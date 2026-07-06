# Sprint 2 — Chuyển Chat Stream Qua Backend

## 1. Mục tiêu Sprint

Sprint 2 tập trung chuyển luồng chat hiện tại từ mô hình **frontend gọi trực tiếp LLM provider** sang mô hình **frontend gọi backend, backend gọi LLM provider và stream kết quả về frontend**.

Sau sprint này, ứng dụng vẫn giữ được trải nghiệm chat roleplay 1-1 như hiện tại, nhưng toàn bộ request tới model AI sẽ đi qua **Cloudflare Worker backend**.

---

## 2. Bối cảnh

Ở phiên bản hiện tại, frontend đang gọi trực tiếp tới API tương thích OpenAI, ví dụ:

```txt
Frontend
  -> OpenAI-compatible API
  -> stream response về Frontend
```

Cách này phù hợp với prototype, nhưng có một số vấn đề:

- API key có thể bị lộ ở browser.
- Khó kiểm soát request.
- Khó thêm authentication.
- Khó thêm logging, rate limit, quota.
- Khó xử lý streaming JSON ở sprint sau.
- Không phù hợp khi cần đồng bộ dữ liệu server-side.

Sau Sprint 1, hệ thống đã có:

- Cloudflare Worker backend.
- Guest login.
- JWT authentication.
- Frontend có thể gửi request kèm `Authorization: Bearer <token>`.

Sprint 2 sẽ tận dụng nền tảng đó để chuyển chat streaming qua backend.

---

## 3. Phạm vi công việc

### 3.1. Trong phạm vi Sprint 2

Sprint này bao gồm:

- Tạo endpoint backend `POST /chat/stream`.
- Backend verify JWT trước khi xử lý chat.
- Backend nhận messages từ frontend.
- Backend gọi LLM provider.
- Backend stream response về frontend.
- Frontend chuyển từ gọi LLM trực tiếp sang gọi backend.
- Giữ nguyên trải nghiệm stream từng phần trong UI.
- Giữ lại partial assistant message nếu stream lỗi giữa chừng.
- Thêm trạng thái loading/error/cancel cho chat stream.

### 3.2. Ngoài phạm vi Sprint 2

Sprint này chưa làm:

- Streaming JSON.
- Auto-fill form tạo nhân vật.
- Resume stream hoàn chỉnh.
- Server-side message persistence.
- Offline sync.
- Model management đầy đủ.
- Multi-provider UI nâng cao.
- Rate limit phức tạp.
- Billing/quota.

---

## 4. Kiến trúc sau Sprint 2

Luồng cũ:

```txt
Frontend
  -> LLM Provider
  -> Frontend nhận stream
```

Luồng mới:

```txt
Frontend
  -> POST /chat/stream
  -> Cloudflare Worker verify JWT
  -> Worker gọi LLM Provider
  -> Worker stream response về Frontend
```

Sơ đồ:

```txt
User
  -> Chat UI
  -> useChat()
  -> chatApi.streamChat()
  -> Cloudflare Worker /chat/stream
  -> LLM Provider /chat/completions
  -> Stream response
  -> Worker forward stream
  -> Frontend render token dần
```

---

## 5. Cấu trúc thư mục đề xuất

### Backend

```txt
worker/
  src/
    index.ts
    routes/
      auth.ts
      chat.ts
    lib/
      authMiddleware.ts
      cors.ts
      jwt.ts
      llmClient.ts
      stream.ts
      response.ts
```

### Frontend

```txt
src/
  features/
    chat/
      hooks/
        useChat.ts
      services/
        chatApi.ts
  services/
    api/
      apiClient.ts
    streaming/
      textStreamReader.ts
```

---

## 6. Backend Tasks

## Task 1 — Tạo route `POST /chat/stream`

Tạo file:

```txt
worker/src/routes/chat.ts
```

Endpoint:

```http
POST /chat/stream
Authorization: Bearer <token>
Content-Type: application/json
```

Request body đề xuất:

```ts
type ChatStreamRequest = {
    characterId: string;
    modelProfileId?: string;
    messages: {
        role: 'system' | 'user' | 'assistant';
        content: string;
    }[];
    options?: {
        temperature?: number;
        maxTokens?: number;
        stream?: boolean;
    };
};
```

