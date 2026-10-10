export interface CustomAction {
  id: string;
  label: string;
  icon: string;
  prompt: string;
  scene: 'all' | 'reading' | 'writing';
  isDefault?: boolean;
  isPinned?: boolean;
  shortcut?: string;
  enabled?: boolean;
}

export type AIProvider = 'openai' | 'gemini' | 'claude' | 'openrouter';

export type FontFamilyOption = 
  | 'system'
  | 'inter'
  | 'roboto'
  | 'arial'
  | 'georgia'
  | 'merriweather'
  | 'mono';

export type FontSizeOption = 
  | '12px'
  | '13px'
  | '14px'
  | '15px'
  | '16px'
  | '18px'
  | '20px';

export const FONT_FAMILY_STACKS: Record<FontFamilyOption, string> = {
  system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  inter: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  roboto: '"Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
  arial: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
  georgia: 'Georgia, Cambria, "Times New Roman", Times, serif',
  merriweather: '"Merriweather", Georgia, Cambria, serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
};

export function normalizeFontFamily(input?: string): FontFamilyOption {
  if (!input) return 'system';
  if (input === 'sans') return 'system';
  if (input === 'serif') return 'georgia';
  if (Object.prototype.hasOwnProperty.call(FONT_FAMILY_STACKS, input)) {
    return input as FontFamilyOption;
  }
  return 'system';
}

export function normalizeFontSize(input?: string): FontSizeOption {
  if (!input) return '14px';
  if (input === 'sm') return '13px';
  if (input === 'base') return '14px';
  if (input === 'lg') return '16px';
  if (input === 'xl') return '18px';
  const validSizes: FontSizeOption[] = ['12px', '13px', '14px', '15px', '16px', '18px', '20px'];
  if (validSizes.includes(input as FontSizeOption)) {
    return input as FontSizeOption;
  }
  return '14px';
}

export function getFontFamilyCss(family?: string): string {
  const normalized = normalizeFontFamily(family);
  return FONT_FAMILY_STACKS[normalized];
}

export function getFontSizeCss(size?: string): string {
  return normalizeFontSize(size);
}

export interface UserSettings {
  apiKey: string;
  provider: AIProvider;
  modelId?: string;
  apiKeys?: Partial<Record<AIProvider, string>>;
  modelIds?: Partial<Record<AIProvider, string>>;
  sourceLanguage: string;
  targetLanguage: string;
  outputLanguage?: string;
  appLanguage: 'vi' | 'en' | 'ja';
  actions: CustomAction[];
  pageActions?: CustomAction[];
  showToolbar: boolean;
  quickAskEnabled?: boolean;
  webSearchEnabled?: boolean;
  disabledWebsites?: string[];
  fontFamily?: FontFamilyOption;
  fontSize?: FontSizeOption;
}

