# Sprint 5 — Model Management

## 1. Mục tiêu Sprint

Sprint 5 tập trung xây dựng tính năng **quản lý model AI** để người dùng có thể thêm, sửa, xóa, chọn và kiểm tra các model dùng cho chat roleplay và tạo nhân vật bằng AI.

Sau sprint này, ứng dụng không còn phụ thuộc vào một cấu hình model duy nhất trong Settings. Thay vào đó, hệ thống có khái niệm **Model Profile**, cho phép quản lý nhiều model khác nhau.

Ví dụ:

```txt id="0q9je5"
OpenRouter - Gemini Flash
OpenRouter - Claude Sonnet
OpenAI - GPT model
Local - Ollama
Local - LM Studio
Custom OpenAI-compatible endpoint
```

Model profile sẽ được dùng ở hai luồng chính:

```txt id="om9z3s"
1. Chat với nhân vật
2. Generate character bằng AI
```

---

## 2. Bối cảnh

Ở các sprint trước, hệ thống đã có:

```txt id="rzgoe2"
Sprint 1:
  - Cloudflare Worker backend
  - Guest login
  - JWT authentication

Sprint 2:
  - Chat stream qua backend

Sprint 3:
  - Streaming JSON / NDJSON core

Sprint 4:
  - UX tạo nhân vật bằng AI
  - Auto-fill form theo stream
```

Tuy nhiên, model AI hiện tại vẫn còn đơn giản. App có thể đang chỉ lưu một bộ cấu hình như:

```txt id="28yajy"
apiKey
baseUrl
modelName
temperature
maxTokens
```

Cách này không đủ tốt cho sản phẩm lâu dài vì:

```txt id="9q8lvc"
- Không quản lý được nhiều model.
- Không chọn model riêng cho chat/generate.
- Không test được model trước khi dùng.
- Không phân biệt provider.
- Khó mở rộng khi có backend/server storage.
```

Sprint 5 sẽ chuẩn hóa phần này thành **Model Profile Management**.

---

## 3. Phạm vi công việc

### 3.1. Trong phạm vi Sprint 5

Sprint này bao gồm:

- Thiết kế entity `AiModelProfile`.
- Tạo UI quản lý model.
- Thêm model profile.
- Sửa model profile.
- Xóa model profile.
- Set default model.
- Test connection model.
- Chọn model khi chat.
- Chọn model khi generate character.
- Lưu model profile local bằng IndexedDB.
- Chuẩn bị API backend cho model profile nếu có server storage.
- Migrate settings cũ sang model profile mặc định nếu cần.

### 3.2. Ngoài phạm vi Sprint 5

Sprint này chưa làm:

- Mã hóa API key server-side đầy đủ.
- Billing/quota theo user.
- Rate limit nâng cao.
- Model marketplace.
- Auto fetch model list từ provider.
- Fine-tuning.
- Multi-user sharing model profile.
- Sync/offline-first hoàn chỉnh.
- Server storage bắt buộc cho model profile.
- Secret vault nghiêm túc cho production.

---

## 4. User Stories

## Story 1 — Thêm model profile

```txt id="xizs51"
Là người dùng,
tôi muốn thêm một model AI mới,
để sử dụng model đó cho chat hoặc tạo nhân vật.
```

Acceptance Criteria:

```txt id="zwwb1z"
- User mở được màn Models.
- User bấm Add Model.
- User nhập name, provider, baseUrl, modelName.
- User nhập temperature và maxTokens.
- User lưu được model profile.
- Model mới xuất hiện trong danh sách.
```

---

## Story 2 — Sửa model profile

```txt id="b4am4b"
Là người dùng,
tôi muốn chỉnh sửa cấu hình model,
để thay đổi endpoint, model name hoặc tham số sinh phản hồi.
```

Acceptance Criteria:

```txt id="fauzx7"
- User chọn một model profile.
- User sửa được thông tin.
- User lưu thay đổi.
- Thông tin mới được cập nhật.
- Các luồng chat/generate dùng cấu hình mới.
```

---

## Story 3 — Set default model

```txt id="h2spew"
Là người dùng,
tôi muốn chọn một model làm mặc định,
để app tự dùng model đó nếu tôi không chọn model cụ thể.
```

Acceptance Criteria:

