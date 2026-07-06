# Sprint 7 — Offline-first Nâng Cao

## 1. Mục tiêu Sprint

Sprint 7 tập trung hoàn thiện cơ chế **offline-first** cho ứng dụng.

Sau sprint này, người dùng có thể tiếp tục sử dụng app trong điều kiện mạng yếu hoặc mất mạng:

```txt id="d13c0b"
- Mở app không có mạng vẫn xem được dữ liệu cũ.
- Tạo/sửa/xóa nhân vật khi offline.
- Gửi hoặc chỉnh sửa dữ liệu local trước.
- Khi online lại, hệ thống tự đồng bộ lên server.
- Nếu sync lỗi, dữ liệu local vẫn được giữ lại.
```

Mục tiêu quan trọng nhất:

```txt id="j4ih3j"
Không để mất dữ liệu người dùng chỉ vì mất mạng, reload tab hoặc backend tạm thời lỗi.
```

---

## 2. Bối cảnh

Ở Sprint 6, hệ thống đã có:

```txt id="lk7e4j"
- Server database.
- CRUD API cho characters/messages/model_profiles.
- /sync/push.
- /sync/pull.
- Local entity có sync metadata.
- Save local trước, sync server sau.
- Sync status cơ bản.
```

Tuy nhiên, Sprint 6 mới chỉ là sync cơ bản. Sprint 7 sẽ nâng cấp thành offline-first rõ ràng hơn:

```txt id="75ohb1"
Sprint 6:
  Có sync local/server cơ bản.

Sprint 7:
  Có offline queue, retry, auto sync khi online lại, conflict handling tốt hơn.
```

---

## 3. Phạm vi công việc

### 3.1. Trong phạm vi Sprint 7

Sprint này bao gồm:

- Thiết kế offline mutation queue.
- Lưu các thao tác local chưa sync vào IndexedDB.
- Tự động retry khi mạng quay lại.
- Tự động detect online/offline.
- Tích hợp React Query/TanStack Query theo hướng offline-first nếu phù hợp.
- Persist query/mutation cache nếu sử dụng React Query.
- Hoàn thiện sync status toàn app.
- Xử lý conflict cơ bản.
- Không overwrite dữ liệu local khi có pending changes.
- Tối ưu flow pull/push.
- Tạo UI cho trạng thái offline/syncing/conflict.
- Thêm manual retry.
- Thêm cơ chế chống duplicate khi retry.
- Kiểm thử các tình huống mất mạng, reload, sync lỗi.

### 3.2. Ngoài phạm vi Sprint 7

Sprint này chưa làm:

- Multi-device realtime sync.
- Collaboration nhiều người cùng sửa.
- Conflict merge UI phức tạp kiểu Git.
- Service Worker background sync hoàn chỉnh.
- Push notification.
- Full PWA install/offline shell nâng cao.
- End-to-end encryption.
- Version history đầy đủ.
- Undo/restore nhiều phiên bản.
- Billing/quota.
- Account thật bằng email/password/OAuth.

---

## 4. Nguyên tắc Offline-first

## 4.1. Local là nơi ghi trước

Mọi thao tác dữ liệu chính phải ghi local trước:

```txt id="pubmp5"
User action
  -> ghi IndexedDB
  -> update UI ngay
  -> thêm mutation vào offline queue
  -> sync khi có mạng
```

Không để UI phụ thuộc vào server response mới cập nhật.

---

## 4.2. Server sync là tác vụ nền

Server sync không được chặn trải nghiệm chính.

Đúng:

```txt id="cs3qor"
User sửa character
  -> UI cập nhật ngay
  -> badge Pending sync
  -> hệ thống tự push server sau
```

Sai:

```txt id="yw48m7"
User sửa character
  -> chờ server trả response
  -> server lỗi
  -> user mất thay đổi
```

---

## 4.3. Dữ liệu local không được mất khi sync fail

Nếu server lỗi, mất mạng, token lỗi hoặc provider lỗi:

```txt id="g8xn1c"
- Dữ liệu local vẫn giữ nguyên.
- Mutation vẫn nằm trong queue.
- UI hiển thị trạng thái lỗi hoặc pending.
- User có thể retry.
```

---

## 4.4. Sync phải idempotent

Một mutation có thể được retry nhiều lần. Vì vậy server phải xử lý an toàn:

```txt id="bort3u"
Cùng một create mutation gửi 2 lần
  -> không tạo duplicate record
  -> trả lại cùng serverId hoặc update record cũ
```