export const DEFAULT_PAGE_ACTIONS: CustomAction[] = [
  {
    id: 'summarize-page',
    label: 'Tóm tắt nội dung',
    icon: '📄',
    prompt: 'Tóm tắt ngắn gọn các luận điểm và nội dung chính của bài viết sau đây bằng {OUTPUT_LANG} theo định dạng gạch đầu dòng rõ ràng. Chỉ xuất ra kết quả tóm tắt, không thêm lời dẫn:\n\n"""\n{text}\n"""\n\n⚠️ YÊU CẦU BẮT BUỘC: Toàn bộ bản tóm tắt PHẢI được dịch và viết 100% bằng {OUTPUT_LANG}. Dù bài viết gốc là tiếng Nhật, tiếng Anh hay bất kỳ ngôn ngữ nào khác, TUYỆT ĐỐI KHÔNG dùng ngôn ngữ của bài viết gốc nếu khác {OUTPUT_LANG}.',
    scene: 'reading',
    isDefault: true,
    shortcut: 'Alt+O',
  },
  {
    id: 'simplify-page',
    label: 'Giải thích ELI5',
    icon: '🧒',
    prompt: 'Hãy giải thích và trình bày lại toàn bộ nội dung của bài viết sau đây bằng {OUTPUT_LANG} theo cách cực kỳ đơn giản, trực quan, dễ hiểu cho người mới bắt đầu (phong cách đại chúng, bình dân).\n\nQuy tắc bắt buộc:\n- Dùng các ví dụ đời thường và hình ảnh ẩn dụ gần gũi để giải thích bản chất vấn đề.\n- Tránh dùng thuật ngữ chuyên môn phức tạp; nếu bắt buộc có thuật ngữ thì phải giải thích ngay bằng từ ngữ bình dân.\n- TUYỆT ĐỐI KHÔNG xưng hô kiểu người lớn với trẻ em (CẤM dùng các từ: "chú", "bác", "cháu", "con", "bạn nhỏ", "bé"). Giữ cách xưng hô trung tính, tôn trọng và văn minh.\n- TUYỆT ĐỐI KHÔNG thêm lời chào hỏi hay mào đầu xã giao (như "Chào bạn nhỏ...", "Chào bạn...", "Sau đây tôi xin..."). Đi thẳng ngay vào nội dung giải thích.\n\n"""\n{text}\n"""\n\n⚠️ YÊU CẦU BẮT BUỘC: Toàn bộ nội dung giải thích PHẢI được viết hoàn toàn bằng {OUTPUT_LANG}. Tuyệt đối không dùng ngôn ngữ của bài viết gốc nếu khác {OUTPUT_LANG}.',
    scene: 'reading',
    isDefault: true,
    shortcut: 'Alt+P',
  },
  {
    id: 'summarize-link',
    label: 'Tóm tắt URL',
    icon: '🔗',
    prompt: 'Tóm tắt ngắn gọn các luận điểm và nội dung chính của liên kết sau đây bằng {OUTPUT_LANG} theo định dạng gạch đầu dòng rõ ràng. Chỉ xuất ra kết quả tóm tắt, không thêm lời dẫn:\n\n"""\n{text}\n"""\n\n⚠️ YÊU CẦU BẮT BUỘC: Toàn bộ bản tóm tắt PHẢI được dịch và viết 100% bằng {OUTPUT_LANG}. Dù bài viết gốc là tiếng Nhật, tiếng Anh hay bất kỳ ngôn ngữ nào khác, TUYỆT ĐỐI KHÔNG dùng ngôn ngữ của bài viết gốc nếu khác {OUTPUT_LANG}.',
    scene: 'reading',
    isDefault: true,
    shortcut: '',
  },
];

export const DEFAULT_ACTIONS: CustomAction[] = [
  { 
    id: 'translate', 
    label: 'Dịch', 
    icon: '🌐', 
    prompt: 'Dịch đoạn văn bản sau sang {TARGET_LANG}. Chỉ xuất ra kết quả dịch chính xác và tự nhiên nhất, tuyệt đối không kèm lời dẫn hay giải thích:\n\n{text}', 
    scene: 'all', 
    isDefault: true,
    isPinned: true,
    shortcut: 'Alt+T'
  },
  { 
    id: 'rewrite', 
    label: 'Viết lại', 
    icon: '✍️', 
    prompt: 'Viết lại đoạn văn bản sau cho hay, mạch lạc và tự nhiên hơn. ĐẢM BẢO TUYỆT ĐỐI GIỮ NGUYÊN NGÔN NGỮ CỦA VĂN BẢN GỐC (nếu gốc là tiếng Anh thì viết lại bằng tiếng Anh, gốc là tiếng Nhật viết lại bằng tiếng Nhật). Chỉ xuất ra kết quả viết lại, không kèm lời dẫn hay giải thích:\n\n{text}', 
    scene: 'writing', 
    isDefault: true,
    isPinned: true,
    shortcut: 'Alt+R'
  },
  { 
    id: 'summarize', 
    label: 'Tóm tắt', 
    icon: '📝', 
    prompt: 'Tóm tắt ngắn gọn các ý chính của đoạn văn bản sau bằng {OUTPUT_LANG}. Chỉ xuất ra nội dung tóm tắt, không thêm câu giao tiếp hay lời dẫn:\n\n{text}', 
    scene: 'reading', 
    isDefault: true,
    isPinned: true,
    shortcut: 'Alt+S'
  },
  { 
    id: 'explain', 
    label: 'Giải thích', 
    icon: '💡', 
    prompt: 'Giải thích chi tiết ý nghĩa và ngữ cảnh của đoạn văn bản sau bằng {OUTPUT_LANG}. Chỉ xuất ra nội dung giải thích, không thêm lời dẫn:\n\n{text}', 
    scene: 'reading', 
    isDefault: true,
    isPinned: false,
    shortcut: 'Alt+E'
  },
];

