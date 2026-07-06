# Sprint 6 — Server Storage + Sync Cơ Bản

## 1. Mục tiêu Sprint

Sprint 6 tập trung bổ sung khả năng **lưu dữ liệu trên server** và xây dựng cơ chế **đồng bộ cơ bản giữa Local và Server**.

Sau sprint này, ứng dụng không chỉ lưu dữ liệu trong trình duyệt bằng IndexedDB nữa. Các dữ liệu quan trọng như nhân vật, tin nhắn và model profile có thể được lưu lên backend theo user guest hiện tại.

Mục tiêu chính:

```txt id="kpqj2m"
Local vẫn là nơi ghi trước.
Server là nơi đồng bộ sau.
Nếu server lỗi, dữ liệu local không được mất.
```

---

## 2. Bối cảnh

Ở các sprint trước, hệ thống đã có:

```txt id="5ojdib"
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
  - Save generated character vào local

Sprint 5:
  - Model Management
  - Model profile local hoặc server-ready
```

Tuy nhiên, dữ liệu chính của app vẫn chủ yếu nằm ở local browser:

```txt id="64yzwd"
IndexedDB
  - characters
  - messages
  - settings
  - model_profiles
```

Điều này có vấn đề:

```txt id="iysx9i"
- Đổi trình duyệt là mất dữ liệu.
- Xóa site data là mất dữ liệu.
- Không có server backup.
- Không chuẩn bị được cho multi-device.
- Không có nền để làm sync/offline-first nâng cao.
```

Sprint 6 sẽ thêm server storage và sync cơ bản để chuẩn bị cho Sprint 7.

---

## 3. Phạm vi công việc

### 3.1. Trong phạm vi Sprint 6

Sprint này bao gồm:

- Thiết kế server schema cho dữ liệu chính.
- Tạo database server-side.
- Tạo API CRUD cho characters.
- Tạo API CRUD cho messages.
- Tạo API CRUD cho model profiles nếu Sprint 5 chưa làm server-side.
- Thêm metadata sync vào local entity.
- Local write trước, server sync sau.
- Push local changes lên server.
- Pull server data về local.
- Hiển thị trạng thái đồng bộ cơ bản.
- Không làm mất dữ liệu nếu server request fail.
- Có retry thủ công hoặc tự động đơn giản.

### 3.2. Ngoài phạm vi Sprint 6

Sprint này chưa làm hoàn chỉnh:

- Offline mutation queue nâng cao.
- Conflict resolution UI phức tạp.
- Multi-device sync hoàn chỉnh.
- Realtime collaboration.
- Resume stream server-side.
- Soft delete nâng cao cho mọi entity.
- Version history.
- Encryption at rest cho API key.
- Full offline-first bằng React Query persistence.
- Background sync bằng Service Worker.

---

## 4. Nguyên tắc thiết kế

## 4.1. Local-first đơn giản

Khi user tạo hoặc sửa dữ liệu:

```txt id="v0imbx"
1. Ghi vào IndexedDB trước.
2. Cập nhật UI ngay.
3. Đánh dấu syncStatus = pending.
4. Gửi request lên server.
5. Nếu thành công: syncStatus = synced.
6. Nếu thất bại: giữ dữ liệu local và syncStatus = error hoặc pending.
```

Không được làm theo kiểu:

```txt id="hqi4uw"
User bấm Save
  -> chờ server
  -> server success mới hiển thị UI
```

Vì cách đó làm UX chậm và không phù hợp offline-first.

---

## 4.2. Server là bản đồng bộ, không thay thế local ngay

Trong Sprint 6:

```txt id="g00ecl"
Local vẫn là nguồn đọc nhanh cho UI.
Server dùng để backup/sync.
```

Frontend nên đọc từ IndexedDB để render nhanh, sau đó pull server data và merge vào local.

---

## 4.3. Conflict xử lý đơn giản

Sprint 6 chỉ cần conflict strategy tối thiểu:

```txt id="6njdvz"
Last write wins
```

Quy tắc:

```txt id="vruj50"
Bản nào có updatedAt mới hơn thì thắng.
```

Conflict UI chi tiết để Sprint 7 hoặc sau đó.