Cần dùng:

```txt id="5e4fbt"
- localId/clientId
- mutationId
- operation idempotency
```

---

## 5. Kiến trúc Offline-first

Luồng tổng quát:

```txt id="95mcos"
UI
  -> Repository local
  -> IndexedDB
  -> Mutation Queue
  -> Sync Engine
  -> Backend /sync/push
  -> Backend /sync/pull
  -> Merge vào IndexedDB
  -> UI cập nhật từ local store
```

Sơ đồ:

```txt id="4ti72o"
User Action
  -> Local Repository
  -> IndexedDB update
  -> Add Offline Mutation
  -> UI renders local data
  -> Sync Engine watches network
  -> Push queued mutations
  -> Pull server changes
  -> Resolve conflicts
  -> Mark records synced
```

---

## 6. Data cần offline-first

Sprint 7 tập trung vào các entity đã có từ Sprint 6:

```txt id="o9i2t1"
1. characters
2. messages
3. model_profiles
```

Có thể thêm sau:

```txt id="k5979u"
- settings
- generation_drafts
- generation_sessions
```

---

## 7. Offline Mutation Queue

## 7.1. Mục tiêu

Mutation queue lưu lại các thao tác cần sync lên server.

Ví dụ:

```txt id="jqbdy3"
- Tạo character mới khi offline.
- Sửa personality của character khi offline.
- Xóa model profile khi offline.
- Lưu message sau khi assistant stream xong.
```

Khi online lại, sync engine sẽ đọc queue và push lên server.

---

## 7.2. Entity `OfflineMutation`

```ts id="ek35zg"
type OfflineMutation = {
    id: string;
    entity: 'character' | 'message' | 'model_profile';
    operation: 'create' | 'update' | 'delete';

    localId: string;
    serverId?: string;

    payload: unknown;

    status: 'pending' | 'processing' | 'synced' | 'failed' | 'conflict';

    retryCount: number;
    lastError?: string;

    createdAt: string;
    updatedAt: string;
    lastAttemptAt?: string;

    idempotencyKey: string;
};
```

---

## 7.3. Store IndexedDB

Thêm store:

```txt id="25p3qq"
offline_mutations
```

Index đề xuất:

```txt id="b9h6r0"
- status
- entity
- localId
- createdAt
- idempotencyKey
```

---

## 7.4. Quy tắc thêm mutation

Khi user tạo character:

```txt id="rzvh9y"
1. Ghi character vào IndexedDB.
2. syncStatus = pending_create.
3. Thêm mutation:
   entity = character
   operation = create
   localId = local_char_xxx
   payload = character data
```

Khi user sửa character:

```txt id="vdom69"
1. Update local character.
2. syncStatus = pending_update.
3. Thêm mutation update.
```

Khi user xóa character:

```txt id="h1mizs"
1. Soft delete local.
2. syncStatus = pending_delete.
3. Thêm mutation delete.
```

---

## 7.5. Gộp mutation để tránh queue phình to

Nếu user sửa cùng một character nhiều lần khi offline:

```txt id="9g7j1c"
Update 1: sửa description
Update 2: sửa personality
Update 3: sửa firstMessage
```

Không nhất thiết phải push cả 3 mutation. Có thể compact thành 1 update cuối:

```txt id="u4jnie"
Update cuối cùng chứa toàn bộ state mới nhất của character.
```

Quy tắc compact MVP:

```txt id="doq39s"
- create + update => giữ create với payload mới nhất.
- update + update => giữ update mới nhất.
- create + delete => bỏ cả hai hoặc mark local deleted không sync.
- update + delete => giữ delete.
```

---

## 8. Sync Engine

## 8.1. Mục tiêu

Sync engine chịu trách nhiệm:

```txt id="d9f4cz"
- Detect online/offline.
- Push mutation queue.
- Pull server changes.
- Retry khi lỗi.
- Mark synced/error/conflict.
- Không làm mất dữ liệu local.
```

---

## 8.2. File đề xuất

```txt id="qgy2xx"
src/
  features/
    sync/
      engine/
        syncEngine.ts
        mutationQueue.ts
        conflictResolver.ts
        networkStatus.ts
      hooks/
        useSyncEngine.ts
        useNetworkStatus.ts
      components/
        OfflineBanner.tsx
        SyncStatusPanel.tsx
        ConflictList.tsx
```

---

## 8.3. Network status

Tạo hook:

```txt id="7m2jmo"
useNetworkStatus.ts
```

State:

```ts id="cemq0i"
type NetworkStatus = {
    isOnline: boolean;
    lastOnlineAt?: string;
    lastOfflineAt?: string;
};
```

Nguồn:

```txt id="2ruuux"
- navigator.onLine
- window online event
- window offline event
- optional: gọi /health để xác nhận backend thật sự reachable
```

Lưu ý:

```txt id="y5vsat"
navigator.onLine không luôn chính xác.
Có thể online với internet nhưng backend vẫn lỗi.
Vì vậy nên có backend health check nhẹ.
```

---

## 8.4. Push flow

```txt id="fmsjra"
1. Lấy mutations status = pending hoặc failed có thể retry.
2. Compact mutations nếu cần.
3. Set mutation status = processing.
4. Gửi POST /sync/push.
5. Nhận results.
6. Với result success:
   - mark mutation = synced
   - update entity serverId/version/serverUpdatedAt
   - syncStatus = synced nếu không còn mutation pending
7. Với result failed:
   - retryCount += 1
   - status = failed
   - lưu lastError
8. Với result conflict:
   - status = conflict
   - entity syncStatus = conflict
```

---

## 8.5. Pull flow

```txt id="8lbrwe"
1. Đọc lastSyncedAt.
2. GET /sync/pull?since=lastSyncedAt.
3. Nhận changes từ server.
4. Với mỗi change:
   - tìm local record theo serverId.
   - nếu local không có pending changes: apply server.
   - nếu local có pending changes: kiểm tra conflict.
5. Cập nhật lastSyncedAt = serverTime.
```

---

## 8.6. Thứ tự sync

Thứ tự an toàn:

```txt id="3ikofq"
1. Push local pending changes trước.
2. Pull server changes sau.
```

Lý do:

```txt id="g6db33"
- Tránh server data cũ overwrite local data đang pending.
- Đẩy thay đổi của user hiện tại lên trước.
- Sau đó mới lấy thay đổi mới từ server.
```

---

## 8.7. Auto sync trigger

Sync engine nên chạy khi:

```txt id="s5oswr"
- App vừa mở.
- User vừa login guest.
- User vừa tạo/sửa/xóa entity.
- Browser chuyển từ offline sang online.
- User bấm Sync Now.
- Theo interval nhẹ nếu app đang online.
```

Interval đề xuất:

```txt id="v5iy9l"
MVP: mỗi 60 giây khi app đang online.
```

Không sync quá dày để tránh tốn request.

---

## 9. Conflict Handling

## 9.1. Conflict là gì?

Conflict xảy ra khi:

```txt id="9jl929"
- Local record có thay đổi chưa sync.
- Server record cũng có thay đổi mới hơn.
- Không thể tự tin merge an toàn.
```

Ví dụ:

```txt id="smkz0v"
Local sửa personality lúc 10:00.
Server cũng sửa personality lúc 10:01.
Local chưa sync.
```

---

## 9.2. Conflict strategy MVP

Sprint 7 không cần UI merge phức tạp. Dùng chiến lược:

```txt id="i0hplf"
1. Nếu chỉ local thay đổi: push local.
2. Nếu chỉ server thay đổi: apply server.
3. Nếu cả hai thay đổi:
   - Nếu field khác nhau: merge shallow nếu an toàn.
   - Nếu cùng field: mark conflict.
```

Nếu chưa làm field-level diff, dùng rule đơn giản:

```txt id="agqkjw"
Nếu local có pending change và serverUpdatedAt > serverUpdatedAt local đã biết:
  mark conflict
  không overwrite local
```

---

## 9.3. Conflict UI tối thiểu

Tạo component:

```txt id="7d5q27"
ConflictList.tsx
```

Hiển thị:

```txt id="fwowpf"
Có 2 mục cần xử lý xung đột.

- Character: Nguyệt Cơ
  [Keep Local] [Use Server]
```

Action:

```txt id="oecus8"
Keep Local:
  -> tạo mutation update mới từ local state
  -> push lên server
  -> mark pending_update

Use Server:
  -> overwrite local bằng server data
  -> mark synced
```

---

## 10. React Query / TanStack Query Integration

## 10.1. Mục tiêu

React Query có thể dùng để:

```txt id="xf7mt8"
- Quản lý server request.
- Cache API response.
- Retry.
- Network mode offline-first.
- Mutation lifecycle.
```

Tuy nhiên, vì app đã dùng IndexedDB local-first, cần phân vai rõ:

```txt id="th8ob3"
IndexedDB:
  nguồn dữ liệu chính cho UI local-first.

React Query:
  quản lý request server, sync/pull/push, cache phụ trợ.
```

Không nên để React Query thay thế hoàn toàn IndexedDB trong Sprint 7.

---

## 10.2. Query network mode

Khi dùng React Query, có thể cấu hình:

```ts id="y6b0pd"
networkMode: 'offlineFirst';
```

Dùng cho:

```txt id="85uy8d"
- pull server changes
- test connection
- fetch server data
```

---

## 10.3. Persist cache

Nếu dùng React Query persist:

```txt id="h89jhg"
- Persist query cache vào IndexedDB/localStorage.
- Khôi phục cache sau reload.
- Cẩn thận với mutation function không serialize được.
```

MVP Sprint 7 có thể chỉ persist local data bằng IndexedDB và chưa cần persist toàn bộ React Query cache.

---

## 11. UI/UX Offline-first

## 11.1. Offline banner

Tạo component:

```txt id="taqvuw"
OfflineBanner.tsx
```

Khi mất mạng:

```txt id="dz4b82"
Bạn đang offline. Thay đổi sẽ được lưu trên thiết bị này và đồng bộ khi có mạng.
```

Khi online lại:

```txt id="eabkq9"
Đã online lại. Đang đồng bộ dữ liệu...
```

---

## 11.2. Sync status toàn app

Tạo component:

```txt id="rgr5dv"
SyncStatusPanel.tsx
```

Hiển thị:

```txt id="7mif8z"
Network: Online / Offline
Sync: Synced / Syncing / Pending / Failed / Conflict
Pending changes: 3
Last synced: 10:32
[Sync Now]
```

---

## 11.3. Entity-level badge

Ở character/model/message list:

```txt id="y61fsm"
[Synced]
[Pending sync]
[Sync failed]
[Conflict]
```

Ví dụ:

```txt id="fwox23"
Nguyệt Cơ    [Pending sync]
```

---

## 11.4. Không chặn thao tác khi offline

Khi offline, các thao tác sau vẫn nên hoạt động:

```txt id="ec3u9r"
- Xem character cũ.
- Sửa character.
- Tạo character thủ công.
- Save generated character nếu generation đã có data.
- Xem chat history đã lưu.
- Sửa model profile local.
```

Các thao tác cần mạng nên báo rõ:

```txt id="ww26cc"
- Chat với LLM.
- Generate character bằng AI.
- Test model connection.
```

Ví dụ message:

```txt id="3xx2rv"
Tính năng này cần kết nối mạng vì phải gọi model AI.
```

---

## 12. Chat trong Offline-first

## 12.1. Xem chat history offline

Người dùng phải xem được lịch sử chat cũ từ IndexedDB:

```txt id="lqxe25"
Offline
  -> mở character
  -> xem messages cũ
```

---

## 12.2. Gửi chat khi offline

Vì chat cần gọi LLM, có 2 lựa chọn.

### Lựa chọn A — Chặn gửi khi offline

MVP khuyến nghị:

```txt id="yfk7lq"
User offline
  -> disable send button
  -> hiển thị "Chat cần kết nối mạng"
```

Ưu điểm:

```txt id="ajvq1d"
- Đơn giản.
- Không tạo kỳ vọng sai.
```

---

### Lựa chọn B — Queue user message

Có thể cho user soạn message và queue:

```txt id="nsrspu"
User nhập message offline
  -> lưu local message pending_send
  -> khi online thì gửi LLM
```

Nhược điểm:

```txt id="dvkjtk"
- Phức tạp hơn.
- Cần xử lý ngữ cảnh chat đã thay đổi.
- Dễ gây bất ngờ khi online lại app tự gửi.
```

Sprint 7 nên chọn **Lựa chọn A** cho MVP.

---

## 13. Character Generation trong Offline-first

Generate character bằng AI cần mạng.

Khi offline:

```txt id="tlyw0f"
- Disable Generate button.
- Vẫn cho xem/sửa draft cũ nếu có.
- Vẫn cho save partial draft thành character local.
```

Nếu đang stream mà mất mạng:

```txt id="fp3w0g"
- Mark stream partial_error.
- Giữ partial draft.
- Cho user chỉnh sửa.
- Cho save partial draft local.
```

---

## 14. Backend Requirements

## 14.1. Idempotency support

`/sync/push` cần nhận `idempotencyKey` hoặc `mutationId`.

Request:

