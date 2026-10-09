# AGENTS & CODING RULES (QUY TẮC VẬN HÀNH & KỸ THUẬT)

Tài liệu này là bộ quy tắc cốt lõi gồm 2 phần rõ rệt:
- **PHẦN 1: NGUYÊN TẮC KỸ THUẬT CHUNG (UNIVERSAL COMMON RULES)**: Bắt buộc tuân thủ trên mọi dự án phần mềm (Web, Mobile, Backend, CLI... bất kể ngôn ngữ). **Giữ nguyên 100% khi copy sang dự án mới hoặc đưa vào ChatGPT/AI tool.**
- **PHẦN 2: QUY TẮC ĐẶC THÙ DỰ ÁN (PROJECT-SPECIFIC RULES)**: Tùy biến theo từng dự án cụ thể. *(Hiện tại cấu hình cho dự án: Lightning - All-in-One AI Assistant Chrome Extension)*. Khi sang dự án mới, chỉ cần thay đổi nội dung phần này.

---

# ==============================================================================
# PHẦN 1: QUY TẮC KỸ THUẬT CHUNG CHO MỌI DỰ ÁN (UNIVERSAL COMMON RULES)
# (Độc lập ngôn ngữ & nền tảng — Tái sử dụng nguyên vẹn cho bất kỳ dự án nào)
# ==============================================================================

## 1. Quy trình Git Branching & Quản lý PR (Git Automation Workflow)
- **Tuyệt đối không commit trực tiếp vào nhánh chính**: Không bao giờ commit lên `main` hoặc `master`.
- **Luôn tạo nhánh riêng biệt trước khi viết code**: Tự động tạo nhánh `feature/<tên-tính-năng>` hoặc `fix/<tên-lỗi>` từ nhánh chính trước khi thực hiện bất kỳ thay đổi nào.
- **Quy trình chuẩn 4 bước**:
  1. Viết code.
  2. Chạy toàn bộ bộ kiểm thử tự động (Unit / Integration Tests) — **PHẢI PASS 100%**.
  3. Chạy build/compile dự án — **PHẢI BUILD THÀNH CÔNG**.
  4. Chờ người dùng xác nhận trải nghiệm thực tế chạy đúng mong đợi ➔ **Mới tiến hành commit**.
- **Tiêu chuẩn Commit/PR**:
  - Tiêu đề tuân theo Conventional Commits (`feat(...)`, `fix(...)`), **tối đa ≤ 72 ký tự**.
  - Nội dung mô tả (Body) **ngắn gọn ≤ 5 dòng**. Nếu cần mô tả chi tiết, ghi ra file riêng và đính kèm link.
- **Chỉ Push & Merge khi được yêu cầu**:
  - Mặc định **không tự ý push** lên remote repository. Chỉ push và tạo PR (`gh pr create`) khi người dùng yêu cầu rõ ràng.
  - Chỉ merge PR (`gh pr merge`) vào nhánh chính khi người dùng trực tiếp xác nhận "OK" hoặc "Duyệt".

---

## 2. An toàn Thực thi Terminal & Script (Terminal Safety)
- **Không viết inline script dài trong `-c`**: Bất kỳ script nào (Bash, Python, Node...) nếu dài quá ~5 dòng, **bắt buộc phải ghi ra file script tạm**, cấp quyền và thực thi file đó, sau đó xóa file tạm đi.
- **Không pipe build output qua bộ lọc chặn (blocking filter)**: Tránh dùng `| grep ...` trực tiếp trên luồng build/compile vì dễ gây treo tiến trình (hang/freeze/timeout) nếu output không khớp pattern.
- **Giới hạn độ dài dòng lệnh**: Mỗi câu lệnh CLI không vượt quá ~2000 ký tự để tránh lỗi buffer overflow và timeout.

---

## 3. Trung thực Dữ liệu & Phê duyệt Trước khi Code (Mandatory Approval)
- **Trung thực dữ liệu tuyệt đối (No Fake / Dummy Data)**: Tuyệt đối không tự ý bịa dữ liệu giả định, tên công ty giả, hoặc nhồi kết quả heuristic giả lập. Mọi dữ liệu hiển thị bắt buộc phải là dữ liệu thật 100% từ API chính thống hoặc nguồn đã kiểm chứng (trừ trường hợp kịch bản mock test được chỉ định rõ).
- **Bắt buộc chờ phê duyệt phương án trước khi sửa code**:
  1. AI phải giải thích nguyên nhân gốc rễ và trình bày phương án kỹ thuật rõ ràng.
  2. **CHỈ TIẾN HÀNH VIẾT CODE KHI NGƯỜI DÙNG XÁC NHẬN "OK" / DUYỆT TRỰC TIẾP** bằng lời nhắn trong chat.
  3. Tuyệt đối không tự động nhảy sang bước viết code / thực thi thay đổi khi người dùng chưa đồng ý.

