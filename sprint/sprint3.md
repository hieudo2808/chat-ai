# Sprint 3 — Streaming JSON Core

## 1. Mục tiêu Sprint

Sprint 3 tập trung giải quyết bài toán kỹ thuật quan trọng nhất của dự án: **stream dữ liệu có cấu trúc JSON và render dần trên giao diện trong lúc dữ liệu chưa hoàn tất**.

Sau sprint này, backend có thể gọi LLM để tạo dữ liệu nhân vật, nhận dữ liệu dạng stream, sau đó trả về frontend theo format dễ xử lý. Frontend có thể đọc stream, cập nhật từng field trong form theo thời gian thực, và giữ lại dữ liệu một phần nếu stream bị lỗi.

---

## 2. Bối cảnh

Ở chat thông thường, LLM chỉ cần stream text:

```txt
"Xin chào, tôi là..."
```

Frontend chỉ cần append text vào message assistant.

Tuy nhiên, tính năng tạo nhân vật bằng AI cần dữ liệu có cấu trúc:

```json
{
    "name": "Nguyệt Cơ",
    "description": "Một android cổ trang...",
    "personality": "Lạnh lùng nhưng dịu dàng...",
    "firstMessage": "Ngươi gọi ta sao?",
    "tags": ["android", "cổ trang", "roleplay"]
}
```

Vấn đề là JSON object chỉ hợp lệ khi stream hoàn tất. Trong lúc LLM đang stream, dữ liệu có thể đang ở trạng thái dang dở:

```json
{
  "name": "Nguyệt Cơ",
  "description": "Một android cổ
```

Nếu frontend chờ JSON hoàn chỉnh mới render, UX sẽ rất tệ. Người dùng sẽ phải chờ lâu mà không thấy gì.

Vì vậy Sprint 3 cần xây dựng cơ chế **stream structured data** để frontend render dần từng field.

---

## 3. Phạm vi công việc

### 3.1. Trong phạm vi Sprint 3

Sprint này bao gồm:

- Thiết kế schema dữ liệu character generation.
- Tạo endpoint backend `POST /generate-character/stream`.
- Backend gọi LLM để sinh dữ liệu nhân vật.
- Backend xử lý stream từ LLM.
- Backend trả dữ liệu về frontend bằng NDJSON event stream.
- Frontend đọc NDJSON stream.
- Frontend cập nhật state theo từng event.
- Hỗ trợ text field stream dần.
- Hỗ trợ array field stream từng item.
- Hỗ trợ trạng thái field: pending, streaming, done, error.
- Giữ partial data khi stream lỗi.
- Có parser/reducer riêng cho character generation stream.

### 3.2. Ngoài phạm vi Sprint 3

Sprint này chưa làm hoàn chỉnh:

- UI form tạo nhân vật đẹp/chính thức.
- UX hoàn chỉnh cho auto-fill character form.
- Save generated character vào character list.
- Resume stream thật sự bằng `streamId`.
- Sync server.
- Offline-first.
- Model management đầy đủ.
- Conflict handling.
- Advanced prompt management UI.

Sprint 3 tập trung vào **core streaming JSON mechanism**. Sprint 4 sẽ làm UX tạo nhân vật hoàn chỉnh.

---

## 4. Quyết định kỹ thuật chính

## 4.1. Không stream JSON object thô trực tiếp về frontend

Không nên bắt frontend parse JSON object dang dở như:

```json
{
  "name": "Nguyệt
```

Lý do:

- JSON chưa đóng `}` thì chưa hợp lệ.
- String có thể bị cắt giữa chừng.
- Array có thể chưa đủ phần tử.
- Escape character có thể bị cắt.
- LLM có thể sinh sai dấu phẩy hoặc sai format.
- Frontend sẽ rất khó xử lý lỗi.

---

## 4.2. Dùng NDJSON event stream