export const DEFAULT_SETTINGS: UserSettings = {
  apiKey: '',
  provider: 'gemini',
  modelId: '',
  apiKeys: {},
  modelIds: {},
  sourceLanguage: 'auto',
  targetLanguage: 'Vietnamese',
  outputLanguage: 'Vietnamese',
  appLanguage: 'vi',
  actions: DEFAULT_ACTIONS,
  pageActions: DEFAULT_PAGE_ACTIONS,
  showToolbar: true,
  quickAskEnabled: true,
  webSearchEnabled: false,
  disabledWebsites: [],
  fontFamily: 'system',
  fontSize: '14px',
};

import { getDefaultPrompt, type LanguageCode } from './i18n.ts';

export function getDefaultOutputLanguage(appLang: LanguageCode = 'vi'): string {
  if (appLang === 'ja') return 'Japanese';
  if (appLang === 'en') return 'English';
  return 'Vietnamese';
}

/**
 * Normalizes a URL or domain string to a clean domain/hostname.
 * Examples:
 * - "https://www.youtube.com/watch?v=123" -> "youtube.com"
 * - "http://docs.google.com/document/d/..." -> "docs.google.com"
 * - "www.facebook.com" -> "facebook.com"
 * - "sub.domain.co.uk:8080/path" -> "sub.domain.co.uk"
 */
export function normalizeDomain(input: string): string {
  let str = (input || '').trim().toLowerCase();
  if (!str) return '';
  // Remove protocol if present
  str = str.replace(/^[a-z]+:\/\//i, '');
  // Remove path, query, hash
  str = str.split('/')[0];
  str = str.split('?')[0];
  str = str.split('#')[0];
  // Remove port
  str = str.split(':')[0];
  // Strip leading 'www.'
  if (str.startsWith('www.')) {
    str = str.slice(4);
  }
  // Strip leading and trailing dots
  str = str.replace(/^\.+|\.+$/g, '');
  return str.trim();
}

/**
 * Checks if a given hostname matches any disabled domain in the list.
 * Supports subdomain hierarchy:
 * e.g., if 'google.com' is disabled, 'docs.google.com' and 'google.com' match.
 * If 'docs.google.com' is disabled, 'docs.google.com' matches, but 'google.com' does NOT.
 * Single labels without a dot (e.g., 'com', 'org', 'localhost') will NOT match all subdomains.
 */
export function isDomainDisabled(hostname: string, disabledList?: string[]): boolean {
  if (!hostname || !disabledList || !Array.isArray(disabledList) || disabledList.length === 0) return false;
  const normalizedHost = normalizeDomain(hostname);
  if (!normalizedHost) return false;

  return disabledList.some((item) => {
    const disabled = normalizeDomain(item);
    if (!disabled) return false;
    // Exact match
    if (normalizedHost === disabled) return true;
    // Subdomain match: only apply if disabled pattern contains at least one dot
    if (disabled.includes('.') && normalizedHost.endsWith(`.${disabled}`)) {
      return true;
    }
    return false;
  });
}

function sanitizeDisabledWebsites(list?: string[]): string[] {
  if (!Array.isArray(list)) return [];
  const set = new Set<string>();
  for (const item of list) {
    const cleaned = normalizeDomain(item);
    if (cleaned) {
      set.add(cleaned);
    }
  }
  return Array.from(set);
}

export function sanitizeActions(actionsList?: CustomAction[], lang: LanguageCode = 'vi'): CustomAction[] {
  if (!Array.isArray(actionsList) || actionsList.length === 0) {
    return DEFAULT_ACTIONS.map(a => ({
      ...a,
      prompt: getDefaultPrompt(a.id, lang) || a.prompt,
    }));
  }
  return actionsList.map((a, idx) => {
    const isDef = a.isDefault || DEFAULT_ACTIONS.some(d => d.id === a.id);
    const defAction = DEFAULT_ACTIONS.find(d => d.id === a.id);
    return {
      ...a,
      isDefault: isDef,
      enabled: a.enabled !== undefined ? a.enabled : true,
      label: a.label.replace(/\s*\([^)]*\)/g, '').trim() || a.label,
      isPinned: a.isPinned !== undefined ? a.isPinned : idx < 3,
      prompt: isDef ? (getDefaultPrompt(a.id, lang) || a.prompt) : a.prompt,
      shortcut: a.shortcut !== undefined ? a.shortcut : (defAction?.shortcut || ''),
    };
  });
}