```txt id="ahd8cy"
- User bấm Set as Default.
- Chỉ có một model default tại một thời điểm.
- Chat dùng default model nếu không chọn model khác.
- Generate character dùng default model nếu không chọn model khác.
```

---

## Story 4 — Test connection

```txt id="py9l2p"
Là người dùng,
tôi muốn kiểm tra model có gọi được không,
để biết cấu hình API có đúng trước khi dùng.
```

Acceptance Criteria:

```txt id="xgahje"
- User bấm Test Connection.
- Hệ thống gửi request test tới backend.
- Backend gọi thử provider/model.
- UI hiển thị success hoặc error.
- Không làm crash app nếu API key/baseUrl/model sai.
```

---

## Story 5 — Chọn model khi chat

```txt id="n7hx8e"
Là người dùng,
tôi muốn chọn model AI cho từng phiên chat,
để linh hoạt dùng model nhanh/rẻ/mạnh tùy nhu cầu.
```

Acceptance Criteria:

```txt id="23453c"
- Chat UI có model selector.
- User chọn được model profile.
- Request /chat/stream gửi kèm modelProfileId.
- Backend dùng đúng model đó.
```

---

## Story 6 — Chọn model khi tạo nhân vật

```txt id="kh0ggp"
Là người dùng,
tôi muốn chọn model khi generate character,
để dùng model phù hợp cho việc tạo dữ liệu có cấu trúc.
```

Acceptance Criteria:

```txt id="4ay855"
- Create Character with AI có model selector.
- User chọn được model profile.
- Request /generate-character/stream gửi kèm modelProfileId.
- Backend dùng đúng model đó.
```

---

## 5. Entity Design

## 5.1. `AiModelProfile`

```ts id="a1ccqg"
type AiModelProfile = {
    id: string;
    name: string;

    provider: 'openai' | 'openrouter' | 'ollama' | 'lmstudio' | 'custom';

    baseUrl: string;
    apiKey?: string;
    modelName: string;

    temperature: number;
    maxTokens: number;

    supportsStreaming: boolean;
    supportsJsonMode: boolean;

    isDefault: boolean;

    createdAt: string;
    updatedAt: string;
};
```

---

## 5.2. Field giải thích

| Field               | Kiểu      | Ý nghĩa                                  |
| ------------------- | --------- | ---------------------------------------- |
| `id`                | `string`  | ID nội bộ của model profile              |
| `name`              | `string`  | Tên hiển thị cho người dùng              |
| `provider`          | `string`  | Provider/model backend                   |
| `baseUrl`           | `string`  | Endpoint OpenAI-compatible               |
| `apiKey`            | `string`  | API key nếu dùng user-provided key       |
| `modelName`         | `string`  | Tên model thật gửi tới provider          |
| `temperature`       | `number`  | Độ sáng tạo của response                 |
| `maxTokens`         | `number`  | Giới hạn token output                    |
| `supportsStreaming` | `boolean` | Model/provider có hỗ trợ stream không    |
| `supportsJsonMode`  | `boolean` | Model/provider có hỗ trợ JSON mode không |
| `isDefault`         | `boolean` | Có phải model mặc định không             |
| `createdAt`         | `string`  | Thời điểm tạo                            |
| `updatedAt`         | `string`  | Thời điểm cập nhật                       |

---

## 5.3. Giá trị mặc định

Khi tạo model mới:

```ts id="0nkycp"
const defaultModelProfile = {
    provider: 'openrouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    temperature: 0.8,
    maxTokens: 1200,
    supportsStreaming: true,
    supportsJsonMode: false,
    isDefault: false,
};
```

Với local model:

```txt id="l1gfeb"
Ollama:
  baseUrl = http://localhost:11434/v1

LM Studio:
  baseUrl = http://localhost:1234/v1
```

---

## 6. Data Storage

## 6.1. Lưu local trước

Trong Sprint 5, có thể tiếp tục lưu model profile vào IndexedDB.

Store đề xuất:

```txt id="q2olje"
model_profiles
```

Nếu DB hiện tại chưa có store này, cần migration schema.

---

## 6.2. Migration từ settings cũ

Nếu app cũ đang có settings dạng:

```ts id="jgggrf"
type Settings = {
    apiKey: string;
    baseUrl: string;
    modelName: string;
    temperature: number;
    maxTokens: number;
};
```

Cần migrate thành model profile mặc định:

```ts id="x6zkgc"
const migratedProfile: AiModelProfile = {
    id: 'model_default',
    name: 'Default Model',
    provider: 'custom',
    baseUrl: settings.baseUrl,
    apiKey: settings.apiKey,
    modelName: settings.modelName,
    temperature: settings.temperature,
    maxTokens: settings.maxTokens,
    supportsStreaming: true,
    supportsJsonMode: false,
    isDefault: true,
    createdAt: now,
    updatedAt: now,
};
```

Quy tắc:

```txt id="an4v4w"
- Nếu đã có model profile thì không migrate lại.
- Nếu settings cũ có modelName/baseUrl thì tạo default profile.
- Nếu settings cũ rỗng thì tạo profile mẫu hoặc để user tự thêm.
```

---

## 7. Backend API Design

Sprint 5 có thể làm backend API nếu đã sẵn sàng. Nếu chưa có server storage, frontend có thể lưu local trước nhưng vẫn nên thiết kế API.

## 7.1. Endpoint đề xuất

```txt id="66wqd8"
GET    /models
POST   /models
GET    /models/:id
PUT    /models/:id
DELETE /models/:id
POST   /models/:id/test
```

Tất cả endpoint cần JWT:

```http id="b8bbxv"
Authorization: Bearer <jwt_token>
```

---

## 7.2. `GET /models`

Lấy danh sách model profile của user.

Response:

```json id="tsse6w"
{
    "models": [
        {
            "id": "model_abc",
            "name": "OpenRouter Gemini Flash",
            "provider": "openrouter",
            "baseUrl": "https://openrouter.ai/api/v1",
            "modelName": "google/gemini-flash",
            "temperature": 0.8,
            "maxTokens": 1200,
            "supportsStreaming": true,
            "supportsJsonMode": false,
            "isDefault": true,
            "createdAt": "2026-07-02T00:00:00.000Z",
            "updatedAt": "2026-07-02T00:00:00.000Z"
        }
    ]
}
```

Lưu ý:

```txt id="2c6bbo"
Không trả apiKey thô về frontend nếu API key được lưu server-side.
```

---

## 7.3. `POST /models`

Tạo model profile mới.

Request:

```json id="4xii91"
{
    "name": "OpenRouter Gemini Flash",
    "provider": "openrouter",
    "baseUrl": "https://openrouter.ai/api/v1",
    "apiKey": "<api_key>",
    "modelName": "google/gemini-flash",
    "temperature": 0.8,
    "maxTokens": 1200,
    "supportsStreaming": true,
    "supportsJsonMode": false,
    "isDefault": true
}
```

Response:

```json id="nl6vev"
{
    "model": {
        "id": "model_abc",
        "name": "OpenRouter Gemini Flash",
        "provider": "openrouter",
        "baseUrl": "https://openrouter.ai/api/v1",
        "modelName": "google/gemini-flash",
        "temperature": 0.8,
        "maxTokens": 1200,
        "supportsStreaming": true,
        "supportsJsonMode": false,
        "isDefault": true,
        "createdAt": "2026-07-02T00:00:00.000Z",
        "updatedAt": "2026-07-02T00:00:00.000Z"
    }
}
```

---

## 7.4. `PUT /models/:id`

Cập nhật model profile.

Request:

```json id="fug9gx"
{
    "name": "OpenRouter Claude",
    "modelName": "anthropic/claude-sonnet",
    "temperature": 0.7,
    "maxTokens": 1600,
    "isDefault": true
}
```

Response:

```json id="bdui63"
{
    "model": {
        "id": "model_abc",
        "name": "OpenRouter Claude",
        "provider": "openrouter",
        "baseUrl": "https://openrouter.ai/api/v1",
        "modelName": "anthropic/claude-sonnet",
        "temperature": 0.7,
        "maxTokens": 1600,
        "supportsStreaming": true,
        "supportsJsonMode": false,
        "isDefault": true,
        "createdAt": "2026-07-02T00:00:00.000Z",
        "updatedAt": "2026-07-02T00:10:00.000Z"
    }
}
```

---

## 7.5. `DELETE /models/:id`

Xóa model profile.

Response:

```json id="ztvnu4"
{
    "ok": true
}
```

Quy tắc:

```txt id="nyjpus"
- Không cho xóa model default nếu vẫn còn model khác mà chưa chọn default mới.
- Hoặc nếu xóa default, tự set model còn lại đầu tiên làm default.
- Nếu chỉ còn một model, có thể cho xóa nhưng app phải hiển thị trạng thái chưa có model.
```

