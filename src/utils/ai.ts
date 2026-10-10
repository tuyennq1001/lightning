import type { UserSettings } from './storage';
import { getT, type LanguageCode } from './i18n';

export type AIProvider = UserSettings['provider'];

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface StreamOptions {
  webSearch?: boolean;
}

export async function* streamAIResponse(
  messages: ChatMessage[],
  settings: UserSettings,
  options?: StreamOptions
): AsyncGenerator<string, void, unknown> {
  const lang = (settings.appLanguage as LanguageCode) || 'vi';
  const t = getT(lang);

  const cleanApiKey = (settings.apiKey || '').trim();
  if (!cleanApiKey) {
    yield t.errNoApiKey;
    return;
  }

  const cleanSettings = { ...settings, apiKey: cleanApiKey };

  try {
    if (cleanSettings.provider === 'openai') {
      yield* streamOpenAI(messages, cleanSettings, options);
    } else if (cleanSettings.provider === 'gemini') {
      yield* streamGemini(messages, cleanSettings, options);
    } else if (cleanSettings.provider === 'claude') {
      yield* streamClaude(messages, cleanSettings, options);
    } else if (cleanSettings.provider === 'openrouter') {
      yield* streamOpenRouter(messages, cleanSettings, options);
    } else {
      yield t.errUnsupportedProvider;
    }
  } catch (error: any) {
    yield `\n\n[${t.errConnection}: ${error?.message || 'Unknown'}]`;
  }
}

export function getEffectiveSystemInstruction(settings: UserSettings): string {
  const rawOutput = settings.outputLanguage || 'Vietnamese';
  const normalizedOutput = rawOutput === 'tiếng Việt' ? 'Vietnamese' : rawOutput;
  
  let targetLangName = normalizedOutput;
  if (normalizedOutput === 'Vietnamese') targetLangName = 'Vietnamese (Tiếng Việt)';
  else if (normalizedOutput === 'Japanese') targetLangName = 'Japanese (日本語)';
  else if (normalizedOutput === 'Chinese') targetLangName = 'Chinese (中文)';
  else if (normalizedOutput === 'Korean') targetLangName = 'Korean (한국어)';
  else if (normalizedOutput === 'English') targetLangName = 'English';

  return `You are Lightning, an intelligent, fast, and accurate AI browser assistant.
CRITICAL LANGUAGE ADHERENCE RULE:
- You MUST write and output your entire response strictly in ${targetLangName}.
- Even if the input text, webpage, or article is in another language (e.g., Japanese, Chinese, French, English), you MUST translate, summarize, explain, and respond strictly in ${targetLangName}.
- NEVER output in the original document language if it differs from ${targetLangName}, unless the user prompt explicitly asks to preserve the original language (such as for in-place text rewriting or proofreading).`;
}