---

## 5. Entity cần đồng bộ

Sprint 6 nên tập trung vào 3 nhóm dữ liệu:

```txt id="1vzpfr"
1. Characters
2. Messages
3. Model Profiles
```

Settings nhỏ có thể giữ local trước nếu chưa cần sync.

---

## 6. Sync Metadata

Mỗi entity local nên có metadata đồng bộ.

```ts id="uscdaj"
type SyncStatus = 'synced' | 'pending_create' | 'pending_update' | 'pending_delete' | 'sync_error' | 'conflict';

type SyncMeta = {
    localId: string;
    serverId?: string;

    createdAt: string;
    updatedAt: string;

    localUpdatedAt: string;
    serverUpdatedAt?: string;

    syncStatus: SyncStatus;
    syncError?: string;

    version: number;
};
```

Ví dụ Character local:

```ts id="totw9i"
type LocalCharacter = Character & SyncMeta;
```

Ví dụ Message local:

```ts id="p0mt38"
type LocalMessage = Message & SyncMeta;
```

Ví dụ Model Profile local:

```ts id="n1b2h3"
type LocalModelProfile = AiModelProfile & SyncMeta;
```

---

## 7. Server Database Design

Nếu dùng Cloudflare Workers, database đề xuất là **Cloudflare D1** cho dữ liệu quan hệ.

Các bảng tối thiểu:

```txt id="z7und2"
users
characters
messages
model_profiles
```

Với guest login hiện tại, user có thể chỉ tồn tại thông qua JWT. Tuy nhiên, để lưu server-side ổn định, nên có bảng `users`.

---

## 7.1. Bảng `users`

