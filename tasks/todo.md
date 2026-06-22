# TODO: TDD Prompt Injection

- [x] Viết test mô phỏng `buildChatMessages` với `advancedPrompt` ở `tests/promptBuilder.test.ts`. Xác minh test đang báo lỗi (RED).
- [x] Xóa `advancedPrompt` khỏi logic của `buildSystemPrompt`.
- [x] Implement logic trích xuất `advancedPrompt` và chèn vào cuối mảng History ở `buildChatMessages`. (GREEN)
- [x] Chạy lại `npm test` và đảm bảo toàn bộ pass (kể cả những test cũ về history size limit hay system format).
- [x] Refactor: Tổ chức cấu trúc code trong `promptBuilder.ts` rõ ràng hơn, định nghĩa Interface InjectedPrompt nếu thấy mã đang rối.
- [ ] Manual test qua giao diện.
