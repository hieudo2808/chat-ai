# New Direction Roadmap (Chat AI)

## 1. Mục tiêu sản phẩm mới
Chuyển đổi dự án từ một ứng dụng Frontend-only Dating Sim phức tạp sang ứng dụng **Chat AI Roleplay 1-1 tinh gọn hơn**, với cấu trúc **Backend Proxy + Local-first**.
- Trọng tâm kỹ thuật: **Streaming JSON** cho tính năng AI Character Generation (Tạo nhân vật tự động từ 1 câu prompt).
- Nền tảng Backend: Cloudflare Workers.

## 2. Lộ trình phát triển (8 Sprint)

- **Sprint 0: Khảo sát & Đóng băng Baseline.** (Hoàn thành)
- **Sprint 1: Cloudflare Worker + Guest Login.** Tạo backend tối thiểu, endpoint `/auth/guest`, cấp JWT.
- **Sprint 2: Chat Stream qua Backend.** Đưa luồng `useChat` hiện tại chuyển proxy sang Backend thay vì gọi trực tiếp Provider.
- **Sprint 3: Streaming JSON Core.** Tính năng cốt lõi: Backend sinh NDJSON (Newline Delimited JSON) theo từng token trả về. Frontend đọc stream và parse thành JSON state dần dần.
- **Sprint 4: AI Character Generation UX.** Hoàn thiện giao diện tạo nhân vật bằng Idea (Prompt). Form tự động điền (auto-fill), xử lý ngắt/lỗi mạng (giữ partial data).
- **Sprint 5: Model Management.** Mở rộng tính năng settings, cho phép lưu nhiều Model Profiles (OpenRouter, Ollama...).
- **Sprint 6: Lưu Server + Sync Cơ bản.** Đẩy dữ liệu Characters/Messages từ IndexedDB lên Backend lưu trữ vĩnh viễn.
- **Sprint 7: Offline-first Nâng cao.** Kết hợp React Query (TanStack) chạy chế độ offline-first, tự đồng bộ khi có mạng.

## 3. Rủi ro Kỹ thuật Chính
- **Streaming JSON Parsing:** Dữ liệu JSON bị cắt vỡ (chunked) rất dễ gây parse lỗi nếu dùng `JSON.parse`. Yêu cầu dùng Event-stream (NDJSON) để map chính xác từng Object/Field.
- **Đồng bộ State UI khi Stream:** Render hàng chục updates mỗi giây có thể gây giật lag (re-render) mạnh ở phía UI, cần tối ưu Component.
- **Xử lý Partial Save:** Ngắt kết nối mạng giữa chừng không được làm mất dữ liệu đã stream được. Phải giữ nguyên "Bản nháp" cho người dùng tiếp tục thao tác.
