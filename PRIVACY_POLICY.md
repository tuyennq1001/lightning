# Privacy Policy for Lightning AI Assistant

**Last updated:** October 8, 2026

Lightning AI ("we", "our", or "the extension") is a browser extension designed to enhance your web reading and writing experience with AI capabilities. We are committed to protecting your privacy and ensuring complete transparency regarding how your data is handled.

---

## 1. Core Principle: Bring Your Own Key (BYOK) & Zero Data Collection

Lightning operates strictly on a **Bring Your Own Key (BYOK)** architecture:
- **No Intermediary Servers:** We do not own or operate any backend proxy server that processes, logs, or intercepts your prompts or data.
- **Direct API Communication:** All AI requests are transmitted directly from your browser client to the official API endpoints of your chosen provider:
  - Google Gemini (`generativelanguage.googleapis.com`)
  - OpenAI (`api.openai.com`)
  - Anthropic Claude (`api.anthropic.com`)
- **No Analytics / Telemetry:** We do not track your browsing habits, sell user data, or inject any tracking scripts/analytics into your browser.

---

## 2. Information We Access and How It Is Used

### A. API Keys and Settings
- **What is stored:** Your chosen AI provider, API key, model selection, custom actions, and language preferences.
- **Where it is stored:** Exclusively inside your browser's local extension storage (`chrome.storage.local`).
- **Access scope:** Only the Lightning extension running in your browser has access to this data. It is never synced to external servers or accessible to third parties.

### B. Selected Text and Webpage Content
- **When it is accessed:** Only when you explicitly perform an action (e.g., highlighting text and clicking an action on the Floating Toolbar, right-clicking for a Context Menu action, or clicking "Summarize this page").
- **How it is used:** The selected text or extracted article content is sent directly to your configured AI provider to fulfill your request (e.g., translation, explanation, grammar correction, or summarization).
- **Retention:** We do not log, retain, or store your text snippets. Once the AI response stream completes, the text is discarded from temporary memory.

---

## 3. Chrome Extension Permissions Justification

In accordance with Google Chrome Web Store policies, here is why Lightning requests specific permissions:

| Permission | Purpose |
| :--- | :--- |
| `storage` | Stores user configuration, preferred languages, and API keys locally in `chrome.storage.local`. |
| `activeTab` & `scripting` | Extracts article content on demand when you explicitly click "Summarize this page" using Mozilla Readability. |
| `contextMenus` | Adds quick-access AI options (Translate, Explain, Summarize) to the right-click menu. |
| `<all_urls>` (Host Permissions) | Enables the floating selection toolbar across websites you visit and permits direct network requests from the browser to the official AI provider APIs. |

---

## 4. Third-Party Service Providers

When you use Lightning, your interactions are processed by the AI provider you have configured:
- **Google Generative AI:** Subject to [Google Privacy Policy](https://policies.google.com/privacy) and [Google Generative AI Terms of Service](https://ai.google.dev/terms).
- **OpenAI:** Subject to [OpenAI Privacy Policy](https://openai.com/privacy) and [OpenAI Terms of Use](https://openai.com/terms).
- **Anthropic:** Subject to [Anthropic Privacy Policy](https://www.anthropic.com/privacy).

We recommend reviewing the privacy policies of the respective AI providers you choose to connect.

---

## 5. Security & Isolation

- **Shadow DOM Isolation:** Lightning renders its floating toolbar and modal dialogs inside an isolated Shadow DOM (`mode: 'open'`) to guarantee that web page scripts cannot inspect or interfere with extension UI states or API key prompts.
- **Secure Token Handling:** API keys are never printed to console logs or exposed to host web pages.

---

## 6. Children's Privacy

Lightning does not knowingly collect or solicit any personal information from children under the age of 13.

---

## 7. Changes to This Policy

We may update this Privacy Policy from time to time to reflect improvements or regulatory requirements. Any updates will be published with an updated "Last updated" date in this document and in the project repository.

---

## 8. Contact Us

If you have questions, feedback, or concerns regarding this Privacy Policy, please open an issue on our GitHub repository or contact the project maintainer.
