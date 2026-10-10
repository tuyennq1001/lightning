import { StrictMode, useEffect, useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Readability } from '@mozilla/readability';
import tailwindStyles from './index.css?inline';
import { 
  storage, 
  type UserSettings, 
  type CustomAction, 
  DEFAULT_ACTIONS, 
  DEFAULT_PAGE_ACTIONS,
  isDomainDisabled, 
  normalizeDomain,
  getFontFamilyCss,
  getFontSizeCss
} from './utils/storage';
import { getT, getDefaultPrompt, stripFlagEmoji, type LanguageCode } from './utils/i18n';
import MarkdownRenderer from './components/MarkdownRenderer';

function ActionIcon({ action }: { action: CustomAction }) {
  if (action.id === 'translate') {
    return (
      <span className="flex items-center gap-0.5 font-semibold text-xs text-slate-700">
        <span className="text-sm">文A</span>
        <svg className="w-2.5 h-2.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </span>
    );
  }
  if (action.id === 'rewrite') {
    return (
      <svg className="w-4 h-4 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    );
  }
  if (action.id === 'summarize') {
    return (
      <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  }
  if (action.id === 'explain') {
    return (
      <svg className="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    );
  }
  return <span className="text-sm">{action.icon || '⚡'}</span>;
}

function getLocalizedActionLabel(action: CustomAction, lang: LanguageCode) {
  const t = getT(lang);
  if (action.isDefault) {
    if (action.id === 'translate') return t.actionTranslate;
    if (action.id === 'summarize') return t.actionSummarize;
    if (action.id === 'explain') return t.actionExplain;
    if (action.id === 'rewrite') return t.actionRewrite;
    if (action.id === 'summarize-page') return t.actionSummarizePage;
    if (action.id === 'simplify-page') return t.actionSimplifyPage;
  }
  return action.label;
}

function matchesShortcut(e: KeyboardEvent, shortcutStr?: string): boolean {
  if (!shortcutStr) return false;
  const parts = shortcutStr.split('+').map(p => p.trim().toLowerCase());
  const hasCtrl = parts.includes('ctrl');
  const hasAlt = parts.includes('alt');
  const hasShift = parts.includes('shift');
  const hasMeta = parts.includes('command') || parts.includes('cmd') || parts.includes('meta');
  
  if (hasCtrl !== e.ctrlKey) return false;
  if (hasAlt !== e.altKey) return false;
  if (hasShift !== e.shiftKey) return false;
  if (hasMeta !== e.metaKey) return false;

  const nonModifiers = parts.filter(p => !['ctrl', 'alt', 'shift', 'command', 'cmd', 'meta'].includes(p));
  if (nonModifiers.length !== 1) return false;

  const targetKey = nonModifiers[0].toLowerCase();
  const eventKey = e.key.toLowerCase();
  const eventCode = e.code.toLowerCase();

  if (eventKey === targetKey) return true;
  if (eventCode === `key${targetKey}` || eventCode === `digit${targetKey}`) return true;
  return false;
}

function FloatingToolbar() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedText, setSelectedText] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [modalPosition, setModalPosition] = useState<{ x: number; y: number } | null>(null);
  const [activeAction, setActiveAction] = useState<CustomAction | null>(null);
  const [isPageAction, setIsPageAction] = useState(false);
  const [isQuickAskMode, setIsQuickAskMode] = useState(false);
  const [quickAskQuestion, setQuickAskQuestion] = useState('');
  const [webSearchActive, setWebSearchActive] = useState(true);
  
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showCloseMenu, setShowCloseMenu] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [currentScene, setCurrentScene] = useState<'reading' | 'writing'>('reading');

  const settingsRef = useRef<UserSettings | null>(null);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const activeActionRef = useRef<CustomAction | null>(null);
  useEffect(() => {
    activeActionRef.current = activeAction;
  }, [activeAction]);

  const extractedArticleRef = useRef<string>('');
  const pageActionCacheRef = useRef<Record<string, string>>({});
  const aiResponseRef = useRef<string>('');
  useEffect(() => {
    aiResponseRef.current = aiResponse;
  }, [aiResponse]);

  const showModalRef = useRef(false);
  useEffect(() => {
    showModalRef.current = showModal;
  }, [showModal]);

  const isPageActionRef = useRef(false);
  useEffect(() => {
    isPageActionRef.current = isPageAction;
  }, [isPageAction]);

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; modalX: number; modalY: number } | null>(null);

  const handleCloseModal = () => {
    setShowModal(false);
    setIsPageAction(false);
    setIsDragging(false);
    dragStartRef.current = null;
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    pageActionCacheRef.current = {};
    extractedArticleRef.current = '';
  };

  useEffect(() => {
    return () => {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, []);

  const currentLang = (settings?.appLanguage as LanguageCode) || 'vi';
  const t = getT(currentLang);

  const getTargetLangLabel = (code?: string) => {
    const c = code === 'tiếng Việt' ? 'Vietnamese' : (code || 'Vietnamese');
    const found = t.targetLanguages.find((l) => l.code === c);
    return found ? found.label : c;
  };

  useEffect(() => {
    storage.getSettings().then((s) => {
      setSettings(s);
      if (s?.webSearchEnabled !== undefined) {
        setWebSearchActive(s.webSearchEnabled);
      }
    });
    const unsubscribe = storage.onSettingsChanged((s) => {
      setSettings(s);
      if (s?.webSearchEnabled !== undefined) {
        setWebSearchActive(s.webSearchEnabled);
      }
    });
    return () => unsubscribe();
  }, []);

  // Dismiss popup and toolbar when clicking outside
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      const container = document.getElementById('lightning-ai-root');
      if (container && container.contains(e.target as Node)) return;
      // Clicked outside, hide current modal if any
      handleCloseModal();
      setShowMoreMenu(false);
      setShowCloseMenu(false);
      setPosition(null);
    };

    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, []);

  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      // Don't trigger if clicking inside our own UI
      const container = document.getElementById('lightning-ai-root');
      if (container && container.contains(e.target as Node)) return;

      setTimeout(() => {
        try {
          const curSettings = settingsRef.current;
          if (curSettings && curSettings.showToolbar === false) return;
          if (curSettings && isDomainDisabled(window.location.hostname, curSettings.disabledWebsites)) return;

          let text = '';
          let isWriting = false;
          let activeElTarget: HTMLElement | null = null;

          const activeEl = document.activeElement as HTMLElement;

          if (activeEl && (activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement)) {
            const start = activeEl.selectionStart ?? 0;
            const end = activeEl.selectionEnd ?? 0;
            if (end > start) {
              text = activeEl.value.substring(start, end).trim();
              isWriting = true;
              activeElTarget = activeEl;
            }
          } else {
            const selection = window.getSelection();
            const selText = selection?.toString().trim();
            if (selText && selection && selection.rangeCount > 0) {
              text = selText;
              if (activeEl && (activeEl.isContentEditable || activeEl.closest('[contenteditable="true"]'))) {
                isWriting = true;
                activeElTarget = activeEl;
              }
            }
          }

          if (text) {
            // Hide previous modal popup when selecting new text
            setShowModal(false);

            // Position EXACTLY at the cursor end point (where mouse released)
            const endX = e.pageX || (window.innerWidth / 2 + window.scrollX);
            const endY = e.pageY || (window.innerHeight / 2 + window.scrollY);

            setPosition({
              x: Math.min(Math.max(120, endX), window.innerWidth + window.scrollX - 120),
              y: endY + 12, // Appear immediately below the cursor end
            });
            setSelectedText(text);
            setTargetElement(activeElTarget);
            setCurrentScene(isWriting ? 'writing' : 'reading');
            setShowMoreMenu(false);
            setShowCloseMenu(false);
          } else {
            setPosition(null);
            setShowMoreMenu(false);
            setShowCloseMenu(false);
          }
        } catch (err) {
          console.error('[Lightning AI] Toolbar error:', err);
        }
      }, 30);
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const handleContextMenuActionRef = useRef<((menuId: string, text?: string) => void) | null>(null);

  useEffect(() => {
    const messageListener = (message: any) => {
      if (message.action === 'AI_CHUNK') {
        setAiResponse((prev) => {
          const next = prev + message.chunk;
          if (activeActionRef.current) {
            pageActionCacheRef.current[activeActionRef.current.id] = next;
          }
          return next;
        });
      } else if (message.action === 'AI_DONE') {
        setIsGenerating(false);
        if (activeActionRef.current) {
          pageActionCacheRef.current[activeActionRef.current.id] = aiResponseRef.current;
        }
      } else if (message.action === 'AI_ERROR') {
        const curLang = (settingsRef.current?.appLanguage as LanguageCode) || 'vi';
        const curT = getT(curLang);
        setAiResponse((prev) => prev + `\n\n[${curT.errorPrefix}: ${message.error}]`);
        setIsGenerating(false);
      } else if (message.action === 'CONTEXT_MENU_CLICK') {
        handleContextMenuActionRef.current?.(message.menuId, message.selectionText);
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);
    return () => chrome.runtime.onMessage.removeListener(messageListener);
  }, []);

  const startAI = (action: CustomAction, text: string, overrideTargetLang?: string) => {
    setAiResponse('');
    setIsGenerating(true);
    if (activeActionRef.current) {
      pageActionCacheRef.current[action.id] = '';
    }
    
    const curSettings = settingsRef.current;
    let prompt = action.prompt || '';
    if (action.isDefault) {
      prompt = getDefaultPrompt(action.id, currentLang) || prompt;
    }

    // Replace supported prompt variables
    const rawTarget = overrideTargetLang || curSettings?.targetLanguage || 'Vietnamese';
    const normalizedTarget = rawTarget === 'tiếng Việt' ? 'Vietnamese' : rawTarget;
    const targetOption = t.targetLanguages.find((l) => l.code === normalizedTarget);
    const targetLang = targetOption ? targetOption.label : normalizedTarget;

    const rawOutput = curSettings?.outputLanguage || (currentLang === 'ja' ? 'Japanese' : currentLang === 'en' ? 'English' : 'Vietnamese');
    const normalizedOutput = rawOutput === 'tiếng Việt' ? 'Vietnamese' : rawOutput;
    const outputOption = t.outputLanguages?.find((l) => l.code === normalizedOutput) || t.targetLanguages.find((l) => l.code === normalizedOutput);
    const outputLang = outputOption ? outputOption.label : normalizedOutput;

    let outputLangString = stripFlagEmoji(outputLang);
    if (normalizedOutput === 'Vietnamese') outputLangString = 'Tiếng Việt (Vietnamese)';
    else if (normalizedOutput === 'Japanese') outputLangString = 'Japanese (日本語)';
    else if (normalizedOutput === 'Chinese') outputLangString = 'Chinese (中文)';
    else if (normalizedOutput === 'Korean') outputLangString = 'Korean (한국어)';
    else if (normalizedOutput === 'English') outputLangString = 'English';

    const rawSource = curSettings?.sourceLanguage || 'auto';
    const sourceOption = t.sourceLanguages.find((l) => l.code === rawSource);
    const sourceLang = sourceOption ? sourceOption.label : rawSource;
    const pageTitle = document.title || '';
    const pageUrl = window.location.href || '';

    prompt = prompt.replace(/{TARGET_LANG}/g, stripFlagEmoji(targetLang));
    prompt = prompt.replace(/{OUTPUT_LANG}/g, outputLangString);
    prompt = prompt.replace(/{SOURCE_LANG}/g, stripFlagEmoji(sourceLang));
    prompt = prompt.replace(/{page_title}/g, pageTitle);
    prompt = prompt.replace(/{page_url}/g, pageUrl);

    let finalPrompt = prompt;
    if (finalPrompt.includes('{text}')) {
      finalPrompt = finalPrompt.replace(/{text}/g, text);
    } else {
      finalPrompt = `${finalPrompt}\n\n"${text}"`;
    }

    chrome.runtime.sendMessage({
      action: 'ASK_AI',
      messages: [{ role: 'user', content: finalPrompt }],
      webSearch: false,
    });
  };

  const handleSwitchPageActionTab = (targetAction: CustomAction) => {
    if (activeActionRef.current?.id === targetAction.id) return;

    if (activeActionRef.current && aiResponseRef.current) {
      pageActionCacheRef.current[activeActionRef.current.id] = aiResponseRef.current;
    }

    setActiveAction(targetAction);

    const cached = pageActionCacheRef.current[targetAction.id];
    if (cached) {
      setAiResponse(cached);
      setIsGenerating(false);
    } else {
      setAiResponse('');
      startAI(targetAction, extractedArticleRef.current);
    }
  };

  const triggerPageActionDirectly = (action: CustomAction) => {
    // If modal is already open in page action mode, simply switch tab without resetting position or recreating modal
    if (showModalRef.current && isPageActionRef.current) {
      handleSwitchPageActionTab(action);
      return;
    }

    const curSettings = settingsRef.current;
    const curLang = (curSettings?.appLanguage as LanguageCode) || 'vi';
    const curT = getT(curLang);

    const posX = window.innerWidth / 2 + window.scrollX;
    const posY = window.innerHeight / 3 + window.scrollY;

    const clampedPos = {
      x: Math.min(Math.max(225, posX), window.innerWidth + window.scrollX - 225),
      y: posY,
    };

    let article = extractedArticleRef.current;
    if (!article) {
      try {
        const documentClone = document.cloneNode(true) as Document;
        const reader = new Readability(documentClone);
        const articleObj = reader.parse();
        const content = articleObj?.textContent || document.body.innerText;
        article = (content || '').trim().substring(0, 15000);
      } catch {
        article = (document.body.innerText || '').trim().substring(0, 15000);
      }
      extractedArticleRef.current = article;
    }

    setIsPageAction(true);
    setSelectedText(curT.fullPageContent);
    setTargetElement(null);
    setCurrentScene('reading');
    setModalPosition(clampedPos);
    setActiveAction(action);
    setIsQuickAskMode(false);
    setShowModal(true);
    setPosition(null);
    setShowMoreMenu(false);
    setShowCloseMenu(false);

    const cached = pageActionCacheRef.current[action.id];
    if (cached) {
      setAiResponse(cached);
      setIsGenerating(false);
    } else {
      startAI(action, article);
    }
  };

  const triggerPageActionRef = useRef<typeof triggerPageActionDirectly | null>(null);
  useEffect(() => {
    triggerPageActionRef.current = triggerPageActionDirectly;
  });

  const handleContextMenuAction = (menuId: string, text?: string) => {
    const curSettings = settingsRef.current;
    const actions = curSettings?.actions && curSettings.actions.length > 0 ? curSettings.actions : DEFAULT_ACTIONS;

    const viewportX = window.innerWidth / 2 + window.scrollX;
    const viewportY = window.innerHeight / 3 + window.scrollY;
    
    setModalPosition(position || { x: viewportX, y: viewportY });
    setPosition(null); 
    setShowMoreMenu(false);
    setIsQuickAskMode(false);

    const activeEl = document.activeElement as HTMLElement;
    let isWriting = false;
    let activeElTarget: HTMLElement | null = null;

    if (activeEl && (activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement || activeEl.isContentEditable)) {
      isWriting = true;
      activeElTarget = activeEl;
    }
    setTargetElement(activeElTarget);
    setCurrentScene(isWriting ? 'writing' : 'reading');

    const pageActions = curSettings?.pageActions && curSettings.pageActions.length > 0
      ? curSettings.pageActions
      : DEFAULT_PAGE_ACTIONS;
    const targetPageAction = pageActions.find(a => a.id === menuId);

    if (targetPageAction) {
      triggerPageActionDirectly(targetPageAction);
    } else {
      const action = actions.find(a => a.id === menuId);
      if (action) {
        setIsPageAction(false);
        pageActionCacheRef.current = {};
        extractedArticleRef.current = '';
        setSelectedText(text || '');
        setActiveAction(action);
        setShowModal(true);
        startAI(action, text || '');
      }
    }
  };

  useEffect(() => {
    handleContextMenuActionRef.current = handleContextMenuAction;
  });

  const handleAction = (action: CustomAction) => {
    setIsPageAction(false);
    pageActionCacheRef.current = {};
    extractedArticleRef.current = '';
    setModalPosition(position);
    setActiveAction(action);
    setIsQuickAskMode(false);
    setShowModal(true);
    setPosition(null);
    setShowMoreMenu(false);
    startAI(action, selectedText);
  };

  const handleOpenQuickAsk = () => {
    setIsPageAction(false);
    pageActionCacheRef.current = {};
    extractedArticleRef.current = '';
    setModalPosition(position);
    setIsQuickAskMode(true);
    setActiveAction({
      id: 'quick-ask',
      label: 'Quick Ask',
      icon: '⚡',
      prompt: '',
      scene: 'all'
    });
    setAiResponse('');
    setQuickAskQuestion('');
    setWebSearchActive(settings?.webSearchEnabled ?? false);
    setShowModal(true);
    setPosition(null);
    setShowMoreMenu(false);
  };

  const handleSendQuickAsk = (questionToSend?: string) => {
    const q = (questionToSend || quickAskQuestion).trim();
    if (!q || isGenerating) return;

    setAiResponse('');
    setIsGenerating(true);
    setQuickAskQuestion('');

    const curSettings = settingsRef.current;
    const rawOutput = curSettings?.outputLanguage || (currentLang === 'ja' ? 'Japanese' : currentLang === 'en' ? 'English' : 'Vietnamese');
    const normalizedOutput = rawOutput === 'tiếng Việt' ? 'Vietnamese' : rawOutput;
    const outputOption = t.outputLanguages?.find((l) => l.code === normalizedOutput) || t.targetLanguages.find((l) => l.code === normalizedOutput);
    const outputLang = outputOption ? outputOption.label : normalizedOutput;

    const outputClean = stripFlagEmoji(outputLang);
    const finalPrompt = t.quickAskPrompt(selectedText, q, webSearchActive, outputClean);

    chrome.runtime.sendMessage({
      action: 'ASK_AI',
      messages: [{ role: 'user', content: finalPrompt }],
      webSearch: webSearchActive,
    });
  };

  const triggerActionDirectly = (action: CustomAction, text: string, isWriting: boolean, activeEl: HTMLElement | null, rect: DOMRect | null) => {
    let posX = window.innerWidth / 2 + window.scrollX;
    let posY = window.innerHeight / 3 + window.scrollY;

    if (rect && rect.width > 0) {
      posX = rect.left + rect.width / 2 + window.scrollX;
      posY = rect.bottom + window.scrollY;
    }

    const clampedPos = {
      x: Math.min(Math.max(220, posX), window.innerWidth + window.scrollX - 220),
      y: posY,
    };

    setIsPageAction(false);
    pageActionCacheRef.current = {};
    extractedArticleRef.current = '';
    setSelectedText(text);
    setTargetElement(activeEl);
    setCurrentScene(isWriting ? 'writing' : 'reading');
    setModalPosition(clampedPos);
    setActiveAction(action);
    setIsQuickAskMode(false);
    setShowModal(true);
    setPosition(null);
    setShowMoreMenu(false);
    setShowCloseMenu(false);
    startAI(action, text);
  };

  const triggerActionRef = useRef<typeof triggerActionDirectly | null>(null);
  useEffect(() => {
    triggerActionRef.current = triggerActionDirectly;
  });

  // Global keyboard shortcuts listener for actions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const curSettings = settingsRef.current;
      if (!curSettings) return;
      if (curSettings.showToolbar === false) return;
      if (isDomainDisabled(window.location.hostname, curSettings.disabledWebsites)) return;

      // 1. Check Page Actions first (can trigger WITHOUT text selection and works even when modal has focus)
      const pageActions = (curSettings.pageActions && curSettings.pageActions.length > 0 
        ? curSettings.pageActions 
        : DEFAULT_PAGE_ACTIONS).filter(a => a.enabled !== false);
      const matchingPageAction = pageActions.find(a => matchesShortcut(e, a.shortcut));
      if (matchingPageAction) {
        e.preventDefault();
        e.stopPropagation();
        triggerPageActionRef.current?.(matchingPageAction);
        return;
      }

      // Ignore selection actions if user is interacting inside our own shadow DOM / root
      const container = document.getElementById('lightning-ai-root');
      if (container && container.contains(e.target as Node)) return;

      // 2. Check Selection Actions (requires text selection)
      const actions = (curSettings.actions && curSettings.actions.length > 0 
        ? curSettings.actions 
        : DEFAULT_ACTIONS).filter(a => a.enabled !== false);
      const matchingAction = actions.find(a => matchesShortcut(e, a.shortcut));
      if (!matchingAction) return;

      let text = '';
      let isWriting = false;
      let activeElTarget: HTMLElement | null = null;
      let targetRect: DOMRect | null = null;

      const activeEl = document.activeElement as HTMLElement;

      if (activeEl && (activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement)) {
        const start = activeEl.selectionStart ?? 0;
        const end = activeEl.selectionEnd ?? 0;
        if (end > start) {
          text = activeEl.value.substring(start, end).trim();
          isWriting = true;
          activeElTarget = activeEl;
          targetRect = activeEl.getBoundingClientRect();
        }
      } else {
        const selection = window.getSelection();
        const selText = selection?.toString().trim();
        if (selText && selection && selection.rangeCount > 0) {
          text = selText;
          if (activeEl && (activeEl.isContentEditable || activeEl.closest('[contenteditable="true"]'))) {
            isWriting = true;
            activeElTarget = activeEl;
          }
          try {
            targetRect = selection.getRangeAt(0).getBoundingClientRect();
          } catch {
            targetRect = null;
          }
        }
      }

      if (text) {
        e.preventDefault();
        e.stopPropagation();
        triggerActionRef.current?.(matchingAction, text, isWriting, activeElTarget, targetRect);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  const handleTargetLanguageChange = async (newLang: string) => {
    if (!settings) return;
    const updated = { ...settings, targetLanguage: newLang };
    setSettings(updated);
    await storage.saveSettings({ targetLanguage: newLang });

    if (activeAction) {
      startAI(activeAction, selectedText, newLang);
    }
  };

  const togglePinAction = async (e: React.MouseEvent, actionId: string) => {
    e.stopPropagation();
    if (!settings) return;
    const updatedActions = settings.actions.map(a => {
      if (a.id === actionId) {
        return { ...a, isPinned: !a.isPinned };
      }
      return a;
    });
    setSettings({ ...settings, actions: updatedActions });
    await storage.saveSettings({ actions: updatedActions });
  };

  const handleCopy = () => {
    if (!aiResponse) return;
    navigator.clipboard.writeText(aiResponse);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const closeToolbar = () => {
    setPosition(null);
    setShowMoreMenu(false);
    setShowCloseMenu(false);
    window.getSelection()?.removeAllRanges();
  };

  const handleDisableOnCurrentSite = async () => {
    const currentHost = normalizeDomain(window.location.hostname);
    const curSettings = settings || settingsRef.current;
    if (currentHost && curSettings) {
      const existing = curSettings.disabledWebsites || [];
      if (!existing.includes(currentHost)) {
        const updated = [...existing, currentHost];
        setSettings({ ...curSettings, disabledWebsites: updated });
        await storage.saveSettings({ disabledWebsites: updated });
      }
    }
    closeToolbar();
  };

  const replaceText = () => {
    if (!targetElement || !aiResponse) return;

    if (targetElement instanceof HTMLTextAreaElement || targetElement instanceof HTMLInputElement) {
      const start = targetElement.selectionStart ?? 0;
      const end = targetElement.selectionEnd ?? targetElement.value.length;
      const oldVal = targetElement.value;
      const newVal = oldVal.substring(0, start) + aiResponse + oldVal.substring(end);
      targetElement.value = newVal;
      targetElement.dispatchEvent(new Event('input', { bubbles: true }));
      targetElement.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (targetElement.isContentEditable) {
      targetElement.innerText = aiResponse;
      targetElement.dispatchEvent(new Event('input', { bubbles: true }));
    }
    setShowModal(false);
  };

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    // If clicked on an interactive element (button, select, input, link, textarea), do not drag
    const target = e.target as HTMLElement;
    if (target.closest('button, select, input, a, textarea')) {
      return;
    }
    if (!modalPosition) return;

    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      modalX: modalPosition.x,
      modalY: modalPosition.y,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragStartRef.current) return;
      moveEvent.preventDefault();

      const dx = moveEvent.clientX - dragStartRef.current.mouseX;
      const dy = moveEvent.clientY - dragStartRef.current.mouseY;

      // Modal is 450px wide, centered horizontally via translateX(-50%)
      const modalHalfWidth = 225;
      const minX = window.scrollX + modalHalfWidth + 10;
      const maxX = window.scrollX + window.innerWidth - modalHalfWidth - 10;
      const clampedX = Math.min(Math.max(minX, dragStartRef.current.modalX + dx), Math.max(minX, maxX));

      // Modal top is modalPosition.y + 36
      // Keep header visible inside visible window
      const minY = window.scrollY - 26;
      const maxY = window.scrollY + window.innerHeight - 80;
      const clampedY = Math.min(Math.max(minY, dragStartRef.current.modalY + dy), maxY);

      setModalPosition({
        x: clampedX,
        y: clampedY,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };

    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const actions = (settings?.actions && settings.actions.length > 0) ? settings.actions : DEFAULT_ACTIONS;
  const enabledActions = actions.filter(a => a.enabled !== false);
  const visibleActions = enabledActions.filter(a => a.scene === 'all' || a.scene === currentScene);

  // Pinned actions on main bar
  const pinnedActions = visibleActions.filter(a => a.isPinned);

  const appIconUrl = chrome.runtime.getURL('icons/icon32.png');

  return (
    <>
      {position && !showModal && (
        <div
          className="lightning-toolbar absolute z-[2147483647] flex items-center bg-white rounded-full px-2.5 py-1 gap-1 animate-fade-in-up select-none"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: 'translateX(-50%)',
            border: '2px solid #0f172a',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.25)',
          }}
        >
          {/* Pinned Action Buttons on Main Bar */}
          {pinnedActions.map((action) => {
            const localizedLabel = getLocalizedActionLabel(action, currentLang);
            return (
              <div key={action.id} className="relative group flex items-center justify-center">
                <button
                  onClick={() => handleAction(action)}
                  className="h-8 min-w-[32px] px-2 flex items-center justify-center rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer"
                  aria-label={localizedLabel}
                >
                  <ActionIcon action={action} />
                </button>

                {/* Text Bubble (Tooltip) on Hover */}
                <div className="lightning-tooltip absolute -top-9 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-medium rounded-lg shadow-lg whitespace-nowrap pointer-events-none z-50">
                  <span>{action.id === 'translate' ? `${t.translateTo} ${getTargetLangLabel(settings?.targetLanguage)}` : localizedLabel}</span>
                  {action.shortcut && (
                    <kbd className="px-1 py-0.2 text-[9px] font-mono bg-slate-800 text-slate-300 border border-slate-700 rounded">
                      {action.shortcut}
                    </kbd>
                  )}
                  <div className="lightning-tooltip-arrow absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
                </div>
              </div>
            );
          })}

          {/* Always Visible More Button (...) */}
          <div className="relative flex items-center justify-center">
            <button
              onClick={() => {
                setShowMoreMenu(!showMoreMenu);
                setShowCloseMenu(false);
              }}
              className={`h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer text-slate-700 ${
                showMoreMenu ? 'bg-purple-100 text-purple-700 font-bold' : ''
              }`}
              title={t.moreActions}
              aria-label={t.moreActions}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
            </button>

            {/* Monica-style Action List Dropdown Menu with Pin Buttons */}
            {showMoreMenu && (
              <div 
                className="lightning-dropdown absolute top-full mt-2.5 left-1/2 -translate-x-1/2 bg-white rounded-2xl py-2 min-w-[240px] z-50 animate-fade-in-up divide-y divide-slate-100"
                style={{
                  border: '2px solid #0f172a',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.25)',
                }}
              >
                <div className="px-3.5 py-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>{t.actionListTitle}</span>
                  <span className="text-[10px] text-purple-600 font-semibold">{t.pinHeader}</span>
                </div>

                <div className="max-h-[300px] overflow-y-auto py-1">
                  {visibleActions.map((action) => {
                    const localizedLabel = getLocalizedActionLabel(action, currentLang);
                    return (
                      <div
                        key={action.id}
                        onClick={() => handleAction(action)}
                        className="px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-between group transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-slate-300 group-hover:text-slate-400 text-xs">⠿</span>
                          <span className="text-base shrink-0">{action.icon}</span>
                          <span className="truncate max-w-[130px]">
                            {action.id === 'translate' ? `${t.translateTo} ${getTargetLangLabel(settings?.targetLanguage)}` : localizedLabel}
                          </span>
                          {action.shortcut && (
                            <kbd className="px-1.5 py-0.5 text-[9px] font-mono bg-slate-100 text-slate-600 border border-slate-200 rounded">
                              {action.shortcut}
                            </kbd>
                          )}
                        </div>

                        {/* Pin Toggle Button */}
                        <button
                          onClick={(e) => togglePinAction(e, action.id)}
                          className={`p-1 rounded-md transition-colors ${
                            action.isPinned
                              ? 'text-purple-600 bg-purple-50 hover:bg-purple-100'
                              : 'text-slate-300 hover:text-slate-600 hover:bg-slate-100'
                          }`}
                          title={action.isPinned ? t.unpinTooltip : t.pinTooltip}
                        >
                          <svg className={`w-3.5 h-3.5 ${action.isPinned ? 'fill-current' : ''}`} viewBox="0 0 24 24" fill={action.isPinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Quick Ask Fixed Button with App Icon */}
          {settings?.quickAskEnabled !== false && (
            <div className="relative group flex items-center justify-center">
              <button
                onClick={handleOpenQuickAsk}
                className="h-7 w-7 rounded-full flex items-center justify-center shadow-xs transition-transform active:scale-95 cursor-pointer ml-0.5 hover:ring-2 hover:ring-blue-400"
                aria-label="Quick Ask"
              >
                <img src={appIconUrl} alt="Lightning" className="w-6 h-6 rounded-full" />
              </button>

              {/* Tooltip */}
              <div className="lightning-tooltip absolute -top-9 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center px-2.5 py-1 bg-slate-900 text-white text-[11px] font-medium rounded-lg shadow-lg whitespace-nowrap pointer-events-none z-50">
                {t.quickAsk}
                <div className="lightning-tooltip-arrow absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="w-px h-4 bg-slate-300 mx-0.5"></div>

          {/* Close Button & Options Popover */}
          <div className="relative flex items-center justify-center">
            <button
              onClick={() => {
                setShowCloseMenu(!showCloseMenu);
                setShowMoreMenu(false);
              }}
              className={`h-6 w-6 flex items-center justify-center rounded-full transition-colors cursor-pointer text-xs ${
                showCloseMenu ? 'bg-slate-200 text-slate-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}
              title={t.closeBtn}
              aria-label={t.closeBtn}
            >
              ✕
            </button>

            {/* Close Options Popover */}
            {showCloseMenu && (
              <div 
                className="lightning-dropdown absolute top-full mt-2.5 right-0 bg-white rounded-2xl py-1.5 min-w-[210px] z-50 animate-fade-in-up text-left shadow-2xl divide-y divide-slate-100"
                style={{
                  border: '2px solid #0f172a',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.25)',
                }}
              >
                <div className="py-0.5">
                  <button
                    onClick={closeToolbar}
                    className="w-full px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                  >
                    <span className="text-slate-400 text-xs shrink-0">✕</span>
                    <span className="truncate">{t.closeToolbarThisTime}</span>
                  </button>
                </div>
                <div className="py-0.5">
                  <button
                    onClick={handleDisableOnCurrentSite}
                    className="w-full px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                  >
                    <span className="text-rose-500 text-sm shrink-0">🚫</span>
                    <div className="flex flex-col min-w-0">
                      <span className="truncate font-semibold">{t.disableOnThisSite}</span>
                      <span className="text-[10px] text-slate-400 truncate max-w-[150px]">
                        {normalizeDomain(window.location.hostname)}
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RESULT / QUICK ASK MODAL */}
      {showModal && modalPosition && activeAction && (
        <div 
          className={`absolute z-[2147483647] ${isDragging ? 'cursor-grabbing select-none' : 'animate-fade-in-up'}`}
          style={{
            left: `${Math.min(Math.max(225, modalPosition.x), window.innerWidth + window.scrollX - 225)}px`,
            top: `${modalPosition.y + 36}px`,
            transform: 'translateX(-50%)',
            width: '450px',
            maxWidth: 'calc(100vw - 32px)',
          }}
        >
          <div 
            className="lightning-modal bg-white rounded-2xl w-full overflow-hidden flex flex-col max-h-[75vh]"
            style={{
              border: '2px solid #0f172a',
              boxShadow: isDragging 
                ? '0 30px 60px -12px rgba(0, 0, 0, 0.45)' 
                : '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
              transition: isDragging ? 'none' : 'box-shadow 0.2s ease',
            }}
          >
            {/* Header */}
            <div 
              onMouseDown={handleHeaderMouseDown}
              className={`lightning-modal-header px-4 py-2.5 border-b border-slate-200 flex justify-between items-center bg-slate-50/90 select-none ${
                isDragging ? 'is-dragging cursor-grabbing' : 'cursor-grab'
              }`}
              title={t.dragToMove}
            >
              <div className="flex items-center gap-2">
                <span className="text-slate-300 hover:text-slate-500 text-xs shrink-0 select-none cursor-grab" title={t.dragToMove}>
                  ⠿
                </span>
                <span className="text-base shrink-0">{activeAction.icon}</span>

                {/* If Translation: Show Target Language Dropdown right in header! */}
                {activeAction.id === 'translate' ? (
                  <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-slate-300 shadow-2xs">
                    <span className="text-xs text-slate-500 font-medium">{t.translateTo}</span>
                    <select
                      value={settings?.targetLanguage === 'tiếng Việt' ? 'Vietnamese' : (settings?.targetLanguage || 'Vietnamese')}
                      onChange={(e) => handleTargetLanguageChange(e.target.value)}
                      className="bg-transparent text-xs font-bold text-blue-600 focus:outline-none cursor-pointer pr-1"
                    >
                      {t.targetLanguages.map((lang) => (
                        <option key={lang.code} value={lang.code}>{lang.label}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <span className="font-bold text-slate-800 text-sm">
                    {isQuickAskMode ? 'Quick Ask ⚡' : getLocalizedActionLabel(activeAction, currentLang)}
                  </span>
                )}

                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-[10px] text-blue-600 font-bold border border-blue-100">
                  <img src={appIconUrl} alt="Lightning" className="w-3.5 h-3.5 rounded" />
                  <span>Lightning</span>
                </div>
              </div>

              <button 
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 p-1 rounded-lg transition-colors cursor-pointer text-xs"
                title={t.closeBtn}
              >
                ✕
              </button>
            </div>

            {/* Page Actions Switcher Tab Bar */}
            {isPageAction && (
              <div className="px-3.5 py-2 bg-slate-100/90 border-b border-slate-200/80 flex items-center">
                <div className="inline-flex p-1 bg-white rounded-xl border border-slate-200 shadow-2xs gap-1 overflow-x-auto">
                  {((settings?.pageActions && settings.pageActions.length > 0) ? settings.pageActions : DEFAULT_PAGE_ACTIONS)
                    .filter(pa => pa.enabled !== false)
                    .map((pa) => {
                    const isSelected = activeAction.id === pa.id;
                    const label = pa.isDefault
                      ? (pa.id === 'summarize-page' ? t.tabSummarize : pa.id === 'simplify-page' ? t.tabSimplify : pa.label)
                      : pa.label;
                    return (
                      <button
                        key={pa.id}
                        type="button"
                        onClick={() => handleSwitchPageActionTab(pa)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-xs font-bold'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-sm">{pa.icon}</span>
                        <span>{label}</span>
                        {pa.shortcut && (
                          <kbd className={`px-1 py-0.2 text-[9px] font-mono rounded ${
                            isSelected ? 'bg-blue-700 text-blue-100' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {pa.shortcut}
                          </kbd>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Ask Input Bar (when in Quick Ask mode) */}
            {isQuickAskMode && (
              <div className="p-3 bg-slate-50/70 border-b border-slate-200 space-y-2">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSendQuickAsk(); }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={quickAskQuestion}
                    onChange={(e) => setQuickAskQuestion(e.target.value)}
                    placeholder={t.quickAskPlaceholder}
                    disabled={isGenerating}
                    className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 font-sans shadow-xs"
                    autoFocus
                  />
                  {/* Web Search Toggle Button */}
                  <button
                    type="button"
                    onClick={() => setWebSearchActive(!webSearchActive)}
                    className={`flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border shrink-0 ${
                      webSearchActive
                        ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-2xs hover:bg-blue-100'
                        : 'bg-white border-slate-300 text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                    }`}
                    title={t.webSearchTooltip}
                  >
                    <span className="text-sm leading-none">🌐</span>
                    <span className="text-[11px]">{t.webSearch}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ml-0.5 ${webSearchActive ? 'bg-blue-600' : 'bg-slate-300'}`}></span>
                  </button>

                  <button
                    type="submit"
                    disabled={!quickAskQuestion.trim() || isGenerating}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-black disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
                  >
                    {t.askBtn} ➔
                  </button>
                </form>

                {/* Quick Suggestion Chips */}
                {!aiResponse && !isGenerating && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {t.quickAskSuggestions.map((sug, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSendQuickAsk(sug)}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 hover:border-slate-800 text-slate-700 rounded-lg text-[11px] transition-colors cursor-pointer shadow-2xs"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* AI Response Area */}
            <div 
              className="p-4 overflow-y-auto flex-1 bg-white min-h-[90px] leading-relaxed"
              style={{
                fontFamily: getFontFamilyCss(settings?.fontFamily),
                fontSize: getFontSizeCss(settings?.fontSize),
              }}
            >
              {isGenerating && !aiResponse ? (
                <div className="text-slate-400 text-xs italic flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
                  <span>{t.thinking}</span>
                </div>
              ) : (
                <MarkdownRenderer content={aiResponse} isGenerating={isGenerating} />
              )}
            </div>
            
            {/* Sleek Icon-Only Footer */}
            <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
              <span className="text-[11px] text-slate-400 truncate max-w-[200px]">
                {selectedText}
              </span>

              {/* Compact Icon Action Buttons */}
              <div className="flex items-center gap-1.5">
                {/* Replace text in input/editor */}
                {targetElement && !isGenerating && (
                  <div className="relative group flex items-center justify-center">
                    <button 
                      onClick={replaceText}
                      className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer border border-slate-300 hover:border-slate-800"
                      aria-label={t.replaceBtn}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <div className="absolute -top-8 right-0 hidden group-hover:flex items-center px-2 py-1 bg-slate-900 text-white text-[11px] font-medium rounded-lg shadow-lg whitespace-nowrap pointer-events-none z-30">
                      {t.replaceBtn}
                      <div className="absolute top-full right-2.5 border-4 border-transparent border-t-slate-900"></div>
                    </div>
                  </div>
                )}

                {/* Copy Button */}
                <div className="relative group flex items-center justify-center">
                  <button 
                    onClick={handleCopy}
                    className="p-1.5 text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer border border-slate-300 hover:border-slate-800"
                    aria-label={copied ? t.copiedBtn : t.copyBtn}
                  >
                    {copied ? (
                      <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                      </svg>
                    )}
                  </button>
                  <div className="absolute -top-8 right-0 hidden group-hover:flex items-center px-2 py-1 bg-slate-900 text-white text-[11px] font-medium rounded-lg shadow-lg whitespace-nowrap pointer-events-none z-30">
                    {copied ? t.copiedBtn : t.copyBtn}
                    <div className="absolute top-full right-2.5 border-4 border-transparent border-t-slate-900"></div>
                  </div>
                </div>

                {/* Retry Button */}
                {!isQuickAskMode && (
                  <div className="relative group flex items-center justify-center">
                    <button 
                      onClick={() => {
                        if (isPageAction) {
                          pageActionCacheRef.current[activeAction.id] = '';
                          startAI(activeAction, extractedArticleRef.current || selectedText);
                        } else {
                          startAI(activeAction, selectedText);
                        }
                      }}
                      disabled={isGenerating}
                      className="p-1.5 text-slate-700 hover:bg-slate-200/60 disabled:opacity-40 rounded-lg transition-colors cursor-pointer border border-slate-300 hover:border-slate-800"
                      aria-label={t.retryBtn}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                    <div className="absolute -top-8 right-0 hidden group-hover:flex items-center px-2 py-1 bg-slate-900 text-white text-[11px] font-medium rounded-lg shadow-lg whitespace-nowrap pointer-events-none z-30">
                      {t.retryBtn}
                      <div className="absolute top-full right-2.5 border-4 border-transparent border-t-slate-900"></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function init() {
  if (document.getElementById('lightning-ai-root')) return;
  if (!document.body) {
    window.addEventListener('DOMContentLoaded', init, { once: true });
    return;
  }

  const container = document.createElement('div');
  container.id = 'lightning-ai-root';
  container.style.position = 'absolute';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '100%';
  container.style.zIndex = '2147483647';
  container.style.pointerEvents = 'none';
  document.body.appendChild(container);

  const shadowRoot = container.attachShadow({ mode: 'open' });
  
  const wrapper = document.createElement('div');
  wrapper.style.pointerEvents = 'auto';
  shadowRoot.appendChild(wrapper);

  const style = document.createElement('style');
  style.textContent = tailwindStyles;
  shadowRoot.appendChild(style);

  createRoot(wrapper).render(
    <StrictMode>
      <FloatingToolbar />
    </StrictMode>
  );
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
