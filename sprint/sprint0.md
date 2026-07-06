# Sprint 0 — Khảo sát & Đóng băng Baseline

## 1. Mục tiêu Sprint

Sprint 0 tập trung khảo sát lại project hiện tại, xác định chức năng nào đã có, chức năng nào còn thiếu, và chuẩn bị nền tảng trước khi chuyển sang kiến trúc mới có backend.

Mục tiêu chính của sprint này là:

- Chạy lại được repo hiện tại.
- Hiểu rõ app hiện tại đang hoạt động như thế nào.
- Ghi nhận các chức năng đã có.
- Ghi nhận các điểm cần refactor.
- Tách nhánh phát triển mới.
- Viết tài liệu baseline để tránh sửa code mất kiểm soát.
- Chuẩn bị cấu trúc thư mục cho các sprint sau.

Sprint 0 chưa xây dựng backend, chưa làm guest login, chưa làm streaming JSON.

---

## 2. Bối cảnh

Project hiện tại đang là một web app chat AI roleplay dạng frontend-only.

Các chức năng chính hiện có:

- Tạo nhân vật thủ công.
- Import nhân vật từ Character Card.
- Chat roleplay 1-1 với nhân vật.
- Cấu hình model AI.
- Stream response từ LLM.
- Lưu dữ liệu local bằng IndexedDB.

Tuy nhiên, theo yêu cầu mới, project cần chuyển hướng sang kiến trúc có backend:

```txt id="9y8waw"
Frontend
  -> Backend Cloudflare Worker
  -> LLM Provider
```

Vì vậy trước khi làm backend, cần khảo sát lại code hiện tại để xác định phần nào giữ lại, phần nào cần sửa, phần nào cần thay thế.

---

## 3. Phạm vi công việc

### 3.1. Trong phạm vi Sprint 0

Sprint này bao gồm:

- Clone hoặc cập nhật repo hiện tại.
- Cài dependencies.
- Chạy app local.
- Chạy build/lint nếu có.
- Kiểm tra các chức năng hiện tại.
- Đọc cấu trúc source code.
- Ghi lại luồng hoạt động chính.
- Xác định các module quan trọng.
- Xác định technical debt.
- Tạo branch mới cho hướng phát triển backend/streaming JSON.
- Tạo tài liệu kế hoạch tổng quan.
- Chuẩn bị cấu trúc folder mới nếu cần.

### 3.2. Ngoài phạm vi Sprint 0

Sprint này chưa làm:

- Cloudflare Worker.
- Guest login.
- JWT authentication.
- Chat stream qua backend.
- Streaming JSON.
- Auto-fill form tạo nhân vật.
- Server database.
- Sync/offline-first.
- Model management nâng cao.
- Resume stream.
- Error handling nâng cao.

---

## 4. Kết quả mong muốn

Sau Sprint 0, nhóm cần trả lời được các câu hỏi sau:

```txt id="ksnik0"
1. App hiện tại chạy được không?
2. Luồng tạo/import character hiện tại đang hoạt động thế nào?
3. Luồng chat hiện tại đang gọi LLM ở đâu?
4. Dữ liệu đang lưu ở đâu?
5. Settings/model config đang nằm ở đâu?
6. File nào chịu trách nhiệm build prompt?
7. File nào chịu trách nhiệm stream response?
8. Những phần nào có thể giữ lại?
9. Những phần nào cần refactor trước khi làm backend?
10. Rủi ro lớn nhất khi chuyển sang backend là gì?
```

---

## 5. Kiến trúc hiện tại cần khảo sát

Luồng hiện tại dự kiến:

```txt id="2afg6l"
User
  -> React UI
  -> Character / Chat Feature
  -> Prompt Builder
  -> LLM Client
  -> OpenAI-compatible API
  -> Stream response
  -> UI update dần
```

Dữ liệu local:

```txt id="hk8w1z"
IndexedDB
  -> settings
  -> characters
  -> messages
```

Sau Sprint 0, cần có sơ đồ thực tế dựa trên code hiện tại.

---

## 6. Công việc chi tiết

