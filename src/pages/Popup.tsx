import { useEffect, useState } from 'react';
import './Popup.css';
import { storage } from '../utils/storage';
import { getT, type LanguageCode } from '../utils/i18n';

export default function Popup() {
  const [lang, setLang] = useState<LanguageCode>('vi');

  useEffect(() => {
    storage.getSettings().then((s) => {
      if (s?.appLanguage) setLang(s.appLanguage as LanguageCode);
    });
  }, []);

  const t = getT(lang);

  const openOptions = () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('options.html'));
    }
  };

  const openSidePanel = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.sidePanel.open({ tabId: tab.id });
      window.close();
    }
  };

  return (
    <div className="w-72 p-4 flex flex-col items-center justify-center bg-white font-sans text-gray-800 border-2 border-slate-900 rounded-2xl shadow-xl m-1">
      <div className="flex items-center gap-2 mb-2">
        <img src="/icons/icon32.png" alt="Lightning AI" className="w-7 h-7 rounded-lg shadow-sm" />
        <h1 className="text-lg font-bold text-gray-900 tracking-tight">Lightning AI</h1>
      </div>
      <p className="text-xs text-gray-500 text-center mb-4 leading-relaxed">
        {t.popupSubtitle}
      </p>
      
      <div className="w-full flex flex-col gap-2">
        <button
          onClick={openSidePanel}
          className="w-full py-2 px-3 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
        >
          <span>💬</span> {t.popupOpenSidePanel}
        </button>
        <button
          onClick={openOptions}
          className="w-full py-2 px-3 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>⚙️</span> {t.popupOpenOptions}
        </button>
      </div>
      <div className="mt-3 text-[10px] text-gray-400">{t.popupVersion}</div>
    </div>
  );
}
