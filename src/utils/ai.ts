import type { UserSettings } from './storage';

export type AIProvider = UserSettings['provider'];

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function* streamAIResponse(
  messages: ChatMessage[],
  settings: UserSettings
): AsyncGenerator<string, void, unknown> {
  if (!settings.apiKey) {
    yield 'Lỗi: Vui lòng nhập API Key trong phần Cài đặt.';
    return;
  }

  try {
    if (settings.provider === 'openai') {
      yield* streamOpenAI(messages, settings);
    } else if (settings.provider === 'gemini') {
      yield* streamGemini(messages, settings);
    } else if (settings.provider === 'claude') {
      yield* streamClaude(messages, settings);
    } else {
      yield 'Lỗi: Nhà cung cấp chưa được hỗ trợ.';
    }
  } catch (error: any) {
    yield `\n\n[Lỗi kết nối: ${error?.message || 'Không xác định'}]`;
  }
}

async function* streamOpenAI(messages: ChatMessage[], settings: UserSettings) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({
      model: settings.modelId || 'gpt-4o-mini',
      messages,
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

async function* streamGemini(messages: ChatMessage[], settings: UserSettings) {
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
  };
  if (systemMessage) {
    body.systemInstruction = {
      parts: [{ text: systemMessage.content }],
    };
  }

  const modelId = settings.modelId || 'gemini-1.5-flash';
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:streamGenerateContent?alt=sse&key=${settings.apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${response.status}`);
  }

  yield* parseSSEStream(response, (data) => {
    if (data.error) {
      throw new Error(data.error.message || 'Lỗi API Gemini');
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
}

async function* streamClaude(messages: ChatMessage[], settings: UserSettings) {
  const systemMessage = messages.find((m) => m.role === 'system')?.content;
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