## Task 1 — Chuẩn bị môi trường

Clone repo hoặc cập nhật code mới nhất:

```bash id="elyypq"
git clone https://github.com/hieudo2808/chat-ai.git
cd chat-ai
```

Nếu đã có repo local:

```bash id="nfc1uo"
git pull
```

Kiểm tra Node.js:

```bash id="x6tkgg"
node -v
npm -v
```

Cài dependencies:

```bash id="m5xdo9"
npm install
```

Hoặc nếu project dùng pnpm:

```bash id="62jkux"
pnpm install
```

---

## Task 2 — Chạy app local

Chạy development server:

```bash id="o1c2fe"
npm run dev
```

Hoặc:

```bash id="blxfam"
pnpm dev
```

Kiểm tra app có mở được trên trình duyệt không.

Thông thường Vite sẽ chạy ở:

```txt id="5zktx0"
http://localhost:5173
```

Cần ghi lại:

```txt id="w17fb0"
- App có chạy không?
- Có lỗi console không?
- Có lỗi TypeScript không?
- Có lỗi UI runtime không?
- Có lỗi khi reload không?
```

---

## Task 3 — Chạy build và lint

Chạy build:

```bash id="l7ujtl"
npm run build
```

Hoặc:

```bash id="d9lu4d"
pnpm build
```

Chạy lint nếu có:

```bash id="gsmwl5"
npm run lint
```

Hoặc:

```bash id="xn5uju"
pnpm lint
```

Ghi lại kết quả:

```txt id="gv0c79"
Build: pass / fail
Lint: pass / fail
TypeScript: pass / fail
```

Nếu fail, ghi cụ thể lỗi nhưng chưa cần sửa hết trong Sprint 0, trừ lỗi khiến app không chạy được.

---

## Task 4 — Kiểm tra chức năng tạo nhân vật thủ công

Cần test:

```txt id="xjvwu3"
1. Mở app.
2. Tạo character mới.
3. Nhập tên.
4. Nhập mô tả.
5. Nhập personality/scenario nếu có.
6. Lưu character.
7. Reload app.
8. Kiểm tra character còn tồn tại không.
```

Ghi nhận:

```txt id="6p4t8z"
- Form character hiện có những field nào?
- Field nào bắt buộc?
- Field nào đang thiếu so với yêu cầu mới?
- Character được lưu vào đâu?
- Có lỗi khi save không?
```

---

## Task 5 — Kiểm tra chức năng import character

Cần test:

```txt id="ffmtsv"
1. Import character từ file JSON nếu có.
2. Import character từ PNG Character Card nếu có.
3. Kiểm tra avatar.
4. Kiểm tra thông tin character sau khi import.
5. Lưu character.
6. Reload app.
7. Kiểm tra character vẫn tồn tại.
```

Ghi nhận:

```txt id="4bkeco"
- App hỗ trợ format import nào?
- Import JSON có ổn không?
- Import PNG có ổn không?
- Có field nào bị mất khi import không?
- Có validate dữ liệu import không?
```

---

## Task 6 — Kiểm tra chức năng settings/model

Cần test:

```txt id="0s69zo"
1. Mở settings.
2. Kiểm tra các field cấu hình model.
3. Nhập base URL.
4. Nhập API key.
5. Nhập model name.
6. Lưu settings.
7. Reload app.
8. Kiểm tra settings còn tồn tại.
```

Ghi nhận:

```txt id="xj4agf"
- Settings hiện đang lưu những gì?
- API key đang lưu ở đâu?
- Có nhiều model profile không hay chỉ một cấu hình duy nhất?
- Có test connection không?
- Có hỗ trợ provider khác nhau không?
```

---

## Task 7 — Kiểm tra luồng chat hiện tại

Cần test:

```txt id="mlxptt"
1. Chọn character.
2. Cấu hình model hợp lệ.
3. Gửi một message.
4. Quan sát assistant response.
5. Kiểm tra response có stream dần không.
6. Reload app.
7. Kiểm tra lịch sử chat còn không.
```

Ghi nhận:

```txt id="p3quka"
- Chat có hoạt động không?
- Response có stream từng phần không?
- Nếu provider lỗi thì UI xử lý thế nào?
- Nếu API key sai thì báo lỗi thế nào?
- Nếu mạng đứt thì partial response có được giữ không?
- Message được lưu vào đâu?
```

---

## Task 8 — Đọc source code và xác định module chính

Cần xác định các file/module phụ trách:

```txt id="pdyypd"
- App root.
- Character list.
- Character editor.
- Character import.
- Chat panel.
- Chat hook.
- LLM client.
- Prompt builder.
- IndexedDB wrapper.
- Settings modal.
- Types chính.
```

Tạo bảng ghi chú:

| Chức năng        | File/module hiện tại | Ghi chú |
| ---------------- | -------------------- | ------- |
| App root         |                      |         |
| Chat UI          |                      |         |
| Chat logic       |                      |         |
| LLM client       |                      |         |
| Prompt builder   |                      |         |
| Character import |                      |         |
| Character editor |                      |         |
| Local DB         |                      |         |
| Settings         |                      |         |
| Types            |                      |         |

---

## Task 9 — Xác định phần giữ lại và phần cần refactor

Phân loại code hiện tại thành 3 nhóm:

### Nhóm 1 — Giữ lại gần như nguyên vẹn

Ví dụ:

```txt id="bplvwr"
- Character editor cơ bản.
- Character import.
- Chat UI cơ bản.
- IndexedDB local storage.
- Prompt builder nếu đang hoạt động ổn.
```

### Nhóm 2 — Cần refactor

Ví dụ:

```txt id="0kgab6"
- LLM client gọi trực tiếp provider từ frontend.
- Settings chỉ hỗ trợ một model.
- Chat hook đang phụ thuộc quá chặt vào LLM client.
- Error handling stream còn yếu.
```

### Nhóm 3 — Cần làm mới

Ví dụ:

```txt id="ybc05u"
- Backend Cloudflare Worker.
- Guest auth.
- JWT.
- Streaming JSON parser.
- Character generation auto-fill.
- Server sync.
```

---

## Task 10 — Tạo branch phát triển mới

Tạo branch cho hướng mới:

```bash id="4kavb9"
git checkout -b feature/backend-streaming-json
```

Hoặc nếu muốn tách riêng từng sprint:

```bash id="xf9b3z"
git checkout -b sprint-0-baseline
```

Quy ước branch đề xuất:

```txt id="ewlk4b"
sprint-0-baseline
sprint-1-worker-auth
sprint-2-chat-stream-backend
sprint-3-streaming-json
sprint-4-character-generation-ui
```

---

## Task 11 — Tạo tài liệu baseline

Tạo file:

```txt id="5rfeos"
docs/baseline/current-project-baseline.md
```

Nội dung cần có:

```txt id="hjdwcp"
1. Project hiện tại làm gì?
2. Tech stack hiện tại.
3. Cấu trúc thư mục hiện tại.
4. Luồng tạo/import character.
5. Luồng chat.
6. Luồng lưu dữ liệu.
7. Luồng settings/model.
8. Các vấn đề hiện tại.
9. Các phần giữ lại.
10. Các phần cần refactor.
```

---

## Task 12 — Tạo tài liệu kế hoạch tổng quan

Tạo file:

```txt id="wh7xjc"
docs/roadmap/new-direction-roadmap.md
```

Nội dung:

```txt id="ks9lg3"
- Mục tiêu sản phẩm mới.
- Lý do chuyển từ frontend-only sang backend.
- Các sprint dự kiến.
- Rủi ro kỹ thuật chính.
- Ưu tiên MVP.
```

Sprint dự kiến:

```txt id="xi1hje"
Sprint 0 — Baseline
Sprint 1 — Cloudflare Worker + Guest Login
Sprint 2 — Chat Stream qua Backend
Sprint 3 — Streaming JSON Core
Sprint 4 — AI Character Generation UX
Sprint 5 — Model Management
Sprint 6 — Server Storage + Sync cơ bản
Sprint 7 — Offline-first nâng cao
```

---

