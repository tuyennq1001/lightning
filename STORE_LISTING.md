# Chrome Web Store Listing Package & Instructions: Livia AI

Tài liệu này chứa toàn bộ nội dung đã được chuẩn hóa để bạn sao chép (copy & paste) trực tiếp vào **Chrome Web Store Developer Dashboard** ([chrome.google.com/webstore/devconsole](https://chrome.google.com/webstore/devconsole)).

---

## 1. Tab "Package" (Tải lên gói mở rộng)
- **File nén tải lên**: `livia-v1.1.0.zip` (hoặc chạy lệnh `npm run package` để tự động build và đóng gói).
- Khi có bản cập nhật mới, chỉ cần chạy lệnh:
  ```bash
  npm run package
  ```

---

## 2. Tab "Store listing" (Thông tin hiển thị trên cửa hàng)

### Product Details (Chi tiết sản phẩm)
- **Extension Name (Tên tiện ích)**:
  ```text
  Livia: Private AI Copilot & Web Assistant
  ```
  *(Phiên bản tiếng Việt nếu chọn locale vi)*:
  ```text
  Livia: Trợ lý AI Riêng Tư & Toàn Năng Trên Web
  ```

- **Summary (Mô tả ngắn - ≤ 132 ký tự)**:
  ```text
  Your private AI copilot on every web page. Instant translate, summarize & rewrite with Gemini, Claude & GPT-4o. 100% Private BYOK.
  ```
  *(Phiên bản tiếng Việt - ≤ 132 ký tự)*:
  ```text
  Trợ lý AI đa năng riêng tư trên mọi trang web. Dịch thuật, tóm tắt, viết lại tức thì với Gemini, Claude & GPT-4o. Bảo mật 100% BYOK.
  ```

- **Detailed Description (Mô tả chi tiết)**:
  ```text
  ✨ Livia là trợ lý AI thông minh toàn năng (All-in-One AI Copilot) hoạt động mượt mà trực tiếp trên mọi trang web theo kiến trúc bảo mật BYOK (Bring Your Own Key). Tự do kết nối API Key từ Google Gemini, OpenAI hoặc Anthropic Claude — 100% không qua máy chủ trung gian, không thu thập dữ liệu và không tốn phí thuê bao hàng tháng!

  🌟 CÁC TÍNH NĂNG ĐỘT PHÁ CỦA LIVIA:
  -------------------------------------------------------------
  1. 📌 THANH CÔNG CỤ NỔI HIỆN ĐẠI (CAPSULE FLOATING TOOLBAR):
     • Tự động xuất hiện tinh tế ngay khi bạn bôi đen văn bản trên trang web.
     • Dịch thuật tức thì giữa hơn 100+ ngôn ngữ (Tiếng Việt, Anh, Nhật, Hàn, Trung...).
     • Phân tích ngữ cảnh, giải thích thuật ngữ chuyên môn và thành ngữ tự nhiên.
     • Viết lại đoạn văn, chỉnh sửa ngữ pháp hoặc nâng tầm giọng văn chuyên nghiệp.
     • Tùy chỉnh danh sách hành động ghim theo nhu cầu làm việc và học tập.

  2. 📄 TÓM TẮT TOÀN BỘ TRANG WEB (MOZILLA READABILITY):
     • Tích hợp thuật toán Mozilla Readability trích xuất nội dung cốt lõi của bài báo, tài liệu học thuật.
     • Rút ngắn bài viết 10,000 chữ thành các luận điểm súc tích chỉ trong vài giây.
     • Chuyển đổi nhanh sang chế độ giải thích bình dân (ELI5 - Explain Like I'm 5).

  3. ✍️ TRỢ LÝ VIẾT INLINE TRONG CÁC Ô NHẬP LIỆU:
     • Hỗ trợ viết email, phản hồi bình luận, soạn thảo thảo luận trên Gmail, LinkedIn, GitHub, Docs.
     • Đề xuất phương án viết lại chuẩn xác và cho phép thay thế trực tiếp chỉ với 1 cú click.

  4. 🔒 BẢO MẬT TUYỆT ĐỐI VỚI MÔ HÌNH 100% CLIENT-SIDE BYOK:
     • Kết nối trực tiếp từ trình duyệt của bạn đến các nhà cung cấp AI hàng đầu:
       - Google Gemini (Gemini 1.5 Flash, Gemini 1.5 Pro)
       - OpenAI (GPT-4o, GPT-4o mini)
       - Anthropic Claude (Claude 3.5 Sonnet, Claude 3 Haiku)
       - OpenRouter (Meta Llama 3.3, DeepSeek, Mistral...)
     • API Key và cài đặt cá nhân được lưu trữ cục bộ 100% trong trình duyệt (chrome.storage.local).
     • Không máy chủ trung gian, không theo dõi lịch sử duyệt web, không quảng cáo, không phí ẩn.

  💡 HƯỚNG DẪN SỬ DỤNG NHANH:
  1. Thêm tiện ích Livia vào Chrome.
  2. Mở trang Cài đặt (Options) và nhập API Key của bạn (khuyên dùng Google Gemini hoàn toàn miễn phí hoặc OpenAI/Claude).
  3. Bôi đen bất kỳ đoạn văn bản nào trên trang web để trải nghiệm thanh công cụ nổi Livia!
  ```

### Categorization (Phân loại)
- **Category (Danh mục)**: `Productivity` (Năng suất) hoặc `Workflow & Planning`.
- **Language (Ngôn ngữ chính)**: `English` hoặc `Tiếng Việt`.

### Graphic Assets (Tài nguyên hình ảnh tiếp thị)
Tất cả hình ảnh đã được chuẩn hóa kích thước và chất lượng cao nằm trong thư mục `store-assets/`:
1. **Marquee Promo Tile**: `store-assets/marquee-1400x560.png` (1400 x 560 px).
2. **Small Promo Tile**: `store-assets/promo-tile-440x280.png` (440 x 280 px).
3. **Store Icon**: `public/icons/icon128.png` (128 x 128 px).
4. **Bộ 5 Screenshots Showcase (1280 x 800 px)**:
   - `store-assets/screenshot-1-hero-1280x800.png` (Showcase 1: Giới thiệu tổng quan Livia Copilot).
   - `store-assets/screenshot-2-translate-1280x800.png` (Showcase 2: Dịch thuật ngữ cảnh sâu & từ vựng).
   - `store-assets/screenshot-3-summarize-1280x800.png` (Showcase 3: Tóm tắt trang web Readability siêu tốc).
   - `store-assets/screenshot-4-write-1280x800.png` (Showcase 4: Trợ lý viết & tinh chỉnh văn phong).
   - `store-assets/screenshot-5-byok-1280x800.png` (Showcase 5: Kiến trúc bảo mật BYOK độc lập 100%).

*(Bạn cũng có thể mở file `tools/store-asset-generator.html` trên trình duyệt để xem trước trực quan toàn bộ bộ ảnh này).*

---

## 3. Tab "Privacy" (Quyền riêng tư & Giải trình Quyền hạn)

### Single Purpose (Mục đích duy nhất của tiện ích)
```text
Livia is a privacy-first AI browsing assistant that enables users to translate, explain, summarize, and polish text directly on web pages using their own AI API keys (100% Client-Side Bring Your Own Key architecture).
```

### Permission Justifications (Giải trình lý do xin quyền)
1. **`storage`**:
   ```text
   Used to store user preferences, custom action prompts, selected UI language, and user-provided API keys locally on the device via chrome.storage.local.
   ```
2. **`contextMenus`**:
   ```text
   Used to add right-click context menu shortcuts allowing users to trigger instant AI translation, explanation, or page summarization for selected web content.
   ```
3. **`activeTab`**:
   ```text
   Used to access the currently active tab when the user explicitly triggers page summarization or opens the action popup.
   ```
4. **Host permissions (`<all_urls>`)**:
   ```text
   Required for the content script to inject the floating action toolbar and popover directly on user-selected text across web pages, and to send direct, authenticated HTTPS requests to user-configured AI provider endpoints (Google Gemini, OpenAI, Anthropic Claude, and OpenRouter) without routing through any intermediary servers.
   ```
