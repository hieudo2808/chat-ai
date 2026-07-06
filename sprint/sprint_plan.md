# Kế hoạch Sprint (Chat AI)

Dựa trên yêu cầu chia nhỏ dự án thành các giai đoạn để dễ kiểm soát và demo, dự án sẽ được chạy theo 8 Sprint (từ 0 đến 7) bám sát các Milestone thiết kế kỹ thuật:

| Sprint   | Mục tiêu chính                         | Kết quả demo được                              |
| -------- | -------------------------------------- | ---------------------------------------------- |
| Sprint 0 | Chốt scope, chạy lại repo cũ           | App cũ chạy ổn, biết phần nào giữ              |
| Sprint 1 | Backend Cloudflare Worker + Guest Auth | Bấm “Log in as Guest” nhận JWT                 |
| Sprint 2 | Chuyển chat stream qua backend         | Chat roleplay vẫn stream được nhưng qua server |
| Sprint 3 | Streaming JSON core                    | Backend stream JSON/NDJSON, frontend đọc được  |
| Sprint 4 | UX tạo nhân vật bằng AI                | Nhập idea → form tự fill dần                   |
| Sprint 5 | Model management                       | Thêm/sửa/chọn model AI                         |
| Sprint 6 | Lưu server + sync cơ bản               | Character lưu local + server                   |
| Sprint 7 | Offline-first nâng cao                 | Offline vẫn xem/sửa được, online thì sync      |
