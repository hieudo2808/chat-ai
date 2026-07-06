# Sprint 1 — Cloudflare Worker + Guest Login

## 1. Mục tiêu Sprint

Sprint 1 tập trung xây dựng backend tối thiểu bằng **Cloudflare Workers** và bổ sung luồng đăng nhập đơn giản dưới dạng **Guest Login**.

Sau sprint này, ứng dụng không còn là frontend-only hoàn toàn. Frontend có thể gọi backend, backend có thể phản hồi request, và người dùng có thể đăng nhập tạm thời bằng tài khoản khách thông qua JWT.

---

## 2. Bối cảnh

Ở phiên bản hiện tại, ứng dụng chủ yếu chạy ở phía frontend:

- Dữ liệu được lưu local trong trình duyệt.
- Frontend gọi trực tiếp tới LLM provider.
- Chưa có backend riêng.
- Chưa có cơ chế xác thực người dùng.

Theo yêu cầu mới, hệ thống cần có backend để:

- Làm trung gian gọi LLM.
- Quản lý token người dùng.
- Chuẩn bị cho lưu dữ liệu server-side.
- Chuẩn bị cho sync/offline-first ở các sprint sau.

Sprint này chưa xử lý streaming chat hoặc streaming JSON. Mục tiêu chính là tạo nền backend và auth trước.

---

## 3. Phạm vi công việc

### 3.1. Trong phạm vi Sprint 1

Sprint này bao gồm:

- Khởi tạo Cloudflare Worker.
- Tạo endpoint kiểm tra backend `/health`.
- Tạo endpoint đăng nhập khách `/auth/guest`.
- Tạo endpoint kiểm tra token `/auth/me`.
- Sinh JWT cho guest user.
- Lưu JWT ở frontend.
- Gửi JWT trong các request tiếp theo.
- Hiển thị trạng thái đăng nhập ở giao diện.

### 3.2. Ngoài phạm vi Sprint 1

Sprint này chưa làm:

- Chat stream qua backend.
- Streaming JSON.
- Auto-fill character form.
- Server database.
- Sync dữ liệu.
- Offline-first.
- Login bằng email/password.
- Login Google/OAuth.
- Phân quyền phức tạp.
- Refresh token.

---

## 4. Kiến trúc sau Sprint 1

Luồng tổng quát:

```txt
Frontend
  -> gọi Cloudflare Worker
  -> Worker xử lý request
  -> Worker trả response về Frontend
```

Luồng Guest Login:

```txt
User bấm "Log in as Guest"
  -> Frontend gửi POST /auth/guest
  -> Worker sinh guest userId
  -> Worker ký JWT
  -> Worker trả token về Frontend
  -> Frontend lưu token vào localStorage
  -> Các request sau gửi kèm Authorization header
```

Luồng kiểm tra token:

```txt
Frontend có token
  -> gửi GET /auth/me
  -> Worker verify JWT
  -> Nếu hợp lệ: trả thông tin user
  -> Nếu không hợp lệ: trả 401 Unauthorized
```

---

## 5. Cấu trúc thư mục đề xuất

Tạo thêm thư mục backend riêng:

```txt
worker/
  src/
    index.ts
    routes/
      auth.ts
    lib/
      cors.ts
      jwt.ts
      response.ts
  wrangler.toml
```

Frontend bổ sung module auth:

```txt
src/
  features/
    auth/
      authApi.ts
      authStore.ts
      LoginAsGuestButton.tsx
      AuthStatus.tsx
```

---

## 6. Backend Tasks

### Task 1 — Khởi tạo Cloudflare Worker

Tạo project Worker trong thư mục `worker`.

Cấu trúc tối thiểu:

```txt
worker/
  src/
    index.ts
  wrangler.toml
```

`index.ts` sẽ là entrypoint chính của Worker.

Yêu cầu:

- Worker export `fetch`.
- Có xử lý routing cơ bản theo path.
- Có xử lý CORS cho frontend local.
- Có response JSON thống nhất.

---

### Task 2 — Tạo endpoint `GET /health`

Endpoint dùng để kiểm tra backend có hoạt động không.

