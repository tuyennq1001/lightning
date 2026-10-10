import { storage, type UserSettings, DEFAULT_PAGE_ACTIONS } from './utils/storage';
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

      // Page context menu (Option A: Submenu under ⚡ Lightning AI)
      const pageActions = (settings?.pageActions && settings.pageActions.length > 0)
        ? settings.pageActions
        : DEFAULT_PAGE_ACTIONS;

      const pageParentId = 'lightning-page-parent';
      chrome.contextMenus.create({
        id: pageParentId,
        title: 'Lightning AI',
        contexts: ['page'],
      }, () => {
        if (chrome.runtime.lastError) { /* ignore */ }
      });

      pageActions.filter((pAction) => pAction.enabled !== false && pAction.id !== 'summarize-youtube' && pAction.id !== 'summarize-link').forEach((pAction) => {
        let label = pAction.label;
        if (pAction.isDefault) {
          if (pAction.id === 'summarize-page') label = t.actionSummarizePage;
          else if (pAction.id === 'simplify-page') label = t.actionSimplifyPage;
        }
        const shortcutSuffix = pAction.shortcut ? ` (${pAction.shortcut})` : '';

        chrome.contextMenus.create({
          id: pAction.id,
          parentId: pageParentId,
          title: `${pAction.icon} ${label}${shortcutSuffix}`,
          contexts: ['page'],
        }, () => {
          if (chrome.runtime.lastError) { /* ignore */ }
        });
      });

      // Link context menu (appears when right-clicking on any hyperlink)
      const linkSummarizeAction = pageActions.find(p => p.id === 'summarize-link');
      if (linkSummarizeAction && linkSummarizeAction.enabled !== false) {
        chrome.contextMenus.create({
          id: 'summarize-link',
          title: `Lightning AI: ${t.actionSummarizeLink}`,
          contexts: ['link'],
        }, () => {
          if (chrome.runtime.lastError) { /* ignore */ }
        });
      }

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
      linkUrl: info.linkUrl || '',
    }, () => {
      if (chrome.runtime.lastError) { /* ignore */ }
    });
  }
});

chrome.runtime.onMessage.addListener((message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
  if (message.action === 'ASK_AI') {
    handleAIRequest(message.messages, sender.tab?.id, { webSearch: Boolean(message.webSearch) });
    return true;
  }
  if (message.action === 'FETCH_URL_CONTENT') {
    handleFetchUrlContent(message.url)
      .then((res) => sendResponse(res))
      .catch((err) => sendResponse({ success: false, url: message.url, error: err?.message || 'Lỗi tải trang' }));
    return true;
  }
});

async function handleFetchUrlContent(url: string): Promise<{ success: boolean; html?: string; url: string; error?: string }> {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Chỉ hỗ trợ giao thức HTTP và HTTPS');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} (${response.statusText})`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType && !contentType.includes('text/html') && !contentType.includes('text/plain') && !contentType.includes('application/xhtml+xml')) {
      throw new Error(`Định dạng không được hỗ trợ (${contentType.split(';')[0]})`);
    }

    const html = await response.text();
    return { success: true, html, url: response.url || url };
  } catch (err: any) {
    return {
      success: false,
      url,
      error: err.name === 'AbortError' ? 'Hết thời gian chờ kết nối (Timeout)' : (err.message || 'Lỗi kết nối'),
    };
  }
}

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
