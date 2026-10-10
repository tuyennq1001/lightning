# Chrome Web Store Listing Package & Instructions

Tài liệu này chứa toàn bộ nội dung đã được chuẩn hóa để bạn sao chép (copy & paste) trực tiếp vào **Chrome Web Store Developer Dashboard** ([chrome.google.com/webstore/devconsole](https://chrome.google.com/webstore/devconsole)).

---

## 1. Tab "Package" (Tải lên gói mở rộng)
- **File nén tải lên**: `lightning-v1.0.0.zip` (nằm ngay tại thư mục gốc của dự án).
- Khi có bản cập nhật mới, chỉ cần chạy lệnh:
  ```bash
  npm run package
  ```

---

## 2. Tab "Store listing" (Thông tin hiển thị trên cửa hàng)

### Product Details (Chi tiết sản phẩm)
- **Extension Name (Tên tiện ích)**:
  ```text
  Lightning: All-in-One AI Assistant (BYOK)
  ```
  *(Hoặc phiên bản tiếng Việt nếu chọn locale vi)*:
  ```text
  Lightning - Trợ lý AI Đa Năng (BYOK)
  ```

- **Summary (Mô tả ngắn - ≤ 132 ký tự)**:
  ```text
  Trợ lý AI đa năng hỗ trợ dịch thuật, giải thích, tóm tắt và chat side panel trên mọi trang web. Bảo mật tuyệt đối theo mô hình BYOK.
  ```
  *(English version)*:
  ```text
  All-in-one AI assistant for translation, summarization, and side-panel chat across any web page. 100% private Bring Your Own Key.
  ```

- **Detailed Description (Mô tả chi tiết)**:
  ```text
  ⚡ Lightning là trợ lý AI cá nhân toàn năng hoạt động mượt mà trên mọi trang web theo mô hình BYOK (Bring Your Own Key). Tự do kết nối API Key của bạn từ Google Gemini, OpenAI hoặc Anthropic Claude — hoàn toàn không qua máy chủ trung gian, không thu thập dữ liệu và không phát sinh chi phí ẩn!

  🌟 TÍNH NĂNG NỔI BẬT:
  ---------------------------------
  1. 📌 THANH CÔNG CỤ NỔI (FLOATING TOOLBAR) KHI BÔI ĐEN VĂN BẢN:
     • Dịch thuật tức thì giữa các ngôn ngữ (Tiếng Việt, Tiếng Anh, Tiếng Nhật...).
     • Giải thích thuật ngữ, phân tích ngữ cảnh chuyên sâu.
     • Kiểm tra và sửa lỗi ngữ pháp, hành văn tự nhiên.
     • Viết tiếp hoặc rút gọn đoạn văn với một cú nhấp chuột.
     • Tùy chỉnh danh sách hành động ghim theo thói quen đọc và viết.

  2. 📄 TÓM TẮT TOÀN BỘ TRANG WEB (READABILITY):
     • Tích hợp Mozilla Readability giúp trích xuất nội dung cốt lõi của bài báo, tài liệu.
     • Sinh bản tóm tắt súc tích, làm nổi bật các ý chính trong vài giây.

  3. 🖱️ MENU CHUỘT PHẢI (CONTEXT MENU):
     • Kích hoạt nhanh các tác vụ AI cho đoạn văn bản đã chọn từ menu ngữ cảnh.

  4. 🔒 BẢO MẬT TUYỆT ĐỐI VỚI MÔ HÌNH BYOK:
     • Kết nối trực tiếp với các nhà cung cấp AI hàng đầu:
       - Google Gemini (Gemini 1.5 Flash, Gemini 1.5 Pro)
       - OpenAI (GPT-4o, GPT-4o mini)
       - Anthropic Claude (Claude 3.5 Sonnet, Claude 3 Haiku)
     • API Key và cấu hình được lưu trữ cục bộ 100% trong trình duyệt của bạn (chrome.storage.local).
     • Không trung gian, không theo dõi lịch sử duyệt web, không quảng cáo.

  💡 HƯỚNG DẪN BẮT ĐẦU:
  1. Cài đặt tiện ích Lightning.
  2. Mở trang Cài đặt (Options) và nhập API Key của nhà cung cấp bạn muốn sử dụng (Google Gemini, OpenAI hoặc Claude).
  3. Bôi đen bất kỳ đoạn văn bản nào trên trang web để trải nghiệm thanh công cụ nổi!
  ```

### Categorization (Phân loại)
- **Category (Danh mục)**: `Productivity` (Năng suất) hoặc `Workflow & Planning`.
- **Language (Ngôn ngữ chính)**: `English` hoặc `Tiếng Việt`.

### Graphic Assets (Tài nguyên hình ảnh)
- **Store Icon**: Tải lên file [`public/icons/icon128.png`](file:///Users/tuyennq1001/htdocs/projects/lightning/public/icons/icon128.png) (128x128 px).
- **Screenshots (Ảnh chụp màn hình)**: Chuẩn bị 1 đến 5 ảnh định dạng **1280x800 px** hoặc **640x400 px**. Khuyến nghị 4 ảnh:
  1. *Ảnh 1*: Bôi đen văn bản trên trang web hiển thị Floating Toolbar và kết quả popup (dịch/giải thích).
  2. *Ảnh 2*: Trang Cài đặt Options cấu hình BYOK (Gemini, OpenAI, Claude, OpenRouter).
  3. *Ảnh 3*: Tóm tắt trang web với Mozilla Readability.
- **Small Promo Tile**: Ảnh kích thước 440x280 px (tùy chọn hoặc khuyến nghị tạo).

---

## 3. Tab "Privacy" (Quyền riêng tư & Giải trình Quyền hạn)

Đây là phần **quan trọng nhất** quyết định việc duyệt của Google Chrome Web Store.

### Single Purpose (Mục đích duy nhất của tiện ích)
Điền vào ô mô tả Single Purpose:
```text
Lightning is an AI-powered reading and writing productivity assistant that allows users to translate, explain, summarize, and chat with AI directly on web pages using their own API keys (Bring Your Own Key architecture).
```

### Permission Justifications (Giải trình lý do xin quyền)
Google sẽ hỏi lý do cho từng quyền được khai báo trong `manifest.json`:

1. **`storage`**:
   ```text
   Used to store user preferences, custom action prompts, selected UI language, and user-provided API keys locally on the device via chrome.storage.local.
   ```

2. **`activeTab`**:
   ```text
   Used to access the currently active web page only when the user explicitly triggers features such as "Summarize this page" or interacts with the contextual toolbar.
   ```

3. **`scripting`**:
   ```text
   Used to safely extract article text from the active tab using Mozilla Readability when the user clicks "Summarize this page" without modifying the underlying DOM.
   ```

4. **`contextMenus`**:
   ```text
   Used to add right-click menu shortcuts (Translate, Explain, Summarize, Rewrite) on selected text for quick AI processing.
   ```

5. **Host Permissions (`<all_urls>`)**:
   ```text
   Required for two critical purposes:
   1. To inject the isolated Shadow DOM selection toolbar across websites where the user reads or edits text.
   2. To enable direct browser-to-API network requests to the official AI endpoints (Google Generative Language API, OpenAI API, Anthropic API) without routing through any intermediate servers.
   ```

### Data Usage & Declarations (Khai báo sử dụng dữ liệu)
- **Do you collect personal data?**: Chọn **No** cho tất cả các loại dữ liệu cá nhân (PII, Financial, Health, Authentication, Location...).
- **Website Content**: Đánh dấu chọn **Yes**, sau đó chọn:
  - **Data collection purpose**: `App functionality`.
  - **Does this data identify a user?**: `No`.
  - **Do you sell or transfer data to third parties?**: `No`.
- **Certifications**:
  - Tích chọn: *"I certify that this extension complies with the Limited Use policy."*
  - Tích chọn: *"I do not sell or transfer user data."*
  - Tích chọn: *"I do not use or transfer user data for purposes that are unrelated to the item's core functionality."*
  - Tích chọn: *"I do not use or transfer user data to determine creditworthiness or for lending purposes."*

### Privacy Policy URL (Đường dẫn chính sách bảo mật)
- Bạn có thể đưa nội dung file `PRIVACY_POLICY.md` lên:
  - **Cách 1 (Khuyên dùng)**: Tạo GitHub Repository công khai (ví dụ repo của tiện ích) và dùng link file `PRIVACY_POLICY.md` hoặc kích hoạt **GitHub Pages**.
  - **Cách 2**: Đưa nội dung vào một trang Notion hoặc Google Sites công khai.
- Nhập URL công khai đó vào ô **Privacy policy** trên dashboard.

---

## 4. Tab "Distribution" (Phân phối)
- **Visibility (Hiển thị)**: `Public` (Công khai).
- **Regions (Quốc gia)**: Chọn `All regions` (Tất cả khu vực).
- **Trader Status (Tư cách thương nhân)**: Chọn **Non-trader** (Phi thương mại/Cá nhân) nếu bạn phát hành tiện ích miễn phí và không thu phí giao dịch.

---

## 5. Reviewer Notes (Ghi chú cho đội ngũ kiểm duyệt của Google)
Nếu dashboard có mục **Reviewer notes**, hãy dán nội dung này để reviewer hiểu rõ cách kiểm tra:
```text
This extension operates under the Bring Your Own Key (BYOK) model. To test its functionality:
1. Open the Options page by clicking on the extension icon or right-clicking > Options.
2. Enter a valid Google Gemini, OpenAI, or Anthropic Claude API key.
3. Highlight any text on any webpage to see the floating AI action toolbar.
All network requests are made directly from the client to the official provider endpoints. No backend proxy or tracking servers are involved.
```