Request:

```http
GET /health
```

Response thành công:

```json
{
    "ok": true,
    "service": "chat-ai-worker",
    "status": "healthy"
}
```

Mục đích:

- Kiểm tra Worker đã deploy/chạy local được.
- Frontend có thể gọi backend.
- Dùng làm bước test trước khi làm auth.

---

### Task 3 — Tạo JWT utility

Tạo file:

```txt
worker/src/lib/jwt.ts
```

JWT payload đề xuất:

```ts
type GuestJwtPayload = {
    sub: string;
    type: 'guest';
    iat: number;
    exp: number;
};
```

Trong đó:

- `sub`: user ID của guest.
- `type`: loại user, hiện tại chỉ có `"guest"`.
- `iat`: thời điểm tạo token.
- `exp`: thời điểm hết hạn token.

Ví dụ payload:

```json
{
    "sub": "guest_01JXYZABC",
    "type": "guest",
    "iat": 1780000000,
    "exp": 1782592000
}
```

Yêu cầu:

- Có hàm ký token.
- Có hàm verify token.
- Secret lấy từ biến môi trường `JWT_SECRET`.
- Token hết hạn sau một khoảng thời gian cấu hình được, ví dụ 30 ngày.

---

### Task 4 — Tạo endpoint `POST /auth/guest`

Endpoint dùng để đăng nhập khách.

Request:

```http
POST /auth/guest
```

Request body có thể để trống trong MVP.

Backend xử lý:

```txt
1. Sinh guest userId.
2. Tạo JWT payload.
3. Ký JWT bằng JWT_SECRET.
4. Trả token về client.
```

Response thành công:

```json
{
    "token": "<jwt_token>",
    "user": {
        "id": "guest_01JXYZABC",
        "type": "guest"
    }
}
```

Response lỗi:

```json
{
    "error": {
        "code": "AUTH_GUEST_FAILED",
        "message": "Could not create guest session."
    }
}
```

---

### Task 5 — Tạo endpoint `GET /auth/me`

Endpoint dùng để kiểm tra token hiện tại.

Request:

```http
GET /auth/me
Authorization: Bearer <jwt_token>
```

Backend xử lý:

```txt
1. Đọc Authorization header.
2. Lấy Bearer token.
3. Verify token.
4. Nếu hợp lệ, trả thông tin user.
5. Nếu không hợp lệ, trả 401.
```

Response thành công:

```json
{
    "user": {
        "id": "guest_01JXYZABC",
        "type": "guest"
    }
}
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

Response khi token sai/hết hạn:

```json
{
    "error": {
        "code": "AUTH_INVALID_TOKEN",
        "message": "Invalid or expired access token."
    }
}
```

---

### Task 6 — CORS

Trong Sprint 1, frontend có thể chạy ở local, ví dụ:

```txt
http://localhost:5173
```

Worker cần cho phép frontend gọi API.

Header tối thiểu:

```http
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

Cần xử lý request `OPTIONS` để browser không chặn preflight request.

---

## 7. Frontend Tasks

### Task 1 — Tạo API client cho backend

Tạo file:

```txt
src/features/auth/authApi.ts
```

Các function cần có:

```ts
loginAsGuest(): Promise<LoginAsGuestResponse>

getCurrentUser(token: string): Promise<AuthMeResponse>
```

Kiểu dữ liệu đề xuất:

```ts
type AuthUser = {
    id: string;
    type: 'guest';
};

type LoginAsGuestResponse = {
    token: string;
    user: AuthUser;
};

type AuthMeResponse = {
    user: AuthUser;
};
```

---

### Task 2 — Tạo auth store

Tạo file:

```txt
src/features/auth/authStore.ts
```

State cần quản lý:

```ts
type AuthState = {
    token: string | null;
    user: AuthUser | null;
    status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated' | 'error';
    error?: string;
};
```

Yêu cầu:

- Lưu token vào `localStorage`.
- Load token từ `localStorage` khi mở app.
- Gọi `/auth/me` để verify token cũ.
- Nếu token sai hoặc hết hạn, xóa token khỏi localStorage.

---