---

## 7.6. `POST /models/:id/test`

Kiểm tra model có gọi được không.

Request:

```json id="2sygjb"
{
    "prompt": "Say hello in one short sentence."
}
```

Response thành công:

```json id="hextvt"
{
    "ok": true,
    "message": "Model connection successful.",
    "sample": "Hello! How can I help?"
}
```

Response lỗi:

```json id="5b818x"
{
    "ok": false,
    "error": {
        "code": "MODEL_TEST_FAILED",
        "message": "Could not connect to the selected model."
    }
}
```

---

## 8. Frontend Structure

Tạo module:

```txt id="4ps59t"
src/
  features/
    models/
      components/
        ModelManagementPage.tsx
        ModelList.tsx
        ModelForm.tsx
        ModelCard.tsx
        ModelSelector.tsx
        ModelTestButton.tsx
      hooks/
        useModelProfiles.ts
      services/
        modelApi.ts
      state/
        modelProfileStore.ts
      types.ts
```

---

## 9. Frontend Tasks

## Task 1 — Tạo `ModelManagementPage`

File:

```txt id="c58zfm"
src/features/models/components/ModelManagementPage.tsx
```

Nhiệm vụ:

```txt id="81uoyu"
- Là màn hình chính quản lý model.
- Hiển thị danh sách model profile.
- Có nút Add Model.
- Có trạng thái empty nếu chưa có model.
- Cho chọn model để sửa/xóa/test.
```

UI đề xuất:

```txt id="5cmr3g"
Models

[Add Model]

Default:
OpenRouter Gemini Flash

All Models:
- OpenRouter Gemini Flash     [Default] [Edit] [Test] [Delete]
- Local Ollama                [Edit] [Test] [Delete]
- LM Studio                   [Edit] [Test] [Delete]
```

---

## Task 2 — Tạo `ModelList`

File:

```txt id="qmwj42"
src/features/models/components/ModelList.tsx
```

Props:

```ts id="licmay"
type ModelListProps = {
    models: AiModelProfile[];
    selectedModelId?: string;
    onEdit: (modelId: string) => void;
    onDelete: (modelId: string) => void;
    onSetDefault: (modelId: string) => void;
    onTest: (modelId: string) => void;
};
```

Yêu cầu:

```txt id="abpf8f"
- Hiển thị tên model.
- Hiển thị provider.
- Hiển thị modelName.
- Hiển thị badge Default nếu isDefault = true.
- Có action Edit/Test/Delete/Set Default.
```

---

## Task 3 — Tạo `ModelForm`

File:

```txt id="vfuwmc"
src/features/models/components/ModelForm.tsx
```

Field:

```txt id="9e9awo"
- name
- provider
- baseUrl
- apiKey
- modelName
- temperature
- maxTokens
- supportsStreaming
- supportsJsonMode
- isDefault
```

Props:

```ts id="99dzke"
type ModelFormProps = {
    initialValue?: AiModelProfile;
    mode: 'create' | 'edit';
    onSubmit: (value: AiModelProfileInput) => void;
    onCancel: () => void;
};
```

Validation:

```txt id="iygn0u"
- name không được rỗng.
- provider bắt buộc.
- baseUrl không được rỗng.
- modelName không được rỗng.
- temperature từ 0 đến 2.
- maxTokens lớn hơn 0.
```

---

## Task 4 — Provider presets

Khi user chọn provider, tự gợi ý base URL:

```txt id="pswc7c"
openai:
  https://api.openai.com/v1

openrouter:
  https://openrouter.ai/api/v1

ollama:
  http://localhost:11434/v1

lmstudio:
  http://localhost:1234/v1

custom:
  user tự nhập
```

Không bắt buộc modelName tự động, nhưng có thể placeholder:

```txt id="w27i5b"
OpenRouter example: google/gemini-flash
Ollama example: llama3.1
LM Studio example: local-model
```

---

## Task 5 — Tạo `ModelSelector`

File:

```txt id="q4sc8q"
src/features/models/components/ModelSelector.tsx
```

Dùng ở:

```txt id="xz9rjr"
- Chat UI
- Create Character with AI UI
```

Props:

```ts id="byje7v"
type ModelSelectorProps = {
    models: AiModelProfile[];
    value?: string;
    onChange: (modelId: string) => void;
    disabled?: boolean;
};
```

Behavior:

```txt id="gh41pu"
- Nếu chưa chọn gì, dùng default model.
- Nếu không có model nào, hiển thị warning.
- Khi đang stream, selector disabled.
```

UI:

```txt id="3lwpiv"
Model: [OpenRouter Gemini Flash v]
```

---

## Task 6 — Tạo `ModelTestButton`

File:

```txt id="doxxhe"
src/features/models/components/ModelTestButton.tsx
```

Behavior:

```txt id="4v8q28"
User bấm Test
  -> gọi /models/:id/test hoặc test local config
  -> loading
  -> success/fail
```

Trạng thái UI:

```txt id="tpp839"
Testing...
Connection successful.
Connection failed: invalid API key.
Connection failed: model not found.
```

---

## Task 7 — Tạo hook `useModelProfiles`

File:

```txt id="1x6w9x"
src/features/models/hooks/useModelProfiles.ts
```

Hook quản lý:

```txt id="qgn4yx"
- Load model profiles
- Create model
- Update model
- Delete model
- Set default model
- Test model
- Get default model
```

API đề xuất:

```ts id="j2l8nw"
type UseModelProfilesResult = {
    models: AiModelProfile[];
    defaultModel?: AiModelProfile;
    status: 'idle' | 'loading' | 'ready' | 'error';
    error?: string;

    createModel: (input: AiModelProfileInput) => Promise<void>;
    updateModel: (id: string, input: Partial<AiModelProfileInput>) => Promise<void>;
    deleteModel: (id: string) => Promise<void>;
    setDefaultModel: (id: string) => Promise<void>;
    testModel: (id: string) => Promise<ModelTestResult>;
};
```

---

## Task 8 — Tích hợp vào Chat UI

Ở Chat UI, thêm model selector.

Luồng:

```txt id="rcnezn"
User chọn model
  -> selectedModelId lưu vào chat state hoặc settings
  -> gửi modelProfileId trong /chat/stream
```

Request `/chat/stream` cập nhật:

```json id="spe3vy"
{
    "characterId": "char_123",
    "modelProfileId": "model_abc",
    "messages": [
        {
            "role": "user",
            "content": "Xin chào"
        }
    ]
}
```

Nếu không có `modelProfileId`:

```txt id="cyr9nu"
Backend dùng default model.
```

---

## Task 9 — Tích hợp vào Character Generation UI

Ở màn Create Character with AI, thêm model selector.

Luồng:

```txt id="ajsfj0"
User chọn model
  -> selectedModelId
  -> gửi modelProfileId trong /generate-character/stream
```

Request:

```json id="klhmpd"
{
    "idea": "Một nữ kiếm sĩ cổ trang là android",
    "modelProfileId": "model_abc",
    "language": "vi"
}
```

Khi đang stream:

```txt id="w6a1u6"
- Disable model selector.
- Không cho đổi model giữa chừng.
```

---

## Task 10 — Empty state khi chưa có model

Nếu chưa có model nào, Chat UI và Generate UI cần báo rõ:

```txt id="f4jy8o"
Bạn chưa có model AI nào. Hãy thêm model trước khi sử dụng chat hoặc tạo nhân vật.
```

Action:

```txt id="788h6r"
[Add Model]
```

Không nên để user bấm chat/generate rồi lỗi mơ hồ.

---

## 10. Backend Tasks

## Task 1 — Model resolver

Tạo module:

```txt id="smiwa8"
worker/src/lib/modelResolver.ts
```

Nhiệm vụ:

```txt id="9v5d2o"
- Nhận userId và modelProfileId.
- Nếu modelProfileId có, lấy model tương ứng.
- Nếu không có, lấy default model.
- Nếu không tìm thấy, dùng env default hoặc trả lỗi.
```

Fallback logic MVP:

```txt id="pznxbi"
1. Dùng modelProfileId nếu có.
2. Nếu không có, dùng default model profile.
3. Nếu chưa có storage model, dùng env:
   - LLM_BASE_URL
   - LLM_API_KEY
   - LLM_DEFAULT_MODEL
4. Nếu vẫn không có, trả MODEL_NOT_CONFIGURED.
```

---

## Task 2 — Cập nhật `/chat/stream`