```json id="at13nh"
{
    "changes": [
        {
            "mutationId": "mut_abc",
            "idempotencyKey": "guest_123:local_char_abc:create",
            "entity": "character",
            "operation": "create",
            "localId": "local_char_abc",
            "serverId": null,
            "data": {
                "name": "Nguyệt Cơ"
            },
            "localUpdatedAt": "2026-07-02T10:00:00.000Z"
        }
    ]
}
```

Server cần đảm bảo:

```txt id="snzyx2"
- Nếu cùng idempotencyKey đã xử lý rồi, trả lại result cũ.
- Không tạo duplicate record.
```

Có thể thêm bảng:

```sql id="g4li50"
CREATE TABLE sync_mutations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  entity TEXT NOT NULL,
  operation TEXT NOT NULL,
  local_id TEXT NOT NULL,
  server_id TEXT,
  status TEXT NOT NULL,
  result_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,

  UNIQUE(user_id, idempotency_key)
);
```

---

## 14.2. Version check

Server entity có `version`.

Khi client update:

```json id="gjboml"
{
    "serverId": "char_123",
    "version": 2,
    "data": {
        "name": "Nguyệt Cơ updated"
    }
}
```

Server xử lý:

```txt id="zcj4pd"
- Nếu version khớp: update, version + 1.
- Nếu version cũ hơn server: trả conflict.
```

Conflict response:

```json id="vmt3v0"
{
    "localId": "local_char_abc",
    "serverId": "char_123",
    "status": "conflict",
    "serverVersion": 3,
    "serverData": {
        "name": "Nguyệt Cơ server"
    }
}
```

---

## 14.3. Pull deleted records

`/sync/pull` cần trả cả delete changes:

```json id="q5412m"
{
    "entity": "character",
    "operation": "delete",
    "serverId": "char_123",
    "serverUpdatedAt": "2026-07-02T10:20:00.000Z",
    "version": 4
}
```

Frontend nhận delete:

```txt id="lmqxer"
- Nếu local không có pending change: mark deleted local.
- Nếu local có pending change: mark conflict.
```

---

## 15. Frontend Tasks

## Task 1 — Thêm `offline_mutations` store

Cập nhật IndexedDB schema:

```txt id="younk5"
offline_mutations
sync_state
```

`sync_state` lưu:

```ts id="o5o6oo"
type SyncState = {
    id: 'global';
    lastSyncedAt?: string;
    lastSyncAttemptAt?: string;
    status: 'idle' | 'syncing' | 'synced' | 'error';
    error?: string;
};
```

---

## Task 2 — Tạo `mutationQueue`

File:

```txt id="6qezu0"
src/features/sync/engine/mutationQueue.ts
```

Functions:

```ts id="3hqycd"
type MutationQueue = {
    enqueue(mutation: OfflineMutation): Promise<void>;
    listPending(): Promise<OfflineMutation[]>;
    markProcessing(id: string): Promise<void>;
    markSynced(id: string): Promise<void>;
    markFailed(id: string, error: string): Promise<void>;
    markConflict(id: string, error: string): Promise<void>;
    compact(): Promise<void>;
};
```

---

## Task 3 — Tạo `syncEngine`

File:

```txt id="snsi1a"
src/features/sync/engine/syncEngine.ts
```

Functions:

```ts id="5hb64r"
type SyncEngine = {
    syncNow(): Promise<void>;
    pushPendingChanges(): Promise<void>;
    pullServerChanges(): Promise<void>;
    startAutoSync(): void;
    stopAutoSync(): void;
};
```

---

## Task 4 — Tạo `networkStatus`

File:

```txt id="llwv7k"
src/features/sync/engine/networkStatus.ts
```

Functions:

```ts id="k71nfe"
type NetworkStatusService = {
    isOnline(): boolean;
    checkBackendHealth(): Promise<boolean>;
    subscribe(listener: (online: boolean) => void): () => void;
};
```

---

## Task 5 — Cập nhật repositories để enqueue mutation

Ví dụ `characterRepository.update`:

```txt id="8ctfqm"
1. Update local record.
2. Set syncStatus = pending_update.
3. Enqueue update mutation.
4. Return updated local record.
```

Không để UI tự tạo mutation thủ công.

---

## Task 6 — Compact queue

Trước khi push, gọi:

```txt id="5ch5ez"
mutationQueue.compact()
```

Mục tiêu:

```txt id="w3s3cp"
- Giảm request thừa.
- Tránh push nhiều update lỗi thời.
- Giữ state cuối cùng.
```

---

## Task 7 — Retry logic

Retry rule:

```txt id="sw3i4a"
retryCount < 5
```