```sql id="fd5hu3"
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

Ví dụ:

```txt id="nk4tf2"
id: guest_01JXYZABC
type: guest
```

---

## 7.2. Bảng `characters`

```sql id="mzskxd"
CREATE TABLE characters (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,

  name TEXT NOT NULL,
  description TEXT,
  personality TEXT,
  scenario TEXT,
  first_message TEXT,
  appearance TEXT,
  speaking_style TEXT,

  tags_json TEXT,
  example_dialogues_json TEXT,
  avatar_url TEXT,
  metadata_json TEXT,

  deleted_at TEXT,

  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,

  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

Ghi chú:

```txt id="u5bb4d"
tags_json và example_dialogues_json lưu JSON string để đơn giản.
Nếu sau này cần query tag, có thể tách bảng character_tags.
```

---

## 7.3. Bảng `messages`

```sql id="inys45"
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  character_id TEXT NOT NULL,

  role TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT,

  metadata_json TEXT,

  deleted_at TEXT,

  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,

  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (character_id) REFERENCES characters(id)
);
```

Role hợp lệ:

```txt id="23miga"
user
assistant
system
```

Status đề xuất:

```txt id="91gjl4"
completed
streaming
cancelled
error
```

Lưu ý:

```txt id="nm80xq"
Không nên sync message đang streaming dở nếu chưa cần.
Có thể chỉ sync khi message completed/cancelled/error.
```

---

## 7.4. Bảng `model_profiles`

```sql id="66qvck"
CREATE TABLE model_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,

  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  base_url TEXT NOT NULL,
  api_key_encrypted TEXT,
  model_name TEXT NOT NULL,

  temperature REAL NOT NULL,
  max_tokens INTEGER NOT NULL,

  supports_streaming INTEGER NOT NULL DEFAULT 1,
  supports_json_mode INTEGER NOT NULL DEFAULT 0,
  is_default INTEGER NOT NULL DEFAULT 0,

  deleted_at TEXT,

  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,

  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

Nếu Sprint 6 chưa xử lý mã hóa API key, có thể:

```txt id="i6cdq1"
- Không lưu apiKey server-side.
- Hoặc chỉ dùng env API key.
- Hoặc ghi rõ api_key_encrypted là technical debt chưa implement.
```

Không nên lưu API key thô vào database production.

---

## 8. Backend API Design

Tất cả endpoint cần JWT:

```http id="pa1yxm"
Authorization: Bearer <jwt_token>
```

Backend lấy userId từ JWT:

```txt id="xieewa"
userId = jwt.sub
```

---

## 8.1. Character APIs

```txt id="sxnp9h"
GET    /characters
POST   /characters
GET    /characters/:id
PUT    /characters/:id
DELETE /characters/:id
```

### `GET /characters`

Response:

```json id="wsmmu4"
{
    "characters": [
        {
            "id": "char_server_123",
            "name": "Nguyệt Cơ",
            "description": "Một android cổ trang...",
            "personality": "Lạnh lùng nhưng dịu dàng...",
            "scenario": "Hoàng thành sau chiến tranh...",
            "firstMessage": "Ngươi gọi ta sao?",
            "appearance": "Dáng vẻ cổ trang...",
            "speakingStyle": "Điềm tĩnh, ít lời",
            "tags": ["android", "cổ trang"],
            "exampleDialogues": ["User: Xin chào\nCharacter: ..."],
            "createdAt": "2026-07-02T00:00:00.000Z",
            "updatedAt": "2026-07-02T00:00:00.000Z",
            "version": 1
        }
    ]
}
```

### `POST /characters`

Request:

```json id="xk3mgc"
{
    "clientId": "local_char_abc",
    "name": "Nguyệt Cơ",
    "description": "Một android cổ trang...",
    "personality": "Lạnh lùng nhưng dịu dàng...",
    "scenario": "Hoàng thành sau chiến tranh...",
    "firstMessage": "Ngươi gọi ta sao?",
    "appearance": "Dáng vẻ cổ trang...",
    "speakingStyle": "Điềm tĩnh",
    "tags": ["android", "cổ trang"],
    "exampleDialogues": []
}
```

Response:

```json id="lm31ii"
{
    "character": {
        "id": "char_server_123",
        "clientId": "local_char_abc",
        "name": "Nguyệt Cơ",
        "updatedAt": "2026-07-02T00:00:00.000Z",
        "version": 1
    }
}
```

### `PUT /characters/:id`

Request:

```json id="kysw09"
{
    "name": "Nguyệt Cơ",
    "description": "Mô tả đã chỉnh sửa",
    "updatedAt": "2026-07-02T00:10:00.000Z",
    "version": 1
}
```

Response:

```json id="0tshk7"
{
    "character": {
        "id": "char_server_123",
        "name": "Nguyệt Cơ",
        "description": "Mô tả đã chỉnh sửa",
        "updatedAt": "2026-07-02T00:10:10.000Z",
        "version": 2
    }
}
```

### `DELETE /characters/:id`

Nên dùng soft delete:

```sql id="nmzmw7"
UPDATE characters
SET deleted_at = ?, updated_at = ?, version = version + 1
WHERE id = ? AND user_id = ?;
```

Response:

```json id="xgtbt4"
{
    "ok": true
}
```

---

## 8.2. Message APIs

```txt id="6wq0is"
GET    /messages?characterId=...
POST   /messages
PUT    /messages/:id
DELETE /messages/:id
```

### `GET /messages?characterId=...`

Response:

```json id="fub709"
{
    "messages": [
        {
            "id": "msg_server_123",
            "characterId": "char_server_123",
            "role": "user",
            "content": "Xin chào",
            "status": "completed",
            "createdAt": "2026-07-02T00:00:00.000Z",
            "updatedAt": "2026-07-02T00:00:00.000Z",
            "version": 1
        }
    ]
}
```

### `POST /messages`

Request:

```json id="aprxp2"
{
    "clientId": "local_msg_abc",
    "characterId": "char_server_123",
    "role": "user",
    "content": "Xin chào",
    "status": "completed"
}
```

Response:

```json id="fsnfif"
{
    "message": {
        "id": "msg_server_123",
        "clientId": "local_msg_abc",
        "updatedAt": "2026-07-02T00:00:00.000Z",
        "version": 1
    }
}
```

---

## 8.3. Model Profile APIs

Nếu Sprint 5 đã làm server API thì Sprint 6 chỉ cần tích hợp sync. Nếu chưa làm, bổ sung:

```txt id="6gn8nh"
GET    /models
POST   /models
PUT    /models/:id
DELETE /models/:id
```

Model profile response không nên trả API key thô.

---

## 8.4. Sync APIs

Để chuẩn bị cho Sprint 7, Sprint 6 nên thêm API sync cơ bản:

```txt id="gihhnt"
GET  /sync/pull?since=<timestamp>
POST /sync/push
```

### `GET /sync/pull`

Request:

```http id="wlyw7v"
GET /sync/pull?since=2026-07-02T00:00:00.000Z
Authorization: Bearer <jwt_token>
```

Response:

```json id="j5vmd8"
{
    "serverTime": "2026-07-02T00:10:00.000Z",
    "changes": [
        {
            "entity": "character",
            "operation": "upsert",
            "serverId": "char_server_123",
            "data": {
                "name": "Nguyệt Cơ",
                "description": "Một android cổ trang..."
            },
            "serverUpdatedAt": "2026-07-02T00:05:00.000Z",
            "version": 2
        }
    ]
}
```

### `POST /sync/push`

Request:

```json id="jc2u6l"
{
    "changes": [
        {
            "entity": "character",
            "operation": "create",
            "localId": "local_char_abc",
            "serverId": null,
            "data": {
                "name": "Nguyệt Cơ",
                "description": "Một android cổ trang..."
            },
            "localUpdatedAt": "2026-07-02T00:02:00.000Z",
            "version": 1
        }
    ]
}
```

Response:

```json id="5ciwdl"
{
    "results": [
        {
            "localId": "local_char_abc",
            "serverId": "char_server_123",
            "status": "synced",
            "serverUpdatedAt": "2026-07-02T00:02:05.000Z",
            "version": 1
        }
    ],
    "serverTime": "2026-07-02T00:02:05.000Z"
}
```

---

## 9. Frontend Structure

Tạo hoặc bổ sung module:

```txt id="127smj"
src/
  features/
    sync/
      hooks/
        useSync.ts
      services/
        syncApi.ts
      state/
        syncQueue.ts
      types.ts
      components/
        SyncStatusBadge.tsx
        SyncStatusPanel.tsx

  services/
    storage/
      characterRepository.ts
      messageRepository.ts
      modelProfileRepository.ts
```

---

## 10. Frontend Tasks

## Task 1 — Thêm sync metadata vào local schema

Cập nhật IndexedDB store cho:

```txt id="fjyi7o"
characters
messages
model_profiles
```

Mỗi record cần có:

```txt id="p4xpe8"
localId
serverId
syncStatus
localUpdatedAt
serverUpdatedAt
version
syncError
```

Nếu không muốn đổi toàn bộ schema ngay, có thể thêm field optional để backward compatible.

---

## Task 2 — Tạo repository layer

Không nên để UI gọi IndexedDB trực tiếp quá nhiều.

Tạo:

```txt id="rv1oji"
characterRepository.ts
messageRepository.ts
modelProfileRepository.ts
```

Ví dụ API:

```ts id="gz4l8x"
type CharacterRepository = {
    list(): Promise<LocalCharacter[]>;
    get(localId: string): Promise<LocalCharacter | undefined>;
    create(input: CharacterInput): Promise<LocalCharacter>;
    update(localId: string, patch: Partial<CharacterInput>): Promise<LocalCharacter>;
    markSynced(localId: string, serverData: SyncResult): Promise<void>;
    markSyncError(localId: string, error: string): Promise<void>;
};
```

Nguyên tắc:

```txt id="dggd31"
UI gọi repository.
Repository xử lý sync metadata.
Sync service xử lý push/pull.
```

---

## Task 3 — Local write trước

Khi tạo character:

```txt id="ju7oq0"
1. Tạo localId.
2. Ghi vào IndexedDB.
3. syncStatus = pending_create.
4. UI update ngay.
5. Gọi sync push.
```

Khi sửa character:

```txt id="w6lg3u"
1. Update IndexedDB.
2. localUpdatedAt = now.
3. syncStatus = pending_update.
4. UI update ngay.
5. Gọi sync push.
```

Khi xóa character:

```txt id="f4nfcx"
1. Mark deleted local.
2. syncStatus = pending_delete.
3. Ẩn khỏi UI.
4. Gọi sync push.
```

Không xóa cứng ngay nếu còn cần sync delete lên server.

---

## Task 4 — Tạo `syncApi`

File:

```txt id="fpzszo"
src/features/sync/services/syncApi.ts
```

Functions:

```ts id="m4sjdf"
type SyncApi = {
    pushChanges(changes: SyncChange[]): Promise<SyncPushResponse>;
    pullChanges(since?: string): Promise<SyncPullResponse>;
};
```

---

## Task 5 — Tạo `useSync`

File:

```txt id="t24fvr"
src/features/sync/hooks/useSync.ts
```

Hook quản lý:

```txt id="63minn"
- Push pending local changes.
- Pull server changes.
- Track sync status.
- Expose manual sync button.
```

API đề xuất:

```ts id="tp6ctz"
type UseSyncResult = {
    status: 'idle' | 'syncing' | 'synced' | 'error';
    lastSyncedAt?: string;
    error?: string;

    syncNow: () => Promise<void>;
};
```

---

## Task 6 — Push pending changes

Quy trình:

```txt id="nd6c71"
1. Lấy tất cả records có syncStatus pending_*.
2. Convert thành SyncChange[].
3. POST /sync/push.
4. Với result success:
   - set serverId
   - set syncStatus = synced
   - set serverUpdatedAt
   - set version
5. Với result error:
   - set syncStatus = sync_error
   - lưu syncError
```

---

## Task 7 — Pull server changes

Quy trình:

```txt id="xu31kg"
1. Lấy lastSyncedAt từ local.
2. GET /sync/pull?since=lastSyncedAt.
3. Nhận changes từ server.
4. Merge từng change vào IndexedDB.
5. Cập nhật lastSyncedAt = serverTime.
```

Merge rule Sprint 6:

```txt id="s0yxcq"
Nếu local record không có pending change:
  apply server change.

Nếu local record có pending change:
  so sánh localUpdatedAt và serverUpdatedAt.
  bản mới hơn thắng.
```

Có thể đơn giản hơn:

```txt id="pxth1t"
Nếu local pending thì không overwrite bằng server trong Sprint 6.
Đánh dấu conflict nếu phát hiện server cũng mới hơn.
```

---

## Task 8 — Sync status UI

Tạo component:

```txt id="itqcn0"
SyncStatusBadge.tsx
```

Hiển thị trạng thái:

```txt id="e43gya"
Synced
Syncing...
Pending sync
Sync failed
Conflict
```

Dùng ở:

```txt id="s2q8pm"
- Character list
- Model profile list
- App header/footer
```

Ví dụ:

```txt id="0qal9i"
Character: Nguyệt Cơ    [Pending sync]
```

---

## Task 9 — Manual sync button

Tạo nút:

```txt id="nx3ei0"
[Sync Now]
```

Hành vi:

```txt id="akgemz"
User bấm Sync Now
  -> push pending changes
  -> pull server changes
  -> update status
```

Sprint 6 chưa cần auto background sync phức tạp. Nhưng có thể sync khi:

```txt id="wlq7ef"
- App mở lên
- User save entity
- User bấm Sync Now
```

---

## Task 10 — Tích hợp vào character save

Khi user save generated character ở Sprint 4:

```txt id="fhwz80"
Save Character
  -> local create
  -> syncStatus = pending_create
  -> sync push lên server
```

Nếu server success:

```txt id="nn3jv1"
syncStatus = synced
serverId = char_server_xxx
```

Nếu server fail:

```txt id="8kfsth"
syncStatus = sync_error hoặc pending_create
character vẫn tồn tại local
```

---

## Task 11 — Tích hợp vào chat messages

Khi user gửi message:

```txt id="rk9d2g"
1. Lưu user message local.
2. Sau khi assistant stream xong, lưu assistant message local.
3. Push cả hai lên server.
```

Lưu ý:

```txt id="jfi0vo"
Không bắt buộc push message trong lúc assistant đang streaming.
Chỉ push khi status = completed/cancelled/error.
```

---

## 11. Backend Tasks

## Task 1 — Setup D1

Tạo D1 database:

```bash id="vo6qi6"
wrangler d1 create chat-ai-db
```

Cập nhật `wrangler.toml`:

```toml id="a66yui"
[[d1_databases]]
binding = "DB"
database_name = "chat-ai-db"
database_id = "<database_id>"
```

Tạo migration:

```txt id="d768c0"
worker/migrations/
  0001_init.sql
```

---

## Task 2 — Tạo database access layer

Tạo folder:

```txt id="le8zt3"
worker/src/repositories/
  characterRepository.ts
  messageRepository.ts
  modelProfileRepository.ts
  userRepository.ts
```

Không nên viết SQL trực tiếp trong route quá nhiều.

---

## Task 3 — Tạo auth user ensure

Khi guest login hoặc request có JWT:

```txt id="td0i01"
- Kiểm tra user có trong DB chưa.
- Nếu chưa có, tạo user.
```

Function:

```ts id="ier8zm"
async function ensureUser(db: D1Database, userId: string): Promise<void>;
```

---

## Task 4 — CRUD characters

Implement:

```txt id="uvwaaj"
GET    /characters
POST   /characters
GET    /characters/:id
PUT    /characters/:id
DELETE /characters/:id
```

Yêu cầu:

```txt id="2g6t46"
- Chỉ lấy dữ liệu của user hiện tại.
- Không cho user A đọc/sửa/xóa dữ liệu user B.
- Soft delete bằng deleted_at.
```

---

## Task 5 — CRUD messages

Implement:

```txt id="kf3a8d"
GET    /messages?characterId=...
POST   /messages
PUT    /messages/:id
DELETE /messages/:id
```

Yêu cầu:

```txt id="80a42j"
- Message phải thuộc character của user hiện tại.
- Không cho ghi message vào character của user khác.
```

---

## Task 6 — CRUD model profiles

Nếu chưa có từ Sprint 5, implement:

```txt id="3n2jku"
GET    /models
POST   /models
PUT    /models/:id
DELETE /models/:id
```

Yêu cầu:

```txt id="ifn0d4"
- Model profile thuộc user hiện tại.
- Chỉ một model default.
- Không trả API key thô nếu lưu server-side.
```

---

## Task 7 — Implement `/sync/push`

Route:

```txt id="jx6cdn"
POST /sync/push
```

Xử lý:

```txt id="vmdqwb"
1. Verify JWT.
2. Validate changes.
3. Với mỗi change:
   - create/update/delete entity tương ứng.
   - check user ownership.
   - update version.
4. Trả mapping localId -> serverId.
```

---

## Task 8 — Implement `/sync/pull`

Route:

```txt id="noxzt4"
GET /sync/pull?since=...
```

Xử lý:

```txt id="2sv5b3"
1. Verify JWT.
2. Query characters/messages/model_profiles có updated_at > since.
3. Bao gồm cả deleted_at nếu cần sync delete.
4. Trả changes[].
5. Trả serverTime.
```

---

## 12. Error Handling

## 12.1. Server unavailable

Frontend:

```txt id="njg7tm"
- Giữ data local.
- Mark syncStatus = sync_error hoặc pending.
- Hiển thị "Sync failed".
- Cho user bấm Sync Now.
```

Không được:

```txt id="5levg8"
- Xóa character local.
- Rollback UI.
- Chặn user tiếp tục dùng app.
```

---

## 12.2. Unauthorized

Nếu `/sync/push` hoặc CRUD API trả 401:

```txt id="wjm9gz"
- Mark sync failed.
- Yêu cầu user login guest lại.
- Không xóa local data.
```

---

## 12.3. Server validation error

Ví dụ character thiếu name:

```txt id="ba42jp"
- Mark record sync_error.
- Lưu syncError.
- Hiển thị lỗi ở UI nếu user mở record đó.
```

---

## 12.4. Conflict

MVP:

```txt id="tnrsy6"
- Nếu conflict phát hiện được, mark syncStatus = conflict.
- Không overwrite dữ liệu local một cách im lặng nếu local có pending change.
```

---

## 13. Test Cases

## 13.1. Backend tests

### Test 1 — Character API cần auth

```txt id="u923tg"
Given không có token
When gọi GET /characters
Then response status = 401
```

### Test 2 — Tạo character server

```txt id="peh02h"
Given JWT hợp lệ
When gọi POST /characters với body hợp lệ
Then response status = 200 hoặc 201
And response có character.id
```

### Test 3 — Không đọc character user khác

```txt id="r3mo9k"
Given user A có character
When user B gọi GET /characters/:id của user A
Then response status = 404 hoặc 403
```

### Test 4 — Push create character

```txt id="9bgg2x"
Given local change create character
When gọi POST /sync/push
Then server tạo character
And trả mapping localId -> serverId
```

### Test 5 — Pull changes

```txt id="ak32b5"
Given server có character updated sau timestamp
When gọi GET /sync/pull?since=timestamp
Then response có change tương ứng
```

### Test 6 — Soft delete character

```txt id="rpngyr"
Given character tồn tại
When gọi DELETE /characters/:id
Then server set deleted_at
And GET /characters không trả character đó
```

---

## 13.2. Frontend tests

### Test 1 — Save local trước

```txt id="kcpyug"
Given user tạo character
When bấm Save
Then character xuất hiện ngay trong UI
And syncStatus = pending_create
```

### Test 2 — Server sync success

```txt id="pqmo7c"
Given character pending_create
When sync push thành công
Then syncStatus = synced
And serverId được lưu vào local record
```

### Test 3 — Server sync fail

```txt id="zgktrf"
Given server unavailable
When user save character
Then character vẫn tồn tại local
And syncStatus = sync_error hoặc pending_create
```

### Test 4 — Pull server data

```txt id="cpcaqw"
Given server có character mới
When frontend gọi sync pull
Then character được lưu vào IndexedDB
And hiển thị trong UI
```

### Test 5 — Update local rồi sync

```txt id="j8n6ux"
Given character đã synced
When user sửa description
Then syncStatus = pending_update
And sau sync success chuyển thành synced
```

### Test 6 — Delete local rồi sync

```txt id="13pbx7"
Given character đã synced
When user xóa character
Then local mark pending_delete
And sau sync success record bị xóa/ẩn hoàn toàn
```

---

## 14. Manual QA Checklist

```txt id="wbj4my"
[ ] Login as Guest được
[ ] Tạo character mới
[ ] Character xuất hiện ngay trong UI
[ ] Character có syncStatus pending rồi synced
[ ] Reload app character vẫn còn
[ ] Gọi GET /characters thấy character trên server
[ ] Sửa character sync lên server
[ ] Xóa character sync lên server
[ ] Gửi chat message
[ ] Message được lưu local
[ ] Message được sync server sau khi hoàn tất
[ ] Tạo model profile sync được nếu áp dụng
[ ] Tắt backend/server fail không làm mất dữ liệu local
[ ] Bấm Sync Now retry được
```

---

## 15. Definition of Done

Sprint 6 hoàn thành khi đạt đủ các điều kiện sau:

- Có server database.
- Có bảng hoặc storage cho users.
- Có bảng hoặc storage cho characters.
- Có bảng hoặc storage cho messages.
- Có bảng hoặc storage cho model profiles nếu áp dụng.
- Backend CRUD characters hoạt động.
- Backend CRUD messages hoạt động.
- Backend CRUD model profiles hoạt động nếu áp dụng.
- Backend verify user ownership.
- Frontend entity có sync metadata.
- Save character ghi local trước.
- Character sync được lên server.
- Message sync được lên server.
- Pull server data về local được.
- Sync failure không làm mất dữ liệu local.
- UI hiển thị trạng thái sync cơ bản.
- Có nút hoặc cơ chế Sync Now.
- Có API `/sync/push`.
- Có API `/sync/pull`.
- Last-write-wins hoặc rule merge tối thiểu được áp dụng.

---

## 16. Demo cuối Sprint

Kịch bản demo:

```txt id="vd3a6v"
1. Mở app.
2. Log in as Guest.
3. Tạo character bằng AI hoặc thủ công.
4. Character xuất hiện ngay trong sidebar.
5. UI hiển thị Pending Sync.
6. Sync thành công, UI chuyển thành Synced.
7. Mở database/server API để chứng minh character đã lưu trên server.
8. Sửa character.
9. UI chuyển Pending Update.
10. Sync thành công.
11. Gửi chat message.
12. Assistant trả lời xong.
13. Message được sync lên server.
14. Reload app.
15. Pull server data về local thành công.
```

Demo lỗi:

```txt id="4snjk2"
1. Tắt hoặc làm fail backend sync.
2. Tạo character mới.
3. Character vẫn xuất hiện local.
4. UI báo Sync Failed hoặc Pending Sync.
5. Bật lại backend.
6. Bấm Sync Now.
7. Character sync thành công.
```

Kết quả mong muốn:

```txt id="g0axvc"
Dữ liệu chính của app đã có thể lưu cả local và server, chuẩn bị cho offline-first nâng cao ở Sprint 7.
```

---

## 17. Rủi ro

## Rủi ro 1 — Schema local và server không khớp

Cách xử lý:

```txt id="40ngrt"
- Viết mapper rõ ràng giữa LocalCharacter và ServerCharacter.
- Không để UI phụ thuộc trực tiếp vào server DTO.
- Có migration IndexedDB cẩn thận.
```

---

## Rủi ro 2 — Guest user mất token là mất quyền truy cập data server

Cách xử lý MVP:

```txt id="3rw3tq"
- Chấp nhận trong giai đoạn guest login.
- Nhắc đây là giới hạn của guest mode.
- Sau này thêm account thật hoặc backup token.
```

---

## Rủi ro 3 — Sync delete làm mất dữ liệu

Cách xử lý:

```txt id="9uugz0"
- Dùng soft delete trên server.
- Local cũng mark pending_delete trước.
- Chỉ hard delete local khi server confirm.
```

---

## Rủi ro 4 — Conflict bị overwrite sai

Cách xử lý Sprint 6:

```txt id="d750yg"
- Dùng last-write-wins đơn giản.
- Nếu local có pending change, không overwrite ngay.
- Mark conflict nếu không chắc.
```

---

## Rủi ro 5 — API key model profile lưu server không an toàn

Cách xử lý:

```txt id="b9nq6d"
- Không lưu API key server-side nếu chưa mã hóa.
- Dùng env API key cho MVP.
- Ghi technical debt cho encrypted secret storage.
```

---

## 18. Technical Debt ghi nhận

Các phần có thể chưa hoàn chỉnh trong Sprint 6:

```txt id="6g4fts"
- Chưa có offline mutation queue bền vững.
- Chưa có retry exponential backoff.
- Chưa có conflict UI chi tiết.
- Chưa có multi-device sync hoàn chỉnh.
- Chưa có encrypted storage cho API key.
- Chưa có pagination messages.
- Chưa có compact/summarize long chat history.
- Chưa có server-side search.
- Chưa có backup/export.
- Chưa có observability/logging đầy đủ.
```

---

## 19. Ghi chú cho Sprint 7

Sprint 7 sẽ làm **Offline-first nâng cao**.

Sprint 6 cần bàn giao:

```txt id="qa5pfb"
- Server CRUD APIs.
- Sync metadata trong local DB.
- /sync/push.
- /sync/pull.
- SyncStatus UI cơ bản.
- LastSyncedAt local.
- Mapping localId/serverId.
```

Sprint 7 sẽ nâng cấp:

```txt id="owp90q"
- Offline mutation queue.
- Auto retry khi online lại.
- React Query offlineFirst.
- Persist query/mutation cache.
- Conflict handling rõ hơn.
- Sync status toàn app tốt hơn.
```

---

## 20. Kết luận Sprint 6

Sprint 6 là bước chuyển quan trọng từ app local-only sang app có server persistence.

Sau sprint này, hệ thống có nền tảng:

```txt id="8lwuy4"
User thao tác trên local
  -> UI phản hồi ngay
  -> dữ liệu được sync lên server
  -> server lưu theo userId
  -> app có thể pull dữ liệu về lại local
```

Đây là nền bắt buộc để Sprint 7 triển khai offline-first đúng nghĩa.
