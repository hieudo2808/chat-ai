Kế hoạch nên làm theo hướng: **giữ phần app chat/character hiện tại**, nhưng **đập lại luồng gọi AI** thành backend-proxy + structured streaming. Repo hiện tại đang là React/Vite/TypeScript, lưu local bằng IndexedDB, hỗ trợ import Character Card và stream text qua OpenAI-compatible API; tức là nền frontend đã có, nhưng chưa đủ cho bài toán backend/JWT/sync mới. ([GitHub][1])

## 0. Chốt lại mục tiêu mới

App mới không phải dating sim nữa. Scope nên viết lại thành:

> Web app cho phép người dùng guest login, import/tạo/chỉnh sửa nhân vật ảo, import/chỉnh sửa cấu hình model AI, sau đó chat roleplay 1-1 với nhân vật. Hệ thống phải hỗ trợ streaming text và streaming JSON để auto-fill form tạo nhân vật theo thời gian thực.

Ưu tiên kỹ thuật:

1. **Streaming JSON cho tạo nhân vật** — quan trọng nhất.
2. **Backend proxy bằng Cloudflare Workers** — để gọi LLM qua server, không gọi thẳng từ browser nữa.
3. **Guest auth bằng JWT**.
4. **Lưu local trước, server sau**.
5. **Sync/offline-first** để làm sau, không nhảy vào ngay.

---

# Phase 1 — Dọn lại kiến trúc hiện tại

Hiện repo đang là **frontend-only local-first**: README ghi rõ dữ liệu chat/nhân vật nằm trong IndexedDB, không có backend lưu tin nhắn; app gọi OpenAI-compatible provider như OpenRouter/Ollama/LM Studio và stream realtime qua SSE. ([GitHub][1])

Việc đầu tiên là tách code theo domain rõ hơn:

```txt
src/
  app/
  features/
    auth/
    characters/
    character-generation/
    chat/
    models/
    settings/
    sync/
  services/
    api/
    streaming/
    storage/
  db/
  types/
```

Trong đó cần tách riêng:

```txt
services/streaming/
  textStreamClient.ts
  jsonStreamClient.ts
  partialJsonState.ts
  streamErrors.ts
```

Không nên nhét streaming JSON vào `useChat` hiện tại, vì chat text và auto-fill JSON là 2 use case khác nhau.

---

# Phase 2 — Thiết kế schema cho Character Generation

Đừng để LLM trả JSON tự do. Phải bắt nó trả đúng schema cố định, ví dụ:

```ts
type GeneratedCharacterDraft = {
    name: string;
    shortDescription: string;
    personality: string;
    scenario: string;
    firstMessage: string;
    appearance: string;
    speakingStyle: string;
    tags: string[];
    exampleDialogues: string[];
};
```

Form UI nên bind theo từng field:

```ts
type StreamFieldState<T> = {
    value: T;
    status: 'pending' | 'streaming' | 'complete' | 'error';
    lastUpdatedAt?: number;
};
```

Ví dụ state trong lúc stream:

```ts
type CharacterGenerationState = {
    name: StreamFieldState<string>;
    shortDescription: StreamFieldState<string>;
    personality: StreamFieldState<string>;
    scenario: StreamFieldState<string>;
    firstMessage: StreamFieldState<string>;
    tags: StreamFieldState<string[]>;
    exampleDialogues: StreamFieldState<string[]>;
    streamStatus: 'idle' | 'streaming' | 'completed' | 'partial_error' | 'cancelled';
};
```

UX hiển thị:

| Trường               | Khi chưa có dữ liệu        | Khi đang stream                     | Khi xong            |
| -------------------- | -------------------------- | ----------------------------------- | ------------------- |
| `name`               | Skeleton / “Đang tạo tên…” | Text hiện từng phần, input disabled | Input mở lại        |
| `personality`        | Placeholder                | Textarea disabled, chữ chạy dần     | Textarea editable   |
| `tags[]`             | “Đang tạo tags…”           | Tag nào stream xong thì hiện tag đó | Cho sửa/xóa tag     |
| `exampleDialogues[]` | Skeleton list              | Mỗi item hiện khi parser nhận được  | Cho chỉnh từng item |