Backoff đề xuất:

```txt id="m56dif"
Lần 1: retry sau 5 giây
Lần 2: retry sau 15 giây
Lần 3: retry sau 30 giây
Lần 4: retry sau 60 giây
Lần 5: dừng auto retry, chờ user bấm Sync Now
```

Không cần quá phức tạp trong MVP.

---

## Task 8 — Tạo offline/sync UI

Components:

```txt id="k4fw56"
OfflineBanner.tsx
SyncStatusPanel.tsx
SyncStatusBadge.tsx
ConflictList.tsx
```

---

## Task 9 — Handle app reload

Khi app reload:

```txt id="c6jwqr"
1. Load local data từ IndexedDB.
2. Load sync_state.
3. Load offline_mutations.
4. Hiển thị dữ liệu local ngay.
5. Nếu online:
   - sync pending mutations
   - pull server changes
```

Yêu cầu:

```txt id="2bcbjy"
Reload không làm mất pending changes.
```

---

## Task 10 — Manual conflict actions

Implement tối thiểu:

```txt id="yayj7h"
Keep Local
Use Server
```

Không cần field-by-field merge trong Sprint 7.

---

## 16. Backend Tasks

## Task 1 — Thêm bảng `sync_mutations`

Tạo migration:

```txt id="y9tko0"
0002_sync_mutations.sql
```

SQL:

```sql id="a5iayh"
CREATE TABLE sync_mutations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  entity TEXT NOT NULL,
  operation TEXT NOT NULL,
  local_id TEXT NOT NULL,
  server_id TEXT,
  status TEXT NOT NULL,
  result_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,

  UNIQUE(user_id, idempotency_key)
);
```

---

## Task 2 — Cập nhật `/sync/push` hỗ trợ idempotency

Khi nhận mutation:

```txt id="7jt8tc"
1. Check idempotency_key đã tồn tại chưa.
2. Nếu đã synced, trả result cũ.
3. Nếu chưa có, xử lý mutation.
4. Lưu result vào sync_mutations.
```

---

## Task 3 — Cập nhật `/sync/push` hỗ trợ conflict

Khi update/delete:

```txt id="8wxyxa"
- Check serverId.
- Check user ownership.
- Check version.
- Nếu version cũ: trả conflict.
```

---

## Task 4 — Cập nhật `/sync/pull` trả delete changes

Pull phải bao gồm:

```txt id="cs3a69"
- upsert changes
- delete changes
- serverTime
- version
```

---

## Task 5 — Chuẩn hóa response sync

Response `/sync/push`:

```ts id="v1hlac"
type SyncPushResponse = {
    results: SyncPushResult[];
    serverTime: string;
};

type SyncPushResult =
    | {
          mutationId: string;
          localId: string;
          serverId: string;
          status: 'synced';
          serverUpdatedAt: string;
          version: number;
      }
    | {
          mutationId: string;
          localId: string;
          serverId?: string;
          status: 'failed';
          error: {
              code: string;
              message: string;
          };
      }
    | {
          mutationId: string;
          localId: string;
          serverId: string;
          status: 'conflict';
          serverData: unknown;
          serverUpdatedAt: string;
          serverVersion: number;
      };
```

---

## 17. Error Handling

## 17.1. Mất mạng

Frontend:

```txt id="u31g50"
- Detect offline.
- Không gọi sync.
- Queue mutations.
- Hiển thị OfflineBanner.
```

---

## 17.2. Backend không reachable

Dù `navigator.onLine = true`, backend có thể lỗi.

Frontend:

```txt id="azg29t"
- Health check fail.
- Treat as temporarily offline for sync.
- Không xóa queue.
- Retry sau.
```

---

## 17.3. Token hết hạn

Với guest JWT:

```txt id="b9tynb"
- Sync fail 401.
- Hiển thị cần đăng nhập lại.
- Không xóa local data.
- Không xóa mutation queue.
```

---

## 17.4. Conflict

Frontend:

```txt id="eyjbf8"
- Mark entity conflict.
- Mark mutation conflict.
- Hiển thị trong ConflictList.
- Chờ user chọn Keep Local hoặc Use Server.
```

---

## 17.5. Duplicate mutation

Backend:

```txt id="clxkoj"
- Dùng idempotencyKey.
- Trả result cũ.
- Không tạo duplicate.
```

---

## 18. Test Cases

## 18.1. Frontend tests

### Test 1 — Offline tạo character