Backend sẽ convert dữ liệu stream thành từng event nhỏ, mỗi event là một dòng JSON hợp lệ.

Format:

```txt
Content-Type: application/x-ndjson
```

Ví dụ response stream:

```jsonl
{"seq":1,"type":"stream_started","streamId":"str_abc"}
{"seq":2,"type":"field_delta","path":"name","delta":"Nguyệt"}
{"seq":3,"type":"field_delta","path":"name","delta":" Cơ"}
{"seq":4,"type":"field_done","path":"name","value":"Nguyệt Cơ"}
{"seq":5,"type":"field_delta","path":"description","delta":"Một android cổ trang"}
{"seq":6,"type":"array_item","path":"tags","index":0,"value":"android"}
{"seq":7,"type":"array_item","path":"tags","index":1,"value":"cổ trang"}
{"seq":8,"type":"done"}
```

Ưu điểm:

- Mỗi dòng là JSON hợp lệ.
- Frontend parse từng dòng dễ.
- Render được ngay.
- Dễ thêm `seq` để phục vụ resume sau này.
- Dễ giữ partial result.
- Dễ debug.

---

## 5. Kiến trúc sau Sprint 3

Luồng tổng quát:

```txt
Frontend
  -> POST /generate-character/stream
  -> Worker verify JWT
  -> Worker gọi LLM
  -> Worker nhận stream từ LLM
  -> Worker parse/normalize thành NDJSON events
  -> Frontend đọc từng event
  -> Frontend update form state
```

Sơ đồ:

```txt
User idea
  -> Character Generation API
  -> Cloudflare Worker
  -> LLM Provider
  -> Raw LLM stream
  -> Structured Stream Transformer
  -> NDJSON event stream
  -> Frontend NDJSON reader
  -> Character Generation reducer
  -> UI state
```

---

## 6. Schema dữ liệu nhân vật

Dữ liệu character draft cần sinh ra:

```ts
type GeneratedCharacterDraft = {
    name: string;
    description: string;
    personality: string;
    scenario: string;
    firstMessage: string;
    appearance: string;
    speakingStyle: string;
    tags: string[];
    exampleDialogues: string[];
};
```

Ý nghĩa field:

| Field              | Kiểu       | Ý nghĩa                 |
| ------------------ | ---------- | ----------------------- |
| `name`             | `string`   | Tên nhân vật            |
| `description`      | `string`   | Mô tả tổng quan         |
| `personality`      | `string`   | Tính cách nhân vật      |
| `scenario`         | `string`   | Bối cảnh roleplay       |
| `firstMessage`     | `string`   | Lời mở đầu của nhân vật |
| `appearance`       | `string`   | Ngoại hình              |
| `speakingStyle`    | `string`   | Phong cách nói chuyện   |
| `tags`             | `string[]` | Nhãn phân loại          |
| `exampleDialogues` | `string[]` | Ví dụ hội thoại         |

---

## 7. Backend Tasks

## Task 1 — Tạo route `POST /generate-character/stream`

Tạo file:

```txt
worker/src/routes/characterGenerate.ts
```

Endpoint:

```http
POST /generate-character/stream
Authorization: Bearer <token>
Content-Type: application/json
```

Request body:

```ts
type GenerateCharacterStreamRequest = {
    idea: string;
    modelProfileId?: string;
    language?: 'vi' | 'en';
    options?: {
        temperature?: number;
        maxTokens?: number;
    };
};
```

Ví dụ request:

```json
{
    "idea": "Tôi muốn một nữ kiếm sĩ cổ trang là android, lạnh lùng nhưng nói chuyện dịu dàng",
    "language": "vi",
    "options": {
        "temperature": 0.8,
        "maxTokens": 1200
    }
}
```

Response:

```txt
Content-Type: application/x-ndjson
Cache-Control: no-cache
```

---

## Task 2 — Verify JWT

Trước khi generate character, backend phải verify token.

Luồng:

```txt
1. Đọc Authorization header.
2. Lấy Bearer token.
3. Verify JWT.
4. Nếu thiếu hoặc sai token, trả 401.
5. Nếu hợp lệ, tiếp tục xử lý.
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

Response khi token sai:

```json
{
    "error": {
        "code": "AUTH_INVALID_TOKEN",
        "message": "Invalid or expired access token."
    }
}
```

---

## Task 3 — Validate request body

Backend cần validate tối thiểu:

```txt
- idea phải là string.
- idea không được rỗng.
- idea không nên quá dài.
- language nếu có chỉ được là "vi" hoặc "en".
- temperature nếu có phải là number.
- maxTokens nếu có phải là number.
```

Giới hạn đề xuất:

```txt
idea min length: 3
idea max length: 1000
maxTokens default: 1200
temperature default: 0.8
```

Response lỗi:

```json
{
    "error": {
        "code": "INVALID_GENERATE_CHARACTER_REQUEST",
        "message": "Idea is required."
    }
}
```

---

## Task 4 — Viết prompt generate character

Tạo file:

```txt
worker/src/prompts/characterGenerationPrompt.ts
```

Prompt cần ép LLM tạo dữ liệu theo schema.

Yêu cầu prompt:

```txt
- Sinh nhân vật roleplay 1-1.
- Output phải theo schema cố định.
- Không thêm markdown.
- Không thêm giải thích ngoài JSON.
- Nội dung theo language request.
- Field phải đầy đủ.
- tags là array string.
- exampleDialogues là array string.
```

Schema mô tả cho model:

```json
{
    "name": "string",
    "description": "string",
    "personality": "string",
    "scenario": "string",
    "firstMessage": "string",
    "appearance": "string",
    "speakingStyle": "string",
    "tags": ["string"],
    "exampleDialogues": ["string"]
}
```

Ghi chú safety:

```txt
Nếu idea có nội dung sexual hóa trẻ em, vị thành niên hoặc minor-coded character, hệ thống phải từ chối hoặc chuyển hướng sang nhân vật trưởng thành.
```

---

## Task 5 — Gọi LLM provider

Tái sử dụng LLM client từ Sprint 2:

```txt
worker/src/lib/llmClient.ts
```

Request gửi tới provider:

```json
{
    "model": "model-name",
    "messages": [
        {
            "role": "system",
            "content": "You generate structured character JSON..."
        },
        {
            "role": "user",
            "content": "Idea: Tôi muốn một nữ kiếm sĩ cổ trang..."
        }
    ],
    "temperature": 0.8,
    "max_tokens": 1200,
    "stream": true
}
```

Nếu provider hỗ trợ JSON mode hoặc structured output, ưu tiên dùng.

Nếu provider không hỗ trợ JSON mode, prompt phải chặt hơn và backend cần tolerant parser.

---

## Task 6 — Transform raw LLM stream thành NDJSON events

Tạo module:

```txt
worker/src/lib/structuredStream.ts
```

Mục tiêu:

```txt
Raw LLM stream
  -> parse delta content
  -> tích lũy buffer
  -> phát hiện field/path
  -> emit NDJSON events
```

Event type:

```ts
type CharacterStreamEvent =
    | {
          seq: number;
          type: 'stream_started';
          streamId: string;
      }
    | {
          seq: number;
          type: 'field_delta';
          path: keyof GeneratedCharacterDraft;
          delta: string;
      }
    | {
          seq: number;
          type: 'field_done';
          path: keyof GeneratedCharacterDraft;
          value: unknown;
      }
    | {
          seq: number;
          type: 'array_item';
          path: 'tags' | 'exampleDialogues';
          index: number;
          value: string;
      }
    | {
          seq: number;
          type: 'done';
      }
    | {
          seq: number;
          type: 'error';
          code: string;
          message: string;
          partial?: Partial<GeneratedCharacterDraft>;
      };
