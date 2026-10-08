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
  appLanguage: 'vi' | 'en' | 'ja';
  actions: CustomAction[];
  showToolbar: boolean;
  webSearchEnabled?: boolean;
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
    prompt: 'Tóm tắt ngắn gọn các ý chính của đoạn văn bản sau bằng tiếng Việt. Chỉ xuất ra nội dung tóm tắt, không thêm câu giao tiếp hay lời dẫn:\n\n{text}', 
    scene: 'reading', 
    isDefault: true,
    isPinned: true
  },
  { 
    id: 'explain', 
    label: 'Giải thích', 
    icon: '💡', 
    prompt: 'Giải thích chi tiết ý nghĩa và ngữ cảnh của đoạn văn bản sau bằng tiếng Việt. Chỉ xuất ra nội dung giải thích, không thêm lời dẫn:\n\n{text}', 
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
  appLanguage: 'vi',
  actions: DEFAULT_ACTIONS,
  showToolbar: true,
  webSearchEnabled: true,
};

import { getDefaultPrompt, type LanguageCode } from './i18n';

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
      return {
        ...DEFAULT_SETTINGS,
        ...saved,
        actions: sanitizeActions(saved.actions, lang),
      };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  async saveSettings(settings: Partial<UserSettings>): Promise<void> {
    const currentSettings = await this.getSettings();
    const newLang = (settings.appLanguage as LanguageCode) || currentSettings.appLanguage || 'vi';
    const newSettings = { 
      ...currentSettings, 
      ...settings,
      actions: settings.actions ? sanitizeActions(settings.actions, newLang) : sanitizeActions(currentSettings.actions, newLang)
    };
    await chrome.storage.local.set({ settings: newSettings });
  },

  onSettingsChanged(callback: (newSettings: UserSettings) => void) {
    const listener = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName === 'local' && changes.settings) {
        const val: Partial<UserSettings> = changes.settings.newValue || {};
        const lang = (val.appLanguage as LanguageCode) || 'vi';
        callback({
          ...DEFAULT_SETTINGS,
          ...val,
          actions: sanitizeActions(val.actions, lang),
        });
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }
};

