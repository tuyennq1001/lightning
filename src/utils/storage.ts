export interface CustomAction {
  id: string;
  label: string;
  icon: string;
  prompt: string;
  scene: 'all' | 'reading' | 'writing';
  isDefault?: boolean;
  isPinned?: boolean;
}

export interface UserSettings {
  apiKey: string;
  provider: 'openai' | 'gemini' | 'claude';
  modelId?: string;
  sourceLanguage: string;
  targetLanguage: string;
  outputLanguage?: string;
  appLanguage: 'vi' | 'en' | 'ja';
  actions: CustomAction[];
  showToolbar: boolean;
  webSearchEnabled?: boolean;
  disabledWebsites?: string[];
}

export const DEFAULT_ACTIONS: CustomAction[] = [
  { 
    id: 'translate', 
    label: 'Dịch', 
    icon: '🌐', 
    prompt: 'Dịch đoạn văn bản sau sang {TARGET_LANG}. Chỉ xuất ra kết quả dịch chính xác và tự nhiên nhất, tuyệt đối không kèm lời dẫn hay giải thích:\n\n{text}', 
    scene: 'all', 
    isDefault: true,
    isPinned: true
  },
  { 
    id: 'rewrite', 
    label: 'Viết lại', 
    icon: '✍️', 
    prompt: 'Viết lại đoạn văn bản sau cho hay, mạch lạc và tự nhiên hơn. ĐẢM BẢO TUYỆT ĐỐI GIỮ NGUYÊN NGÔN NGỮ CỦA VĂN BẢN GỐC (nếu gốc là tiếng Anh thì viết lại bằng tiếng Anh, gốc là tiếng Nhật viết lại bằng tiếng Nhật). Chỉ xuất ra kết quả viết lại, không kèm lời dẫn hay giải thích:\n\n{text}', 
    scene: 'writing', 
    isDefault: true,
    isPinned: true
  },
  { 
    id: 'summarize', 
    label: 'Tóm tắt', 
    icon: '📝', 
    prompt: 'Tóm tắt ngắn gọn các ý chính của đoạn văn bản sau bằng {OUTPUT_LANG}. Chỉ xuất ra nội dung tóm tắt, không thêm câu giao tiếp hay lời dẫn:\n\n{text}', 
    scene: 'reading', 
    isDefault: true,
    isPinned: true
  },
  { 
    id: 'explain', 
    label: 'Giải thích', 
    icon: '💡', 
    prompt: 'Giải thích chi tiết ý nghĩa và ngữ cảnh của đoạn văn bản sau bằng {OUTPUT_LANG}. Chỉ xuất ra nội dung giải thích, không thêm lời dẫn:\n\n{text}', 
    scene: 'reading', 
    isDefault: true,
    isPinned: false
  },
];

export const DEFAULT_SETTINGS: UserSettings = {
  apiKey: '',
  provider: 'gemini',
  sourceLanguage: 'auto',
  targetLanguage: 'Vietnamese',
  outputLanguage: 'Vietnamese',
  appLanguage: 'vi',
  actions: DEFAULT_ACTIONS,
  showToolbar: true,
  webSearchEnabled: false,
  disabledWebsites: [],
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

function sanitizeActions(actionsList?: CustomAction[], lang: LanguageCode = 'vi'): CustomAction[] {
  if (!Array.isArray(actionsList) || actionsList.length === 0) {
    return DEFAULT_ACTIONS.map(a => ({
      ...a,
      prompt: getDefaultPrompt(a.id, lang) || a.prompt,
    }));
  }
  return actionsList.map((a, idx) => {
    const isDef = a.isDefault || DEFAULT_ACTIONS.some(d => d.id === a.id);
    return {
      ...a,
      isDefault: isDef,
      label: a.label.replace(/\s*\([^)]*\)/g, '').trim() || a.label,
      isPinned: a.isPinned !== undefined ? a.isPinned : idx < 3,
      prompt: isDef ? (getDefaultPrompt(a.id, lang) || a.prompt) : a.prompt,
    };
  });
}

export const storage = {
  async getSettings(): Promise<UserSettings> {
    try {
      const data = await chrome.storage.local.get('settings');
      const saved: Partial<UserSettings> = data?.settings || {};
      const lang = (saved.appLanguage as LanguageCode) || 'vi';
      const outputLanguage = saved.outputLanguage || getDefaultOutputLanguage(lang);
      return {
        ...DEFAULT_SETTINGS,
        ...saved,
        outputLanguage,
        actions: sanitizeActions(saved.actions, lang),
        disabledWebsites: sanitizeDisabledWebsites(saved.disabledWebsites),
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
    const newSettings = { 
      ...currentSettings, 
      ...settings,
      outputLanguage: newOutputLang,
      actions: settings.actions ? sanitizeActions(settings.actions, newLang) : sanitizeActions(currentSettings.actions, newLang),
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
        callback({
          ...DEFAULT_SETTINGS,
          ...val,
          outputLanguage,
          actions: sanitizeActions(val.actions, lang),
          disabledWebsites: sanitizeDisabledWebsites(val.disabledWebsites),
        });
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }
};