Route `/chat/stream` cần đọc thêm:

```txt id="1frcbh"
modelProfileId
```

Sau đó:

```txt id="1l9w0s"
- Resolve model profile.
- Gọi LLM bằng baseUrl/apiKey/modelName của profile.
- Dùng temperature/maxTokens của request hoặc profile.
```

---

## Task 3 — Cập nhật `/generate-character/stream`

Route `/generate-character/stream` cũng cần đọc:

```txt id="d7o19g"
modelProfileId
```

Sau đó dùng model tương ứng cho generation.

Lưu ý:

```txt id="w54oot"
Nếu model không hỗ trợ streaming hoặc không ổn với structured output,
backend nên trả warning hoặc lỗi rõ ràng.
```

---

## Task 4 — Implement `/models/:id/test`

Test bằng một prompt cực ngắn:

```txt id="h4xj7d"
Say "ok" only.
```

Yêu cầu:

```txt id="jbwly6"
- Không tốn nhiều token.
- Timeout ngắn.
- Không stream cũng được.
- Trả error rõ ràng nếu fail.
```

---

## 11. Error Handling

## 11.1. Không có model

```json id="aafz8a"
{
    "error": {
        "code": "MODEL_NOT_CONFIGURED",
        "message": "No AI model has been configured."
    }
}
```

UI:

```txt id="ajk3lf"
Bạn chưa cấu hình model AI. Hãy thêm model trước.
```

---

## 11.2. Model không tồn tại

```json id="7fpa5k"
{
    "error": {
        "code": "MODEL_NOT_FOUND",
        "message": "The selected model profile does not exist."
    }
}
```

---

## 11.3. API key sai

```json id="plpe6i"
{
    "error": {
        "code": "MODEL_AUTH_FAILED",
        "message": "Model provider authentication failed."
    }
}
```

---

## 11.4. Base URL sai

```json id="gay9pu"
{
    "error": {
        "code": "MODEL_CONNECTION_FAILED",
        "message": "Could not connect to the model provider."
    }
}
```

---

## 11.5. Model name sai

```json id="aqlvsn"
{
    "error": {
        "code": "MODEL_NOT_AVAILABLE",
        "message": "The selected model is not available from this provider."
    }
}
```

---

## 11.6. Model không hỗ trợ streaming

```json id="oo8v36"
{
    "error": {
        "code": "MODEL_STREAMING_NOT_SUPPORTED",
        "message": "The selected model does not support streaming."
    }
}
```

---

## 12. Security Notes

## 12.1. API key trong Sprint 5

Có hai hướng:

### Hướng A — API key lưu local

```txt id="2e47tm"
- User nhập API key.
- API key lưu trong IndexedDB.
- Frontend gửi API key lên backend khi gọi model.
```

Ưu điểm:

```txt id="0l4krp"
- Dễ làm MVP.
- Không cần server database/secret storage.
```

Nhược điểm:

```txt id="u503mx"
- API key vẫn nằm ở browser.
- Không phù hợp production.
```

---

### Hướng B — API key lưu server

```txt id="nqyt7t"
- User nhập API key.
- Backend lưu server-side.
- Frontend không nhận lại API key thô.
```

Ưu điểm:

```txt id="tq1e10"
- An toàn hơn.
- Dễ kiểm soát request.
```

Nhược điểm:

```txt id="3ghdhv"
- Cần database.
- Cần mã hóa secret.
- Phức tạp hơn.
```

---

### Quyết định MVP

Sprint 5 có thể chọn một trong hai:

```txt id="q0n8gr"
MVP nhanh:
  Lưu local trước, ghi rõ technical debt.

MVP tốt hơn:
  Dùng env API key server-side và chỉ cho user chọn baseUrl/modelName.
```

Không nên triển khai nửa vời kiểu lưu API key server-side nhưng không mã hóa.

---

## 13. Validation Rules

## 13.1. Model form validation

```txt id="nw94l9"
name:
  required

provider:
  required

baseUrl:
  required
  must be valid URL

apiKey:
  optional nếu dùng local model
  required nếu provider cần key

modelName:
  required

temperature:
  min 0
  max 2

maxTokens:
  min 1
  max tùy provider

supportsStreaming:
  boolean

supportsJsonMode:
  boolean
```

---

## 13.2. Default model validation