---

## 4. Tiêu chuẩn Kỹ thuật Hiệu năng (Universal Performance Engineering)
*(Áp dụng cho mọi hệ thống: Frontend UI, Backend API, Mobile, Desktop, CLI)*
- **Cô lập State & Sự kiện tần số cao (State & Event Isolation)**:
  - Các sự kiện hoặc state biến động liên tục (hover chuột, con trỏ, vị trí scroll, sensors, keystrokes input...) **bắt buộc phải cô lập trong component/module con**. Tuyệt đối không đặt ở component cha vì sẽ kích hoạt re-render hoặc re-calculate toàn bộ cây view/component.
- **Cấm tính toán nặng trong Render Loop & Request Hot-Path**:
  - Không chạy sắp xếp (`sort`), lọc mảng lớn (`filter`), parse JSON nặng, hoặc các thuật toán tính toán phức tạp trực tiếp bên trong vòng lặp render giao diện hoặc hàm xử lý request chính.
  - Mọi phép tính nặng phải tính trước (pre-compute) và lưu cache bộ nhớ (in-memory cache / memoization). View/handler chỉ đóng vai trò đọc dữ liệu đã chuẩn bị.
- **Tối ưu cấp phát bộ nhớ & Giảm tải Garbage Collection (Allocation Optimization)**:
  - Tránh khởi tạo các đối tượng tốn kém tài nguyên (date formatters, regex parsers, database connections, crypto engines) lặp đi lặp lại trong vòng lặp kín hoặc từng item của danh sách. Bắt buộc tái sử dụng instance static/singleton hoặc object pool.
- **Ảo hóa & Phân trang dữ liệu lớn (Virtualization & Pagination)**:
  - Trên giao diện: Danh sách lớn bắt buộc phải dùng cơ chế ảo hóa (virtual list/lazy loading), chỉ render các phần tử thực sự nằm trong khung nhìn.
  - Dưới backend/DB: Luôn phân trang (pagination), stream hoặc chunking dữ liệu, tuyệt đối không tải hàng loạt triệu bản ghi vào RAM cùng lúc.
- **Gom cụm & Tiết chế luồng dữ liệu thời gian thực (Buffering & Throttling)**:
  - Dữ liệu từ luồng thời gian thực (WebSocket, Message Queue, Event Stream) không được bắn trực tiếp từng event đơn lẻ lên UI/Main Loop. Bắt buộc có cơ chế buffer gom batch và debounce/throttle (ví dụ: 0.5s – 1.0s) để giảm tải tần suất cập nhật.
- **Bất đồng bộ & Không chặn luồng chính (Non-blocking I/O)**:
  - Mọi thao tác I/O (đọc/ghi file, gọi network, truy vấn DB) tuyệt đối không chạy đồng bộ trên Main Thread / Event Loop chính.
  - Thao tác ghi đĩa/persistence lặp đi lặp lại phải được debounce và đẩy xuống background worker/thread.

---

## 5. Tư duy Triển khai Ngang (Horizontal Deployment Mindset)
Khi giải quyết bất kỳ lỗi hoặc phát triển tính năng nào, bắt buộc tự động rà soát đồng bộ theo 4 trục:
- **Trục Tính năng & Thành phần tương đồng (Feature Parity)**: Nếu sửa/thêm logic ở Module A, phải tự động quét toàn bộ codebase tìm các Module B, C có vai trò hoặc logic tương tự (ví dụ: danh sách chính ↔ danh sách phụ; chế độ xem bảng ↔ chi tiết modal; giỏ hàng ↔ thanh toán) để áp dụng đồng bộ.
- **Trục Đa Nền tảng / Đa Môi trường (Environment & Platform Parity)**: Đảm bảo tính năng hoạt động nhất quán trên mọi nền tảng được hỗ trợ (Desktop ↔ Mobile, Web Responsive, macOS ↔ iOS, Dark Mode ↔ Light Mode).
- **Trục Đầy đủ Trạng thái Dữ liệu (State Parity)**: Mọi thành phần hiển thị/xử lý dữ liệu phải đáp ứng trọn vẹn 4 trạng thái:
  1. `Loading`: Có skeleton/placeholder dự trù, không làm vỡ hoặc giật layout.
  2. `Empty`: Giao diện thông báo trạng thái trống thân thiện, có chỉ dẫn hành động.
  3. `Error`: Bắt lỗi lịch sự, có nút thử lại (Retry), không để crash ứng dụng.
  4. `Loaded`: Hiển thị dữ liệu chính xác.
