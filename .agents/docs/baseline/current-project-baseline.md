# Current Project Baseline (Sprint 0)

## 1. Project hiện tại làm gì?
Dự án là một Web App dạng AI Roleplay Chatbot, chạy hoàn toàn dưới dạng Local-first (frontend-only). Cho phép người dùng:
- Nhập Character Card (từ định dạng ảnh PNG hoặc JSON).
- Tạo thẻ nhân vật thủ công.
- Lưu trữ dữ liệu chat và nhân vật vào `IndexedDB`.
- Cấu hình thông số API (Base URL, API Key, LLM Provider).
- Thực hiện chat 1-1 với nhân vật bằng cơ chế stream trực tiếp từ Client tới LLM Provider.

## 2. Tech Stack hiện tại
- **Framework:** React 19, Vite.
- **Language:** TypeScript.
- **Styling:** CSS cơ bản (tự build).
- **Storage:** IndexedDB (thư viện `idb`).
- **Testing:** Đã tích hợp sẵn Vitest (tuy chưa có bài test logic nào).

## 3. Cấu trúc thư mục (Nổi bật)
- `src/features/chat`: Xử lý giao diện và logic gửi tin nhắn. Hook `useChat.ts` quản lý state của đoạn chat, stream chunk, và auto-save vào IndexedDB.
- `src/features/characters`: Quản lý danh sách, chỉnh sửa, import character.
- `src/features/settings`: Xử lý configuration của user (API Key, Model name).
- `src/services`: Tách logic tương tác ra (MessageService, CharacterService, PromptBuilder, LLMClient).

## 4. Các vấn đề hiện tại (Technical Debt)
1. **Lộ API Key & Bảo mật yếu:** Client gọi trực tiếp LLM Provider, API Key lưu ở Frontend gây rủi ro nếu public.
2. **Coupling trong UseChat:** Hook `useChat.ts` xử lý quá nhiều việc (lưu DB, gọi AI, xử lý error code 503, cập nhật chunk stream).
3. **Cấu hình Model:** Hiện tại chỉ cho phép config 1 setting duy nhất cho toàn bộ hệ thống, không có khái niệm "Model Profiles" đa nền tảng.
4. **Không có Backend:** Giới hạn khả năng scale, tính năng stream dữ liệu có cấu trúc, đồng bộ hoá dữ liệu giữa các máy.
5. **Chưa có cấu trúc TDD rõ ràng:** Có Vitest nhưng chưa được áp dụng.

## 5. Kế hoạch Refactor (cho các Sprint sau)
- **Giữ lại:** Giao diện cơ bản (Chat, Sidebar), kho lưu trữ `IndexedDB` để làm nền cho Offline-First.
- **Thay mới / Refactor:** 
  - `src/services/llmClient.ts` sẽ bị thay thế. Các request chat sẽ được đẩy về Cloudflare Worker.
  - Chuyển logic stream parsing thành NDJSON stream parsing cho Character Generation.
  - Bổ sung xác thực "Guest Login".