Cái quan trọng: **disable field đang stream**, nhưng vẫn render value. Khi stream hoàn tất hoặc người dùng bấm cancel, mới unlock.

---

# Phase 3 — Streaming JSON parser

Có 2 hướng.

## Hướng A — LLM stream JSON object thật

LLM trả dạng:

```json
{
    "name": "Aurelia",
    "shortDescription": "A mysterious...",
    "personality": "She is...",
    "tags": ["android", "ancient", "calm"]
}
```

Vấn đề: JSON object chỉ valid khi đóng `}` cuối cùng. Vì vậy frontend phải dùng parser kiểu incremental để đọc dần token và map theo path:

```txt
$.name
$.shortDescription
$.personality
$.tags[0]
$.tags[1]
```

Luồng xử lý:

```txt
fetch stream
  -> decode chunk
  -> feed vào json stream parser
  -> parser emit event { path, value, partial }
  -> update form field tương ứng
```

Ví dụ event nội bộ:

```ts
type JsonStreamEvent =
    | { type: 'field_start'; path: string }
    | { type: 'field_delta'; path: string; delta: string }
    | { type: 'field_value'; path: string; value: unknown }
    | { type: 'array_item'; path: string; index: number; value: unknown }
    | { type: 'done' }
    | { type: 'error'; message: string; partialText: string };
```

## Hướng B — Backend convert JSON stream thành event dễ ăn hơn

Tôi khuyên chọn hướng này cho MVP.

Backend vẫn yêu cầu LLM sinh JSON, nhưng Worker parse/transform rồi trả về **NDJSON event** cho client:

```jsonl
{"type":"field_delta","path":"name","delta":"Aur"}
{"type":"field_delta","path":"name","delta":"elia"}
{"type":"field_done","path":"name","value":"Aurelia"}
{"type":"array_item","path":"tags","index":0,"value":"android"}
{"type":"done"}
```

Frontend lúc này không cần hiểu JSON dang dở phức tạp nữa. Nó chỉ đọc từng dòng JSONL.

Lý do nên làm vậy: streaming JSON trực tiếp ở frontend rất dễ vỡ khi LLM thêm dấu phẩy sai, escape sai, hoặc stream bị đứt. Backend có thể normalize lỗi và trả partial result an toàn hơn. Cloudflare Workers hỗ trợ Web Streams/ReadableStream/TransformStream; docs cũng nói Worker có thể trả `Response` bằng `ReadableStream` và stream dữ liệu về client khi dữ liệu sẵn sàng, không cần buffer toàn bộ response. ([Cloudflare Docs][2])

---

# Phase 4 — Backend Cloudflare Workers

Cloudflare Workers đúng với yêu cầu của sếp: một file JS/TS export `fetch(request, env, ctx)`. Fetch handler nhận request và trả `Response`; docs của Cloudflare cũng mô tả pattern `export default { async fetch(request, env, ctx) { return new Response(...) } }`. ([Cloudflare Docs][3])

Nên tạo thư mục backend riêng:

```txt
worker/
  src/
    index.ts
    routes/
      auth.ts
      chat.ts
      characterGenerate.ts
      characters.ts
      models.ts
      sync.ts
    lib/
      jwt.ts
      llm.ts
      stream.ts
      jsonStream.ts
      cors.ts
  wrangler.toml
```

API đề xuất:

```txt
POST /auth/guest
GET  /auth/me

GET  /models
POST /models
PUT  /models/:id
DELETE /models/:id

GET  /characters
POST /characters
PUT  /characters/:id
DELETE /characters/:id

POST /generate-character/stream
POST /chat/stream

GET  /sync/pull?since=<timestamp>
POST /sync/push
```

MVP backend trước mắt chỉ cần 3 endpoint:

