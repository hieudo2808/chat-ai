# Spec: Quản lý LLM Profiles & Tích hợp Chat Settings (Sprint 8)

## Objective

Xây dựng tính năng **Quản lý cấu hình LLM (Model Profiles)**. Cho phép người dùng lưu trữ nhiều thông số kết nối (API Key, Base URL, Tên Model, Hyperparameters như Temperature, Max Tokens, Top P, Repetition Penalty) bên trong Cài đặt hệ thống. Người dùng có thể chỉ định một cấu hình làm mặc định để sử dụng toàn cục cho các cuộc trò chuyện.

## Project Structure

Tái cấu trúc và tích hợp các component có sẵn trong `src/features/models`:

```text
src/
  features/
    models/
      components/
        ModelForm.tsx           → Form nhập thông tin model (chuyển sang Vanilla CSS, thêm Top P/Repetition Penalty)
        ModelList.tsx           → Danh sách các model profile (chuyển sang Vanilla CSS)
        ModelManagementTab.tsx  → Tab điều phối list/create/edit (chuyển sang Vanilla CSS)
      hooks/
        useModelProfiles.ts     → Hook quản lý state IndexedDB cho models
      services/
        modelService.ts         → Logic CRUD IndexedDB cho models & di trú từ settings cũ
```

## Tech Stack

- **Frontend**: React, TypeScript, IndexedDB (`idb` library).
- **Styling**: Vanilla CSS (tích hợp trong `SettingsModal.css`), không phụ thuộc vào Tailwind CSS hay inline styles.

## Commands

- Run Unit & Integration Tests: `pnpm test`
- Run Dev Mode: `pnpm run dev`
- Build Application: `pnpm run build`

## Code Style

Ví dụ về kiểu dữ liệu mở rộng cho `AiModelProfile` và logic gộp trong `App.tsx`:

```typescript
// types/index.ts
export type AiModelProfile = {
    id: string;
    name: string;
    provider: 'openai' | 'openrouter' | 'ollama' | 'lmstudio' | 'custom';
    baseUrl: string;
    apiKey?: string;
    modelName: string;
    temperature: number;
    maxTokens: number;
    topP?: number;
    repetitionPenalty?: number;
    supportsStreaming: boolean;
    supportsJsonMode: boolean;
    isDefault: boolean;
    createdAt: number;
    updatedAt: number;
} & Partial<SyncMeta>;
```

## Testing Strategy

Áp dụng phương pháp Test-Driven Development (TDD):
- Viết unit tests chứng minh logic `effectiveSettings` cập nhật đúng đắn theo default model profile đang chọn.
- Chạy toàn bộ test suite để đảm bảo không xảy ra lỗi hồi quy (regression tests).

## Boundaries

- **Always (Luôn luôn)**:
  - Sử dụng database IndexedDB store `models` làm nguồn lưu trữ chính thức cho các profiles.
  - Sử dụng hoàn toàn Vanilla CSS cho các UI components mới/sửa đổi.
- **Ask first (Hỏi ý kiến trước)**:
  - Thay đổi cấu trúc schema của store `models` nếu có phát sinh trường dữ liệu mới ngoài mong đợi.
- **Never (Không bao giờ)**:
  - Không được hardcode API key hay thông số cấu hình cụ thể trong mã nguồn.
  - Không cho phép xóa model profile duy nhất hoặc model đang được đặt làm mặc định (trừ khi có từ 2 model trở lên).