export function sanitizePageActions(actionsList?: CustomAction[], lang: LanguageCode = 'vi'): CustomAction[] {
  if (!Array.isArray(actionsList) || actionsList.length === 0) {
    return DEFAULT_PAGE_ACTIONS.map(a => ({
      ...a,
      prompt: getDefaultPrompt(a.id, lang) || a.prompt,
    }));
  }
  // Filter out deprecated YouTube action, explain-link, or any invalid items
  const validActions = actionsList.filter(a => a && a.id && a.id !== 'summarize-youtube' && a.id !== 'explain-link');
  const existingIds = new Set(validActions.map(a => a.id));
  const result: CustomAction[] = validActions.map((a) => {
    const isDef = DEFAULT_PAGE_ACTIONS.some(d => d.id === a.id);
    const defAction = DEFAULT_PAGE_ACTIONS.find(d => d.id === a.id);
    let shortcut = a.shortcut !== undefined ? a.shortcut : (defAction?.shortcut || '');
    if (isDef) {
      if (a.id === 'summarize-page' && (shortcut === 'Alt+P' || !shortcut)) {
        shortcut = 'Alt+O';
      } else if (a.id === 'simplify-page' && (shortcut === 'Alt+E' || !shortcut)) {
        shortcut = 'Alt+P';
      }
    }
    return {
      ...a,
      isDefault: isDef,
      enabled: a.enabled !== undefined ? a.enabled : true,
      label: a.label.replace(/\s*\([^)]*\)/g, '').trim() || a.label,
      prompt: isDef ? (getDefaultPrompt(a.id, lang) || a.prompt) : a.prompt,
      shortcut,
    };
  });

  for (const defAction of DEFAULT_PAGE_ACTIONS) {
    if (!existingIds.has(defAction.id)) {
      result.push({
        ...defAction,
        prompt: getDefaultPrompt(defAction.id, lang) || defAction.prompt,
      });
    }
  }

  return result;
}

