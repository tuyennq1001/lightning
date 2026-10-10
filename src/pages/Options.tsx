import { useState, useEffect, useRef, useMemo } from 'react';
import { useSettings } from '../hooks/useSettings';
import { 
  type UserSettings, 
  type CustomAction, 
  type FontFamilyOption, 
  type FontSizeOption, 
  DEFAULT_ACTIONS, 
  DEFAULT_PAGE_ACTIONS,
  normalizeDomain, 
  getDefaultOutputLanguage,
  getFontFamilyCss,
  getFontSizeCss 
} from '../utils/storage';
import { getT, getDefaultPrompt, type LanguageCode } from '../utils/i18n';

type SectionId = 'general' | 'translation' | 'page-actions' | 'toolbar' | 'provider' | 'help' | 'about';

const PRESET_ICONS = [
  // Reading & Learning
  '📄', '📖', '📚', '📑', '📰', '🎓', '📜', '🔖', '💡', '🧠',
  // Writing & Editing
  '✍️', '📝', '✏️', '✒️', '📋', '💬', '🗨️', '🖋️', '📌', '🏷️',
  // AI, Tech & Code
  '🤖', '⚡', '💻', '⚙️', '🛠️', '🔬', '🧪', '🔑', '🛡️', '🔨',
  // Search & Data Analysis
  '🔍', '🔎', '📊', '📈', '📉', '🎯', '🧭', '🌐', '📡', '📍',
  // Creativity & Productivity
  '✨', '🎨', '🚀', '🔥', '🌟', '🎭', '🧩', '💼', '📁', '⭐',
  '💎', '🔔', '✅', '☕', '🪄', '🔮'
];

const getPromptVariables = (t: ReturnType<typeof getT>) => [
  { label: '{text}', desc: t.varTextDesc },
  { label: '{OUTPUT_LANG}', desc: t.varOutputLangDesc },
  { label: '{TARGET_LANG}', desc: t.varTargetLangDesc },
  { label: '{SOURCE_LANG}', desc: t.varSourceLangDesc },
  { label: '{page_title}', desc: t.varPageTitleDesc },
  { label: '{page_url}', desc: t.varPageUrlDesc },
];

const ChevronDownIcon = () => (
  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  </div>
);