```txt id="sd5wqz"
Given app đang offline
When user tạo character
Then character được lưu vào IndexedDB
And syncStatus = pending_create
And offline mutation được tạo
```

### Test 2 — Online lại tự sync

```txt id="hrbrly"
Given có pending mutation
And app chuyển từ offline sang online
When sync engine chạy
Then mutation được push lên server
And character syncStatus = synced
```

### Test 3 — Reload không mất queue

```txt id="c6aey1"
Given có pending mutation trong IndexedDB
When user reload app
Then pending mutation vẫn còn
And sync engine tiếp tục xử lý khi online
```

### Test 4 — Compact create + update

```txt id="qgyx4h"
Given user tạo character offline
And sửa character đó 2 lần
When compact queue
Then chỉ còn create mutation với payload mới nhất
```

### Test 5 — Update + delete

```txt id="819bgu"
Given character đã synced
And user sửa rồi xóa khi offline
When compact queue
Then queue giữ delete mutation
```

### Test 6 — Sync fail giữ local data

```txt id="nyzm3y"
Given server unavailable
When sync engine push mutation
Then mutation status = failed
And local character vẫn còn
```

### Test 7 — Conflict không overwrite local

```txt id="g6qgux"
Given local có pending update
And server có version mới hơn
When pull server changes
Then local không bị overwrite
And entity syncStatus = conflict
```

### Test 8 — Keep Local

```txt id="c0pf7l"
Given entity đang conflict
When user chọn Keep Local
Then tạo mutation update mới
And syncStatus = pending_update
```

### Test 9 — Use Server

```txt id="eqbfr7"
Given entity đang conflict
When user chọn Use Server
Then local record được overwrite bằng server data
And syncStatus = synced
```

---

## 18.2. Backend tests

### Test 1 — Idempotent create

```txt id="fltlbt"
Given cùng idempotencyKey create character
When client gửi /sync/push 2 lần
Then server chỉ tạo một character
And cả hai lần trả cùng serverId
```

### Test 2 — Version conflict

```txt id="656ivk"
Given server character version = 3
When client update với version = 2
Then server trả status = conflict
And không overwrite server data
```

### Test 3 — Pull delete change

```txt id="pw7mce"
Given character bị soft delete sau lastSyncedAt
When client gọi /sync/pull
Then response có operation = delete
```

### Test 4 — User ownership

```txt id="nxy8it"
Given user A có character
When user B push update cho serverId của user A
Then server trả 403 hoặc failed result
```

---

## 19. Manual QA Checklist

```txt id="auc05v"
[ ] Mở app khi online, dữ liệu local hiển thị ngay
[ ] Tắt mạng, app vẫn mở được dữ liệu cũ
[ ] Tạo character khi offline được
[ ] Sửa character khi offline được
[ ] Xóa character khi offline được
[ ] OfflineBanner hiển thị đúng
[ ] Pending sync badge hiển thị đúng
[ ] Reload khi offline không mất dữ liệu
[ ] Bật mạng lại app tự sync
[ ] Sync thành công chuyển badge thành Synced
[ ] Server fail không làm mất local data
[ ] Sync Now retry được
[ ] Conflict hiển thị trong ConflictList
[ ] Keep Local hoạt động
[ ] Use Server hoạt động
[ ] Chat history cũ xem được khi offline
[ ] Chat/generate AI bị chặn rõ ràng khi offline
```

---

## 20. Definition of Done

Sprint 7 hoàn thành khi đạt đủ các điều kiện sau:

- Có `offline_mutations` store trong IndexedDB.
- Có mutation queue.
- Tạo/sửa/xóa character offline được.
- Tạo/sửa/xóa model profile offline được nếu model profile đã sync.
- Message completed/cancelled/error có thể queue sync.
- Reload app không làm mất pending mutations.
- Có sync engine push/pull.
- Có auto sync khi online lại.
- Có manual Sync Now.
- Có retry cơ bản khi sync fail.
- Có compact mutation cơ bản.
- Backend `/sync/push` hỗ trợ idempotency.
- Backend `/sync/push` hỗ trợ conflict response.
- Backend `/sync/pull` trả được upsert và delete changes.
- UI có OfflineBanner.
- UI có SyncStatusPanel hoặc SyncStatusBadge.
- Conflict không overwrite local data im lặng.
- Có action Keep Local / Use Server cho conflict.
- Chat history cũ xem được offline.
- Tính năng cần mạng như chat/generate AI báo rõ khi offline.

---

## 21. Demo cuối Sprint

## Demo 1 — Offline tạo và sync character