- **Trục Ổn định Giao diện & Hợp đồng Dữ liệu (Contract & Layout Stability)**:
  - Trên UI: Giữ vững kích thước khung hình, triệt tiêu hiện tượng giật nhảy layout (Zero Layout Shift).
  - Trên Logic: Xử lý triệt để các trường hợp biên (`null/undefined`, chia cho 0 sinh ra `NaN/Inf`, lỗi tràn mảng `Index out of bounds`). Khi thiếu số liệu, hiển thị ký hiệu thay thế lịch sự (`-` hoặc `--`), tuyệt đối không làm crash hay hiển thị giá trị bất thường.

---

## 6. An toàn Concurrency & Kiểm thử Hồi quy (Concurrency & Test Guard)
- **Luồng UI vs Luồng Background**: Mọi cập nhật trạng thái hiển thị người dùng bắt buộc diễn ra trên Main/UI Thread. Mọi tính toán thuật toán nặng hoặc I/O bắt buộc đẩy sang Background Thread/Worker.
- **Kiểm thử hồi quy (Regression Testing Guard)**: Khi sửa đổi các hàm tính toán cốt lõi hoặc thuật toán quan trọng, bắt buộc phải chạy hoặc viết bổ sung Unit Test tương ứng để đảm bảo lỗi không bao giờ tái phát.

---

# ==============================================================================
# PHẦN 2: QUY TẮC ĐẶC THÙ DỰ ÁN (PROJECT-SPECIFIC RULES: LIGHTNING AI EXTENSION)
# Tech Stack: Chrome Extension (Manifest V3), React 19, TypeScript, Vite, Tailwind CSS v4, @crxjs/vite-plugin, Mozilla Readability, Marked
# ==============================================================================

## 1. Lệnh Kiểm Tra & Triển Khai Chuẩn (Build & Quality Gates)
- **Môi trường phát triển (Dev)**: `npm run dev` (Khởi chạy Vite Dev Server kết hợp CrxJS HMR cho tiện ích).
- **Kiểm tra kiểu & Đóng gói (Build Gate)**: `npm run build` (`tsc -b && vite build`)
  - **Bắt buộc**: Phải build thành công 100% không có lỗi TypeScript trước khi báo hoàn thành công việc hoặc tạo commit.
- **Phân tích tĩnh (Linter Gate)**: `npm run lint` (`oxlint`)
  - Phải kiểm tra không có lỗi cú pháp hoặc vi phạm React Compiler trước khi bàn giao.
- **Thư mục phân phối (Unpacked Extension)**: Thư mục `dist/`.
  - Nạp tiện ích vào Google Chrome qua: `chrome://extensions` ➔ Bật **Developer mode** ➔ Chọn **Load unpacked** ➔ Trỏ tới thư mục `dist/`.

---

## 2. Kiến Trúc Phân Vùng Chrome Extension (Manifest V3 Architecture & Boundaries)
Dự án được phân định thành 4 môi trường thực thi biệt lập:
- **Content Script (`src/content.tsx`) & Cô Lập Shadow DOM**:
  - Chạy trực tiếp trong ngữ cảnh trang web người dùng (`<all_urls>`).
  - **Bắt buộc 100% sử dụng Shadow DOM (`attachShadow({ mode: 'open' })`)**: Tuyệt đối không gắn trực tiếp các phần tử giao diện của toolbar/modal vào DOM chính của trang web. Toàn bộ stylesheet Tailwind phải inject inline vào Shadow Root để tránh xung đột CSS hai chiều (CSS của trang web làm méo UI extension, hoặc CSS extension làm vỡ trang web).
  - **Cơ chế Pointer Events**: Container cha (`#lightning-ai-root`) gắn vào `document.body` **bắt buộc** đặt `pointer-events: none` để không chắn thao tác click chuột của trang web. Chỉ các container con bên trong Shadow DOM (Floating Toolbar, Modal Popup) mới đặt `pointer-events: auto`.
  - **Giới hạn Viewport & Tọa độ**: Tọa độ xuất hiện của toolbar/modal phải tính toán động theo điểm nhả chuột (`e.pageX`, `e.pageY`) và được kẹp (clamp) trong ranh giới hiển thị của màn hình (`window.innerWidth`, `window.innerHeight`), triệt tiêu hiện tượng tràn mép hoặc tạo thanh cuộn ngang ngoài ý muốn.