### Task 3 — Tạo nút `Log in as Guest`

Tạo component:

```txt
src/features/auth/LoginAsGuestButton.tsx
```

Hành vi:

```txt
Người dùng bấm nút
  -> gọi loginAsGuest()
  -> lưu token
  -> cập nhật auth state
  -> hiển thị trạng thái đã đăng nhập
```

UI tối thiểu:

```txt
[Log in as Guest]
```

Khi đang xử lý:

```txt
Logging in...
```

Khi lỗi:

```txt
Could not log in as guest. Please try again.
```

---

### Task 4 — Hiển thị trạng thái đăng nhập

Tạo component:

```txt
src/features/auth/AuthStatus.tsx
```

Trạng thái chưa đăng nhập:

```txt
Not logged in
```

Trạng thái đã đăng nhập:

```txt
Logged in as Guest
User ID: guest_01JXYZABC
```

Không cần hiển thị toàn bộ JWT cho người dùng.

---

### Task 5 — Gắn Authorization header cho request sau này

Tạo API helper dùng chung:

```txt
src/services/api/apiClient.ts
```

Mục tiêu:

```ts
const token = localStorage.getItem('access_token');

fetch(url, {
    headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    },
});
```

Trong Sprint 1, helper này chỉ cần chuẩn bị. Các sprint sau sẽ dùng cho `/chat/stream`, `/generate-character/stream`, `/characters`, `/models`.

---

## 8. API Specification

### `GET /health`

Kiểm tra backend.

#### Response `200`

```json
{
    "ok": true,
    "service": "chat-ai-worker",
    "status": "healthy"
}
```

---

### `POST /auth/guest`

Tạo guest session.

#### Response `200`

```json
{
    "token": "<jwt_token>",
    "user": {
        "id": "guest_01JXYZABC",
        "type": "guest"
    }
}
```

#### Response `500`

```json
{
    "error": {
        "code": "AUTH_GUEST_FAILED",
        "message": "Could not create guest session."
    }
}
```

---

### `GET /auth/me`

Lấy thông tin user từ token.

#### Headers

```http
Authorization: Bearer <jwt_token>
```

#### Response `200`

```json
{
    "user": {
        "id": "guest_01JXYZABC",
        "type": "guest"
    }
}
```

#### Response `401`

```json
{
    "error": {
        "code": "AUTH_INVALID_TOKEN",
        "message": "Invalid or expired access token."
    }
}
```

---

## 9. Error Handling

Backend nên dùng format lỗi thống nhất:

```ts
type ApiErrorResponse = {
    error: {
        code: string;
        message: string;
        details?: unknown;
    };
};
```

Một số mã lỗi cần có trong Sprint 1:

```txt
AUTH_MISSING_TOKEN
AUTH_INVALID_TOKEN
AUTH_GUEST_FAILED
METHOD_NOT_ALLOWED
NOT_FOUND
INTERNAL_SERVER_ERROR
```

Ví dụ:

```json
{
    "error": {
        "code": "METHOD_NOT_ALLOWED",
        "message": "This endpoint does not support the requested method."
    }
}
```

---

## 10. Security Notes

Trong Sprint 1, auth chỉ là guest login nên chưa cần hệ thống bảo mật phức tạp. Tuy nhiên cần chú ý:

- Không hardcode `JWT_SECRET` trong source code.
- `JWT_SECRET` phải lấy từ environment variable.
- Không log toàn bộ JWT ra console.
- Không hiển thị JWT trên UI.
- Token lưu localStorage chỉ phù hợp MVP/demo.
- Sau này nếu cần bảo mật hơn, chuyển sang HttpOnly cookie.

---

## 11. Test Cases

### Backend

#### Test 1 — Health check

```txt
Given Worker đang chạy
When gọi GET /health
Then nhận response 200
And body có ok = true
```

#### Test 2 — Guest login

```txt
Given Worker đang chạy
When gọi POST /auth/guest
Then nhận response 200
And response có token
And response có user.id
And user.type = "guest"
```

#### Test 3 — Auth me hợp lệ

```txt
Given đã có JWT hợp lệ
When gọi GET /auth/me với Authorization header
Then nhận response 200
And response trả đúng user id
```