```

---

## Task 7 — MVP parser strategy

Trong Sprint 3, có thể chọn một trong hai hướng.

### Hướng A — Parse JSON stream thật

Backend đọc JSON token stream và emit event theo path.

Ưu điểm:

```txt
- Gần với yêu cầu streaming JSON gốc.
- Có thể xử lý field theo đúng thứ tự model sinh ra.
```

Nhược điểm:

```txt
- Khó làm ổn định.
- Dễ lỗi nếu LLM sinh JSON không chuẩn.
- Cần parser incremental tốt.
```

### Hướng B — Prompt model sinh từng event NDJSON trực tiếp

Yêu cầu LLM trả thẳng từng dòng NDJSON:

```jsonl
{"type":"field_delta","path":"name","delta":"Nguyệt"}
{"type":"field_delta","path":"name","delta":" Cơ"}
{"type":"field_done","path":"name","value":"Nguyệt Cơ"}
```

Ưu điểm:

```txt
- Dễ làm MVP.
- Frontend parse rất dễ.
- Có thể demo nhanh.
```

Nhược điểm:

```txt
- LLM có thể sinh event sai format.
- Backend vẫn cần validate event.
```

### Khuyến nghị Sprint 3

Làm theo hướng B trước để có MVP chạy được, nhưng backend vẫn phải validate từng event trước khi forward sang frontend.

Sau này có thể nâng cấp sang hướng A hoặc dùng thư viện `json-stream-parser`.

---

## Task 8 — Chuẩn hóa event trước khi gửi frontend

Backend không nên forward mù quáng tất cả output từ LLM.

Cần validate:

```txt
- Event phải parse được JSON.
- Event phải có type hợp lệ.
- path phải thuộc schema cho phép.
- delta phải là string.
- array_item chỉ áp dụng cho tags hoặc exampleDialogues.
- seq do backend tự gán, không tin seq từ LLM.
```

Nếu LLM sinh event sai:

```txt
- Bỏ qua event lỗi nếu nhẹ.
- Hoặc gửi event error nếu không thể tiếp tục.
- Giữ partial result.
```

---

## Task 9 — Gửi partial error event

Nếu stream lỗi giữa chừng, backend gửi event:

```json
{
    "seq": 42,
    "type": "error",
    "code": "STREAM_INTERRUPTED",
    "message": "The stream was interrupted.",
    "partial": {
        "name": "Nguyệt Cơ",
        "description": "Một android cổ trang..."
    }
}
```

Nếu lỗi xảy ra trước khi stream bắt đầu, trả JSON error bình thường.

Nếu lỗi xảy ra sau khi đã stream, gửi NDJSON error event nếu còn có thể ghi vào stream.

---

## 8. Frontend Tasks

## Task 1 — Tạo NDJSON stream reader

Tạo file:

```txt
src/services/streaming/ndjsonStreamReader.ts
```

Function đề xuất:

```ts
type ReadNdjsonStreamOptions<TEvent> = {
    response: Response;
    signal?: AbortSignal;
    onEvent: (event: TEvent) => void;
};

async function readNdjsonStream<TEvent>(options: ReadNdjsonStreamOptions<TEvent>): Promise<void>;
```

Nhiệm vụ:

```txt
1. Lấy response.body.
2. Đọc chunk bằng ReadableStream reader.
3. Decode bằng TextDecoder.
4. Tách từng dòng bằng "\n".
5. Parse từng dòng JSON.
6. Gọi onEvent(event).
7. Giữ lại line dang dở sang chunk tiếp theo.
```

Cần xử lý trường hợp chunk bị cắt giữa dòng:

```txt
Chunk 1: {"type":"field_delta","path":"name",
Chunk 2: "delta":"Nguyệt"}
```

Reader phải ghép lại trước khi parse.

---

## Task 2 — Tạo character generation API client

Tạo file:

```txt
src/features/character-generation/services/characterGenerationApi.ts
```

Function:

```ts
type GenerateCharacterStreamParams = {
    idea: string;
    modelProfileId?: string;
    language?: 'vi' | 'en';
    signal?: AbortSignal;
    onEvent: (event: CharacterStreamEvent) => void;
};