```txt id="j3wzip"
- Chỉ một model được isDefault = true.
- Nếu tạo model đầu tiên, tự set default.
- Nếu set model mới làm default, unset model cũ.
- Nếu xóa default model, phải chọn default mới hoặc app chuyển sang trạng thái no default.
```

---

## 14. Test Cases

## 14.1. Frontend tests

### Test 1 — Empty state

```txt id="uev54r"
Given chưa có model profile
When mở Models page
Then hiển thị empty state
And có nút Add Model
```

### Test 2 — Tạo model mới

```txt id="1t1r3j"
Given user mở Add Model form
When nhập thông tin hợp lệ
And bấm Save
Then model được lưu
And xuất hiện trong ModelList
```

### Test 3 — Validation modelName rỗng

```txt id="erx2s7"
Given user đang tạo model
When modelName rỗng
And bấm Save
Then hiển thị lỗi modelName required
And không lưu model
```

### Test 4 — Set default model

```txt id="stze3t"
Given có 2 model
When user set model B làm default
Then model B isDefault = true
And model A isDefault = false
```

### Test 5 — Delete model

```txt id="yh5j7o"
Given có model profile
When user bấm Delete
And xác nhận
Then model bị xóa khỏi list
```

### Test 6 — Test connection success

```txt id="j8nfzl"
Given model config hợp lệ
When user bấm Test
Then UI hiển thị Connection successful
```

### Test 7 — Test connection fail

```txt id="kvmsbj"
Given API key hoặc baseUrl sai
When user bấm Test
Then UI hiển thị Connection failed
And app không crash
```

### Test 8 — Chat dùng selected model

```txt id="opdpdu"
Given user chọn model B trong Chat UI
When gửi message
Then request /chat/stream có modelProfileId = model B
```

### Test 9 — Generate character dùng selected model

```txt id="y9rfwe"
Given user chọn model B trong Create Character UI
When bấm Generate
Then request /generate-character/stream có modelProfileId = model B
```

---

## 14.2. Backend tests

### Test 1 — Lấy models cần auth

```txt id="l60ihk"
Given không có token
When gọi GET /models
Then response status = 401
```

### Test 2 — Tạo model hợp lệ

```txt id="ok2554"
Given JWT hợp lệ
And body model hợp lệ
When gọi POST /models
Then response status = 200 hoặc 201
And response có model.id
```

### Test 3 — Tạo model thiếu modelName

```txt id="cpwse9"
Given JWT hợp lệ
And body thiếu modelName
When gọi POST /models
Then response status = 400
And error.code = INVALID_MODEL_PROFILE
```

### Test 4 — Set default chỉ có một model

```txt id="rwdxco"
Given user có nhiều model
When set model B isDefault = true
Then các model khác của user isDefault = false
```

### Test 5 — Test model fail do API key sai

```txt id="x79rcr"
Given model có API key sai
When gọi POST /models/:id/test
Then response ok = false
And error.code = MODEL_AUTH_FAILED
```

### Test 6 — Chat resolve model

```txt id="e2dfq1"
Given request /chat/stream có modelProfileId
When backend xử lý request
Then backend dùng đúng baseUrl/modelName của profile đó
```

---

## 15. Manual QA Checklist

```txt id="6yx5p0"
[ ] Mở được Models page
[ ] Empty state hiển thị đúng khi chưa có model
[ ] Add model được
[ ] Edit model được
[ ] Delete model được
[ ] Set default model được
[ ] Chỉ có một default model
[ ] Test connection success hiển thị đúng
[ ] Test connection fail hiển thị đúng
[ ] Chat UI có model selector
[ ] Generate Character UI có model selector
[ ] Đang stream thì model selector bị disabled
[ ] Chat request gửi đúng modelProfileId
[ ] Generate request gửi đúng modelProfileId
[ ] Không có model thì chat/generate bị chặn rõ ràng
```

---

## 16. Definition of Done

Sprint 5 hoàn thành khi đạt đủ các điều kiện sau:

- Có entity `AiModelProfile`.
- Có nơi lưu model profile local hoặc server.
- Có màn Models để quản lý model.
- User thêm được model mới.
- User sửa được model.
- User xóa được model.
- User set default model được.
- Chỉ có một default model tại một thời điểm.
- User test connection model được.
- Chat UI chọn được model.
- Create Character UI chọn được model.
- Request `/chat/stream` gửi được `modelProfileId`.
- Request `/generate-character/stream` gửi được `modelProfileId`.
- Backend resolve được model profile hoặc dùng default.
- Nếu chưa có model, UI báo lỗi rõ ràng.
- Không hardcode API key trong source code.