#### Test 4 — Auth me thiếu token

```txt
Given không có Authorization header
When gọi GET /auth/me
Then nhận response 401
And error.code = "AUTH_MISSING_TOKEN"
```

#### Test 5 — Auth me token sai

```txt
Given token không hợp lệ
When gọi GET /auth/me
Then nhận response 401
And error.code = "AUTH_INVALID_TOKEN"
```

---

### Frontend

#### Test 1 — Hiển thị nút login khi chưa đăng nhập

```txt
Given chưa có token trong localStorage
When mở app
Then hiển thị nút "Log in as Guest"
```

#### Test 2 — Login guest thành công

```txt
Given người dùng chưa đăng nhập
When bấm "Log in as Guest"
Then frontend gọi POST /auth/guest
And lưu token vào localStorage
And hiển thị trạng thái đã đăng nhập
```

#### Test 3 — Reload vẫn giữ trạng thái login

```txt
Given đã login guest thành công
When reload trang
Then frontend đọc token từ localStorage
And gọi GET /auth/me
And hiển thị trạng thái đã đăng nhập
```

#### Test 4 — Token hết hạn hoặc sai

```txt
Given localStorage có token sai
When mở app
Then frontend gọi GET /auth/me
And nhận 401
And xóa token khỏi localStorage
And hiển thị trạng thái chưa đăng nhập
```

---

## 12. Definition of Done

Sprint 1 hoàn thành khi đạt đủ các điều kiện sau:

- Có thư mục `worker/` chạy được Cloudflare Worker.
- `GET /health` trả response thành công.
- `POST /auth/guest` sinh được guest user và JWT.
- `GET /auth/me` verify được JWT.
- Frontend có nút `Log in as Guest`.
- Token được lưu vào `localStorage`.
- Reload app vẫn nhận diện được user nếu token còn hợp lệ.
- Request frontend có thể gửi kèm `Authorization: Bearer <token>`.
- Có xử lý lỗi khi token thiếu, sai hoặc hết hạn.
- Không hardcode JWT secret trong source code.

---

## 13. Demo cuối Sprint

Kịch bản demo:

```txt
1. Mở app.
2. App hiển thị trạng thái chưa đăng nhập.
3. Bấm "Log in as Guest".
4. Backend trả JWT.
5. Frontend hiển thị "Logged in as Guest".
6. Reload trang.
7. App vẫn nhận ra user thông qua token cũ.
8. Gọi thử /auth/me thành công.
```

Kết quả mong muốn:

```txt
Backend đã sẵn sàng để các sprint sau chuyển chat stream và streaming JSON qua server.
```

---

## 14. Rủi ro

### Rủi ro 1 — CORS lỗi khi frontend gọi Worker

Cách xử lý:

- Thêm xử lý `OPTIONS`.
- Cho phép origin local frontend.
- Kiểm tra header `Authorization`.

### Rủi ro 2 — JWT verify lỗi do secret không ổn định

Cách xử lý:

- Dùng một `JWT_SECRET` cố định trong môi trường local.
- Không generate secret mới mỗi lần Worker chạy.

### Rủi ro 3 — Lưu token localStorage chưa đủ bảo mật

Cách xử lý:

- Chấp nhận cho MVP.
- Ghi chú technical debt.
- Sau này cân nhắc HttpOnly cookie.

### Rủi ro 4 — Chưa có database nên guest user không được persist server-side

Cách xử lý:

- Trong Sprint 1, user identity nằm trong JWT là đủ.
- Server storage sẽ xử lý ở sprint sau.
- Khi có database, có thể tạo bảng `users` hoặc `guest_sessions`.

---

## 15. Ghi chú cho Sprint sau

Sprint 2 sẽ dùng nền tảng này để chuyển luồng chat:

```txt
Frontend
  -> POST /chat/stream kèm JWT
  -> Worker verify user
  -> Worker gọi LLM provider
  -> Worker stream response về Frontend
```

Vì vậy Sprint 1 cần đảm bảo phần auth middleware và API helper đủ sạch để tái sử dụng.