async function generateCharacterStream(params: GenerateCharacterStreamParams): Promise<void>;
```

Nhiệm vụ:

```txt
1. Gửi POST /generate-character/stream.
2. Gắn Authorization header.
3. Gửi idea/model/language.
4. Đọc response NDJSON bằng ndjsonStreamReader.
5. Emit event cho reducer.
```

---

## Task 3 — Tạo reducer xử lý event

Tạo file:

```txt
src/features/character-generation/state/characterGenerationReducer.ts
```

State:

```ts
type StreamFieldState<T> = {
    value: T;
    status: 'pending' | 'streaming' | 'done' | 'error';
    error?: string;
};

type CharacterGenerationState = {
    streamId?: string;
    seq: number;
    streamStatus: 'idle' | 'starting' | 'streaming' | 'done' | 'partial_error' | 'cancelled';

    fields: {
        name: StreamFieldState<string>;
        description: StreamFieldState<string>;
        personality: StreamFieldState<string>;
        scenario: StreamFieldState<string>;
        firstMessage: StreamFieldState<string>;
        appearance: StreamFieldState<string>;
        speakingStyle: StreamFieldState<string>;
        tags: StreamFieldState<string[]>;
        exampleDialogues: StreamFieldState<string[]>;
    };
};
```

Reducer xử lý:

```txt
stream_started
  -> set streamId
  -> streamStatus = streaming

field_delta
  -> append delta vào field.value
  -> field.status = streaming

field_done
  -> set field.value = value
  -> field.status = done

array_item
  -> thêm item vào array field
  -> field.status = streaming

done
  -> streamStatus = done
  -> field nào chưa done thì set done nếu có value

error
  -> streamStatus = partial_error
  -> field đang streaming chuyển error hoặc giữ partial
```

---

## Task 4 — Tạo test UI đơn giản

Sprint 3 chưa cần UI đẹp. Chỉ cần một màn test hoặc component tạm:

```txt
Character Generation Debug Panel
```

UI tối thiểu:

```txt
[Idea input]
[Start stream]
[Cancel]

Name: ...
Description: ...
Personality: ...
Scenario: ...
First message: ...
Appearance: ...
Speaking style: ...
Tags: ...
Example dialogues: ...

Raw events:
...
```

Mục tiêu là chứng minh stream parser và reducer hoạt động.

UX hoàn chỉnh sẽ làm ở Sprint 4.

---

## Task 5 — Hỗ trợ cancel stream

Dùng `AbortController`.

Luồng:

```txt
User bấm Cancel
  -> abort controller
  -> dừng fetch stream
  -> streamStatus = cancelled
  -> giữ partial data