---

## 17. Demo cuối Sprint

Kịch bản demo:

```txt id="f4gnt9"
1. Mở app.
2. Log in as Guest.
3. Mở Models page.
4. Bấm Add Model.
5. Nhập:
   - name
   - provider
   - baseUrl
   - modelName
   - temperature
   - maxTokens
6. Bấm Save.
7. Model xuất hiện trong danh sách.
8. Bấm Test Connection.
9. UI báo success.
10. Set model làm default.
11. Mở Chat UI.
12. Chọn model vừa tạo.
13. Gửi message.
14. Response stream bình thường.
15. Mở Create Character with AI.
16. Chọn model vừa tạo.
17. Generate character.
18. Form auto-fill bình thường.
```

Kết quả mong muốn:

```txt id="g7d5nv"
Người dùng có thể quản lý nhiều model AI và chọn model phù hợp cho từng luồng sử dụng.
```

---

## 18. Rủi ro

## Rủi ro 1 — API key lưu local chưa an toàn

Cách xử lý:

```txt id="yq4ivp"
- Chấp nhận cho MVP nếu cần.
- Ghi rõ technical debt.
- Không dùng cho production.
- Sprint sau có thể chuyển API key sang server-side encrypted storage.
```

---

## Rủi ro 2 — Provider OpenAI-compatible nhưng format khác nhau

Cách xử lý:

```txt id="sj1f29"
- Chuẩn hóa request theo OpenAI-compatible trước.
- Thêm provider preset.
- Cho custom provider chỉnh baseUrl/modelName.
- Test connection để phát hiện sớm.
```

---

## Rủi ro 3 — Local model không cần API key

Cách xử lý:

```txt id="hh4x6g"
- Với ollama/lmstudio, apiKey optional.
- Không validate apiKey bắt buộc cho local provider.
```

---

## Rủi ro 4 — User xóa default model

Cách xử lý:

```txt id="gjww0c"
- Hỏi confirm trước khi xóa.
- Nếu còn model khác, tự set một model khác làm default.
- Nếu không còn model nào, Chat/Generate hiển thị empty state.
```

---

## Rủi ro 5 — Model không hỗ trợ JSON/structured output

Cách xử lý:

```txt id="p1fqn7"
- Có field supportsJsonMode.
- Cho phép warning khi chọn model đó cho Generate Character.
- Backend vẫn có thể dùng prompt NDJSON fallback.
```

---

## 19. Technical Debt ghi nhận

Các phần có thể chưa hoàn chỉnh trong Sprint 5:

```txt id="h2krjo"
- Chưa mã hóa API key nếu lưu server-side.
- Chưa có model catalog tự động.
- Chưa fetch danh sách model từ provider.
- Chưa có quota/rate limit theo model.
- Chưa có cost tracking.
- Chưa có per-character preferred model.
- Chưa có per-conversation model history.
- Chưa có sync model profile giữa local và server.
```

---

## 20. Ghi chú cho Sprint 6

Sprint 6 sẽ làm **Server Storage + Sync cơ bản**.

Sprint 5 cần chuẩn bị để Sprint 6 dễ tích hợp:

```txt id="xqf0c2"
- Model profile có id ổn định.
- Model profile có createdAt/updatedAt.
- Có thể thêm syncStatus nếu đang lưu local.
- Không trộn model settings vào settings global quá sâu.
```

Khi sang Sprint 6, model profile sẽ có thể đồng bộ như các entity khác:

```txt id="3szlk4"
Local model_profiles
  -> push lên server
  -> server lưu theo userId
  -> pull về khi cần
```

---

## 21. Kết luận Sprint 5

Sprint 5 giúp app chuyển từ cấu hình model đơn lẻ sang hệ thống model profile rõ ràng.

Sau sprint này, app có thể hỗ trợ nhiều provider/model khác nhau:

```txt id="f7t6gt"
- Model nhanh cho chat thường
- Model mạnh hơn cho roleplay
- Model ổn định hơn cho streaming JSON
- Local model cho thử nghiệm offline/dev
```

Đây là nền tảng cần thiết trước khi làm server storage và sync ở Sprint 6.
