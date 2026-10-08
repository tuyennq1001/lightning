import { useMemo, useCallback } from 'react';
import { Marked } from 'marked';

interface MarkdownRendererProps {
  content: string;
  isGenerating?: boolean;
  className?: string;
}

// Configured marked instance with custom code block renderer and safe link renderer
const marked = new Marked({
  breaks: true,
  gfm: true,
});

marked.use({
  renderer: {
    code({ text, lang }) {
      const language = (lang || 'code').trim();
      const encoded = encodeURIComponent(text);
      return `<div class="code-block-wrapper">
  <div class="code-header">
    <span class="code-lang">${language}</span>
    <button type="button" class="copy-code-btn" data-code="${encoded}">
      <svg class="w-3.5 h-3.5 inline mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
      </svg>
      <span>Copy</span>
    </button>
  </div>
  <pre><code>${text}</code></pre>
</div>`;
    },
    link({ href, title, text }) {
      return `<a href="${href}" target="_blank" rel="noopener noreferrer"${title ? ` title="${title}"` : ''}>${text}</a>`;
    }
  }
});

export default function MarkdownRenderer({ content, isGenerating = false, className = '' }: MarkdownRendererProps) {
  const htmlContent = useMemo(() => {
    if (!content) return '';
    try {
      return marked.parse(content) as string;
    } catch {
      return content;
    }
  }, [content]);

  const handleContainerClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const copyBtn = target.closest('.copy-code-btn') as HTMLButtonElement | null;
    if (copyBtn) {
      e.preventDefault();
      e.stopPropagation();
      const codeData = copyBtn.getAttribute('data-code');
      if (codeData) {
        const textToCopy = decodeURIComponent(codeData);
        navigator.clipboard.writeText(textToCopy);
        const originalHtml = copyBtn.innerHTML;
        copyBtn.innerHTML = '<span>✓ Copied!</span>';
        copyBtn.classList.add('text-emerald-400');
        setTimeout(() => {
          copyBtn.innerHTML = originalHtml;
          copyBtn.classList.remove('text-emerald-400');
        }, 2000);
      }
    }
  }, []);

  return (
    <div 
      onClick={handleContainerClick} 
      className={`lightning-markdown ${className}`}
    >
      <div 
        dangerouslySetInnerHTML={{ __html: htmlContent }} 
        className="inline"
      />
      {isGenerating && (
        <span className="inline-block w-1.5 h-4 ml-1 bg-blue-600 animate-pulse align-middle" />
      )}
    </div>
  );
}