## Task 13 — Chuẩn bị cấu trúc thư mục frontend mới

Chưa cần di chuyển toàn bộ code ngay. Nhưng có thể chuẩn bị cấu trúc:

```txt id="tsvu4s"
src/
  features/
    auth/
    chat/
    characters/
    character-generation/
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

Trong Sprint 0, chỉ cần tạo nếu cần. Không refactor mạnh nếu chưa chắc.

Nguyên tắc:

```txt id="0sdq27"
Không đổi logic lớn trong Sprint 0.
Không làm hỏng luồng chat hiện tại.
Không vừa khảo sát vừa viết backend.
```

---

## 7. Checklist kiểm thử thủ công

## 7.1. App startup

```txt id="dx4d1k"
[ ] npm install / pnpm install thành công
[ ] npm run dev / pnpm dev thành công
[ ] App mở được trên browser
[ ] Không có lỗi runtime nghiêm trọng
[ ] Reload trang không crash
```

## 7.2. Character

```txt id="umwi2w"
[ ] Tạo character thủ công được
[ ] Edit character được
[ ] Delete character được nếu app hỗ trợ
[ ] Character lưu lại sau reload
[ ] Import JSON character được nếu có file test
[ ] Import PNG character card được nếu có file test
```

## 7.3. Settings / Model

```txt id="kguww5"
[ ] Mở settings được
[ ] Lưu API config được
[ ] Reload vẫn giữ settings
[ ] Biết API key đang lưu ở đâu
[ ] Biết app hiện hỗ trợ một hay nhiều model
```

## 7.4. Chat

```txt id="zjp4f6"
[ ] Gửi message được
[ ] Assistant response stream được
[ ] Message lưu sau reload
[ ] Lỗi API key được hiển thị
[ ] Lỗi network không làm crash app
```

## 7.5. Build quality

```txt id="49ms6c"
[ ] Build pass hoặc lỗi đã được ghi lại
[ ] Lint pass hoặc lỗi đã được ghi lại
[ ] TypeScript pass hoặc lỗi đã được ghi lại
```

---

## 8. Deliverables

Cuối Sprint 0 cần có:

```txt id="tmr9mw"
1. Repo chạy được local.
2. Branch phát triển mới.
3. Tài liệu baseline.
4. Tài liệu roadmap.
5. Checklist chức năng hiện tại.
6. Danh sách bug hiện tại.
7. Danh sách technical debt.
8. Danh sách phần giữ lại/refactor/làm mới.
```

File đề xuất:

```txt id="0q4cik"
docs/
  baseline/
    current-project-baseline.md
  roadmap/
    new-direction-roadmap.md
  sprints/
    sprint-0-baseline.md