export const storage = {
  async getSettings(): Promise<UserSettings> {
    try {
      const data = await chrome.storage.local.get('settings');
      const saved: Partial<UserSettings> = data?.settings || {};
      const lang = (saved.appLanguage as LanguageCode) || 'vi';
      const outputLanguage = saved.outputLanguage || getDefaultOutputLanguage(lang);
      const activeProvider: AIProvider = saved.provider || 'gemini';
      const apiKeys: Partial<Record<AIProvider, string>> = { ...(saved.apiKeys || {}) };
      const modelIds: Partial<Record<AIProvider, string>> = { ...(saved.modelIds || {}) };

      // Backwards compatibility with previous single apiKey / modelId
      if (saved.apiKey && !apiKeys[activeProvider]) {
        apiKeys[activeProvider] = saved.apiKey;
      }
      if (saved.modelId && !modelIds[activeProvider]) {
        modelIds[activeProvider] = saved.modelId;
      }

      const activeApiKey = apiKeys[activeProvider] ?? saved.apiKey ?? '';
      const activeModelId = modelIds[activeProvider] ?? saved.modelId ?? '';

      const sanitizedPageActions = sanitizePageActions(saved.pageActions, lang);

      // Auto-cleanup stale/deprecated actions in storage if any were purged
      if (Array.isArray(saved.pageActions) && saved.pageActions.some(a => a.id === 'summarize-youtube' || a.id === 'explain-link')) {
        chrome.storage.local.set({
          settings: {
            ...saved,
            pageActions: sanitizedPageActions,
          }
        }).catch(() => {});
      }

      return {
        ...DEFAULT_SETTINGS,
        ...saved,
        provider: activeProvider,
        apiKey: activeApiKey,
        modelId: activeModelId,
        apiKeys,
        modelIds,
        outputLanguage,
        fontFamily: normalizeFontFamily(saved.fontFamily),
        fontSize: normalizeFontSize(saved.fontSize),
        actions: sanitizeActions(saved.actions, lang),
        pageActions: sanitizedPageActions,
        disabledWebsites: sanitizeDisabledWebsites(saved.disabledWebsites),
        quickAskEnabled: saved.quickAskEnabled !== undefined ? saved.quickAskEnabled : true,
      };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  async saveSettings(settings: Partial<UserSettings>): Promise<void> {
    const currentSettings = await this.getSettings();
    const newLang = (settings.appLanguage as LanguageCode) || currentSettings.appLanguage || 'vi';
    const newOutputLang = settings.outputLanguage !== undefined
      ? settings.outputLanguage
      : (currentSettings.outputLanguage || getDefaultOutputLanguage(newLang));

    const activeProvider = (settings.provider || currentSettings.provider || 'gemini') as AIProvider;
    const newApiKeys: Partial<Record<AIProvider, string>> = {
      ...(currentSettings.apiKeys || {}),
      ...(settings.apiKeys || {}),
    };
    const newModelIds: Partial<Record<AIProvider, string>> = {
      ...(currentSettings.modelIds || {}),
      ...(settings.modelIds || {}),
    };

    if (settings.apiKey !== undefined) {
      newApiKeys[activeProvider] = settings.apiKey;
    }
    if (settings.modelId !== undefined) {
      newModelIds[activeProvider] = settings.modelId;
    }

    const activeApiKey = newApiKeys[activeProvider] ?? '';
    const activeModelId = newModelIds[activeProvider] ?? '';

    const newSettings: UserSettings = { 
      ...currentSettings, 
      ...settings,
      provider: activeProvider,
      apiKey: activeApiKey,
      modelId: activeModelId,
      apiKeys: newApiKeys,
      modelIds: newModelIds,
      outputLanguage: newOutputLang,
      fontFamily: normalizeFontFamily(settings.fontFamily || currentSettings.fontFamily),
      fontSize: normalizeFontSize(settings.fontSize || currentSettings.fontSize),
      actions: settings.actions ? sanitizeActions(settings.actions, newLang) : sanitizeActions(currentSettings.actions, newLang),
      pageActions: settings.pageActions ? sanitizePageActions(settings.pageActions, newLang) : sanitizePageActions(currentSettings.pageActions, newLang),
      disabledWebsites: settings.disabledWebsites !== undefined
        ? sanitizeDisabledWebsites(settings.disabledWebsites)
        : sanitizeDisabledWebsites(currentSettings.disabledWebsites),
    };
    await chrome.storage.local.set({ settings: newSettings });
  },

  onSettingsChanged(callback: (newSettings: UserSettings) => void) {
    const listener = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName === 'local' && changes.settings) {
        const val: Partial<UserSettings> = changes.settings.newValue || {};
        const lang = (val.appLanguage as LanguageCode) || 'vi';
        const outputLanguage = val.outputLanguage || getDefaultOutputLanguage(lang);
        const activeProvider: AIProvider = val.provider || 'gemini';
        const apiKeys: Partial<Record<AIProvider, string>> = { ...(val.apiKeys || {}) };
        const modelIds: Partial<Record<AIProvider, string>> = { ...(val.modelIds || {}) };

        if (val.apiKey && !apiKeys[activeProvider]) {
          apiKeys[activeProvider] = val.apiKey;
        }
        if (val.modelId && !modelIds[activeProvider]) {
          modelIds[activeProvider] = val.modelId;
        }

        callback({
          ...DEFAULT_SETTINGS,
          ...val,
          provider: activeProvider,
          apiKey: apiKeys[activeProvider] ?? val.apiKey ?? '',
          modelId: modelIds[activeProvider] ?? val.modelId ?? '',
          apiKeys,
          modelIds,
          outputLanguage,
          fontFamily: normalizeFontFamily(val.fontFamily),
          fontSize: normalizeFontSize(val.fontSize),
          actions: sanitizeActions(val.actions, lang),
          pageActions: sanitizePageActions(val.pageActions, lang),
          disabledWebsites: sanitizeDisabledWebsites(val.disabledWebsites),
        });
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }
};