```txt id="plb6iu"
1. Mở app khi online.
2. Log in as Guest.
3. Tắt mạng.
4. Tạo character mới.
5. Character xuất hiện ngay trong sidebar.
6. UI hiển thị Offline + Pending sync.
7. Reload app.
8. Character vẫn còn.
9. Bật mạng.
10. App tự sync.
11. Badge chuyển thành Synced.
12. Kiểm tra server đã có character.
```

---

## Demo 2 — Server lỗi không mất dữ liệu

```txt id="8tkacw"
1. Làm backend sync fail.
2. Sửa character.
3. UI cập nhật local ngay.
4. Sync báo failed.
5. Dữ liệu local vẫn còn.
6. Bật lại backend.
7. Bấm Sync Now.
8. Sync thành công.
```

---

## Demo 3 — Conflict cơ bản

```txt id="krsuys"
1. Tạo một conflict giả lập giữa local và server.
2. App hiển thị ConflictList.
3. Chọn Keep Local.
4. Local được push lên server.
5. Tạo conflict lần nữa.
6. Chọn Use Server.
7. Local được overwrite bằng server data.
```

---

## 22. Rủi ro

## Rủi ro 1 — Sync logic quá phức tạp

Cách xử lý:

```txt id="iy61cc"
- Giữ MVP đơn giản.
- Tập trung characters trước.
- Sau khi ổn mới áp dụng messages/model_profiles.
- Conflict chỉ cần Keep Local / Use Server.
```

---

## Rủi ro 2 — Queue bị duplicate hoặc sai thứ tự

Cách xử lý:

```txt id="0bfh3u"
- Dùng idempotencyKey.
- Compact queue trước khi push.
- Sort mutation theo createdAt.
- Ưu tiên create trước update/delete nếu cùng entity.
```

---

## Rủi ro 3 — User mất guest token

Cách xử lý:

```txt id="h63okj"
- Không xóa local data.
- Cho login guest lại.
- Dữ liệu local vẫn dùng được.
- Ghi chú hạn chế của guest mode.
```

---

## Rủi ro 4 — Conflict bị xử lý sai làm mất data

Cách xử lý:

```txt id="2f4rgx"
- Không overwrite local nếu local có pending change.
- Mark conflict thay vì tự merge nếu không chắc.
- Keep Local / Use Server rõ ràng.
```

---

## Rủi ro 5 — Chat/generate AI offline gây kỳ vọng sai

Cách xử lý:

```txt id="64aj95"
- Disable các tính năng cần mạng.
- Message rõ ràng: "Tính năng này cần kết nối mạng."
- Vẫn cho xem dữ liệu cũ và sửa local.
```

---

## 23. Technical Debt ghi nhận

Các phần có thể chưa hoàn chỉnh trong Sprint 7:

```txt id="rhfwcn"
- Chưa có Service Worker background sync.
- Chưa có PWA offline shell hoàn chỉnh.
- Chưa có field-level merge UI.
- Chưa có version history.
- Chưa có encrypted local storage.
- Chưa có account thật để khôi phục guest data.
- Chưa có multi-device conflict handling tốt.
- Chưa có server-side audit log.
- Chưa có observability cho sync errors.
- Chưa có pagination tối ưu cho message sync.
```

---

## 24. Ghi chú cho giai đoạn sau Sprint 7

Sau Sprint 7, app đã có nền tảng local-first/offline-first tương đối đầy đủ.

Các hướng phát triển tiếp theo:

```txt id="tb7qlm"
- Login thật bằng email/password hoặc OAuth.
- Gắn guest account với account thật.
- PWA install/offline shell.
- Service Worker background sync.
- Resume stream bằng streamId + seq.
- Generation session lưu server-side.
- Conflict UI chi tiết hơn.
- Model profile secret encryption.
- Multi-device sync.
- Chat memory dài hạn.
```

---

## 25. Kết luận Sprint 7

Sprint 7 hoàn thiện nền tảng offline-first cho app.

Sau sprint này, hệ thống có thể hoạt động theo đúng hướng:

```txt id="789oh7"
Người dùng thao tác trước ở local
  -> UI phản hồi ngay
  -> dữ liệu không mất khi offline
  -> mutation được queue
  -> online lại thì tự sync
  -> conflict được xử lý rõ ràng
```

Đây là bước cuối để biến prototype thành một app có nền tảng dữ liệu nghiêm túc, sẵn sàng mở rộng sang account thật, multi-device sync và các tính năng nâng cao khác.