- **Background Service Worker (`src/background.ts`)**:
  - Kiến trúc vô trạng thái (Stateless & Event-driven): Service worker có thể bị trình duyệt hủy tiến trình bất kỳ lúc nào để tiết kiệm tài nguyên.
  - **Tuyệt đối không dùng `window`, `document`, hoặc lưu biến in-memory dài hạn**.
  - Đảm nhiệm quản lý Menu chuột phải (`chrome.contextMenus`), hành vi thanh bên (`chrome.sidePanel`), và điều phối luồng stream AI proxy tới tab thông qua `chrome.tabs.sendMessage`.
- **Side Panel (`src/pages/SidePanel.tsx`) & Options Page (`src/pages/Options.tsx`)**:
  - Chạy trong Extension Window Context hoàn toàn bảo mật và có đầy đủ quyền hạn `chrome.*`.
  - Side Panel phục vụ luồng chat liên tục, tự động cuộn mượt khi sinh văn bản (`scrollToBottom`).
  - Options Page mở toàn màn hình (`options.html`) quản lý cấu hình tập trung: API Keys, Provider, Model, Ngôn ngữ, và Thao tác nhanh (Custom Actions).
- **Giao Tiếp Tin Nhắn An Toàn (Safe Message Passing)**:
  - Mọi thao tác gửi message (`chrome.tabs.sendMessage`, `chrome.runtime.sendMessage`) bắt buộc phải bọc callback xử lý hoặc dập tắt lỗi an toàn khi tab chưa nạp xong script (`chrome.runtime.lastError`).

---

## 3. Mô Hình BYOK, Dữ Liệu & Nhà Cung Cấp AI (BYOK, Security & Storage Truth)
- **Nguồn Dữ Liệu Chân Lý Duy Nhất (Single Source of Truth - `chrome.storage.local`)**:
  - Mọi thông tin cấu hình (`apiKey`, `provider`, `modelId`, `appLanguage`, `sourceLanguage`, `targetLanguage`, `actions`, `showToolbar`) **bắt buộc đọc/ghi qua module chuẩn `storage` (`src/utils/storage.ts`)**.
  - Các thành phần giao diện bắt buộc lắng nghe sự kiện đồng bộ thời gian thực qua `storage.onSettingsChanged` để cập nhật tức thì khi cấu hình thay đổi từ tab khác.
- **Bảo Mật API Key Tuyệt Đối**:
  - Hoạt động thuần túy theo mô hình **BYOK (Bring Your Own Key)**: Không qua máy chủ trung gian, không thu thập dữ liệu người dùng.
  - **Tuyệt đối không gửi API Key ra bất kỳ server thứ ba nào** ngoài các endpoint chính thức của:
    - Google Gemini: `https://generativelanguage.googleapis.com`
    - OpenAI: `https://api.openai.com`
    - Anthropic Claude: `https://api.anthropic.com`
    - OpenRouter: `https://openrouter.ai`
  - **Tuyệt đối cấm** in API Key, Token, hoặc Headers nhạy cảm ra `console.log`.
- **Đặc Thù Nhà Cung Cấp (Provider Rules)**:
  - **Anthropic Claude**: Khi gọi trực tiếp từ extension client, **bắt buộc** phải kèm header `'anthropic-dangerous-direct-browser-access': 'true'`.
  - **Google Gemini**: Chuẩn hóa tin nhắn sang định dạng `{ role: 'user' | 'model', parts: [{ text }] }`, tách riêng tin nhắn hệ thống vào `systemInstruction`.
  - **OpenAI & OpenRouter**: Chuẩn hóa format Chat Completions với cờ `stream: true`. Với OpenRouter, đính kèm headers `'HTTP-Referer'` và `'X-Title'`.
  - Phân tích luồng Server-Sent Events (SSE) an toàn qua hàm `parseSSEStream`, xử lý chuẩn các dòng `data: [DONE]`.
