# ⚡ Lightning AI - All-in-One AI Assistant Chrome Extension (BYOK)

Lightning is a high-performance, commercial-grade AI Chrome Extension operating on a **BYOK (Bring Your Own Key)** model. It supports **Google Gemini**, **OpenAI**, and **Anthropic Claude** directly from your browser with zero middleman servers.

---

## 🌟 Key Features

- **🎯 Contextual Floating Toolbar**: Appears seamlessly at the exact cursor release endpoint upon text selection on any webpage or editable textarea.
- **⚡ Quick Ask & Preset Questions**: Ask anything about selected text or pick from smart quick-action prompts.
- **📝 Markdown Support**: Rich markdown rendering for AI responses with headers, lists, tables, blockquotes, and one-click code snippet copying.
- **🌐 In-Popup Translation**: Switch target translation languages directly inside the floating popup.
- **🔒 Privacy First (BYOK)**: Your personal API Keys are stored locally inside `chrome.storage.local`. All API calls go directly to AI providers with no tracking.
- **🖱️ Smart Right-Click Menus**: Contextual right-click actions (Translate, Summarize, Explain, Rewrite, and Summarize entire page).
- **💬 Continuous Side Panel**: Chat alongside your browsing workflow using the Chrome Side Panel.
- **🌍 Full Localization (i18n)**: Seamless interface translation between English, Tiếng Việt, and 日本語.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or newer)
- npm or pnpm

### Installation & Build

```bash
# Clone the repository
git clone https://github.com/tuyennq1001/lightning.git
cd lightning

# Install dependencies
npm install

# Build the Chrome Extension bundle
npm run build
```

### Loading into Chrome

1. Open Google Chrome and navigate to `chrome://extensions`.
2. Enable **Developer mode** in the top right corner.
3. Click **Load unpacked** and select the `dist` directory inside this project.
4. Pin the Lightning extension to your toolbar and open **Settings** to add your API Key (e.g., Google Gemini API key).

---

## 🛠️ Tech Stack

- **React 19** + **TypeScript**
- **Vite 8** + **@crxjs/vite-plugin** (Manifest V3)
- **Tailwind CSS v4**
- **Marked** (Markdown parser with custom code copy blocks)
- **Mozilla Readability** (Full-page content extraction)