```

Không xóa state khi cancel.

---

## Task 6 — Giữ partial data

Trong lúc stream, frontend nên cập nhật state ngay sau mỗi event.

Nếu stream lỗi:

```txt
- Không reset form.
- Không xóa field đã có.
- Đánh dấu streamStatus = partial_error.
- Cho phép Sprint 4 tiếp tục từ partial draft.
```

Trong Sprint 3, chỉ cần giữ state trong memory. IndexedDB partial save có thể làm ở Sprint 4.

---

## 9. Event Specification

## `stream_started`

Báo stream bắt đầu.

```json
{
    "seq": 1,
    "type": "stream_started",
    "streamId": "str_abc"
}
```

Frontend xử lý:

```txt
- Lưu streamId.
- Set streamStatus = streaming.
```

---

## `field_delta`

Báo một đoạn text mới của field.

```json
{
    "seq": 2,
    "type": "field_delta",
    "path": "description",
    "delta": "Một android cổ trang"
}
```

Frontend xử lý:

```txt
- Append delta vào fields.description.value.
- Set fields.description.status = streaming.
```

---

## `field_done`

Báo field đã hoàn tất.

```json
{
    "seq": 10,
    "type": "field_done",
    "path": "description",
    "value": "Một android cổ trang được tạo ra để bảo vệ hoàng thành."
}
```

Frontend xử lý:

```txt
- Set field value bằng value.
- Set field status = done.
```

---

## `array_item`

Báo một item mới trong array.

```json
{
    "seq": 11,
    "type": "array_item",
    "path": "tags",
    "index": 0,
    "value": "android"
}
```

Frontend xử lý:

```txt
- Thêm hoặc set item tại index.
- Set array field status = streaming.
```

---

## `done`

Báo stream hoàn tất.

```json
{
    "seq": 30,
    "type": "done"
}
```

Frontend xử lý:

```txt
- Set streamStatus = done.
- Mark các field còn lại là done nếu đã có value.
```

---

## `error`

Báo lỗi trong stream.

```json
{
    "seq": 31,
    "type": "error",
    "code": "STREAM_INTERRUPTED",
    "message": "The stream was interrupted.",
    "partial": {
        "name": "Nguyệt Cơ",
        "description": "Một android cổ trang..."
    }
}
```

Frontend xử lý:

```txt
- Set streamStatus = partial_error.
- Merge partial nếu có.
- Không xóa dữ liệu đã stream.
```

---

## 10. API Specification

## `POST /generate-character/stream`

### Headers

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Request Body

```json
{
    "idea": "Tôi muốn một nữ kiếm sĩ cổ trang là android, lạnh lùng nhưng dịu dàng",
    "language": "vi",
    "modelProfileId": "model_default",
    "options": {
        "temperature": 0.8,
        "maxTokens": 1200
    }
}
```

### Response `200`

```http
Content-Type: application/x-ndjson
Cache-Control: no-cache
```

Body stream:

```jsonl
{"seq":1,"type":"stream_started","streamId":"str_abc"}
{"seq":2,"type":"field_delta","path":"name","delta":"Nguyệt"}
{"seq":3,"type":"field_delta","path":"name","delta":" Cơ"}
{"seq":4,"type":"field_done","path":"name","value":"Nguyệt Cơ"}
{"seq":5,"type":"array_item","path":"tags","index":0,"value":"android"}
{"seq":6,"type":"done"}
```

### Response `400`

```json
{
    "error": {
        "code": "INVALID_GENERATE_CHARACTER_REQUEST",
        "message": "Idea is required."
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

## 11. Error Handling

## 11.1. Lỗi trước khi stream bắt đầu

Các lỗi này trả JSON error bình thường:

```txt
- Thiếu token.
- Token sai.
- Body sai.
- Idea rỗng.
- Provider API key sai trước khi nhận stream.
```

Ví dụ:

```json
{
    "error": {
        "code": "INVALID_GENERATE_CHARACTER_REQUEST",
        "message": "Idea is required."
    }
}
```

---

## 11.2. Lỗi trong lúc stream

Nếu lỗi xảy ra sau khi stream đã bắt đầu:

```txt
- Cố gắng gửi event error dạng NDJSON.
- Gửi partial result nếu có.
- Đóng stream.
- Frontend giữ dữ liệu đã nhận.
```

Ví dụ:

```jsonl
{
    "seq": 40,
    "type": "error",
    "code": "STREAM_INTERRUPTED",
    "message": "The stream was interrupted.",
    "partial": {
        "name": "Nguyệt Cơ"
    }
}
```

---

## 11.3. LLM trả event sai format

Nếu LLM trả dòng không parse được:

```txt
- Backend không forward dòng đó.
- Ghi nhận lỗi nội bộ.
- Nếu lỗi quá nhiều, gửi event error.
```

Ví dụ error:

```json
{
    "seq": 22,
    "type": "error",
    "code": "INVALID_LLM_STREAM_FORMAT",
    "message": "The model returned invalid structured stream data."
}
```

---

## 12. Test Cases

## 12.1. Backend tests

### Test 1 — Thiếu token

```txt
Given không có Authorization header
When gọi POST /generate-character/stream
Then response status = 401
And error.code = AUTH_MISSING_TOKEN
```

### Test 2 — Token sai

```txt
Given token không hợp lệ
When gọi POST /generate-character/stream
Then response status = 401
And error.code = AUTH_INVALID_TOKEN
```

### Test 3 — Idea rỗng

```txt
Given JWT hợp lệ
And idea rỗng
When gọi POST /generate-character/stream
Then response status = 400
And error.code = INVALID_GENERATE_CHARACTER_REQUEST
```

### Test 4 — Stream thành công

```txt
Given JWT hợp lệ
And idea hợp lệ
When gọi POST /generate-character/stream
Then response status = 200
And content-type = application/x-ndjson
And stream có event stream_started
And stream có field_delta
And stream có done
```

### Test 5 — Event có seq tăng dần

```txt
Given stream đang chạy
When backend gửi nhiều event
Then mỗi event có seq tăng dần
```

### Test 6 — LLM stream lỗi giữa chừng

```txt
Given LLM stream bị lỗi sau khi đã trả vài token
When backend xử lý lỗi
Then backend gửi error event nếu có thể
And partial result không bị mất
```

---

## 12.2. Frontend tests

### Test 1 — NDJSON reader đọc được nhiều dòng

```txt
Given response body chứa nhiều dòng NDJSON
When ndjsonStreamReader đọc stream
Then onEvent được gọi cho từng dòng
```

### Test 2 — NDJSON reader xử lý dòng bị cắt

```txt
Given một JSON line bị chia thành 2 chunk
When reader nhận chunk
Then reader ghép line đúng
And parse event thành công
```

### Test 3 — field_delta append text

```txt
Given state ban đầu
When nhận field_delta path = name delta = "Nguyệt"
Then fields.name.value = "Nguyệt"
And fields.name.status = streaming
```

### Test 4 — field_done hoàn tất field

```txt
Given name đang streaming
When nhận field_done path = name value = "Nguyệt Cơ"
Then fields.name.value = "Nguyệt Cơ"
And fields.name.status = done
```

### Test 5 — array_item thêm item

```txt
Given tags = []
When nhận array_item path = tags index = 0 value = "android"
Then tags = ["android"]
```

### Test 6 — error giữ partial data

```txt
Given state đã có name và description một phần
When nhận event error
Then streamStatus = partial_error
And name/description không bị xóa
```

### Test 7 — cancel stream

```txt
Given stream đang chạy
When user bấm Cancel
Then AbortController.abort được gọi
And streamStatus = cancelled
And partial data vẫn giữ nguyên
```

---

## 13. Definition of Done

Sprint 3 hoàn thành khi đạt đủ các điều kiện sau:

- Có endpoint `POST /generate-character/stream`.
- Endpoint yêu cầu JWT hợp lệ.
- Backend gọi được LLM để sinh character draft.
- Backend trả response dạng `application/x-ndjson`.
- Backend emit được các event:
    - `stream_started`
    - `field_delta`
    - `field_done`
    - `array_item`
    - `done`
    - `error`

- Frontend có NDJSON stream reader.
- Frontend có reducer xử lý character generation event.
- Text field được update dần bằng `field_delta`.
- Array field được update bằng `array_item`.
- Stream lỗi vẫn giữ partial data.
- User cancel stream thì partial data không bị xóa.
- Có test UI/debug panel để demo streaming structured data.

---

## 14. Demo cuối Sprint

Kịch bản demo:

```txt
1. Mở app.
2. Login as Guest.
3. Mở Character Generation Debug Panel.
4. Nhập idea:
   "Tôi muốn một nữ kiếm sĩ cổ trang là android, lạnh lùng nhưng dịu dàng"
5. Bấm Start Stream.
6. Quan sát event stream bắt đầu.
7. Field name hiện dần.
8. Field description/personality/scenario hiện dần.
9. Tags xuất hiện từng item.
10. Stream hoàn tất với event done.
11. Chạy lại lần nữa và bấm Cancel giữa chừng.
12. Partial data vẫn còn trên UI.
```

Kết quả mong muốn:

```txt
Hệ thống đã chứng minh được khả năng stream dữ liệu có cấu trúc và render dần trên frontend.
```

---

## 15. Rủi ro

## Rủi ro 1 — LLM không tuân thủ format NDJSON

Cách xử lý:

```txt
- Prompt chặt hơn.
- Backend validate từng event.
- Bỏ qua event sai nếu không nghiêm trọng.
- Nếu sai quá nhiều, trả error event.
```

---

## Rủi ro 2 — JSON line bị cắt giữa chunk

Cách xử lý:

```txt
- NDJSON reader phải có buffer.
- Chỉ parse khi gặp newline.
- Dòng dang dở giữ lại cho chunk sau.
```

---

## Rủi ro 3 — Stream lỗi giữa chừng

Cách xử lý:

```txt
- Giữ partial result.
- Gửi error event nếu có thể.
- Frontend không reset state.
```

---

## Rủi ro 4 — Field dài làm UI giật

Cách xử lý:

```txt
- Batch update nếu cần.
- Debounce render nhẹ ở frontend.
- Không update toàn bộ form nếu chỉ một field thay đổi.
```

---

## Rủi ro 5 — Model sinh nội dung không phù hợp

Cách xử lý:

```txt
- Thêm safety instruction trong prompt.
- Validate idea đầu vào.
- Chặn hoặc rewrite nội dung minor-coded sexual content.
- Sprint sau có thể thêm moderation rõ hơn.
```

---

## 16. Technical Debt ghi nhận

Các phần có thể chưa hoàn chỉnh trong Sprint 3:

```txt
- Chưa có resume stream thật sự.
- Chưa lưu stream session lên server.
- Chưa lưu partial draft vào IndexedDB.
- Chưa có UI tạo nhân vật hoàn chỉnh.
- Parser MVP có thể phụ thuộc vào việc LLM sinh đúng NDJSON.
- Chưa có json-stream-parser thật sự cho JSON object thô.
- Chưa có retry thông minh.
```

---

## 17. Ghi chú cho Sprint 4

Sprint 4 sẽ dùng nền tảng Sprint 3 để làm UX chính thức:

```txt
Create Character with AI
  -> nhập idea
  -> form tự fill
  -> field disabled khi stream
  -> stream xong unlock
  -> user chỉnh sửa
  -> save thành character thật
```

Sprint 3 cần bàn giao cho Sprint 4:

```txt
- API `/generate-character/stream`.
- Event specification.
- NDJSON reader.
- Character generation reducer.
- Debug panel hoặc component test.
- Cách giữ partial data.
- Cách cancel stream.
```

---

## 18. Kết luận Sprint 3

Sprint 3 là sprint kỹ thuật lõi của toàn bộ yêu cầu mới.

Nếu Sprint 3 hoàn thành tốt, nhóm sẽ có nền tảng để triển khai trải nghiệm quan trọng nhất của sản phẩm:

```txt
Người dùng nhập một ý tưởng nhân vật
  -> hệ thống tạo dữ liệu có cấu trúc
  -> form hiển thị từng field ngay trong lúc stream
  -> không cần chờ toàn bộ JSON hoàn tất
  -> lỗi giữa chừng vẫn giữ được bản nháp
```

Đây là nền tảng trực tiếp cho Sprint 4 — AI Character Generation UX.