- **Mô Hình Fallback Mặc Định (Model Fallback)**:
  - Luôn cấu hình model mặc định đáng tin cậy nếu người dùng chưa chọn model:
    - Gemini: `gemini-1.5-flash`
    - OpenAI: `gpt-4o-mini`
    - Claude: `claude-3-haiku-20240307`
    - OpenRouter: `meta-llama/llama-3.3-70b-instruct:free`

---

## 4. Chuẩn Hóa Bản Địa Hóa Đa Ngôn Ngữ (i18n & Prompt Template Parity)
- **Đồng Bộ 100% Ba Ngôn Ngữ (`vi`, `en`, `ja`)**:
  - Dự án hỗ trợ 3 ngôn ngữ cốt lõi: Tiếng Việt (`vi`), Tiếng Anh (`en`), và Tiếng Nhật (`ja`).
  - Khi thêm mới hoặc cập nhật bất kỳ nhãn UI, tooltip, tiêu đề, thông báo toast hay preset prompt nào, **bắt buộc phải cập nhật đồng bộ cho cả 3 ngôn ngữ** trong `src/utils/i18n.ts`:
    - `translations.vi`, `translations.en`, `translations.ja`
    - `defaultPromptsByLang.vi`, `defaultPromptsByLang.en`, `defaultPromptsByLang.ja`
  - Tuyệt đối không hardcode chuỗi text hiển thị vào file `.tsx`; luôn lấy qua hook/helper `getT(lang)`.
- **Bảo Vệ Biến Prompt (Prompt Variable Replacement)**:
  - Hệ thống hỗ trợ 5 biến chuẩn: `{text}`, `{TARGET_LANG}`, `{SOURCE_LANG}`, `{page_title}`, `{page_url}`.
  - Trước khi gửi prompt đến AI, bắt buộc thay thế sạch sẽ các biến. Nếu biến không có giá trị, phải xử lý fallback nhẹ nhàng, tuyệt đối không để nguyên cụm ký tự `{text}` thô gửi sang AI.

---

## 5. Quy Tắc CẤM Tuyệt Đối & Trải Nghiệm Người Dùng (Hard Constraints)
- **CẤM Chèn CSS Vào Trang Web Người Dùng**: Tuyệt đối không nhúng CSS trực tiếp vào `<head>` của trang web đang mở. Toàn bộ CSS bắt buộc gói gọn trong Shadow DOM.
- **CẤM Treo Tab Khi Tóm Tắt Toàn Trang (Mozilla Readability Guard)**:
  - Tính năng "Tóm tắt trang này" (`summarize-page`) bắt buộc clone document (`document.cloneNode(true)`) trước khi đưa vào `Readability` để không làm xáo trộn DOM trang web đang xem.
  - Bắt buộc giới hạn tối đa `15,000` ký tự text và bọc toàn bộ logic trong `try/catch`. Khi xảy ra lỗi đọc trang, phải hiển thị thông báo lỗi thân thiện, không được để crash content script.
- **CẤM Rò Rỉ Luồng Sinh Chữ (Streaming Abort & Memory Guard)**:
  - Khi người dùng đóng modal popup hoặc kích hoạt một thao tác mới trong lúc AI đang sinh text, phải hủy cờ `isGenerating` và ngắt việc nối chuỗi `chunk` vào state để tránh cập nhật state trên component đã unmount.
- **CẤM Dịch Tên Riêng, Nhãn Mô Hình & Thương Hiệu**:
  - Các tên gọi: `Lightning`, `Google Gemini`, `OpenAI`, `Anthropic Claude`, `BYOK`, `Side Panel`, `Options`, `Markdown`, `Chrome Extension`, và các mã model (`gemini-1.5-flash`, `gpt-4o-mini`, `claude-3-haiku...`) **bắt buộc giữ nguyên 100% tên gốc**, không dịch sang tiếng Việt hay tiếng Nhật.
- **Hiển Thị Markdown & Khối Mã (Code Snippets)**:
  - Khối mã lập trình phải render có tên ngôn ngữ và nút bấm Copy trực quan (`✓ Copied!`).
  - Mọi liên kết (`<a>`) trong markdown bắt buộc render kèm `target="_blank"` và `rel="noopener noreferrer"` để không điều hướng tab người dùng ngoài ý muốn.
