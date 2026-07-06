# Todo: Sprint - Quản lý LLM Profiles

- [x] **Phase 1: Database Types & Model Service (TDD)**
  - [x] Task 1.1: Cập nhật kiểu dữ liệu AiModelProfile (topP, repetitionPenalty) và sửa mock tests.
  - [x] Task 1.2: Cấu hình default migration trong modelService.ts.
- [x] **Phase 2: UI Style Refactoring (Vanilla CSS Conversion)**
  - [x] Task 2.1: Refactor ModelForm.tsx & ModelList.tsx gỡ Tailwind, chuyển sang Vanilla CSS và thêm topP/repetitionPenalty inputs.
  - [x] Task 2.2: Refactor ModelManagementTab.tsx và tích hợp vào SettingsModal.tsx.
- [x] **Phase 3: Chat Integration & Verification (TDD)**
  - [x] Task 3.1: Cài đặt logic tính toán effectiveSettings từ Default Model Profile trong App.tsx.
  - [x] Task 3.2: Kiểm thử tự động logic tích hợp và chạy lại toàn bộ test suite.