export default function Options() {
  const { settings, updateSettings, loading } = useSettings();
  
  // Active Sidebar Section & Scroll Refs
  const [activeSection, setActiveSection] = useState<SectionId>('general');
  const activeSectionRef = useRef<SectionId>('general');
  const mainContainerRef = useRef<HTMLElement>(null);
  const navContainerRef = useRef<HTMLElement>(null);
  const isManualScrollRef = useRef(false);

  // Toolbar scene filter tab
  const [toolbarFilter, setToolbarFilter] = useState<'all' | 'reading' | 'writing'>('reading');

  // Settings State
  const [localKey, setLocalKey] = useState('');
  const [provider, setProvider] = useState<UserSettings['provider']>('gemini');
  const [modelId, setModelId] = useState('');
  const [apiKeys, setApiKeys] = useState<Partial<Record<UserSettings['provider'], string>>>({});
  const [modelIds, setModelIds] = useState<Partial<Record<UserSettings['provider'], string>>>({});
  const [modelSearchQuery, setModelSearchQuery] = useState('');
  const [isManualModelInput, setIsManualModelInput] = useState(false);
  const [sourceLanguage, setSourceLanguage] = useState('auto');
  const [targetLanguage, setTargetLanguage] = useState('Vietnamese');
  const [outputLanguage, setOutputLanguage] = useState('Vietnamese');
  const [appLanguage, setAppLanguage] = useState<LanguageCode>('vi');
  const [fontFamily, setFontFamily] = useState<FontFamilyOption>('system');
  const [fontSize, setFontSize] = useState<FontSizeOption>('14px');
  const [showToolbar, setShowToolbar] = useState(true);
  const [quickAskEnabled, setQuickAskEnabled] = useState(true);
  const [webSearchEnabled, setWebSearchEnabled] = useState(true);
  const [actions, setActions] = useState<CustomAction[]>([]);
  const [pageActions, setPageActions] = useState<CustomAction[]>([]);
  const [disabledWebsites, setDisabledWebsites] = useState<string[]>([]);
  const [newDomainInput, setNewDomainInput] = useState('');
  const [searchDomainQuery, setSearchDomainQuery] = useState('');
  const [domainError, setDomainError] = useState('');
  
  const [saved, setSaved] = useState(false);

  // Model loading state
  const [models, setModels] = useState<{ id: string; name: string }[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelError, setModelError] = useState('');

  // Modal State (Add or Edit)
  const [showModal, setShowModal] = useState(false);
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [isEditingPageAction, setIsEditingPageAction] = useState(false);
  const [actionName, setActionName] = useState('');
  const [actionIcon, setActionIcon] = useState('✨');
  const [actionPrompt, setActionPrompt] = useState('');
  const [actionScene, setActionScene] = useState<'all' | 'reading' | 'writing'>('reading');
  const [actionShortcut, setActionShortcut] = useState('');
  const [isRecordingShortcut, setIsRecordingShortcut] = useState(false);
  const promptTextareaRef = useRef<HTMLTextAreaElement>(null);

  const t = getT(appLanguage);

  const filteredModels = useMemo(() => {
    if (!modelSearchQuery.trim()) return models;
    const query = modelSearchQuery.toLowerCase();
    return models.filter((m) => m.id.toLowerCase().includes(query) || m.name.toLowerCase().includes(query));
  }, [models, modelSearchQuery]);

  const conflictingAction = useMemo(() => {
    if (!actionShortcut.trim()) return null;
    const allActions = [...actions, ...pageActions];
    return allActions.find(
      (a) => a.id !== editingActionId && a.shortcut?.toLowerCase() === actionShortcut.trim().toLowerCase()
    );
  }, [actions, pageActions, actionShortcut, editingActionId]);

  useEffect(() => {
    document.title = 'Lightning Options';
  }, []);

  // Close modal on Escape key
  useEffect(() => {
    if (!showModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal]);

  useEffect(() => {
    if (settings) {
      const activeProv = settings.provider || 'gemini';
      const storedApiKeys = settings.apiKeys || {};
      const storedModelIds = settings.modelIds || {};
      setApiKeys(storedApiKeys);
      setModelIds(storedModelIds);
      setProvider(activeProv);
      setLocalKey(storedApiKeys[activeProv] || settings.apiKey || '');
      setModelId(storedModelIds[activeProv] || settings.modelId || '');
      setSourceLanguage(settings.sourceLanguage || 'auto');
      setTargetLanguage(settings.targetLanguage || 'Vietnamese');
      setOutputLanguage(settings.outputLanguage || getDefaultOutputLanguage((settings.appLanguage as LanguageCode) || 'vi'));
      setAppLanguage((settings.appLanguage as LanguageCode) || 'vi');
      setFontFamily(settings.fontFamily || 'system');
      setFontSize(settings.fontSize || '14px');
      setShowToolbar(settings.showToolbar !== false);
      setQuickAskEnabled(settings.quickAskEnabled !== false);
      setWebSearchEnabled(settings.webSearchEnabled !== false);
      setActions(settings.actions && settings.actions.length > 0 ? settings.actions : DEFAULT_ACTIONS);
      setPageActions(settings.pageActions && settings.pageActions.length > 0 ? settings.pageActions : DEFAULT_PAGE_ACTIONS);
      setDisabledWebsites(settings.disabledWebsites || []);
    }
  }, [settings]);

  const scrollNavToItem = (id: SectionId) => {
    const navContainer = navContainerRef.current;
    const navBtn = document.getElementById(`nav-item-${id}`);
    if (navContainer && navBtn) {
      const containerRect = navContainer.getBoundingClientRect();
      const btnRect = navBtn.getBoundingClientRect();
      if (btnRect.top < containerRect.top || btnRect.bottom > containerRect.bottom) {
        navBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  };

  const scrollToSection = (id: SectionId) => {
    activeSectionRef.current = id;
    setActiveSection(id);
    scrollNavToItem(id);
    const element = document.getElementById(`section-${id}`);
    if (element) {
      isManualScrollRef.current = true;
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => {
        isManualScrollRef.current = false;
      }, 800);
    }
  };

  const handleScroll = (e?: React.UIEvent<HTMLElement>) => {
    if (isManualScrollRef.current) return;
    const container = (e?.currentTarget as HTMLElement) || mainContainerRef.current;
    if (!container) return;

    const sections: SectionId[] = ['general', 'translation', 'page-actions', 'toolbar', 'provider', 'help', 'about'];
    const containerTop = container.getBoundingClientRect().top;
    const containerHeight = container.clientHeight;
    const scrollHeight = container.scrollHeight;
    const scrollTop = container.scrollTop;

    // Bottom check: if scrolled near the bottom, activate the last section ('about')
    const isNearBottom = scrollTop + containerHeight >= scrollHeight - 60;
    if (isNearBottom) {
      if (activeSectionRef.current !== 'about') {
        activeSectionRef.current = 'about';
        setActiveSection('about');
        scrollNavToItem('about');
      }
      return;
    }

    // Dynamic threshold: roughly 35% of visible viewport
    const threshold = Math.max(140, containerHeight * 0.35);

    let currentSection: SectionId = 'general';
    for (let i = sections.length - 1; i >= 0; i--) {
      const el = document.getElementById(`section-${sections[i]}`);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top - containerTop <= threshold) {
          currentSection = sections[i];
          break;
        }
      }
    }

    if (activeSectionRef.current !== currentSection) {
      activeSectionRef.current = currentSection;
      setActiveSection(currentSection);
      scrollNavToItem(currentSection);
    }
  };

  useEffect(() => {
    if (loading) return;
    const container = mainContainerRef.current;
    if (!container) return;

    const onNativeScroll = () => handleScroll();
    container.addEventListener('scroll', onNativeScroll, { passive: true });
    return () => container.removeEventListener('scroll', onNativeScroll);
  }, [loading]);

  const handleProviderChange = (newProvider: UserSettings['provider']) => {
    const updatedApiKeys = { ...apiKeys, [provider]: localKey.trim() };
    const updatedModelIds = { ...modelIds, [provider]: modelId.trim() };
    setApiKeys(updatedApiKeys);
    setModelIds(updatedModelIds);

    setProvider(newProvider);
    setLocalKey(updatedApiKeys[newProvider] || '');
    setModelId(updatedModelIds[newProvider] || '');
    setModels([]);
    setModelSearchQuery('');
    setIsManualModelInput(false);
    setModelError('');
  };

  const handleLoadModels = async () => {
    if (!localKey.trim()) {
      setModelError(t.enterKeyFirst);
      return;
    }
    setLoadingModels(true);
    setModelError('');
    try {
      let loadedModels: { id: string; name: string }[] = [];
      if (provider === 'gemini') {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(localKey.trim())}`);
        if (!res.ok) throw new Error('API Key không hợp lệ hoặc lỗi mạng');
        const data = await res.json();
        loadedModels = (data.models || [])
          .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
          .map((m: any) => ({
            id: m.name.replace('models/', ''),
            name: m.displayName || m.name.replace('models/', ''),
          }));
      } else if (provider === 'openai') {
        const res = await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${localKey.trim()}` }
        });
        if (!res.ok) throw new Error('API Key không hợp lệ hoặc lỗi mạng');
        const data = await res.json();
        loadedModels = (data.data || [])
          .filter((m: any) => m.id.startsWith('gpt'))
          .map((m: any) => ({
            id: m.id,
            name: m.id,
          }));
        loadedModels.sort((a, b) => b.id.localeCompare(a.id));
      } else if (provider === 'claude') {
        loadedModels = [
          { id: 'claude-3-5-sonnet-20240620', name: 'Claude 3.5 Sonnet' },
          { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
          { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' },
          { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' },
        ];
      } else if (provider === 'openrouter') {
        const res = await fetch('https://openrouter.ai/api/v1/models', {
          headers: { Authorization: `Bearer ${localKey.trim()}` }
        });
        if (!res.ok) throw new Error('API Key không hợp lệ hoặc lỗi mạng');
        const data = await res.json();
        loadedModels = (data.data || []).map((m: any) => ({
          id: m.id,
          name: m.name || m.id,
        }));
        loadedModels.sort((a, b) => {
          const aFree = a.id.includes(':free') || a.id.toLowerCase().includes('free');
          const bFree = b.id.includes(':free') || b.id.toLowerCase().includes('free');
          if (aFree && !bFree) return -1;
          if (!aFree && bFree) return 1;
          return a.id.localeCompare(b.id);
        });
      }
      
      setModels(loadedModels);
      
      if (loadedModels.length > 0) {
        let defaultModel = loadedModels[0].id;
        if (provider === 'gemini') {
          const bestModel = loadedModels.find(m => m.id === 'gemini-flash-lite-latest' || m.id === 'gemini-2.0-flash-lite' || m.id === 'gemini-1.5-flash-8b') 
                         || loadedModels.find(m => m.id === 'gemini-1.5-flash' || m.id === 'gemini-1.5-flash-latest' || m.id === 'gemini-2.0-flash')
                         || loadedModels.find(m => m.id.includes('flash'))
                         || loadedModels.find(m => m.id.includes('pro'));
          if (bestModel) defaultModel = bestModel.id;
        } else if (provider === 'openai') {
          const bestModel = loadedModels.find(m => m.id === 'gpt-4o' || m.id === 'gpt-4-turbo');
          if (bestModel) defaultModel = bestModel.id;
        } else if (provider === 'openrouter') {
          if (modelId && loadedModels.some(m => m.id === modelId)) {
            defaultModel = modelId;
          } else {
            defaultModel = loadedModels[0].id;
          }
        }
        setModelId(defaultModel);
      } else {
        setModelError(t.noCompatibleModels);
      }
    } catch (err: any) {
      setModelError(err.message);
    } finally {
      setLoadingModels(false);
    }
  };

  const handleSaveAll = async (
    newActions?: CustomAction[], 
    newShowToolbar?: boolean,
    newAppLang?: LanguageCode,
    newWebSearch?: boolean,
    newDisabledWebsites?: string[],
    newOutputLang?: string,
    newFontFamily?: FontFamilyOption,
    newFontSize?: FontSizeOption,
    newPageActions?: CustomAction[],
    newQuickAsk?: boolean
  ) => {
    const actionsToSave = newActions || actions;
    const pageActionsToSave = newPageActions || pageActions;
    const toolbarToSave = newShowToolbar !== undefined ? newShowToolbar : showToolbar;
    const quickAskToSave = newQuickAsk !== undefined ? newQuickAsk : quickAskEnabled;
    const appLangToSave = newAppLang || appLanguage;
    const webSearchToSave = newWebSearch !== undefined ? newWebSearch : webSearchEnabled;
    const disabledWebsitesToSave = newDisabledWebsites !== undefined ? newDisabledWebsites : disabledWebsites;
    const outputLangToSave = newOutputLang !== undefined ? newOutputLang : outputLanguage;
    const fontFamilyToSave = newFontFamily || fontFamily;
    const fontSizeToSave = newFontSize || fontSize;
    
    const updatedApiKeys = { ...apiKeys, [provider]: localKey.trim() };
    const updatedModelIds = { ...modelIds, [provider]: modelId.trim() };
    setApiKeys(updatedApiKeys);
    setModelIds(updatedModelIds);

    await updateSettings({ 
      apiKey: localKey.trim(), 
      provider, 
      modelId: modelId.trim(), 
      apiKeys: updatedApiKeys,
      modelIds: updatedModelIds,
      sourceLanguage, 
      targetLanguage,
      outputLanguage: outputLangToSave,
      appLanguage: appLangToSave,
      actions: actionsToSave,
      pageActions: pageActionsToSave,
      showToolbar: toolbarToSave,
      quickAskEnabled: quickAskToSave,
      webSearchEnabled: webSearchToSave,
      disabledWebsites: disabledWebsitesToSave,
      fontFamily: fontFamilyToSave,
      fontSize: fontSizeToSave,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleFontFamilyChange = async (newFamily: FontFamilyOption) => {
    setFontFamily(newFamily);
    await handleSaveAll(actions, showToolbar, appLanguage, webSearchEnabled, disabledWebsites, outputLanguage, newFamily, fontSize);
  };

  const handleFontSizeChange = async (newSize: FontSizeOption) => {
    setFontSize(newSize);
    await handleSaveAll(actions, showToolbar, appLanguage, webSearchEnabled, disabledWebsites, outputLanguage, fontFamily, newSize);
  };

  const handleAddDomain = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setDomainError('');
    const cleaned = normalizeDomain(newDomainInput);
    if (!cleaned) {
      setDomainError(t.invalidDomainFormat);
      return;
    }
    if (disabledWebsites.includes(cleaned)) {
      setDomainError(t.websiteAlreadyExists);
      return;
    }
    const updated = [...disabledWebsites, cleaned];
    setDisabledWebsites(updated);
    setNewDomainInput('');
    await handleSaveAll(actions, showToolbar, appLanguage, webSearchEnabled, updated);
  };

  const handleRemoveDomain = async (domainToRemove: string) => {
    const updated = disabledWebsites.filter(d => d !== domainToRemove);
    setDisabledWebsites(updated);
    await handleSaveAll(actions, showToolbar, appLanguage, webSearchEnabled, updated);
  };

  const handleToggleToolbar = async () => {
    const updated = !showToolbar;
    setShowToolbar(updated);
    await handleSaveAll(actions, updated);
  };

  const handleToggleQuickAsk = async () => {
    const updated = !quickAskEnabled;
    setQuickAskEnabled(updated);
    await handleSaveAll(actions, showToolbar, appLanguage, webSearchEnabled, disabledWebsites, outputLanguage, fontFamily, fontSize, pageActions, updated);
  };

  const handleToggleWebSearch = async () => {
    const updated = !webSearchEnabled;
    setWebSearchEnabled(updated);
    await handleSaveAll(actions, showToolbar, appLanguage, updated);
  };

  const handleAppLanguageChange = async (newLang: LanguageCode) => {
    setAppLanguage(newLang);
    const updatedActions = actions.map(a => {
      if (a.isDefault) {
        return {
          ...a,
          prompt: getDefaultPrompt(a.id, newLang) || a.prompt,
        };
      }
      return a;
    });
    const updatedPageActions = pageActions.map(a => {
      if (a.isDefault) {
        return {
          ...a,
          prompt: getDefaultPrompt(a.id, newLang) || a.prompt,
        };
      }
      return a;
    });
    setActions(updatedActions);
    setPageActions(updatedPageActions);
    await handleSaveAll(updatedActions, showToolbar, newLang, webSearchEnabled, disabledWebsites, outputLanguage, fontFamily, fontSize, updatedPageActions);
  };

  const openAddModal = (isPageAction = false) => {
    setIsEditingPageAction(isPageAction);
    setEditingActionId(null);
    setActionName('');
    setActionIcon(isPageAction ? '📄' : '✨');
    setActionPrompt('');
    setActionScene('reading');
    setActionShortcut(isPageAction ? 'Alt+O' : '');
    setIsRecordingShortcut(false);
    setShowModal(true);
  };

  const openEditModal = (action: CustomAction, isPageAction = false) => {
    if (action.isDefault) return; // Default actions cannot be edited
    setIsEditingPageAction(isPageAction);
    setEditingActionId(action.id);
    const displayLabel = (action.isDefault) ? (
      action.id === 'translate' ? t.actionTranslate :
      action.id === 'summarize' ? t.actionSummarize :
      action.id === 'explain' ? t.actionExplain :
      action.id === 'rewrite' ? t.actionRewrite :
      action.id === 'summarize-page' ? t.actionSummarizePage :
      action.id === 'simplify-page' ? t.actionSimplifyPage :
      action.id === 'summarize-link' ? t.actionSummarizeLink : action.label
    ) : action.label;
    setActionName(displayLabel);
    setActionIcon(action.icon);
    setActionPrompt(action.isDefault ? (getDefaultPrompt(action.id, appLanguage) || action.prompt) : action.prompt);
    setActionScene(action.scene);
    setActionShortcut(action.shortcut || '');
    setIsRecordingShortcut(false);
    setShowModal(true);
  };

  const handleShortcutKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.key === 'Escape') {
      setIsRecordingShortcut(false);
      return;
    }
    if (e.key === 'Tab') {
      return;
    }
    if (e.key === 'Backspace' || e.key === 'Delete') {
      setActionShortcut('');
      setIsRecordingShortcut(false);
      return;
    }

    if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
      return;
    }

    const parts: string[] = [];
    if (e.ctrlKey) parts.push('Ctrl');
    if (e.altKey) parts.push('Alt');
    if (e.shiftKey) parts.push('Shift');
    if (e.metaKey) parts.push('Command');

    let mainKey = e.key.toUpperCase();
    if (e.code.startsWith('Key')) {
      mainKey = e.code.slice(3).toUpperCase();
    } else if (e.code.startsWith('Digit')) {
      mainKey = e.code.slice(5);
    }

    if (parts.length === 0) {
      parts.push('Alt');
    }

    parts.push(mainKey);
    const combo = parts.join('+');
    setActionShortcut(combo);
    setIsRecordingShortcut(false);
  };

  const handleSaveAction = async () => {
    if (!actionName.trim() || !actionPrompt.trim()) return;
    
    if (isEditingPageAction) {
      let updatedPageActions: CustomAction[];
      if (editingActionId) {
        updatedPageActions = pageActions.map(a => {
          if (a.id === editingActionId) {
            return {
              ...a,
              label: actionName.trim(),
              icon: actionIcon.trim() || '📄',
              prompt: actionPrompt.trim(),
              scene: 'all',
              shortcut: actionShortcut.trim(),
            };
          }
          return a;
        });
      } else {
        const newAction: CustomAction = {
          id: `custom-page-${Date.now()}`,
          label: actionName.trim(),
          icon: actionIcon.trim() || '📄',
          prompt: actionPrompt.trim(),
          scene: 'all',
          shortcut: actionShortcut.trim(),
          isPinned: false,
          isDefault: false
        };
        updatedPageActions = [...pageActions, newAction];
      }

      setPageActions(updatedPageActions);
      setShowModal(false);
      await handleSaveAll(actions, showToolbar, appLanguage, webSearchEnabled, disabledWebsites, outputLanguage, fontFamily, fontSize, updatedPageActions);
    } else {
      let updatedActions: CustomAction[];
      if (editingActionId) {
        updatedActions = actions.map(a => {
          if (a.id === editingActionId) {
            return {
              ...a,
              label: actionName.trim(),
              icon: actionIcon.trim() || '⚡',
              prompt: actionPrompt.trim(),
              scene: actionScene,
              shortcut: actionShortcut.trim(),
            };
          }
          return a;
        });
      } else {
        const newAction: CustomAction = {
          id: `custom-${Date.now()}`,
          label: actionName.trim(),
          icon: actionIcon.trim() || '⚡',
          prompt: actionPrompt.trim(),
          scene: actionScene,
          shortcut: actionShortcut.trim(),
          isPinned: false,
          isDefault: false
        };
        updatedActions = [...actions, newAction];
      }

      setActions(updatedActions);
      setShowModal(false);
      await handleSaveAll(updatedActions);
    }
  };

  const removePageAction = async (id: string) => {
    const updated = pageActions.filter(a => a.id !== id);
    setPageActions(updated);
    await handleSaveAll(actions, showToolbar, appLanguage, webSearchEnabled, disabledWebsites, outputLanguage, fontFamily, fontSize, updated);
  };

  const removeAction = async (id: string) => {
    const updated = actions.filter(a => a.id !== id);
    setActions(updated);
    await handleSaveAll(updated);
  };

  const togglePinAction = async (id: string) => {
    const updated = actions.map(a => {
      if (a.id === id) {
        return { ...a, isPinned: !a.isPinned };
      }
      return a;
    });
    setActions(updated);
    await handleSaveAll(updated);
  };

  const handleToggleActionEnabled = async (id: string, isPageAction: boolean) => {
    if (isPageAction) {
      const updated = pageActions.map(a => {
        if (a.id === id) {
          return { ...a, enabled: a.enabled === false ? true : false };
        }
        return a;
      });
      setPageActions(updated);
      await handleSaveAll(actions, showToolbar, appLanguage, webSearchEnabled, disabledWebsites, outputLanguage, fontFamily, fontSize, updated, quickAskEnabled);
    } else {
      const updated = actions.map(a => {
        if (a.id === id) {
          return { ...a, enabled: a.enabled === false ? true : false };
        }
        return a;
      });
      setActions(updated);
      await handleSaveAll(updated, showToolbar, appLanguage, webSearchEnabled, disabledWebsites, outputLanguage, fontFamily, fontSize, pageActions, quickAskEnabled);
    }
  };

  const insertVariable = (varName: string) => {
    if (promptTextareaRef.current) {
      const textarea = promptTextareaRef.current;
      const start = textarea.selectionStart ?? actionPrompt.length;
      const end = textarea.selectionEnd ?? actionPrompt.length;
      const updatedPrompt = actionPrompt.substring(0, start) + varName + actionPrompt.substring(end);
      setActionPrompt(updatedPrompt);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + varName.length, start + varName.length);
      }, 0);
    } else {
      setActionPrompt(prev => prev + varName);
    }
  };

  const filteredActions = actions.filter(a => {
    if (toolbarFilter === 'all') return true;
    return a.scene === 'all' || a.scene === toolbarFilter;
  });

  const readingActionsCount = actions.filter(a => a.scene === 'all' || a.scene === 'reading').length;
  const writingActionsCount = actions.filter(a => a.scene === 'all' || a.scene === 'writing').length;
  const allActionsCount = actions.length;

  const filteredDisabledWebsites = disabledWebsites.filter(d =>
    d.toLowerCase().includes(searchDomainQuery.trim().toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-500 font-medium">
        Đang tải dữ liệu Lightning...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#f8f9fc] text-slate-800 font-sans antialiased overflow-hidden">
      
      {/* LEFT SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 select-none">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-100 flex items-center gap-2.5">
          <img src="/icons/icon32.png" alt="Lightning Logo" className="w-8 h-8 rounded-lg shadow-sm" />
          <div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight leading-none">{t.appName}</h1>
            <span className="text-[11px] text-slate-400 font-medium">{t.appDesc}</span>
          </div>
        </div>

        {/* Navigation Categories */}
        <nav ref={navContainerRef} className="p-3 space-y-1 flex-1 overflow-y-auto">
          <button
            id="nav-item-general"
            onClick={() => scrollToSection('general')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              activeSection === 'general'
                ? 'bg-blue-50 text-blue-600 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="text-lg">⚙️</span>
            <span>{t.navGeneral}</span>
          </button>

          <button
            id="nav-item-translation"
            onClick={() => scrollToSection('translation')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              activeSection === 'translation'
                ? 'bg-blue-50 text-blue-600 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="text-lg">🌐</span>
            <span>{t.navTranslation}</span>
          </button>

          <button
            id="nav-item-page-actions"
            onClick={() => scrollToSection('page-actions')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              activeSection === 'page-actions'
                ? 'bg-blue-50 text-blue-600 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="text-lg">📄</span>
            <span>{t.navPageActions}</span>
          </button>

          <button
            id="nav-item-toolbar"
            onClick={() => scrollToSection('toolbar')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              activeSection === 'toolbar'
                ? 'bg-blue-50 text-blue-600 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="text-lg">✏️</span>
            <span>{t.navToolbar}</span>
          </button>

          <button
            id="nav-item-provider"
            onClick={() => scrollToSection('provider')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              activeSection === 'provider'
                ? 'bg-blue-50 text-blue-600 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="text-lg">🔑</span>
            <span>{t.navProvider}</span>
          </button>

          <button
            id="nav-item-help"
            onClick={() => scrollToSection('help')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              activeSection === 'help'
                ? 'bg-blue-50 text-blue-600 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="text-lg">❓</span>
            <span>{t.navHelp}</span>
          </button>

          <button
            id="nav-item-about"
            onClick={() => scrollToSection('about')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              activeSection === 'about'
                ? 'bg-blue-50 text-blue-600 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="text-lg">ℹ️</span>
            <span>{t.navAbout}</span>
          </button>
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-100 text-[11px] text-slate-400">
          Lightning v1.0.0 • BYOK Mode
        </div>
      </aside>

      {/* RIGHT CONTENT AREA */}
      <main
        ref={mainContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-8 lg:p-10 scroll-smooth"
      >
        <div className="max-w-3xl mx-auto space-y-12 pb-36">

          {/* Toast Notification */}
          {saved && (
            <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium animate-fade-in-up">
              <span>✓</span> {t.savedToast}
            </div>
          )}

          {/* SECTION 1: GENERAL SETTINGS */}
          <section id="section-general" className="scroll-mt-8 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{t.generalTitle}</h2>
              <p className="text-sm text-slate-500 mt-1">
                {t.generalSubtitle}
              </p>
            </div>

            {/* App Interface Language Setting */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">{t.appLangLabel}</h3>
                <p className="text-xs text-slate-500">
                  {t.appLangDesc}
                </p>
              </div>

              {/* Segmented Control */}
              <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/60 shrink-0 self-start sm:self-auto">
                {t.uiLanguages.map((lang) => {
                  const isSelected = appLanguage === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleAppLanguageChange(lang.code as LanguageCode)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                      }`}
                    >
                      <span>{lang.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Font Family & Size Settings Card */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">{t.fontSectionTitle}</h3>
                <p className="text-xs text-slate-500">{t.fontSectionDesc}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Font Family Pulldown */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    {t.fontFamilyLabel}
                  </label>
                  <div className="relative">
                    <select
                      className="w-full appearance-none pl-3.5 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition cursor-pointer"
                      value={fontFamily}
                      onChange={(e) => handleFontFamilyChange(e.target.value as FontFamilyOption)}
                    >
                      {[
                        { id: 'system', label: t.fontSystem },
                        { id: 'inter', label: t.fontInter },
                        { id: 'roboto', label: t.fontRoboto },
                        { id: 'arial', label: t.fontArial },
                        { id: 'georgia', label: t.fontGeorgia },
                        { id: 'merriweather', label: t.fontMerriweather },
                        { id: 'mono', label: t.fontMono },
                      ].map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon />
                  </div>
                </div>

                {/* Font Size Pulldown */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    {t.fontSizeLabel}
                  </label>
                  <div className="relative">
                    <select
                      className="w-full appearance-none pl-3.5 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition cursor-pointer"
                      value={fontSize}
                      onChange={(e) => handleFontSizeChange(e.target.value as FontSizeOption)}
                    >
                      {[
                        { id: '12px', label: t.fontSize12 },
                        { id: '13px', label: t.fontSize13 },
                        { id: '14px', label: t.fontSize14 },
                        { id: '15px', label: t.fontSize15 },
                        { id: '16px', label: t.fontSize16 },
                        { id: '18px', label: t.fontSize18 },
                        { id: '20px', label: t.fontSize20 },
                      ].map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon />
                  </div>
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    {t.fontPreviewTitle}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {fontFamily} • {fontSize}
                  </span>
                </div>
                <div 
                  className="text-slate-800 leading-relaxed transition-all"
                  style={{
                    fontFamily: getFontFamilyCss(fontFamily),
                    fontSize: getFontSizeCss(fontSize),
                  }}
                >
                  <p className="font-semibold text-slate-900 mb-1">⚡ Lightning AI Result</p>
                  <p>{t.fontPreviewSample}</p>
                </div>
              </div>
            </div>
          </section>

          <hr className="border-slate-200/80 my-8" />

          {/* SECTION 2: TRANSLATION SETTINGS */}
          <section id="section-translation" className="scroll-mt-8 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{t.transTitle}</h2>
              <p className="text-sm text-slate-500 mt-1">{t.transDesc}</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    {t.sourceLangLabel}
                  </label>
                  <div className="relative">
                    <select
                      className="w-full appearance-none pl-3.5 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition cursor-pointer"
                      value={sourceLanguage}
                      onChange={(e) => setSourceLanguage(e.target.value)}
                    >
                      {t.sourceLanguages.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    {t.targetLangLabel}
                  </label>
                  <div className="relative">
                    <select
                      className="w-full appearance-none pl-3.5 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition cursor-pointer"
                      value={targetLanguage === 'tiếng Việt' ? 'Vietnamese' : targetLanguage}
                      onChange={(e) => setTargetLanguage(e.target.value)}
                    >
                      {t.targetLanguages.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon />
                  </div>
                </div>
              </div>

              {/* AI Output Language Field */}
              <div className="pt-4 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {t.outputLangLabel}
                </label>
                <p className="text-xs text-slate-500 mb-2.5">
                  {t.outputLangDesc}
                </p>
                <div className="relative w-full sm:w-80">
                  <select
                    className="w-full appearance-none pl-3.5 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition cursor-pointer"
                    value={outputLanguage === 'tiếng Việt' ? 'Vietnamese' : outputLanguage}
                    onChange={(e) => setOutputLanguage(e.target.value)}
                  >
                    {(t.outputLanguages || t.targetLanguages).map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleSaveAll(actions, showToolbar, appLanguage, webSearchEnabled, disabledWebsites, outputLanguage)}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-sm transition cursor-pointer"
                >
                  {t.saveTransBtn}
                </button>
              </div>
            </div>
          </section>

          <hr className="border-slate-200/80 my-8" />

          {/* SECTION 3: PAGE ACTIONS */}
          <section id="section-page-actions" className="scroll-mt-8 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{t.pageActionsTitle}</h2>
              <p className="text-sm text-slate-500 mt-1">{t.pageActionsDesc}</p>
            </div>

            {/* Quick Trigger Note Banner */}
            <div className="bg-blue-50/80 border border-blue-200/70 p-4 rounded-2xl flex items-start gap-3">
              <span className="text-xl shrink-0">💡</span>
              <div className="text-xs text-blue-900 leading-relaxed">
                <p className="font-semibold">{t.pageActionTriggerNote}</p>
                <p className="text-blue-700 mt-0.5">{t.pageActionCardDesc}</p>
              </div>
            </div>

            {/* Page Actions List Card */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{t.pageActionsTitle}</h3>
                  <p className="text-xs text-slate-500">{t.pageActionsDesc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => openAddModal(true)}
                  className="px-3.5 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition flex items-center gap-1.5 shadow-sm shadow-blue-200 cursor-pointer shrink-0"
                >
                  <span>+</span> {t.addNewAction}
                </button>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {pageActions.map((action) => {
                    const displayLabel = action.isDefault
                      ? (
                          action.id === 'summarize-page' ? t.actionSummarizePage :
                          action.id === 'simplify-page' ? t.actionSimplifyPage :
                          action.id === 'summarize-link' ? t.actionSummarizeLink : action.label
                        )
                      : action.label;
                    const isEnabled = action.enabled !== false;

                    return (
                      <div
                        key={action.id}
                        className={`p-4 rounded-xl border transition group flex flex-col justify-between ${
                          isEnabled 
                            ? 'bg-white border-slate-200 shadow-xs hover:border-blue-300' 
                            : 'bg-slate-50/80 border-dashed border-slate-200 opacity-60'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{action.icon}</span>
                              <span className="font-bold text-sm text-slate-800">{displayLabel}</span>
                            </div>

                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                              {t.navPageActions}
                            </span>
                          </div>

                          <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed font-mono">
                            {action.isDefault ? (getDefaultPrompt(action.id, appLanguage) || action.prompt) : action.prompt}
                          </p>
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              isEnabled ? 'bg-slate-100 text-slate-700' : 'bg-slate-200 text-slate-500'
                            }`}>
                              {action.isDefault ? t.defaultBadge : t.customBadge}
                            </span>
                            {action.shortcut ? (
                              <kbd className={`px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded border ${
                                isEnabled ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-400 border-slate-200'
                              }`}>
                                {action.shortcut}
                              </kbd>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">
                                {t.noShortcut}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {action.isDefault ? (
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-semibold ${isEnabled ? 'text-blue-600' : 'text-slate-400'}`}>
                                  {isEnabled ? t.actionStatusEnabled : t.actionStatusDisabled}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleToggleActionEnabled(action.id, true)}
                                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                    isEnabled ? 'bg-blue-600' : 'bg-slate-300'
                                  }`}
                                  title={isEnabled ? t.actionEnabledTooltip : t.actionDisabledTooltip}
                                >
                                  <span
                                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                      isEnabled ? 'translate-x-4' : 'translate-x-0'
                                    }`}
                                  />
                                </button>
                              </div>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => openEditModal(action, true)}
                                  className="text-blue-600 hover:text-blue-800 hover:underline font-medium text-xs cursor-pointer"
                                >
                                  {t.editAction}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removePageAction(action.id)}
                                  className="text-red-500 hover:text-red-700 hover:underline font-medium text-xs cursor-pointer"
                                >
                                  {t.deleteAction}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          <hr className="border-slate-200/80 my-8" />

          {/* SECTION 4: TEXT SELECTION TOOLBAR */}
          <section id="section-toolbar" className="scroll-mt-8 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{t.toolbarTitle}</h2>
              <p className="text-sm text-slate-500 mt-1">{t.toolbarDesc}</p>
            </div>

            {/* Toggle Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{t.toggleToolbarLabel}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{t.toggleToolbarDesc}</p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleToolbar}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    showToolbar ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      showToolbar ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Disabled Websites Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base">🚫</span>
                      <h3 className="text-sm font-semibold text-slate-900">{t.disabledWebsitesTitle}</h3>
                      <span className="px-2 py-0.5 text-[11px] font-semibold bg-slate-100 text-slate-600 rounded-full">
                        {disabledWebsites.length}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{t.disabledWebsitesDesc}</p>
                  </div>
                </div>

                {/* Add Website Input & Button */}
                <form onSubmit={handleAddDomain} className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={newDomainInput}
                      onChange={(e) => {
                        setNewDomainInput(e.target.value);
                        if (domainError) setDomainError('');
                      }}
                      placeholder={t.addWebsitePlaceholder}
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!newDomainInput.trim()}
                    className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs shadow-blue-200 flex items-center gap-1.5 shrink-0"
                  >
                    <span>+</span> {t.addWebsiteBtn}
                  </button>
                </form>

                {domainError && (
                  <p className="text-xs text-rose-500 font-medium animate-fade-in-up">
                    {domainError}
                  </p>
                )}

                {/* Search if there are more than 4 websites */}
                {disabledWebsites.length > 4 && (
                  <div className="relative">
                    <input
                      type="text"
                      value={searchDomainQuery}
                      onChange={(e) => setSearchDomainQuery(e.target.value)}
                      placeholder={t.searchWebsitesPlaceholder}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                    />
                  </div>
                )}

                {/* Websites List Rows */}
                {disabledWebsites.length === 0 ? (
                  <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center">
                    <p className="text-xs text-slate-400">{t.noDisabledWebsites}</p>
                  </div>
                ) : filteredDisabledWebsites.length === 0 ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <p className="text-xs text-slate-400">{t.noMatchingWebsites}</p>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-56 overflow-y-auto">
                    {filteredDisabledWebsites.map((domain) => (
                      <div
                        key={domain}
                        className="px-4 py-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-slate-400 text-sm shrink-0">🌐</span>
                          <span className="text-xs font-mono font-medium text-slate-800 truncate">
                            {domain}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveDomain(domain)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title={t.removeWebsiteTooltip}
                          aria-label={t.removeWebsiteTooltip}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Ask Toggle Card with Nested Web Search Sub-setting */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base">⚡</span>
                      <h3 className="text-sm font-semibold text-slate-900">{t.enableQuickAsk}</h3>
                    </div>
                    <p className="text-xs text-slate-500">{t.enableQuickAskDesc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleQuickAsk}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      quickAskEnabled ? 'bg-blue-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        quickAskEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Nested Web Search Sub-Setting */}
                <div className={`pt-3 border-t border-slate-100 transition-opacity ${
                  quickAskEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pl-3 sm:pl-4 border-l-2 border-blue-400">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">🌐</span>
                        <h4 className="text-xs font-semibold text-slate-800">{t.enableWebSearch}</h4>
                      </div>
                      <p className="text-[11px] text-slate-500">{t.enableWebSearchDesc}</p>
                      <p className="text-[10px] text-amber-800 bg-amber-50/90 px-2.5 py-1 rounded-lg border border-amber-200/70 inline-block font-normal mt-1 leading-relaxed">
                        💡 {t.webSearchNote}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={!quickAskEnabled}
                      onClick={handleToggleWebSearch}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none self-start sm:self-center ${
                        webSearchEnabled ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          webSearchEnabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Action List Section with Segmented Control */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{t.actionListTitle}</h3>
                    <p className="text-xs text-slate-500">{t.actionListDesc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openAddModal(false)}
                    className="px-3.5 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition flex items-center gap-1.5 shadow-sm shadow-blue-200 cursor-pointer shrink-0"
                  >
                    <span>+</span> {t.addNewAction}
                  </button>
                </div>

                {/* Main Action List Card */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  {/* Segmented Control Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/60 shrink-0 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setToolbarFilter('reading')}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                          toolbarFilter === 'reading'
                            ? 'bg-white text-blue-600 shadow-xs font-bold'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                        }`}
                      >
                        <span className="text-sm">📖</span>
                        <span>{t.tabReading}</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                          toolbarFilter === 'reading' ? 'bg-blue-50 text-blue-600' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {readingActionsCount}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setToolbarFilter('writing')}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                          toolbarFilter === 'writing'
                            ? 'bg-white text-blue-600 shadow-xs font-bold'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                        }`}
                      >
                        <span className="text-sm">✍️</span>
                        <span>{t.tabWriting}</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                          toolbarFilter === 'writing' ? 'bg-blue-50 text-blue-600' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {writingActionsCount}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setToolbarFilter('all')}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                          toolbarFilter === 'all'
                            ? 'bg-white text-blue-600 shadow-xs font-bold'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                        }`}
                      >
                        <span className="text-sm">📋</span>
                        <span>{t.tabAll}</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                          toolbarFilter === 'all' ? 'bg-blue-50 text-blue-600' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {allActionsCount}
                        </span>
                      </button>
                    </div>

                    <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                      {filteredActions.length} / {allActionsCount} {t.actionListTitle?.toLowerCase() || 'thao tác'}
                    </span>
                  </div>
                  {filteredActions.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <p className="text-sm text-slate-400 font-medium">{t.noActionsInScene}</p>
                      <button
                        type="button"
                        onClick={() => openAddModal(false)}
                        className="mt-3 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition cursor-pointer"
                      >
                        + {t.addNewAction}
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {filteredActions.map((action) => {
                        const displayLabel = (action.isDefault) ? (
                          action.id === 'translate' ? t.actionTranslate :
                          action.id === 'summarize' ? t.actionSummarize :
                          action.id === 'explain' ? t.actionExplain :
                          action.id === 'rewrite' ? t.actionRewrite : action.label
                        ) : action.label;
                        const isEnabled = action.enabled !== false;

                        return (
                          <div
                            key={action.id}
                            className={`p-4 rounded-xl border transition group flex flex-col justify-between ${
                              isEnabled 
                                ? 'bg-white border-slate-200 shadow-xs hover:border-blue-300' 
                                : 'bg-slate-50/80 border-dashed border-slate-200 opacity-60'
                            }`}
                          >
                            <div>
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-xl">{action.icon}</span>
                                  <span className="font-bold text-sm text-slate-800">{displayLabel}</span>
                                </div>
                                
                                <div className="flex items-center gap-1.5">
                                  {/* Pin Toggle Button */}
                                  <button
                                    onClick={() => togglePinAction(action.id)}
                                    disabled={!isEnabled}
                                    className={`p-1 rounded-md text-xs transition-colors cursor-pointer ${
                                      !isEnabled
                                        ? 'text-slate-300 opacity-40 cursor-not-allowed'
                                        : action.isPinned
                                        ? 'text-purple-600 bg-purple-50 hover:bg-purple-100'
                                        : 'text-slate-300 hover:text-slate-600 hover:bg-slate-100'
                                    }`}
                                    title={action.isPinned ? t.unpinTooltip : t.pinTooltip}
                                  >
                                    📌
                                  </button>

                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                    action.scene === 'all' 
                                      ? 'bg-purple-50 text-purple-700 border border-purple-100' 
                                      : action.scene === 'writing'
                                      ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                      : 'bg-blue-50 text-blue-700 border border-blue-100'
                                  }`}>
                                    {action.scene === 'all' ? t.sceneAll : action.scene === 'writing' ? t.sceneWriting : t.sceneReading}
                                  </span>
                                </div>
                              </div>

                              <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed font-mono">
                                {action.isDefault ? (getDefaultPrompt(action.id, appLanguage) || action.prompt) : action.prompt}
                              </p>
                            </div>

                            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  isEnabled ? 'bg-slate-100 text-slate-700' : 'bg-slate-200 text-slate-500'
                                }`}>
                                  {action.isDefault ? t.defaultBadge : t.customBadge}
                                </span>
                                {action.shortcut ? (
                                  <kbd className={`px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded border ${
                                    isEnabled ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-100 text-slate-400 border-slate-200'
                                  }`}>
                                    {action.shortcut}
                                  </kbd>
                                ) : (
                                  <span className="text-[10px] text-slate-400 italic">
                                    {t.noShortcut}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {action.isDefault ? (
                                  <div className="flex items-center gap-2">
                                    <span className={`text-xs font-semibold ${isEnabled ? 'text-blue-600' : 'text-slate-400'}`}>
                                      {isEnabled ? t.actionStatusEnabled : t.actionStatusDisabled}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleToggleActionEnabled(action.id, false)}
                                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                        isEnabled ? 'bg-blue-600' : 'bg-slate-300'
                                      }`}
                                      title={isEnabled ? t.actionEnabledTooltip : t.actionDisabledTooltip}
                                    >
                                      <span
                                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                          isEnabled ? 'translate-x-4' : 'translate-x-0'
                                        }`}
                                      />
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => openEditModal(action)}
                                      className="text-blue-600 hover:text-blue-800 hover:underline font-medium text-xs cursor-pointer"
                                    >
                                      {t.editAction}
                                    </button>
                                    <button
                                      onClick={() => removeAction(action.id)}
                                      className="text-red-500 hover:text-red-700 hover:underline font-medium text-xs cursor-pointer"
                                    >
                                      {t.deleteAction}
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </section>

          <hr className="border-slate-200/80 my-8" />

          {/* SECTION 5: AI PROVIDER & KEY */}
          <section id="section-provider" className="scroll-mt-8 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{t.providerTitle}</h2>
              <p className="text-sm text-slate-500 mt-1">{t.providerDesc}</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  {t.providerLabel}
                </label>
                <div className="relative">
                  <select
                    className="w-full appearance-none pl-3.5 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition cursor-pointer"
                    value={provider}
                    onChange={(e) => handleProviderChange(e.target.value as UserSettings['provider'])}
                  >
                    <option value="gemini">{t.providerGemini}</option>
                    <option value="openai">{t.providerOpenAI}</option>
                    <option value="claude">{t.providerClaude}</option>
                    <option value="openrouter">{t.providerOpenRouter}</option>
                  </select>
                  <ChevronDownIcon />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  {t.apiKeyLabel}
                </label>
                <input
                  type="password"
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  placeholder={
                    provider === 'openrouter'
                      ? 'sk-or-v1-...'
                      : provider === 'openai'
                      ? 'sk-...'
                      : provider === 'claude'
                      ? 'sk-ant-...'
                      : 'AIzaSy...'
                  }
                  value={localKey}
                  onChange={(e) => setLocalKey(e.target.value)}
                />
                <p className="text-[11px] text-slate-400 mt-1.5">{t.apiKeyNote}</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {t.modelLabel}
                  </label>
                  <div className="flex items-center gap-2">
                    {models.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsManualModelInput(!isManualModelInput)}
                        className="text-xs text-slate-600 hover:text-slate-900 font-medium px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                      >
                        {isManualModelInput ? t.selectFromList : t.enterModelManually}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleLoadModels}
                      disabled={loadingModels || !localKey.trim()}
                      className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold px-2.5 py-1 bg-blue-50 hover:bg-blue-100 rounded-lg transition cursor-pointer"
                    >
                      {loadingModels ? t.loadingModels : t.loadModelsBtn}
                    </button>
                  </div>
                </div>

                {models.length > 0 && !isManualModelInput ? (
                  <div className="space-y-2">
                    {/* Search Filter for models */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs">
                        🔍
                      </div>
                      <input
                        type="text"
                        value={modelSearchQuery}
                        onChange={(e) => setModelSearchQuery(e.target.value)}
                        placeholder={t.searchModelPlaceholder}
                        className="w-full pl-8 pr-16 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                      />
                      <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[11px] text-slate-400">
                        {filteredModels.length}/{models.length}
                      </span>
                    </div>

                    {/* Select Dropdown */}
                    {filteredModels.length > 0 ? (
                      <div className="relative">
                        <select
                          className="w-full appearance-none pl-3.5 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition cursor-pointer"
                          value={modelId}
                          onChange={(e) => setModelId(e.target.value)}
                        >
                          {filteredModels.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.id})
                            </option>
                          ))}
                        </select>
                        <ChevronDownIcon />
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-center">
                        {t.noMatchingModels}
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                    placeholder={provider === 'openrouter' ? 'meta-llama/llama-3.3-70b-instruct:free' : t.modelPlaceholder}
                    value={modelId}
                    onChange={(e) => setModelId(e.target.value)}
                  />
                )}
                {modelError && (
                  <p className="text-xs text-rose-600 font-medium mt-1.5">{modelError}</p>
                )}
              </div>

              <div className="pt-2">
                <button
                  onClick={() => handleSaveAll()}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-sm transition cursor-pointer"
                >
                  {t.saveProviderBtn}
                </button>
              </div>
            </div>
          </section>

          <hr className="border-slate-200/80 my-8" />

          {/* SECTION 6: HELP & SHORTCUTS */}
          <section id="section-help" className="scroll-mt-8 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{t.helpTitle}</h2>
              <p className="text-sm text-slate-500 mt-1">
                {t.helpDesc}
              </p>
            </div>

            {/* Shortcuts & Guide */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <span className="text-2xl">🖱️</span>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{t.guideSelectionTitle}</h4>
                  <p className="text-xs text-slate-500">
                    {t.guideSelectionDesc}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <span className="text-2xl">🖱️</span>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{t.guideContextTitle}</h4>
                  <p className="text-xs text-slate-500">
                    {t.guideContextDesc}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-2xl">🛡️</span>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{t.guidePrivacyTitle}</h4>
                  <p className="text-xs text-slate-500">
                    {t.guidePrivacyDesc}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <hr className="border-slate-200/80 my-8" />

          {/* SECTION 7: ABOUT */}
          <section id="section-about" className="scroll-mt-8 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{t.aboutTitle}</h2>
              <p className="text-sm text-slate-500 mt-1">
                {t.aboutDesc}
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                <img src="/icons/icon48.png" alt="Lightning Logo" className="w-12 h-12 rounded-2xl shadow-sm" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">{t.appName}</h3>
                  <p className="text-xs text-slate-500">{t.appDesc}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    {t.aboutNameLabel}
                  </span>
                  <span className="text-sm font-bold text-slate-800">
                    Terry
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    {t.aboutWebsiteLabel}
                  </span>
                  <a
                    href="https://relipa.global/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1.5 break-all transition-colors"
                  >
                    <span>https://relipa.global/</span>
                    <span className="text-xs">↗</span>
                  </a>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    {t.aboutContactLabel}
                  </span>
                  <a
                    href="mailto:tuyennq.1001@gmail.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1.5 break-all transition-colors"
                  >
                    <span>tuyennq.1001@gmail.com</span>
                    <span className="text-xs">✉</span>
                  </a>
                </div>
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* ADD / EDIT ACTION MODAL */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border-2 border-slate-900 overflow-hidden animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {editingActionId ? t.modalEditTitle : t.modalAddTitle}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Name & Selected Icon */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t.nameAndIcon}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="w-14 px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center text-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={actionIcon}
                    onChange={(e) => setActionIcon(e.target.value)}
                    placeholder="Icon"
                  />
                  <input
                    type="text"
                    required
                    className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t.actionNamePlaceholder}
                    value={actionName}
                    onChange={(e) => setActionName(e.target.value)}
                  />
                </div>
              </div>

              {/* Clickable Preset Icon Palette */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  {t.selectIcon}
                </label>
                <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 max-h-36 overflow-y-auto">
                  {PRESET_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setActionIcon(icon)}
                      className={`h-8 w-8 flex items-center justify-center rounded-lg text-lg hover:bg-white hover:shadow-xs transition-all cursor-pointer ${
                        actionIcon === icon ? 'bg-blue-100 ring-2 ring-blue-500' : ''
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prompt Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {t.promptLabel}
                  </label>
                </div>

                <textarea
                  ref={promptTextareaRef}
                  required
                  rows={4}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs leading-relaxed"
                  placeholder={t.promptPlaceholder}
                  value={actionPrompt}
                  onChange={(e) => setActionPrompt(e.target.value)}
                />

                {/* Clickable Variable Insertion Pills */}
                <div className="mt-2">
                  <span className="block text-[11px] text-slate-500 font-medium mb-1">
                    {t.promptHint}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {getPromptVariables(t).map((v) => (
                      <button
                        key={v.label}
                        type="button"
                        onClick={() => insertVariable(v.label)}
                        className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 rounded-lg text-xs font-mono font-medium transition-colors flex items-center gap-1 cursor-pointer border border-blue-200/60"
                        title={v.desc}
                      >
                        <span>+</span>
                        <span>{v.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Conditions / Scenes (Only for Selection Toolbar Actions) */}
              {!isEditingPageAction ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    {t.useConditions}
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="scene"
                        checked={actionScene === 'reading'}
                        onChange={() => setActionScene('reading')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>{t.conditionReading}</span>
                    </label>
                    <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="scene"
                        checked={actionScene === 'writing'}
                        onChange={() => setActionScene('writing')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>{t.conditionWriting}</span>
                    </label>
                    <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="scene"
                        checked={actionScene === 'all'}
                        onChange={() => setActionScene('all')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>{t.conditionAll}</span>
                    </label>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-blue-50/70 border border-blue-200/70 rounded-xl text-xs text-blue-800 leading-relaxed">
                  📄 {t.pageActionCardDesc}
                </div>
              )}

              {/* Shortcut Key Recorder */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t.actionShortcutLabel}
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  {t.actionShortcutDesc}
                </p>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      readOnly
                      onFocus={() => setIsRecordingShortcut(true)}
                      onBlur={() => setIsRecordingShortcut(false)}
                      onKeyDown={handleShortcutKeyDown}
                      value={isRecordingShortcut ? t.actionShortcutRecording : actionShortcut || ''}
                      placeholder={t.actionShortcutPlaceholder}
                      className={`w-full px-3.5 py-2 text-sm rounded-xl font-mono transition-all cursor-pointer ${
                        isRecordingShortcut
                          ? 'bg-blue-50 border-2 border-blue-500 text-blue-700 ring-2 ring-blue-500/20'
                          : actionShortcut
                          ? 'bg-slate-50 border border-slate-200 text-slate-900 font-bold'
                          : 'bg-slate-50 border border-slate-200 text-slate-400'
                      }`}
                    />
                  </div>
                  {actionShortcut && (
                    <button
                      type="button"
                      onClick={() => {
                        setActionShortcut('');
                        setIsRecordingShortcut(false);
                      }}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition cursor-pointer"
                    >
                      {t.actionShortcutClear}
                    </button>
                  )}
                </div>

                {/* Conflict warning */}
                {conflictingAction && (
                  <p className="text-xs text-rose-500 font-medium flex items-center gap-1.5 mt-2">
                    <span>⚠️</span>
                    <span>{t.actionShortcutConflict(conflictingAction.label)}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
              >
                {t.btnCancel}
              </button>
              <button
                type="button"
                onClick={handleSaveAction}
                disabled={!actionName.trim() || !actionPrompt.trim()}
                className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer shadow-sm shadow-blue-200"
              >
                {t.btnSave}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
