import { useState, useEffect, useRef } from 'react';
import { useSettings } from '../hooks/useSettings';
import { type UserSettings, type CustomAction, DEFAULT_ACTIONS } from '../utils/storage';
import { getT, getDefaultPrompt, type LanguageCode } from '../utils/i18n';

type TabCategory = 'toolbar' | 'provider' | 'translation' | 'general';

const PRESET_ICONS = [
  '✍️', '🌐', '📝', '💡', '✨', '🔍', '📊', '🛠️', 
  '🎯', '⚡', '📖', '🚀', '💬', '🤖', '🎨', '📌', 
  '🏷️', '📋', '✏️', '🧠', '💼', '🔥', '📚', '🧩'
];

const PROMPT_VARIABLES = [
  { label: '{text}', desc: 'Văn bản được bôi đen' },
  { label: '{TARGET_LANG}', desc: 'Ngôn ngữ dịch ra' },
  { label: '{SOURCE_LANG}', desc: 'Ngôn ngữ gốc' },
  { label: '{page_title}', desc: 'Tiêu đề trang web' },
  { label: '{page_url}', desc: 'URL trang web' },
];

export default function Options() {
  const { settings, updateSettings, loading } = useSettings();
  
  // Active Sidebar Category
  const [activeTab, setActiveTab] = useState<TabCategory>('toolbar');

  // Toolbar scene filter tab
  const [toolbarFilter, setToolbarFilter] = useState<'all' | 'reading' | 'writing'>('reading');

  // Settings State
  const [localKey, setLocalKey] = useState('');
  const [provider, setProvider] = useState<UserSettings['provider']>('gemini');
  const [modelId, setModelId] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('auto');
  const [targetLanguage, setTargetLanguage] = useState('Vietnamese');
  const [appLanguage, setAppLanguage] = useState<LanguageCode>('vi');
  const [showToolbar, setShowToolbar] = useState(true);
  const [actions, setActions] = useState<CustomAction[]>([]);
  
  const [saved, setSaved] = useState(false);

  // Model loading state
  const [models, setModels] = useState<{ id: string; name: string }[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelError, setModelError] = useState('');

  // Modal State (Add or Edit)
  const [showModal, setShowModal] = useState(false);
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [actionName, setActionName] = useState('');
  const [actionIcon, setActionIcon] = useState('✨');
  const [actionPrompt, setActionPrompt] = useState('');
  const [actionScene, setActionScene] = useState<'all' | 'reading' | 'writing'>('reading');
  const promptTextareaRef = useRef<HTMLTextAreaElement>(null);

  const t = getT(appLanguage);

  useEffect(() => {
    document.title = 'Lightning Options';
  }, []);

  useEffect(() => {
    if (settings) {
      setLocalKey(settings.apiKey || '');
      setProvider(settings.provider || 'gemini');
      setModelId(settings.modelId || '');
      setSourceLanguage(settings.sourceLanguage || 'auto');
      setTargetLanguage(settings.targetLanguage || 'Vietnamese');
      setAppLanguage((settings.appLanguage as LanguageCode) || 'vi');
      setShowToolbar(settings.showToolbar !== false);
      setActions(settings.actions && settings.actions.length > 0 ? settings.actions : DEFAULT_ACTIONS);
    }
  }, [settings]);

  const handleProviderChange = (newProvider: UserSettings['provider']) => {
    setProvider(newProvider);
    setModels([]);
    setModelId('');
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
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${localKey}`);
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
          headers: { Authorization: `Bearer ${localKey}` }
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
      }
      
      setModels(loadedModels);
      
      if (loadedModels.length > 0) {
        let defaultModel = loadedModels[0].id;
        if (provider === 'gemini') {
          const bestModel = loadedModels.find(m => m.id === 'gemini-1.5-pro' || m.id === 'gemini-1.5-pro-latest') 
                         || loadedModels.find(m => m.id === 'gemini-1.5-flash' || m.id === 'gemini-1.5-flash-latest');
          if (bestModel) defaultModel = bestModel.id;
        } else if (provider === 'openai') {
          const bestModel = loadedModels.find(m => m.id === 'gpt-4o' || m.id === 'gpt-4-turbo');
          if (bestModel) defaultModel = bestModel.id;
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
    newAppLang?: LanguageCode
  ) => {
    const actionsToSave = newActions || actions;
    const toolbarToSave = newShowToolbar !== undefined ? newShowToolbar : showToolbar;
    const appLangToSave = newAppLang || appLanguage;
    
    await updateSettings({ 
      apiKey: localKey, 
      provider, 
      modelId, 
      sourceLanguage, 
      targetLanguage,
      appLanguage: appLangToSave,
      actions: actionsToSave,
      showToolbar: toolbarToSave,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleToggleToolbar = async () => {
    const updated = !showToolbar;
    setShowToolbar(updated);
    await handleSaveAll(actions, updated);
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
    setActions(updatedActions);
    await handleSaveAll(updatedActions, showToolbar, newLang);
  };

  const openAddModal = () => {
    setEditingActionId(null);
    setActionName('');
    setActionIcon('✨');
    setActionPrompt('');
    setActionScene('reading');
    setShowModal(true);
  };

  const openEditModal = (action: CustomAction) => {
    setEditingActionId(action.id);
    setActionName(action.label);
    setActionIcon(action.icon);
    setActionPrompt(action.prompt);
    setActionScene(action.scene);
    setShowModal(true);
  };

  const handleSaveAction = async () => {
    if (!actionName.trim() || !actionPrompt.trim()) return;
    
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
        isPinned: false,
        isDefault: false
      };
      updatedActions = [...actions, newAction];
    }

    setActions(updatedActions);
    setShowModal(false);
    await handleSaveAll(updatedActions);
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
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          <button
            onClick={() => setActiveTab('toolbar')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'toolbar'
                ? 'bg-blue-50 text-blue-600 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="text-lg">✏️</span>
            <span>{t.navToolbar}</span>
          </button>

          <button
            onClick={() => setActiveTab('provider')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'provider'
                ? 'bg-blue-50 text-blue-600 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="text-lg">🔑</span>
            <span>{t.navProvider}</span>
          </button>

          <button
            onClick={() => setActiveTab('translation')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'translation'
                ? 'bg-blue-50 text-blue-600 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="text-lg">🌐</span>
            <span>{t.navTranslation}</span>
          </button>

          <button
            onClick={() => setActiveTab('general')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'general'
                ? 'bg-blue-50 text-blue-600 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="text-lg">⚙️</span>
            <span>{t.navGeneral}</span>
          </button>
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-100 text-[11px] text-slate-400">
          Lightning v1.0.0 • BYOK Mode
        </div>
      </aside>

      {/* RIGHT CONTENT AREA */}
      <main className="flex-1 overflow-y-auto p-8 lg:p-10">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* Toast Notification */}
          {saved && (
            <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium animate-fade-in-up">
              <span>✓</span> {t.savedToast}
            </div>
          )}

          {/* TAB 1: TEXT SELECTION TOOLBAR */}
          {activeTab === 'toolbar' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{t.toolbarTitle}</h2>
                <p className="text-sm text-slate-500 mt-1">{t.toolbarDesc}</p>
              </div>

              {/* Sub-tabs */}
              <div className="flex gap-2 p-1 bg-slate-200/60 rounded-xl w-fit">
                <button
                  onClick={() => setToolbarFilter('reading')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    toolbarFilter === 'reading'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t.tabReading}
                </button>
                <button
                  onClick={() => setToolbarFilter('writing')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    toolbarFilter === 'writing'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t.tabWriting}
                </button>
                <button
                  onClick={() => setToolbarFilter('all')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    toolbarFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t.tabAll}
                </button>
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

              {/* Action List Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{t.actionListTitle} ({filteredActions.length})</h3>
                    <p className="text-xs text-slate-500">{t.actionListDesc}</p>
                  </div>
                  <button
                    onClick={openAddModal}
                    className="px-3.5 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition flex items-center gap-1.5 shadow-sm shadow-blue-200 cursor-pointer"
                  >
                    <span>+</span> {t.addNewAction}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {filteredActions.map((action) => {
                    const displayLabel = (action.isDefault) ? (
                      action.id === 'translate' ? t.actionTranslate :
                      action.id === 'summarize' ? t.actionSummarize :
                      action.id === 'explain' ? t.actionExplain :
                      action.id === 'rewrite' ? t.actionRewrite : action.label
                    ) : action.label;

                    return (
                      <div
                        key={action.id}
                        className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-blue-300 transition group"
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
                                className={`p-1 rounded-md text-xs transition-colors cursor-pointer ${
                                  action.isPinned
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
                          <span>{action.isDefault ? t.defaultBadge : t.customBadge}</span>
                          {!action.isDefault && (
                            <div className="flex items-center gap-2">
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
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AI PROVIDER & KEY */}
          {activeTab === 'provider' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{t.providerTitle}</h2>
                <p className="text-sm text-slate-500 mt-1">{t.providerDesc}</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    {t.providerLabel}
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                    value={provider}
                    onChange={(e) => handleProviderChange(e.target.value as UserSettings['provider'])}
                  >
                    <option value="gemini">Google Gemini (Recommended - Fast & Free tier)</option>
                    <option value="openai">OpenAI (ChatGPT GPT-4o, GPT-4o-mini)</option>
                    <option value="claude">Anthropic Claude (Claude 3.5 Sonnet)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    {t.apiKeyLabel}
                  </label>
                  <input
                    type="password"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                    placeholder={`Dán API Key ${provider} tại đây...`}
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
                    <button
                      type="button"
                      onClick={handleLoadModels}
                      disabled={loadingModels || !localKey.trim()}
                      className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold px-2.5 py-1 bg-blue-50 rounded-lg transition"
                    >
                      {loadingModels ? t.loadingModels : t.loadModelsBtn}
                    </button>
                  </div>

                  {models.length > 0 ? (
                    <select
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                      value={modelId}
                      onChange={(e) => setModelId(e.target.value)}
                    >
                      {models.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.id})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                      placeholder="Nhập tên model hoặc tải danh sách..."
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
            </div>
          )}

          {/* TAB 3: TRANSLATION SETTINGS */}
          {activeTab === 'translation' && (
            <div className="space-y-6">
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
                    <select
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                      value={sourceLanguage}
                      onChange={(e) => setSourceLanguage(e.target.value)}
                    >
                      <option value="auto">Tự động nhận diện (Auto)</option>
                      <option value="English">Tiếng Anh (English)</option>
                      <option value="Japanese">Tiếng Nhật (Japanese)</option>
                      <option value="Chinese">Tiếng Trung (Chinese)</option>
                      <option value="Korean">Tiếng Hàn (Korean)</option>
                      <option value="Vietnamese">Tiếng Việt</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      {t.targetLangLabel}
                    </label>
                    <select
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                      value={targetLanguage}
                      onChange={(e) => setTargetLanguage(e.target.value)}
                    >
                      <option value="tiếng Việt">Tiếng Việt</option>
                      <option value="English">English</option>
                      <option value="Japanese">Japanese (日本語)</option>
                      <option value="Chinese">Chinese (中文)</option>
                      <option value="Korean">Korean (한국어)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => handleSaveAll()}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-sm transition cursor-pointer"
                  >
                    {t.saveTransBtn}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GENERAL SETTINGS (Moved App Language here) */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{t.generalTitle}</h2>
                <p className="text-sm text-slate-500 mt-1">
                  {t.generalSubtitle}
                </p>
              </div>

              {/* App Interface Language Setting */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">{t.appLangLabel}</h3>
                  <p className="text-xs text-slate-500 mb-3">
                    {t.appLangDesc}
                  </p>
                  <select
                    className="w-full sm:w-80 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                    value={appLanguage}
                    onChange={(e) => handleAppLanguageChange(e.target.value as LanguageCode)}
                  >
                    <option value="vi">Tiếng Việt (Vietnamese)</option>
                    <option value="en">English (Tiếng Anh)</option>
                    <option value="ja">日本語 (Japanese / Tiếng Nhật)</option>
                  </select>
                </div>
              </div>

              {/* Shortcuts & Guide */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
                  {t.guideTitle}
                </h3>

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

                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <span className="text-2xl">💬</span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{t.guideSidebarTitle}</h4>
                    <p className="text-xs text-slate-500">
                      {t.guideSidebarDesc}
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
            </div>
          )}

        </div>
      </main>

      {/* ADD / EDIT ACTION MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border-2 border-slate-900 overflow-hidden animate-fade-in-up">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {editingActionId ? t.modalEditTitle : t.modalAddTitle}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
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
                <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200/60 max-h-24 overflow-y-auto">
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
                    {PROMPT_VARIABLES.map((v) => (
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

              {/* Conditions / Scenes */}
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
