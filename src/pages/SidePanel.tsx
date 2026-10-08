import { useState, useRef, useEffect, type FormEvent } from 'react';
import { streamAIResponse, type ChatMessage } from '../utils/ai';
import { useSettings } from '../hooks/useSettings';
import { getT, type LanguageCode } from '../utils/i18n';
import MarkdownRenderer from '../components/MarkdownRenderer';

export default function SidePanel() {
  const { settings, loading } = useSettings();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const t = getT((settings?.appLanguage as LanguageCode) || 'vi');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating || !settings) return;

    const userMessage: ChatMessage = { role: 'user', content: input.trim() };
    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInput('');
    setIsGenerating(true);

    try {
      const stream = streamAIResponse(newHistory, settings);
      
      // Add empty assistant message to be filled
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      for await (const chunk of stream) {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          return [...prev.slice(0, -1), { ...last, content: last.content + chunk }];
        });
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev, 
        { role: 'assistant', content: `[${t.errorPrefix}: ${err.message}]` }
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-center text-gray-500">{t.loading}</div>;
  }

  if (!settings?.apiKey) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-4 text-center">
        <h2 className="text-lg font-bold text-gray-800 mb-2">{t.sidepanelNoKeyTitle}</h2>
        <p className="text-sm text-gray-600 mb-4">{t.sidepanelNoKeyDesc}</p>
        <button
          onClick={() => chrome.runtime.openOptionsPage()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 cursor-pointer"
        >
          {t.sidepanelOpenSettings}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="px-4 py-3 bg-white border-b shadow-sm flex justify-between items-center">
        <div className="flex items-center gap-2">
          <img src="/icons/icon32.png" alt="Lightning AI" className="w-5 h-5 rounded shadow-xs" />
          <h1 className="text-base font-bold text-gray-800">Lightning AI</h1>
        </div>
        <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-semibold uppercase">
          {settings.provider}
        </span>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {messages.length === 0 ? (
          <div className="text-center text-sm text-gray-400 mt-10">
            {t.sidepanelStartChat}
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none whitespace-pre-wrap'
                    : 'bg-white text-gray-800 border border-gray-200 shadow-sm rounded-bl-none'
                }`}
              >
                {msg.role === 'user' ? (
                  msg.content
                ) : (
                  <MarkdownRenderer
                    content={msg.content}
                    isGenerating={isGenerating && idx === messages.length - 1}
                  />
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </main>

      <footer className="p-3 bg-white border-t">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isGenerating}
            placeholder={isGenerating ? t.thinking : t.sidepanelInputPlaceholder}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm disabled:bg-gray-100"
          />
          <button
            type="submit"
            disabled={!input.trim() || isGenerating}
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors flex items-center justify-center shrink-0 w-10 h-10 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </form>
      </footer>
    </div>
  );
}
