# TDD Breakdown Plan: Depth-Based Prompt Injection

## Architecture & Dependencies
- **Target Component:** `src/services/promptBuilder.ts`
- **Test File:** `tests/promptBuilder.test.ts`
- **Dependencies:** `buildChatMessages` depends on `buildSystemPrompt`. Lịch sử chat (History) và cấu hình `Character` được cung cấp từ tham số.

## Slice 1: Core Injection Logic cho `advancedPrompt`
Mục tiêu là tách `advancedPrompt` khỏi System Prompt gốc và đưa nó vào như một tin nhắn `system` độc lập ở vị trí cuối của History (Depth = 0).

### Phase 1: Test Setup (RED)
- **Hành động:** 
  1. Thêm một test case mới vào `tests/promptBuilder.test.ts` để mô phỏng một Character có chứa `advancedPrompt` và một History có 2 tin nhắn.
  2. Bổ sung `expect()` để kiểm tra xem mảng API messages trả về có chứa tin nhắn `advancedPrompt` ở ngay sau phần History hay không (trước tin nhắn mới của User).
  3. Cập nhật các test cũ của `buildSystemPrompt` để đảm bảo `advancedPrompt` KHÔNG CÒN xuất hiện trong System Prompt (index 0).
- **Trạng thái mong đợi:** Test sẽ thất bại (FAIL) do logic hiện tại đang nhét `advancedPrompt` vào System Prompt ở index 0, và mảng history không có chèn thêm tin nhắn nào cả.

### Phase 2: Implementation (GREEN)
- **Hành động:** 
  1. Xóa `section('Advanced Prompt', advancedPrompt)` khỏi hàm `buildSystemPrompt`.
  2. Trong hàm `buildChatMessages`, sau khi gộp `recentHistory`, kiểm tra xem `character.advancedPrompt` có tồn tại không.
  3. Nếu có, sử dụng chuỗi nội dung đó (đã qua `replacePlaceholders`) và gán cho nó `role: 'system'`.
  4. Chèn tin nhắn này vào ngay dưới cùng của mảng History bằng lệnh mảng cơ bản (VD: dùng `.splice` nếu muốn linh hoạt với các Depth khác sau này, hoặc push trực tiếp trước khi push `userMessage`).
- **Trạng thái mong đợi:** Chạy lại `npm test` và tất cả các test case đều phải Pass (PASS).

### Phase 3: Refactor (REFACTOR)
- **Hành động:**
  1. Định nghĩa rõ ràng interface `InjectedPrompt` (nếu cần thiết để chuẩn bị cho việc chèn mảng theo `depth` trong tương lai).
  2. Dọn dẹp code, loại bỏ biến thừa.
- **Verification:** Chạy lại toàn bộ bộ test để đảm bảo không có logic nào bị vỡ.

---

## Checkpoints
- **[Checkpoint 1]** Hoàn thành RED (viết test thất bại).
- **[Checkpoint 2]** Hoàn thành GREEN & REFACTOR (code pass, cấu trúc gọn).
- **[Checkpoint 3]** Manual Verification (chạy app thử chat xem payload API).