async function* streamOpenAI(messages: ChatMessage[], settings: UserSettings, options?: StreamOptions) {
  let finalMessages = messages;
  const hasSystem = messages.some((m) => m.role === 'system');
  const baseInstruction = getEffectiveSystemInstruction(settings);

  if (options?.webSearch) {
    const lang = (settings.appLanguage as LanguageCode) || 'vi';
    const searchNote = lang === 'ja'
      ? 'ウェブ検索モードが有効です。最新かつ正確な情報を提供し、可能であれば出典を引用してください。'
      : lang === 'en'
      ? 'Web search mode is enabled. Provide the most up-to-date and accurate information, citing sources where available.'
      : 'Chế độ tìm kiếm Internet đang bật. Hãy cung cấp câu trả lời mới nhất, chính xác nhất và trích dẫn thông tin nếu có.';
    finalMessages = [
      {
        role: 'system',
        content: `${baseInstruction}\n\n${searchNote}`,
      },
      ...messages
    ];
  } else if (!hasSystem) {
    finalMessages = [
      {
        role: 'system',
        content: baseInstruction,
      },
      ...messages
    ];
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({
      model: settings.modelId || 'gpt-4o-mini',
      messages: finalMessages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${response.status}`);
  }

  yield* parseSSEStream(response, (data) => {
    if (data.error) {
      throw new Error(data.error.message || 'Lỗi API OpenAI');
    }
    return data.choices?.[0]?.delta?.content || '';
  });
}

async function* streamGemini(messages: ChatMessage[], settings: UserSettings, options?: StreamOptions) {
  // Convert generic messages to Gemini format
  const geminiMessages = messages
    .filter((m) => m.role !== 'system') // Gemini handles system instructions differently, simple map here
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const systemMessage = messages.find((m) => m.role === 'system');
  const body: any = {
    contents: geminiMessages,
    systemInstruction: {
      parts: [{ text: systemMessage ? systemMessage.content : getEffectiveSystemInstruction(settings) }],
    },
  };

  const lang = (settings.appLanguage as LanguageCode) || 'vi';
  const t = getT(lang);

  // Only enable Google Search grounding if explicitly requested via options
  let isSearchActive = Boolean(options?.webSearch);
  if (isSearchActive) {
    body.tools = [{ google_search: {} }];
  }

  const modelId = settings.modelId || 'gemini-1.5-flash';
  const apiKey = encodeURIComponent((settings.apiKey || '').trim());
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:streamGenerateContent?alt=sse&key=${apiKey}`;

  let response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  // Graceful fallback: If search grounding fails (e.g. quota 429 or tool error 400), retry without tools
  if (!response.ok && isSearchActive) {
    const err = await response.json().catch(() => ({}));
    const errMsg = err.error?.message || '';
    if (
      response.status === 429 ||
      response.status === 400 ||
      errMsg.toLowerCase().includes('quota') ||
      errMsg.toLowerCase().includes('tool')
    ) {
      delete body.tools;
      isSearchActive = false;
      const fallbackResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (fallbackResponse.ok) {
        response = fallbackResponse;
        yield t.webSearchFallbackNotice;
      } else {
        const fallbackErr = await fallbackResponse.json().catch(() => ({}));
        throw new Error(fallbackErr.error?.message || errMsg || `HTTP ${fallbackResponse.status}`);
      }
    } else {
      throw new Error(errMsg || `HTTP ${response.status}`);
    }
  } else if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${response.status}`);
  }

  const sourcesMap = new Map<string, string>();

  yield* parseSSEStream(response, (data) => {
    if (data.error) {
      throw new Error(data.error.message || 'Lỗi API Gemini');
    }

    // Extract grounding citations if returned
    const groundingChunks = data.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (Array.isArray(groundingChunks)) {
      for (const chunk of groundingChunks) {
        if (chunk?.web?.uri) {
          sourcesMap.set(chunk.web.uri, chunk.web.title || chunk.web.uri);
        }
      }
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!text && data.candidates?.[0]?.finishReason) {
      if (data.candidates[0].finishReason !== 'STOP') {
        return `\n[Đã dừng: ${data.candidates[0].finishReason}]`;
      }
      return '';
    }
    return text;
  });

  if (sourcesMap.size > 0) {
    const label = settings.appLanguage === 'ja'
      ? '参考情報'
      : settings.appLanguage === 'en'
      ? 'Sources'
      : 'Nguồn tham khảo';
    let sourcesText = `\n\n---\n**📚 ${label}:**\n`;
    for (const [uri, title] of sourcesMap.entries()) {
      sourcesText += `- [${title}](${uri})\n`;
    }
    yield sourcesText;
  }
}

async function* streamClaude(messages: ChatMessage[], settings: UserSettings, options?: StreamOptions) {
  let systemMessage = messages.find((m) => m.role === 'system')?.content || getEffectiveSystemInstruction(settings);
  if (options?.webSearch) {
    const searchNote = 'Chế độ tìm kiếm Internet đang bật. Hãy cung cấp câu trả lời mới nhất và chính xác nhất.';
    systemMessage = `${systemMessage}\n\n${searchNote}`;
  }
  const claudeMessages = messages.filter((m) => m.role !== 'system');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': settings.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true', // Required for browser requests
    },
    body: JSON.stringify({
      model: settings.modelId || 'claude-3-haiku-20240307',
      max_tokens: 1024,
      system: systemMessage,
      messages: claudeMessages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${response.status}`);
  }

  yield* parseSSEStream(response, (data) => {
    if (data.type === 'error') {
      throw new Error(data.error?.message || 'Lỗi API Claude');
    }
    if (data.type === 'content_block_delta' && data.delta?.type === 'text_delta') {
      return data.delta.text || '';
    }
    return '';
  });
}

async function* streamOpenRouter(messages: ChatMessage[], settings: UserSettings, options?: StreamOptions) {
  let finalMessages = messages;
  const hasSystem = messages.some((m) => m.role === 'system');
  const baseInstruction = getEffectiveSystemInstruction(settings);
  const shouldSearch = options?.webSearch ?? settings.webSearchEnabled ?? false;
  if (shouldSearch) {
    const lang = (settings.appLanguage as LanguageCode) || 'vi';
    const searchNote = lang === 'ja'
      ? 'ウェブ検索モードが有効です。最新かつ正確な情報を提供し、可能であれば出典を引用してください。'
      : lang === 'en'
      ? 'Web search mode is enabled. Provide the most up-to-date and accurate information, citing sources where available.'
      : 'Chế độ tìm kiếm Internet đang bật. Hãy cung cấp câu trả lời mới nhất, chính xác nhất và trích dẫn thông tin nếu có.';
    finalMessages = [
      {
        role: 'system',
        content: `${baseInstruction}\n\n${searchNote}`,
      },
      ...messages
    ];
  } else if (!hasSystem) {
    finalMessages = [
      {
        role: 'system',
        content: baseInstruction,
      },
      ...messages
    ];
  }

  const modelId = settings.modelId?.trim() || 'meta-llama/llama-3.3-70b-instruct:free';

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey}`,
      'HTTP-Referer': 'https://github.com/tuyennq1001/lightning',
      'X-Title': 'Lightning AI',
    },
    body: JSON.stringify({
      model: modelId,
      messages: finalMessages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${response.status}`);
  }

  yield* parseSSEStream(response, (data) => {
    if (data.error) {
      throw new Error(data.error.message || 'Lỗi API OpenRouter');
    }
    return data.choices?.[0]?.delta?.content || '';
  });
}

// Helper to parse Server-Sent Events (SSE) from fetch Response
async function* parseSSEStream(
  response: Response,
  extractText: (parsedData: any) => string
): AsyncGenerator<string, void, unknown> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Không thể đọc stream từ API');

  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ') && line !== 'data: [DONE]') {
        const dataStr = line.slice(6).trim();
        if (!dataStr) continue;
        try {
          const data = JSON.parse(dataStr);
          const textChunk = extractText(data);
          if (textChunk) {
            yield textChunk;
          }
        } catch (e) {
          console.warn('Lỗi parse JSON stream:', e);
        }
      }
    }
  }
}