Response:

```txt
Content-Type: text/plain; charset=utf-8
Transfer-Encoding: chunked
```

Hoặc nếu muốn giữ chuẩn SSE:

```txt
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

Trong MVP, có thể dùng text stream trước để dễ tích hợp với UI hiện tại.

---

## Task 2 — Verify JWT trước khi chat

Trước khi gọi LLM, backend phải verify token.

Luồng xử lý:

```txt
1. Đọc Authorization header.
2. Lấy Bearer token.
3. Verify JWT.
4. Nếu token thiếu hoặc sai, trả 401.
5. Nếu hợp lệ, tiếp tục xử lý chat.
```

Response khi thiếu token:

```json
{
    "error": {
        "code": "AUTH_MISSING_TOKEN",
        "message": "Missing access token."
    }
}
```

Response khi token không hợp lệ:

```json
{
    "error": {
        "code": "AUTH_INVALID_TOKEN",
        "message": "Invalid or expired access token."
    }
}
```

---

## Task 3 — Tạo LLM client phía Worker

Tạo file:

```txt
worker/src/lib/llmClient.ts
```

Mục tiêu:

- Nhận request từ route `/chat/stream`.
- Gọi OpenAI-compatible API.
- Bật `stream: true`.
- Trả về response stream cho route.

Ví dụ request gửi tới provider:

```json
{
    "model": "model-name",
    "messages": [
        {
            "role": "system",
            "content": "You are a roleplay character..."
        },
        {
            "role": "user",
            "content": "Hello"
        }
    ],
    "temperature": 0.8,
    "max_tokens": 1024,
    "stream": true
}
```

Các biến môi trường cần chuẩn bị:

```txt
LLM_BASE_URL=https://openrouter.ai/api/v1
LLM_API_KEY=...
LLM_DEFAULT_MODEL=...
```

Không hardcode API key trong source code.

---

## Task 4 — Forward stream từ LLM về frontend

Backend cần đọc stream từ LLM provider và trả lại stream đó cho frontend.

Luồng:

```txt
LLM Provider response body
  -> Worker ReadableStream
  -> Transform nếu cần
  -> Frontend Response
```

Trong Sprint 2 có thể làm theo hướng đơn giản:

- Nếu provider trả text/event-stream, Worker forward gần như nguyên stream.
- Nếu frontend hiện tại chỉ cần text delta, Worker có thể parse SSE và chỉ stream text delta về.

Khuyến nghị cho MVP:

```txt
Provider SSE stream
  -> Worker parse từng event
  -> lấy delta.content
  -> trả text chunk thuần về frontend
```

Lý do:

- Frontend dễ xử lý.
- UI chat hiện tại nhiều khả năng đang append text vào assistant message.
- Sprint 3 mới cần stream event phức tạp cho JSON.

---

## Task 5 — Xử lý lỗi provider

Backend cần xử lý các lỗi sau:

### Provider trả 401/403

```json
{
    "error": {
        "code": "LLM_AUTH_FAILED",
        "message": "LLM provider authentication failed."
    }
}
```

### Provider trả 429

```json
{
    "error": {
        "code": "LLM_RATE_LIMITED",
        "message": "LLM provider rate limit exceeded."
    }
}
```

### Provider timeout hoặc network error

```json
{
    "error": {
        "code": "LLM_NETWORK_ERROR",
        "message": "Could not connect to LLM provider."
    }
}
```

### Provider stream bị đứt giữa chừng

Trường hợp này không nên xóa toàn bộ response. Worker có thể đóng stream và frontend giữ partial text đã nhận.

---

## Task 6 — Cancel stream

Frontend nên có khả năng dừng stream bằng `AbortController`.

Sprint 2 chưa cần endpoint cancel riêng. Chỉ cần:

```txt
Frontend abort request
  -> Worker connection close
  -> Provider request bị hủy hoặc Worker ngừng forward
