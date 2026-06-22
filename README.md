# Roleplay AI Chat

Một ứng dụng trò chuyện AI nhập vai (Roleplay AI) hoàn toàn chạy trên trình duyệt, không cần backend phức tạp. Dữ liệu được lưu cục bộ an toàn trong trình duyệt của bạn thông qua **IndexedDB**. Ứng dụng hỗ trợ kết nối tới các LLM Provider tương thích với OpenAI API (như OpenRouter, Ollama, OpenAI) và cho phép người dùng **import trực tiếp ảnh Character Card (.png, .json)**.

## Tính năng chính

- **Local-first**: Không có backend lưu trữ tin nhắn. Toàn bộ lịch sử chat và nhân vật nằm trong IndexedDB trên thiết bị của bạn. Quyền riêng tư 100%.
- **OpenAI-compatible**: Dễ dàng sử dụng bất kỳ nhà cung cấp AI nào có API giống OpenAI (OpenRouter, Ollama, LM Studio...).
- **Real-time Streaming**: Trải nghiệm cảm giác AI đang "gõ" từng chữ theo thời gian thực (Server-Sent Events). Có thể ấn Stop bất cứ lúc nào để ngắt.
- **Character Card Import**: Kéo thả ảnh định dạng `TavernPNG / V2` hoặc file `.json` để thêm nhân vật cực nhanh.
- **UI/UX hiện đại**: Giao diện đẹp mắt, Responsive, tự động cuộn xuống khi có tin nhắn mới, hỗ trợ **Markdown** (In đậm, in nghiêng cho hành động nhân vật).

---

## Hướng dẫn cài đặt và khởi chạy

Dự án sử dụng **React, Vite và TypeScript**. Trình quản lý package được khuyên dùng là `pnpm`.

### Yêu cầu hệ thống

- Node.js (phiên bản 18+ khuyến nghị)
- `pnpm` (Nếu chưa cài: `npm install -g pnpm`)

### Các bước chạy dự án:

1. Clone repo này về máy.
2. Mở terminal tại thư mục gốc của dự án.
3. Cài đặt các gói phụ thuộc:
    ```bash
    pnpm install
    ```
4. Khởi chạy môi trường phát triển:
    ```bash
    pnpm run dev
    ```
5. Truy cập ứng dụng tại đường dẫn hiển thị trên terminal (thường là `http://localhost:5173`).

---

## Hướng dẫn cấu hình API Key (Ví dụ: OpenRouter)

Để AI có thể phản hồi, bạn cần cấu hình API Key từ một nhà cung cấp. Khuyến nghị sử dụng **OpenRouter** vì họ có rất nhiều mô hình xịn và rẻ (kể cả miễn phí).

1. Truy cập [OpenRouter](https://openrouter.ai/) và tạo tài khoản.
2. Nạp tiền hoặc sử dụng các mô hình miễn phí (ví dụ: `google/gemini-2.5-flash:free`, `meta-llama/llama-3-8b-instruct:free`).
3. Truy cập phần **Keys** và tạo một API Key mới. Copy đoạn mã đó.
4. Mở ứng dụng **Roleplay AI Chat**.
5. Nhấn vào nút **Settings** (biểu tượng bánh răng) ở góc dưới cùng bên trái.
6. Điền các thông tin:
    - **Provider**: Chọn `OpenRouter`
    - **API Key**: Dán Key vừa copy vào đây.
    - **Model Name**: Tên mô hình (vd: `google/gemini-2.5-flash:free`).
7. Nhấn **Lưu cấu hình**. Bây giờ bạn đã sẵn sàng chat!

---

## 📥 Hướng dẫn Import Character Card

Có hai cách để thêm nhân vật AI vào để chat:

### Cách 1: Tự tạo bằng tay

1. Nhấn nút **+ New Character** ở thanh Sidebar bên trái.
2. Điền đầy đủ Tên, Avatar, Bối cảnh (Scenario), Tính cách (Personality) và Tin nhắn mở đầu.
3. Nhấn **Save**.

### Cách 2: Import nhanh từ mạng (.png / .json)

Bạn có thể lên các trang chia sẻ nhân vật như `chub.ai`, `janitorai` để tải ảnh nhân vật về máy.

1. Nhấn nút **Import** ở thanh Sidebar bên trái.
2. Kéo thả file ảnh `.png` (chứa dữ liệu Tavern/V2) hoặc file `.json` vào vùng Import.
3. Hệ thống sẽ tự động trích xuất Tên, Bối cảnh, Mô tả... Bạn có thể xem trước nội dung.
4. Nhấn **Import Character** và bắt đầu chat ngay lập tức!

---

## 🛠 Tech Stack

- **Framework**: React 19 + Vite
- **Ngôn ngữ**: TypeScript
- **Lưu trữ**: IndexedDB (thư viện `idb`)
- **Render UI**: `react-markdown` (hỗ trợ Markdown)
- **CSS**: Vanilla CSS kết hợp BEM-like convention
- **Code Quality**: ESLint, Vitest

---

_Chúc bạn có những cuộc trò chuyện thú vị!_