```

---

## 9. Definition of Done

Sprint 0 hoàn thành khi đạt đủ các điều kiện sau:

- Cài được dependencies.
- Chạy được app local.
- Đã kiểm tra chức năng tạo character.
- Đã kiểm tra chức năng import character.
- Đã kiểm tra chức năng settings/model.
- Đã kiểm tra chức năng chat stream hiện tại.
- Đã xác định nơi lưu dữ liệu local.
- Đã xác định nơi gọi LLM provider.
- Đã xác định nơi build prompt.
- Đã tạo branch cho hướng phát triển mới.
- Đã có tài liệu baseline.
- Đã có roadmap tổng quan.
- Đã có danh sách technical debt.
- Nhóm thống nhất phần nào giữ lại, phần nào refactor, phần nào làm mới.

---

## 10. Demo cuối Sprint

Sprint 0 không cần demo tính năng mới. Demo nên tập trung vào việc chứng minh nhóm đã hiểu hệ thống hiện tại.

Kịch bản demo:

```txt id="87ckcu"
1. Chạy app local.
2. Mở màn hình character.
3. Tạo hoặc import một character.
4. Mở settings/model config.
5. Gửi một message chat.
6. Assistant response stream dần.
7. Reload app.
8. Character và message vẫn còn.
9. Trình bày sơ đồ luồng hiện tại.
10. Trình bày kế hoạch refactor cho Sprint 1 và Sprint 2.
```

Kết quả mong muốn:

```txt id="5dkskx"
Nhóm xác nhận app hiện tại đủ nền để phát triển tiếp, nhưng cần chuyển phần gọi LLM sang backend trong các sprint sau.
```

---

## 11. Rủi ro

### Rủi ro 1 — App hiện tại không chạy được

Cách xử lý:

```txt id="lifz4h"
- Ghi rõ lỗi.
- Ưu tiên sửa lỗi cài đặt/build cơ bản.
- Không sửa logic nghiệp vụ nếu chưa cần.
```

### Rủi ro 2 — Không có file test Character Card

Cách xử lý:

```txt id="xj3ag3"
- Tạo character thủ công để test trước.
- Sau đó chuẩn bị một file JSON/PNG mẫu cho import test.
```

### Rủi ro 3 — API provider không gọi được

Cách xử lý:

```txt id="03v3g0"
- Kiểm tra base URL.
- Kiểm tra API key.
- Kiểm tra model name.
- Nếu vẫn lỗi, ghi lại và dùng mock response tạm thời để test UI.
```

### Rủi ro 4 — Code hiện tại phụ thuộc chặt giữa UI và LLM client

Cách xử lý:

```txt id="nilcvq"
- Ghi nhận là technical debt.
- Không refactor lớn trong Sprint 0.
- Đưa vào Sprint 2 khi chuyển chat stream qua backend.
```

### Rủi ro 5 — IndexedDB data structure chưa rõ

Cách xử lý:

```txt id="404a1y"
- Kiểm tra file DB wrapper.
- Kiểm tra DevTools Application > IndexedDB.
- Ghi lại schema hiện tại.
```

---

## 12. Technical Debt cần ghi nhận

Các vấn đề có thể xuất hiện sau khảo sát:

```txt id="vj5zya"
- Frontend gọi trực tiếp LLM provider.
- API key lưu ở browser.
- Chưa có backend.
- Chưa có auth.
- Settings model chưa tách thành model profile.
- Stream error handling chưa tốt.
- Chưa giữ partial response rõ ràng khi stream lỗi.
- Chưa có structured streaming JSON.
- Chưa có server persistence.
- Chưa có sync/offline-first.
- Chưa có test đầy đủ cho prompt builder và stream reader.
```

---

## 13. Ghi chú cho Sprint 1

Sprint 1 sẽ bắt đầu tạo backend tối thiểu:

```txt id="9qzf1l"
Cloudflare Worker
  -> GET /health
  -> POST /auth/guest
  -> GET /auth/me
```

Vì vậy Sprint 0 cần bàn giao rõ:

```txt id="es1khb"
- Frontend đang chạy ở port nào.
- API client nên đặt ở đâu.
- Auth UI nên gắn vào layout nào.
- Có cần bảo vệ màn chat bằng login hay không.
- Các biến môi trường frontend/backend sẽ đặt tên thế nào.
```

---

## 14. Ghi chú cho Sprint 2

Sprint 2 sẽ chuyển chat stream qua backend.

Sprint 0 cần xác định sẵn:

```txt id="y0gqhw"
- File nào hiện đang gọi LLM.
- Response stream hiện đang được đọc như thế nào.
- Prompt builder hiện trả ra messages format gì.
- useChat hiện đang lưu message ra sao.
- Khi stream lỗi hiện tại UI xử lý thế nào.
```

Điều này giúp Sprint 2 không phải đọc lại từ đầu.

---

## 15. Kết luận Sprint 0

Sprint 0 là sprint chuẩn bị, không tạo tính năng mới cho người dùng cuối nhưng rất quan trọng để giảm rủi ro.

Sau sprint này, nhóm phải có đủ thông tin để bắt đầu chuyển project sang kiến trúc mới:

```txt id="prvwge"
Frontend hiện tại
  + Backend Cloudflare Worker
  + Guest Auth
  + Chat Streaming Proxy
  + Streaming JSON Character Generation
  + Local-first Sync
```

Nếu Sprint 0 làm tốt, các sprint sau sẽ rõ việc hơn và ít bị sửa đi sửa lại.