```

Ở frontend, message assistant chuyển sang trạng thái:

```txt
cancelled
```

Partial text vẫn được giữ lại.

---

## 7. Frontend Tasks

## Task 1 — Tạo `chatApi.streamChat`

Tạo file:

```txt
src/features/chat/services/chatApi.ts
```

Function đề xuất:

```ts
type StreamChatParams = {
    characterId: string;
    messages: {
        role: 'system' | 'user' | 'assistant';
        content: string;
    }[];
    modelProfileId?: string;
    options?: {
        temperature?: number;
        maxTokens?: number;
    };
    signal?: AbortSignal;
    onDelta: (delta: string) => void;
};

async function streamChat(params: StreamChatParams): Promise<void>;
```

Nhiệm vụ:

```txt
1. Gửi POST /chat/stream.
2. Gắn Authorization header.
3. Đọc response.body bằng reader.
4. Decode chunk bằng TextDecoder.
5. Gọi onDelta(delta) mỗi khi có text mới.
6. Throw error nếu response không OK.
```

---

## Task 2 — Sửa `useChat`

Hiện tại `useChat` đang phụ thuộc vào client gọi LLM trực tiếp.

Cần sửa thành:

```txt
useChat
  -> build messages/prompt như cũ
  -> lưu user message vào IndexedDB như cũ
  -> tạo assistant message rỗng
  -> gọi chatApi.streamChat()
  -> append delta vào assistant message
  -> khi done thì mark completed
```

Không nên sửa prompt builder quá nhiều ở Sprint 2. Chỉ đổi tầng transport.

---

## Task 3 — Giữ partial assistant message khi lỗi

Trong lúc stream, assistant message nên có state:

```ts
type ChatMessageStatus = 'sending' | 'streaming' | 'completed' | 'cancelled' | 'error';
```

Nếu lỗi xảy ra sau khi đã nhận một phần text:

```txt
- Giữ nội dung đã stream được.
- Mark message status = "error".
- Hiển thị cảnh báo nhỏ.
- Không rollback toàn bộ message.
```

Ví dụ UI:

```txt
Kết nối bị gián đoạn. Nội dung đã nhận được vẫn được giữ lại.
```

---

## Task 4 — Thêm nút Stop

Khi assistant đang stream, hiển thị nút:

```txt
Stop
```

Hành vi:

```txt
User bấm Stop
  -> AbortController.abort()
  -> dừng đọc stream
  -> giữ partial text
  -> message status = "cancelled"
```

---

## Task 5 — Loading và error state

Chat UI cần phân biệt:

```txt
idle
sending
streaming
completed
cancelled
error
```

Trạng thái đề xuất:

| State       | Ý nghĩa              | UI                          |
| ----------- | -------------------- | --------------------------- |
| `idle`      | Không có request     | Input enabled               |
| `sending`   | Đang gửi request     | Input disabled hoặc loading |
| `streaming` | Đang nhận token      | Hiện nút Stop               |
| `completed` | Stream xong          | Input enabled               |
| `cancelled` | User dừng stream     | Giữ partial text            |
| `error`     | Lỗi provider/network | Giữ partial text nếu có     |

---

## 8. API Specification

## `POST /chat/stream`

### Request Headers

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Request Body

```json
{
    "characterId": "char_123",
    "modelProfileId": "model_default",
    "messages": [
        {
            "role": "system",
            "content": "You are Luna, a calm roleplay character."
        },
        {
            "role": "user",
            "content": "Xin chào."
        }
    ],
    "options": {
        "temperature": 0.8,
        "maxTokens": 1024
    }
}
```

### Response `200`

Response là stream text:

```txt
Xin chào, tôi là Luna...
```

Hoặc stream nhiều chunk:

```txt
Xin
 chào
, tôi
 là
 Luna