```txt
POST /auth/guest
POST /generate-character/stream
POST /chat/stream
```

`/generate-character/stream` trả NDJSON stream:

```txt
Content-Type: application/x-ndjson
Cache-Control: no-cache
```

`/chat/stream` có thể trả text stream hoặc SSE như hiện tại, nhưng đi qua Worker thay vì gọi provider trực tiếp từ browser.

---

# Phase 5 — Auth Guest bằng JWT

Luồng:

```txt
User bấm Log in as Guest
  -> POST /auth/guest
  -> server tạo userId
  -> server ký JWT
  -> client lưu token
  -> các request sau gửi Authorization: Bearer <token>
```

Payload JWT:

```json
{
    "sub": "guest_01J...",
    "type": "guest",
    "iat": 1780000000,
    "exp": 1782592000
}
```

Frontend:

```ts
localStorage.setItem('access_token', token);
```

Backend middleware:

```ts
const token = request.headers.get('Authorization')?.replace('Bearer ', '');
const user = await verifyJwt(token, env.JWT_SECRET);
```

Cho demo thì localStorage được. Nếu làm nghiêm túc hơn thì chuyển sang HttpOnly cookie để giảm rủi ro token bị JS đọc.

---

# Phase 6 — Model Management

Hiện app đang có settings kiểu `apiKey`, `baseUrl`, `modelName`, `temperature`, `maxTokens`. Yêu cầu mới là “import/chỉnh sửa các model AI”, nên nên tách thành entity riêng:

```ts
type AiModelProfile = {
    id: string;
    userId: string;
    name: string; // "OpenRouter Gemini Flash"
    provider: 'openrouter' | 'openai' | 'ollama' | 'lmstudio' | 'custom';
    baseUrl: string;
    modelName: string;
    temperature: number;
    maxTokens: number;
    supportsJsonMode?: boolean;
    supportsStreaming?: boolean;
    isDefault?: boolean;
    createdAt: string;
    updatedAt: string;
};
```

MVP nên dùng **server-side API key từ env** trước:

```txt
OPENROUTER_API_KEY=...
```

Đừng để nhiều người dùng tự nhập API key rồi lưu thẳng server ngay từ đầu. Nếu bắt buộc cho user nhập key, cần mã hóa trước khi lưu DB.

---

# Phase 7 — UX tạo nhân vật bằng prompt 1 dòng

Giao diện mới:

```txt
[Ý tưởng nhân vật]
"Tôi muốn một nữ kiếm sĩ cổ trang là android, lạnh lùng nhưng nói chuyện dịu dàng"

[Generate]
```

Sau khi bấm Generate:

```txt
- Disable ô idea input hoặc chỉ cho Cancel.
- Mở form character draft.
- Các field được fill dần.
- Field đang stream bị khóa.
- Có nút Cancel.
- Có badge trạng thái: Đang tạo / Mất kết nối / Đã lưu bản nháp / Hoàn tất.
```

Flow state:

```txt
idle
  -> streaming
  -> completed
  -> editable
```

Nếu lỗi giữa chừng:

```txt
streaming
  -> partial_error
  -> editable_with_warning
```

Tức là không được báo “fail toàn bộ”. Phải giữ lại phần đã stream được.

Lưu ý thêm: ví dụ prompt của sếp có từ “loli”. Nên thêm validation/safety layer để tránh minor-coded sexual content. Có thể cho phép fantasy/roleplay chung, nhưng nên chặn hoặc rewrite các mô tả tình dục hóa nhân vật trẻ con/ngụ ý vị thành niên.

---

# Phase 8 — Xử lý mất kết nối / chuyển tab / resume

Phải nói rõ: **resume thật sự không tự có**. Nếu chỉ dùng Worker stateless stream bình thường, người dùng chuyển tab hoặc mạng đứt thì stream có thể mất. Muốn resume chuẩn thì cần stream session.

Thiết kế tối thiểu:

```ts
type GenerationSession = {
    id: string;
    userId: string;
    type: 'character_generation' | 'chat';
    status: 'streaming' | 'completed' | 'failed' | 'cancelled';
    partialResult: unknown;
    rawBuffer: string;
    events: StreamEvent[];
    lastSeq: number;
    createdAt: string;
    updatedAt: string;
};
```

Endpoint:

```txt
POST /generate-character/stream
  -> trả streamId ngay event đầu tiên

GET /streams/:streamId/events?after=42
  -> trả lại event từ seq 43 trở đi

POST /streams/:streamId/cancel
```

MVP đơn giản hơn:

```txt
- Client lưu partial result vào IndexedDB sau mỗi chunk.
- Nếu stream đứt, hiện "Đã mất kết nối, giữ bản nháp hiện tại".
- Cho nút "Tiếp tục tạo từ phần hiện có".
```

Resume nâng cao:

```txt
- Backend lưu event stream theo seq.
- Client reconnect với streamId + lastSeq.
- Server replay event còn thiếu.
```

Nếu dùng Cloudflare, phần state này nên tách khỏi Worker thuần. Worker xử lý request tốt, nhưng stream resume cần storage/session. Có thể dùng D1/KV cho lưu dữ liệu và Durable Object nếu cần quản lý stream session sống lâu.

---

# Phase 9 — Sync & Offline First

Cái này để sau khi backend và streaming ổn. Không làm ngay, vì sẽ làm rối project.

Hiện app đã có IndexedDB, nên hướng đúng là:

```txt
Local write first
  -> IndexedDB update ngay
  -> đánh dấu dirty/pending_sync
  -> khi online thì push lên server
  -> server merge
  -> pull dữ liệu mới về
```

Entity local nên có metadata:

```ts
type SyncMeta = {
    id: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string;
    localUpdatedAt: string;
    serverUpdatedAt?: string;
    syncStatus: 'synced' | 'pending_create' | 'pending_update' | 'pending_delete' | 'conflict';
    version: number;
};
```

Các bảng/entity:

```txt
characters
messages
model_profiles
generation_sessions
```

React Query có thể dùng cho cache và mutation queue. TanStack Query có `networkMode: 'offlineFirst'`, trong đó query function chạy một lần rồi pause retries nếu network fail; docs cũng ghi mode này phù hợp khi có offline-first PWA/service worker hoặc HTTP cache. ([TanStack][4])

Nếu persist offline mutation bằng TanStack Query, cần chú ý rule quan trọng: mutation không resume sau reload nếu không khai báo default mutation function, vì function không serialize được khi lưu cache. ([TanStack][5])

---

# Thứ tự làm cụ thể

## Milestone 1 — Chạy lại app hiện tại và đóng băng baseline

Mục tiêu: biết app hiện tại còn chạy không.

Checklist:

```txt
pnpm install
pnpm run dev
pnpm run build
pnpm run lint
pnpm test nếu có script test
```

Sau đó tạo branch:

```txt
git checkout -b feature/backend-streaming-json
```

---

## Milestone 2 — Tạo backend Worker tối thiểu

Làm:

```txt
worker/
  src/index.ts
  wrangler.toml
```

Endpoint đầu tiên:

```txt
GET /health
POST /auth/guest
```

Definition of Done:

```txt
- Frontend gọi /health được.
- Bấm "Log in as Guest" nhận JWT.
- Token lưu localStorage.
- Reload trang vẫn nhận ra guest.
```

---

## Milestone 3 — Chuyển chat stream qua backend

Hiện frontend đang gọi thẳng provider. Đổi thành:

```txt
frontend -> Worker /chat/stream -> LLM provider -> Worker stream về frontend
```

Definition of Done:

```txt
- Chat vẫn stream từng chữ như cũ.
- API key không còn nằm trong browser nếu dùng server env.
- Có nút Stop.
- Nếu stream lỗi, message assistant vẫn giữ partial text.
```

---

## Milestone 4 — Character Generator stream JSON

Làm màn hình:

```txt
Create Character with AI
  input idea
  generate button
  auto-filled disabled form
```

Backend:

```txt
POST /generate-character/stream
```

Response nên là NDJSON event, không trả JSON object thô trực tiếp.

Definition of Done:

```txt
- Nhập 1 câu idea.
- Form hiện ngay trong < 1 giây.
- Các field fill dần.
- Field bị disabled trong lúc stream.
- Stream xong thì unlock.
- Mất stream giữa chừng vẫn giữ partial draft.
```

---

## Milestone 5 — Import/edit model profile

Frontend thêm màn hình:

```txt
Models
  - Add model
  - Edit model
  - Set default
  - Test connection
```

MVP field:

```txt
name
provider
baseUrl
modelName
temperature
maxTokens
```

Definition of Done:

```txt
- Tạo được model profile.
- Chọn model khi chat.
- Chọn model khi generate character.
- Có nút test model.
```

---

## Milestone 6 — Lưu server cơ bản

Sau khi auth có rồi, thêm server storage:

```txt
GET /characters
POST /characters
PUT /characters/:id
DELETE /characters/:id
```

Frontend vẫn lưu IndexedDB trước, nhưng có thêm `serverId`, `syncStatus`.

Definition of Done:

```txt
- Tạo nhân vật local.
- Push lên server.
- Reload máy khác với cùng token thì kéo lại được.
```

Với guest login, “máy khác cùng token” chỉ khả thi nếu copy token hoặc chưa cần demo phần đó.

---

## Milestone 7 — Offline-first sync

Làm sau cùng.

Definition of Done:

```txt
- Tắt mạng vẫn xem được characters/messages cũ.
- Tạo/sửa character offline được.
- Bật mạng lại thì tự sync.
- Conflict tối thiểu: last-write-wins hoặc báo conflict.
```

---

# Ưu tiên code nên làm trước

Tôi sẽ xếp thứ tự như này:

```txt
1. Refactor API client frontend: không gọi LLM trực tiếp nữa.
2. Tạo Cloudflare Worker /health, /auth/guest.
3. Làm /chat/stream proxy để chứng minh backend stream được.
4. Làm /generate-character/stream trả NDJSON.
5. Làm UI auto-fill form bằng stream events.
6. Thêm partial-save vào IndexedDB khi stream.
7. Thêm model profile.
8. Thêm server storage.
9. Thêm offline sync.
```

Không nên làm ngay:

```txt
- Login Google/email/password.
- Sync conflict phức tạp.
- Resume stream hoàn hảo.
- Multi-user sharing.
- Dating sim/gameplay.
- Memory/vector database.
```

---

# Kết luận ngắn

Kế hoạch đúng nhất là: **lấy repo hiện tại làm frontend nền**, sau đó làm thêm **Cloudflare Worker backend**, chuyển toàn bộ gọi AI qua backend, rồi tập trung giải quyết **streaming JSON auto-fill character form**. Phần sync/offline-first là advanced, chỉ nên làm sau khi streaming JSON và guest auth đã ổn.

Cột mốc quan trọng nhất để demo với sếp là:

> Nhập một ý tưởng nhân vật → form hiện ngay → từng field tự fill dần bằng stream JSON → stream lỗi vẫn giữ bản nháp → xong thì user chỉnh sửa và lưu nhân vật.

[1]: https://github.com/hieudo2808/chat-ai 'GitHub - hieudo2808/chat-ai · GitHub'
[2]: https://developers.cloudflare.com/workers/runtime-apis/streams/index.md 'Streams - Runtime APIs · Cloudflare Workers docs'
[3]: https://developers.cloudflare.com/workers/runtime-apis/handlers/fetch/ 'Fetch Handler · Cloudflare Workers docs'
[4]: https://tanstack.com/query/v5/docs/framework/react/guides/network-mode 'Network Mode | TanStack Query React Docs'
[5]: https://tanstack.com/query/v5/docs/framework/react/guides/mutations 'Mutations | TanStack Query React Docs'
