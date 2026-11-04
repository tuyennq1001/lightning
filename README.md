# ✨ Livia: Private AI Copilot & Web Assistant

Livia is a privacy-first, commercial-grade AI Chrome Extension operating on a 100% **Client-Side BYOK (Bring Your Own Key)** architecture. It connects directly to **Google Gemini**, **OpenAI**, **Anthropic Claude**, and **OpenRouter** straight from your browser with zero middleman servers and no monthly subscriptions.

---

## 🌟 Key Features

- **🎯 Capsule Floating Toolbar**: Appears seamlessly with smooth glassmorphism at the exact cursor release endpoint upon text selection on any webpage or editable textarea.
- **文A Instant Contextual Translation**: Real-time translation between 100+ languages with direct target language switching inside the popup.
- **📄 Full-Page Summarization**: Powered by Mozilla Readability to extract core articles and condense 10,000-word guides into actionable bullet points.
- **✍️ Inline Writing Companion**: Polish tone, fix grammar, and rewrite text directly inside textareas and inputs (Gmail, LinkedIn, GitHub, Docs).
- **🔒 True Privacy First (BYOK)**: Your personal API Keys are stored locally inside `chrome.storage.local`. All API requests route directly to AI provider endpoints with zero telemetry, tracking, or proxy servers.
- **🖱️ Smart Right-Click Menus**: Contextual right-click actions (Translate, Summarize, Explain, Rewrite, and Summarize page/link).
- **🌍 100% Localization Parity**: Supported in English, Tiếng Việt, and 日本語.

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

# Run automated test suite
npm test

# Build the Chrome Extension bundle
npm run build

# Package extension zip for Chrome Web Store
npm run package
```

### Loading into Chrome

1. Open Google Chrome and navigate to `chrome://extensions`.
2. Enable **Developer mode** in the top right corner.
3. Click **Load unpacked** and select the `dist` directory inside this project.
4. Pin the Livia extension to your toolbar and open **Settings** to add your API Key (e.g. Google Gemini free API key).

---

## 🛠️ Tech Stack

- **React 19** + **TypeScript**
- **Vite 8** + **@crxjs/vite-plugin** (Manifest V3)
- **Tailwind CSS v4** + Cyber Emerald & Mint Teal Glassmorphism
- **Marked** (Markdown parser with code copy blocks)
- **Mozilla Readability** (Full-page content extraction)