...
```

### Response `400`

```json
{
    "error": {
        "code": "INVALID_CHAT_REQUEST",
        "message": "Invalid chat stream request."
    }
}
```

### Response `401`

```json
{
    "error": {
        "code": "AUTH_INVALID_TOKEN",
        "message": "Invalid or expired access token."
    }
}
```

### Response `502`

```json
{
    "error": {
        "code": "LLM_PROVIDER_ERROR",
        "message": "LLM provider returned an error."
    }
}
```

---

## 9. Request Validation

Backend cần validate tối thiểu:

```txt
- characterId phải tồn tại trong request.
- messages phải là array.
- messages không được rỗng.
- Mỗi message phải có role hợp lệ.
- content phải là string.
- temperature nếu có phải là number.
- maxTokens nếu có phải là number.
```

Role hợp lệ:

```txt
system
user
assistant
```

Nếu request sai, trả:

```json
{
    "error": {
        "code": "INVALID_CHAT_REQUEST",
        "message": "Messages must be a non-empty array."
    }
}
```

---

## 10. Error Handling

## 10.1. Lỗi trước khi stream bắt đầu

Nếu lỗi xảy ra trước khi backend bắt đầu stream, backend trả JSON error bình thường.

Ví dụ:

```txt
- Thiếu token.
- Token sai.
- Request body sai.
- Provider auth fail trước khi có response body.
```

## 10.2. Lỗi trong lúc stream

Nếu lỗi xảy ra khi stream đã bắt đầu, backend không thể đổi response thành JSON error chuẩn nữa.

Cách xử lý MVP:

```txt
- Đóng stream.
- Frontend detect stream ended unexpectedly.
- Giữ partial text.
- Mark message = error.
```

Nếu dùng SSE/event stream, có thể gửi event lỗi:

```json
{
    "type": "error",
    "code": "STREAM_INTERRUPTED",
    "message": "The stream was interrupted."
}
```

Tuy nhiên Sprint 2 ưu tiên text stream đơn giản. Event stream phức tạp để Sprint 3 xử lý.

---

## 11. Security Notes

Sprint 2 cần chú ý:

- Không gửi API key của provider xuống frontend.
- API key chỉ nằm ở Worker environment.
- Không log nội dung chat nhạy cảm nếu chưa cần.
- Không log JWT.
- Verify JWT trước khi gọi provider.
- Có giới hạn request body size tối thiểu.
- Có thể thêm rate limit ở sprint sau.

---

## 12. Test Cases

## Backend

### Test 1 — Chat stream thiếu token

```txt
Given không có Authorization header
When gọi POST /chat/stream
Then nhận response 401
And error.code = "AUTH_MISSING_TOKEN"
```

### Test 2 — Chat stream token sai

```txt
Given token không hợp lệ
When gọi POST /chat/stream
Then nhận response 401
And error.code = "AUTH_INVALID_TOKEN"
```

### Test 3 — Request body sai

```txt
Given JWT hợp lệ
And body thiếu messages
When gọi POST /chat/stream
Then nhận response 400
And error.code = "INVALID_CHAT_REQUEST"
```

### Test 4 — Provider trả stream thành công

```txt
Given JWT hợp lệ
And request body hợp lệ
When gọi POST /chat/stream
Then backend gọi LLM provider
And response status = 200
And frontend nhận được text stream
```

### Test 5 — Provider lỗi auth

```txt
Given JWT hợp lệ
And LLM_API_KEY sai
When gọi POST /chat/stream
Then nhận response 502 hoặc error phù hợp
And error.code = "LLM_AUTH_FAILED"
```

### Test 6 — Client abort stream

```txt
Given chat stream đang chạy
When client ngắt kết nối
Then Worker dừng forward stream
And không crash backend
```

---

## Frontend

### Test 1 — Chat gọi backend thay vì provider trực tiếp

```txt
Given người dùng đã login guest
When gửi message
Then frontend gọi POST /chat/stream
And không gọi trực tiếp baseUrl provider từ browser
```

### Test 2 — Assistant message stream dần

```txt
Given backend trả text stream
When frontend nhận từng chunk
Then assistant message được append dần trong UI
```

### Test 3 — Stream hoàn tất

```txt
Given stream trả xong
When reader done
Then assistant message status = "completed"
And input chat được mở lại
```

### Test 4 — Stream lỗi giữa chừng

```txt
Given frontend đã nhận một phần response
When stream bị lỗi
Then partial assistant text vẫn được giữ
And message status = "error"
```

### Test 5 — User bấm Stop

```txt
Given assistant đang stream
When user bấm Stop
Then AbortController abort request
And message status = "cancelled"
And partial text vẫn được giữ
```

---

## 13. Definition of Done

Sprint 2 hoàn thành khi đạt đủ các điều kiện sau:

- Có endpoint `POST /chat/stream` trong Cloudflare Worker.
- Endpoint verify JWT trước khi xử lý chat.
- Backend gọi được LLM provider.
- Backend stream response về frontend.
- Frontend không còn gọi trực tiếp LLM provider cho chat.
- Chat roleplay vẫn hiển thị response từng phần.
- API key provider không nằm ở frontend runtime.
- Assistant message giữ partial text nếu stream lỗi.
- Có nút Stop để dừng stream.
- Có xử lý trạng thái `streaming`, `completed`, `cancelled`, `error`.
- Request thiếu/sai token bị từ chối.
- Request body sai bị trả lỗi rõ ràng.

---

## 14. Demo cuối Sprint

Kịch bản demo:

```txt
1. Mở app.
2. Login bằng "Log in as Guest".
3. Chọn hoặc import một character.
4. Gửi message trong chat.
5. Frontend gọi /chat/stream thay vì gọi provider trực tiếp.
6. Assistant response hiện ra từng phần.
7. Bấm Stop giữa chừng.
8. Partial response vẫn được giữ.
9. Gửi lại message khác.
10. Stream hoàn tất bình thường.
```

Kết quả mong muốn:

```txt
Chat roleplay đã chạy qua backend, tạo nền cho Sprint 3 xử lý streaming JSON.
```

---

## 15. Rủi ro

## Rủi ro 1 — Provider trả SSE format khác nhau

Một số provider OpenAI-compatible có thể trả format hơi khác.

Cách xử lý:

```txt
- Tạo parser SSE riêng trong Worker.
- Bỏ qua event không có delta.content.
- Xử lý [DONE].
- Log lỗi ở mức tối thiểu.
```

---

## Rủi ro 2 — Stream bị đứt giữa chừng

Nguyên nhân có thể do mạng, provider timeout hoặc user chuyển tab.

Cách xử lý Sprint 2:

```txt
- Giữ partial response.
- Mark message = error.
- Không xóa tin nhắn.
```

Resume hoàn chỉnh để Sprint sau hoặc advanced task.

---

## Rủi ro 3 — CORS lỗi với stream

Cách xử lý:

```txt
- Đảm bảo Worker xử lý OPTIONS.
- Cho phép Authorization header.
- Cho phép Content-Type.
- Kiểm tra response header phù hợp với stream.
```

---

## Rủi ro 4 — AbortController không dừng provider request ngay

Một số trường hợp client abort nhưng request tới provider vẫn chạy trong một thời gian ngắn.

Cách xử lý:

```txt
- Gắn signal vào fetch nếu môi trường hỗ trợ.
- Khi stream writer bị close thì ngừng đọc provider stream.
- Chấp nhận là MVP chưa có cancel server-side hoàn hảo.
```

---

## Rủi ro 5 — API key provider bị cấu hình sai

Cách xử lý:

```txt
- Trả lỗi rõ ràng LLM_AUTH_FAILED.
- Không expose API key.
- Thêm /health hoặc /models/test ở sprint sau để kiểm tra cấu hình.
```

---

## 16. Technical Debt ghi nhận

Các phần chưa xử lý trong Sprint 2:

```txt
- Chưa có rate limit theo user.
- Chưa có quota token.
- Chưa lưu message lên server.
- Chưa có resume stream.
- Chưa có structured event stream.
- Chưa có model profile server-side.
- Chưa có logging/observability đầy đủ.
```

---

## 17. Ghi chú cho Sprint sau

Sprint 3 sẽ xử lý bài toán quan trọng hơn:

```txt
Streaming JSON cho tính năng tạo nhân vật.
```

Nền tảng từ Sprint 2 sẽ được tái sử dụng:

```txt
- Backend streaming response.
- Auth middleware.
- API client frontend.
- AbortController.
- Partial result handling.
- Error state trong UI.
```

Điểm khác ở Sprint 3:

```txt
Sprint 2:
  stream text cho chat

Sprint 3:
  stream structured event/NDJSON để auto-fill form
```
