import { storage, type UserSettings, DEFAULT_ACTIONS } from './utils/storage';
import { streamAIResponse, type ChatMessage } from './utils/ai';
import { getT, type LanguageCode } from './utils/i18n';
// Open options page directly when clicking the extension action icon
chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});

const updateContextMenus = (settings: UserSettings) => {
  try {
    const lang = (settings?.appLanguage as LanguageCode) || 'vi';
    const t = getT(lang);

    chrome.contextMenus.removeAll(() => {
      if (chrome.runtime.lastError) {
        // Suppress benign lastError during cleanup
      }

      // Page context menu: summarize page
      chrome.contextMenus.create({
        id: 'summarize-page',
        title: t.summarizePageTitle,
        contexts: ['page']
      }, () => {
        if (chrome.runtime.lastError) { /* ignore */ }
      });

      // Actions from settings
      const actions = (settings?.actions && settings.actions.length > 0) ? settings.actions : DEFAULT_ACTIONS;
      actions.forEach((action) => {
        let contexts: any[] = ['selection'];
        if (action.scene === 'writing') {
          contexts = ['editable'];
        } else if (action.scene === 'reading') {
          contexts = ['selection'];
        } else {
          contexts = ['selection', 'editable'];
        }

        let label = action.label;
        if (action.isDefault) {
          if (action.id === 'translate') label = t.actionTranslate;
          else if (action.id === 'summarize') label = t.actionSummarize;
          else if (action.id === 'explain') label = t.actionExplain;
          else if (action.id === 'rewrite') label = t.actionRewrite;
        }

        chrome.contextMenus.create({
          id: action.id,
          title: `${label} ${action.icon}`,
          contexts: contexts
        } as any, () => {
          if (chrome.runtime.lastError) { /* ignore */ }
        });
      });
    });
  } catch (err) {
    console.error('Error updating context menus:', err);
  }
};

const initMenus = async () => {
  try {
    const settings = await storage.getSettings();
    updateContextMenus(settings);
  } catch (err) {
    console.error('Failed to init context menus:', err);
  }
};

chrome.runtime.onInstalled.addListener(() => {
  initMenus();
});

chrome.runtime.onStartup.addListener(() => {
  initMenus();
});

// Run once immediately on service worker start
initMenus();

// Re-update menus when settings change
storage.onSettingsChanged((settings) => {
  updateContextMenus(settings);
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, {
      action: 'CONTEXT_MENU_CLICK',
      menuId: info.menuItemId,
      selectionText: info.selectionText || '',
    }, () => {
      if (chrome.runtime.lastError) { /* ignore */ }
    });
  }
});

chrome.runtime.onMessage.addListener((message: any, sender: chrome.runtime.MessageSender, _sendResponse: (response?: any) => void) => {
  if (message.action === 'ASK_AI') {
    handleAIRequest(message.messages, sender.tab?.id, { webSearch: Boolean(message.webSearch) });
    return true;
  }
});

async function handleAIRequest(messages: ChatMessage[], tabId?: number, options?: { webSearch?: boolean }) {
  if (!tabId) return;
  try {
    const settings = await storage.getSettings();
    const stream = streamAIResponse(messages, settings, options);
    for await (const chunk of stream) {
      chrome.tabs.sendMessage(tabId, { action: 'AI_CHUNK', chunk }, () => {
        if (chrome.runtime.lastError) { /* ignore */ }
      });
    }
    chrome.tabs.sendMessage(tabId, { action: 'AI_DONE' }, () => {
      if (chrome.runtime.lastError) { /* ignore */ }
    });
  } catch (err: any) {
    chrome.tabs.sendMessage(tabId, { action: 'AI_ERROR', error: err.message }, () => {
      if (chrome.runtime.lastError) { /* ignore */ }
    });
  }
}
