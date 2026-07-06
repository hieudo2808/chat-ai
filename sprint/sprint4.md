# Sprint 4 — UX Tạo Nhân Vật Bằng AI

## 1. Mục tiêu Sprint

Sprint 4 tập trung hoàn thiện trải nghiệm người dùng cho tính năng **tạo nhân vật bằng AI từ một ý tưởng ngắn**.

Sau sprint này, người dùng có thể nhập một mô tả đơn giản như:

```txt
Tôi muốn một nữ kiếm sĩ cổ trang là android, lạnh lùng nhưng nói chuyện dịu dàng.
```

Sau đó hệ thống sẽ gọi backend, nhận dữ liệu dạng stream, và tự động điền từng field vào form tạo nhân vật theo thời gian thực.

Mục tiêu quan trọng nhất của sprint này là:

```txt
User không phải chờ 1–2 phút nhìn loading trống.
Form phải hiện dữ liệu ngay khi AI bắt đầu trả kết quả.
```

---

## 2. Bối cảnh

Ở Sprint 3, hệ thống đã có nền tảng kỹ thuật:

```txt
POST /generate-character/stream
  -> Backend gọi LLM
  -> Backend trả NDJSON event stream
  -> Frontend đọc từng event
  -> Reducer cập nhật state từng field
```

Sprint 4 sẽ biến phần kỹ thuật đó thành trải nghiệm người dùng hoàn chỉnh:

```txt
Nhập idea
  -> Bấm Generate
  -> Form hiện ngay
  -> Field tự fill dần
  -> Field đang stream bị khóa
  -> Stream xong thì mở khóa
  -> User chỉnh sửa
  -> Save thành character thật
```

---

## 3. Phạm vi công việc

### 3.1. Trong phạm vi Sprint 4

Sprint này bao gồm:

- Thiết kế UI chính thức cho tính năng tạo nhân vật bằng AI.
- Tạo input nhập ý tưởng nhân vật.
- Gọi API streaming từ Sprint 3.
- Hiển thị form character draft.
- Auto-fill từng field theo stream event.
- Disable field trong lúc đang stream.
- Unlock field sau khi stream hoàn tất.
- Cho phép cancel stream.
- Giữ partial draft nếu stream lỗi hoặc user cancel.
- Cho phép user chỉnh sửa draft sau khi stream kết thúc.
- Cho phép save draft thành character thật.
- Hiển thị trạng thái stream rõ ràng.
- Xử lý lỗi UX khi mất kết nối.
- Lưu partial draft tạm thời vào IndexedDB nếu cần.

### 3.2. Ngoài phạm vi Sprint 4

Sprint này chưa làm:

- Resume stream hoàn chỉnh bằng `streamId`.
- Server-side character storage đầy đủ.
- Sync/offline-first.
- Conflict resolution.
- Multi-user sharing.
- Advanced model management.
- Image/avatar generation.
- Character memory dài hạn.
- Dating sim gameplay.

---

## 4. User Story

## Story 1 — Tạo nhân vật từ idea

```txt
Là người dùng,
tôi muốn nhập một ý tưởng nhân vật ngắn,
để hệ thống tự tạo tên, mô tả, tính cách, bối cảnh và lời mở đầu cho tôi.
```

Acceptance Criteria:

```txt
- User nhập được idea.
- User bấm Generate.
- Form tạo nhân vật hiện ra ngay.
- Dữ liệu được fill dần.
- User không phải chờ toàn bộ kết quả mới thấy form.
```

---

## Story 2 — Xem dữ liệu đang stream

```txt
Là người dùng,
tôi muốn nhìn thấy từng phần thông tin nhân vật xuất hiện trong lúc AI đang tạo,
để biết hệ thống vẫn đang hoạt động.
```

Acceptance Criteria:

```txt
- Name hiện khi backend bắt đầu gửi field name.
- Description hiện dần khi có field_delta.
- Tags hiện từng item.
- Example dialogues hiện từng dòng.
- Có trạng thái "Đang tạo..." rõ ràng.
```

---

## Story 3 — Không cho sửa field khi đang stream

```txt
Là hệ thống,
tôi cần khóa các field đang được AI điền,
để tránh user sửa khi stream chưa kết thúc làm hỏng logic state.
```

Acceptance Criteria:

```txt
- Field đang stream bị disabled.
- User vẫn nhìn thấy text đang hiện ra.
- User không nhập được vào field đang stream.
- Sau khi stream xong, field được unlock.
```

---

## Story 4 — Giữ partial draft khi lỗi

```txt
Là người dùng,
nếu stream bị lỗi giữa chừng,
tôi muốn giữ lại phần nội dung đã được tạo,
để không phải làm lại từ đầu.
```

Acceptance Criteria:

```txt
- Lỗi stream không xóa dữ liệu đã có.
- UI hiển thị warning.
- User có thể chỉnh sửa partial draft.
- User có thể bấm Generate lại nếu muốn.
```

---

## Story 5 — Save thành character thật

```txt
Là người dùng,
sau khi AI tạo xong nhân vật,
tôi muốn chỉnh sửa lại và lưu nhân vật đó vào danh sách character.
```

Acceptance Criteria:

```txt
- Stream xong thì form editable.
- User sửa được field.
- User bấm Save.
- Character được lưu vào IndexedDB.
- Character xuất hiện trong sidebar/list.
- User có thể chọn character đó để chat.
```

---

## 5. UX Flow

## 5.1. Trạng thái ban đầu

UI hiển thị:

```txt
Create Character with AI

Ý tưởng nhân vật
[________________________________________]

[Generate Character]
```

Ví dụ placeholder:

```txt
Ví dụ: Một nữ kiếm sĩ cổ trang là android, lạnh lùng nhưng dịu dàng.
```

---

## 5.2. Khi user bấm Generate

Ngay lập tức:

```txt
- Disable nút Generate.
- Hiện nút Cancel.
- Hiện form draft.
- Field chưa có dữ liệu hiển thị skeleton hoặc placeholder.
- Gửi request tới /generate-character/stream.
```

UI:

```txt
Đang tạo nhân vật...

Name: Đang tạo tên...
Description: Đang tạo mô tả...
Personality: Đang tạo tính cách...
Scenario: Đang tạo bối cảnh...
First Message: Đang tạo lời mở đầu...
Tags: Đang tạo tags...
```

---

## 5.3. Khi stream đang chạy

Field được cập nhật theo event.

Ví dụ:

```txt
Name:
Nguyệt Cơ

Description:
Một android cổ trang được tạo ra để bảo vệ hoàng thành...

Personality:
Lạnh lùng, điềm tĩnh...
```

Quy tắc:

```txt
- Field nào đang nhận delta thì status = streaming.
- Field đang streaming bị disabled.
- Field chưa có dữ liệu thì hiển thị placeholder.
- Field array hiển thị từng item khi nhận được.
```

---

## 5.4. Khi stream hoàn tất

UI chuyển sang trạng thái editable:

```txt
Đã tạo xong. Bạn có thể chỉnh sửa trước khi lưu.

[Save Character]
[Regenerate]
[Discard]
```

Quy tắc:

```txt
- Unlock toàn bộ field.
- User có thể sửa tên, mô tả, personality, scenario...
- User có thể thêm/xóa tags.
- User có thể sửa example dialogues.
```

---

## 5.5. Khi user cancel

Nếu user bấm Cancel giữa chừng:

```txt
- Abort stream.
- Giữ dữ liệu đã có.
- Chuyển streamStatus = cancelled.
- Unlock field đã có dữ liệu.
- Hiện warning.
```

Thông báo đề xuất:

```txt
Quá trình tạo đã được dừng. Bản nháp hiện tại vẫn được giữ lại.
```

UI sau cancel:

```txt
[Continue Editing]
[Generate Again]
[Discard]
```

---

## 5.6. Khi stream lỗi

Nếu mất mạng hoặc backend lỗi giữa chừng:

```txt
- Giữ partial draft.
- Chuyển streamStatus = partial_error.
- Unlock field để user chỉnh sửa.
- Hiện thông báo lỗi.
```

Thông báo đề xuất:

```txt
Kết nối bị gián đoạn. Bản nháp đã được giữ lại, bạn có thể chỉnh sửa hoặc tạo lại.
```

Không được:

```txt
- Xóa toàn bộ form.
- Reset về màn hình ban đầu.
- Chỉ báo "Failed" mà không giữ dữ liệu.
```

---

## 6. UI Component Structure

Đề xuất tạo folder:

```txt
src/
  features/
    character-generation/
      components/
        CharacterGenerationPage.tsx
        CharacterIdeaInput.tsx
        GeneratedCharacterForm.tsx
        GeneratedField.tsx
        GeneratedArrayField.tsx
        GenerationStatusBanner.tsx
        GenerationActions.tsx
      hooks/
        useCharacterGeneration.ts
      services/
        characterGenerationApi.ts
      state/
        characterGenerationReducer.ts
      types.ts
```

---

## 7. Frontend Tasks

## Task 1 — Tạo `CharacterGenerationPage`

File:

```txt
src/features/character-generation/components/CharacterGenerationPage.tsx
```

Nhiệm vụ:

```txt
- Là container chính cho flow tạo character bằng AI.
- Quản lý layout tổng.
- Gọi hook useCharacterGeneration.
- Render idea input.
- Render form draft.
- Render action buttons.
```

Layout đề xuất:

```txt
Create Character with AI

[Idea Input]

[Status Banner]

[Generated Form]

[Actions]
```

---

## Task 2 — Tạo `CharacterIdeaInput`

File:

```txt
src/features/character-generation/components/CharacterIdeaInput.tsx
```

Props đề xuất:

```ts
type CharacterIdeaInputProps = {
    value: string;
    disabled: boolean;
    onChange: (value: string) => void;
    onGenerate: () => void;
};
```

Hành vi:

```txt
- Cho user nhập idea.
- Disable khi đang stream nếu cần.
- Validate idea rỗng.
- Bấm Enter có thể generate nếu UX cho phép.
```

Validation tối thiểu:

```txt
- Không cho generate nếu idea rỗng.
- Idea phải dài ít nhất 3 ký tự.
- Idea không nên quá 1000 ký tự.
```

---

## Task 3 — Tạo `GeneratedCharacterForm`

File:

```txt
src/features/character-generation/components/GeneratedCharacterForm.tsx
```

Field cần hiển thị:

```txt
- name
- description
- personality
- scenario
- firstMessage
- appearance
- speakingStyle
- tags
- exampleDialogues
```

Form nhận state từ reducer:

```ts
type GeneratedCharacterFormProps = {
    fields: CharacterGenerationState['fields'];
    editable: boolean;
    onFieldChange: (path: string, value: unknown) => void;
};
```

Quy tắc disabled:

```txt
Nếu streamStatus = streaming:
  - Field đang stream: disabled
  - Field chưa done: disabled
  - Có thể khóa toàn bộ form để đơn giản

Nếu streamStatus = done / partial_error / cancelled:
  - Unlock field
  - Cho user chỉnh sửa
```

MVP nên khóa toàn bộ form trong lúc stream để tránh logic phức tạp.

---

## Task 4 — Tạo `GeneratedField`

File:

```txt
src/features/character-generation/components/GeneratedField.tsx
```

Dùng cho field string như:

```txt
name
description
personality
scenario
firstMessage
appearance
speakingStyle
```

Props:

```ts
type GeneratedFieldProps = {
    label: string;
    value: string;
    status: 'pending' | 'streaming' | 'done' | 'error';
    disabled: boolean;
    multiline?: boolean;
    placeholder?: string;
    onChange: (value: string) => void;
};
```

UI behavior:

```txt
pending:
  - Hiển thị placeholder hoặc skeleton.

streaming:
  - Hiển thị value đang có.
  - Field disabled.
  - Hiện indicator nhỏ "Đang tạo..."

done:
  - Hiển thị value.
  - Cho sửa nếu form editable.

error:
  - Hiển thị partial value.
  - Hiện warning nhỏ nếu cần.
```

---

## Task 5 — Tạo `GeneratedArrayField`

File:

```txt
src/features/character-generation/components/GeneratedArrayField.tsx
```

Dùng cho:

```txt
tags
exampleDialogues
```

Props:

```ts
type GeneratedArrayFieldProps = {
    label: string;
    values: string[];
    status: 'pending' | 'streaming' | 'done' | 'error';
    disabled: boolean;
    onChange: (values: string[]) => void;
};
```

Behavior cho tags:

```txt
- Mỗi tag là một chip.
- Khi streaming, tag mới hiện dần theo array_item.
- Khi done, user có thể xóa/thêm tag.
```

Behavior cho exampleDialogues:

```txt
- Hiển thị list textarea hoặc list item.
- Khi streaming, mỗi dialogue hiện khi nhận được array_item.
- Khi done, user có thể sửa từng item.
```

---

## Task 6 — Tạo `GenerationStatusBanner`

File:

```txt
src/features/character-generation/components/GenerationStatusBanner.tsx
```

Các trạng thái cần hiển thị:

| State           | Text đề xuất                                    |
| --------------- | ----------------------------------------------- |
| `idle`          | Nhập ý tưởng để tạo nhân vật                    |
| `starting`      | Đang bắt đầu tạo nhân vật...                    |
| `streaming`     | Đang tạo nhân vật, dữ liệu sẽ xuất hiện dần...  |
| `done`          | Đã tạo xong, bạn có thể chỉnh sửa trước khi lưu |
| `partial_error` | Kết nối bị gián đoạn, bản nháp đã được giữ lại  |
| `cancelled`     | Quá trình tạo đã được dừng, bản nháp vẫn còn    |

---

## Task 7 — Tạo `GenerationActions`

File:

```txt
src/features/character-generation/components/GenerationActions.tsx
```

Nút cần có theo state:

### `idle`

```txt
[Generate Character]
```

### `streaming`

```txt
[Cancel]
```

### `done`

```txt
[Save Character]
[Regenerate]
[Discard]
```

### `partial_error`

```txt
[Save Partial Draft]
[Generate Again]
[Discard]
```

### `cancelled`

```txt
[Continue Editing]
[Generate Again]
[Discard]
```

MVP có thể dùng:

```txt
[Save]
[Generate Again]
[Cancel]
[Discard]
```

---

## Task 8 — Tạo hook `useCharacterGeneration`

File:

```txt
src/features/character-generation/hooks/useCharacterGeneration.ts
```

Hook này quản lý:

```txt
- idea
- stream state
- abort controller
- generated fields
- start generation
- cancel generation
- edit generated field
- save character
- discard draft
```

API đề xuất:

```ts
type UseCharacterGenerationResult = {
    idea: string;
    setIdea: (value: string) => void;

    state: CharacterGenerationState;

    canGenerate: boolean;
    canCancel: boolean;
    canEdit: boolean;
    canSave: boolean;

    startGeneration: () => Promise<void>;
    cancelGeneration: () => void;
    updateField: (path: string, value: unknown) => void;
    saveCharacter: () => Promise<void>;
    discardDraft: () => void;
};
```

---

## Task 9 — Save generated draft thành character thật

Khi user bấm Save:

```txt
1. Convert GeneratedCharacterDraft sang Character entity hiện tại.
2. Validate field bắt buộc.
3. Lưu vào IndexedDB.
4. Thêm vào character list/sidebar.
5. Chọn character vừa tạo nếu phù hợp.
```

Mapping đề xuất:

```txt
GeneratedCharacterDraft.name
  -> Character.name

GeneratedCharacterDraft.description
  -> Character.description

GeneratedCharacterDraft.personality
  -> Character.personality

GeneratedCharacterDraft.scenario
  -> Character.scenario

GeneratedCharacterDraft.firstMessage
  -> Character.firstMessage

GeneratedCharacterDraft.appearance
  -> Character.appearance nếu schema hiện có hỗ trợ

GeneratedCharacterDraft.speakingStyle
  -> Character.speakingStyle hoặc note/prompt extension

GeneratedCharacterDraft.tags
  -> Character.tags nếu schema hiện có hỗ trợ

GeneratedCharacterDraft.exampleDialogues
  -> Character.exampleDialogues / mes_example nếu schema hiện có hỗ trợ
```

Nếu schema hiện tại chưa có field tương ứng, cần quyết định:

```txt
- Thêm field mới vào Character type.
- Hoặc merge vào description/personality.
- Hoặc lưu vào metadata.
```

Ưu tiên: thêm field rõ ràng nếu không phá import/export.

---

## Task 10 — Partial draft autosave

Để tránh mất dữ liệu khi tab reload hoặc lỗi stream, có thể lưu draft tạm vào IndexedDB.

Entity đề xuất:

```ts
type CharacterGenerationDraft = {
    id: string;
    idea: string;
    fields: Partial<GeneratedCharacterDraft>;
    streamStatus: 'streaming' | 'done' | 'partial_error' | 'cancelled';
    createdAt: string;
    updatedAt: string;
};
```

Luồng:

```txt
- Khi stream_started: tạo draft local.
- Khi field_delta/array_item: update draft local.
- Khi done: mark done.
- Khi save character: có thể xóa draft hoặc mark saved.
```

Nếu không đủ thời gian, autosave có thể để cuối sprint hoặc technical debt.

---

## 8. Backend Tasks

Sprint 4 chủ yếu frontend/UX, nhưng backend có thể cần tinh chỉnh.

## Task 1 — Cải thiện prompt output cho UX

Backend prompt nên sinh field theo thứ tự phù hợp với form:

```txt
1. name
2. description
3. appearance
4. personality
5. scenario
6. speakingStyle
7. firstMessage
8. tags
9. exampleDialogues
```

Lý do:

```txt
User nhìn thấy name/description sớm sẽ có cảm giác hệ thống phản hồi ngay.
```

---

## Task 2 — Đảm bảo event đủ ổn định

Backend cần đảm bảo event trả về đúng spec Sprint 3:

```txt
stream_started
field_delta
field_done
array_item
done
error
```

Không được để frontend phải xử lý format mới ngoài spec trong Sprint 4.

---

## Task 3 — Thêm metadata nếu cần

Có thể bổ sung event:

```json
{
    "seq": 1,
    "type": "stream_started",
    "streamId": "str_abc",
    "schemaVersion": "character-draft-v1"
}
```

Mục tiêu:

```txt
- Debug dễ hơn.
- Sau này migration schema dễ hơn.
```

Không bắt buộc cho MVP.

---

## 9. State Management

State chính vẫn dùng từ Sprint 3:

```ts
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

Bổ sung action cho user edit:

```ts
type CharacterGenerationAction =
    | { type: 'USER_UPDATE_FIELD'; path: string; value: unknown }
    | { type: 'USER_DISCARD_DRAFT' }
    | { type: 'USER_RESET_FOR_REGENERATE' };
```

Quy tắc:

```txt
USER_UPDATE_FIELD chỉ được cho phép khi streamStatus không phải streaming.
```

---

## 10. Validation

Trước khi Save Character:

```txt
- name không được rỗng.
- firstMessage không được rỗng nếu app yêu cầu.
- description/personality có thể rỗng nhưng nên warning.
- tags không bắt buộc.
- exampleDialogues không bắt buộc.
```

Lỗi validation hiển thị inline.

Ví dụ:

```txt
Tên nhân vật là bắt buộc.
```

---

## 11. Error Handling UX

## 11.1. Idea rỗng

Khi user bấm Generate mà idea rỗng:

```txt
Vui lòng nhập ý tưởng nhân vật.
```

---

## 11.2. Chưa login

Nếu user chưa login guest:

```txt
Bạn cần đăng nhập Guest trước khi tạo nhân vật bằng AI.
```

Có thể hiển thị nút:

```txt
[Log in as Guest]
```

---

## 11.3. API lỗi trước khi stream

Ví dụ token sai, request sai, provider lỗi ngay từ đầu.

UI:

```txt
Không thể bắt đầu tạo nhân vật. Vui lòng thử lại.
```

Không render form nếu chưa có stream_started.

---

## 11.4. Stream lỗi giữa chừng

UI:

```txt
Kết nối bị gián đoạn. Bản nháp đã được giữ lại, bạn có thể chỉnh sửa hoặc tạo lại.
```

Hành vi:

```txt
- Giữ partial data.
- Unlock form.
- Cho Save Partial Draft nếu name hợp lệ.
```

---

## 11.5. User chuyển tab / trình duyệt pause stream

Nếu stream bị dừng:

```txt
- Frontend catch error.
- Mark partial_error.
- Giữ draft.
```

MVP chưa cần resume thật sự.

---

## 12. UI Rules

## 12.1. Không để màn hình loading trống

Sai:

```txt
User bấm Generate
  -> hiện spinner 2 phút
  -> xong mới hiện form
```

Đúng:

```txt
User bấm Generate
  -> hiện form ngay
  -> từng field xuất hiện dần
```

---

## 12.2. Không cho sửa trong lúc stream

Sai:

```txt
User sửa description khi AI đang stream description.
```

Đúng:

```txt
Field disabled trong lúc stream.
Text vẫn hiện ra.
Stream xong mới editable.
```

---

## 12.3. Không xóa partial data

Sai:

```txt
Stream lỗi
  -> reset toàn bộ form
```

Đúng:

```txt
Stream lỗi
  -> giữ field đã có
  -> báo lỗi nhẹ
  -> cho user chỉnh sửa
```

---

## 12.4. Trạng thái phải rõ ràng

Cần có status banner hoặc label:

```txt
Đang tạo...
Đã tạo xong.
Đã dừng.
Kết nối bị gián đoạn.
```

---

## 13. Test Cases

## 13.1. Frontend tests

### Test 1 — Idea rỗng không generate

```txt
Given idea rỗng
When user bấm Generate
Then không gọi API
And hiển thị lỗi "Vui lòng nhập ý tưởng nhân vật"
```

### Test 2 — Generate thành công

```txt
Given user đã login
And idea hợp lệ
When user bấm Generate
Then frontend gọi POST /generate-character/stream
And form draft được hiển thị
And streamStatus = streaming
```

### Test 3 — Field auto-fill theo stream

```txt
Given stream trả field_delta name
When frontend nhận event
Then field name được append text
And input name bị disabled
```

### Test 4 — Array field hiện từng item

```txt
Given stream trả array_item path = tags
When frontend nhận event
Then tag mới xuất hiện trong UI
```

### Test 5 — Stream done unlock form

```txt
Given stream đang chạy
When frontend nhận event done
Then streamStatus = done
And toàn bộ form editable
And nút Save hiển thị
```

### Test 6 — Cancel giữ partial data

```txt
Given stream đang chạy
And name đã có dữ liệu
When user bấm Cancel
Then request bị abort
And streamStatus = cancelled
And name vẫn còn
And form editable
```

### Test 7 — Stream error giữ partial data

```txt
Given stream đang chạy
And description đã có một phần
When stream bị lỗi
Then streamStatus = partial_error
And description không bị xóa
And hiển thị warning
```

### Test 8 — Save generated character

```txt
Given stream done
And name hợp lệ
When user bấm Save Character
Then character được lưu vào IndexedDB
And character xuất hiện trong list
```

### Test 9 — Save partial draft

```txt
Given stream partial_error
And name hợp lệ
When user bấm Save Partial Draft
Then character vẫn được lưu
And các field thiếu được để rỗng hoặc default
```

---

## 13.2. Manual QA checklist

```txt
[ ] Mở được màn Create Character with AI
[ ] Nhập idea được
[ ] Bấm Generate được
[ ] Form hiện ngay sau khi bấm Generate
[ ] Name được fill dần
[ ] Description được fill dần
[ ] Personality được fill dần
[ ] Tags hiện từng item
[ ] Field bị disabled khi stream
[ ] Field unlock sau khi done
[ ] Cancel stream giữ partial data
[ ] Lỗi stream giữ partial data
[ ] Save thành character thật
[ ] Character mới chat được
[ ] Reload app character vẫn còn
```

---

## 14. Definition of Done

Sprint 4 hoàn thành khi đạt đủ các điều kiện sau:

- Có màn hình hoặc modal tạo nhân vật bằng AI.
- User nhập được idea.
- User bấm Generate để bắt đầu stream.
- Form draft hiển thị ngay khi bắt đầu tạo.
- Các field được auto-fill theo stream event.
- Text field hiển thị nội dung đang stream.
- Array field hiển thị từng item.
- Field bị disabled trong lúc stream.
- Field unlock khi stream hoàn tất.
- User cancel stream được.
- Cancel không xóa partial draft.
- Stream error không xóa partial draft.
- User chỉnh sửa được draft sau khi stream kết thúc/cancel/lỗi.
- User save được draft thành character thật.
- Character vừa tạo xuất hiện trong danh sách character.
- Character vừa tạo có thể dùng để chat.
- Có trạng thái UI rõ ràng cho streaming/done/cancel/error.

---

## 15. Demo cuối Sprint

Kịch bản demo:

```txt
1. Mở app.
2. Log in as Guest.
3. Vào màn Create Character with AI.
4. Nhập idea:
   "Tôi muốn một nữ kiếm sĩ cổ trang là android, lạnh lùng nhưng nói chuyện dịu dàng."
5. Bấm Generate.
6. Form hiện ra ngay.
7. Name, description, personality, scenario hiện dần.
8. Tags xuất hiện từng tag.
9. Trong lúc stream, thử click vào field và xác nhận field bị khóa.
10. Stream hoàn tất.
11. Field được unlock.
12. Sửa lại name hoặc firstMessage.
13. Bấm Save Character.
14. Character xuất hiện trong sidebar.
15. Chọn character và gửi message chat thử.
```

Kết quả mong muốn:

```txt
Tính năng tạo nhân vật bằng AI đã có UX hoàn chỉnh ở mức MVP.
```

Demo lỗi/cancel:

```txt
1. Generate lại một character khác.
2. Bấm Cancel giữa chừng.
3. Partial data vẫn còn.
4. Form được unlock.
5. User có thể chỉnh sửa hoặc discard.
```

---

## 16. Rủi ro

## Rủi ro 1 — Stream event về quá nhanh làm UI render nhiều

Cách xử lý:

```txt
- Chỉ update field bị thay đổi.
- Có thể batch update nếu cần.
- Không render raw event log trong production UI.
```

---

## Rủi ro 2 — User muốn sửa ngay khi stream chưa xong

Cách xử lý:

```txt
- Disable form trong lúc stream.
- Hiển thị tooltip hoặc text: "Bạn có thể chỉnh sửa sau khi tạo xong."
```

---

## Rủi ro 3 — Field bị thiếu do LLM không sinh đủ dữ liệu

Cách xử lý:

```txt
- Khi done, field thiếu vẫn unlock.
- Hiển thị placeholder.
- Cho user tự nhập.
- Có thể thêm warning "Một số trường chưa được tạo đầy đủ."
```

---

## Rủi ro 4 — Save character lỗi do schema hiện tại không khớp

Cách xử lý:

```txt
- Mapping rõ GeneratedCharacterDraft -> Character.
- Field nào chưa có trong Character thì lưu vào metadata hoặc merge vào description.
- Không phá import/export character hiện có.
```

---

## Rủi ro 5 — Stream lỗi khi user chuyển tab

Cách xử lý MVP:

```txt
- Catch lỗi.
- Mark partial_error.
- Giữ partial draft.
- Không báo fail toàn bộ.
```

Resume thật sự để sprint sau.

---

## 17. Technical Debt ghi nhận

Các phần có thể chưa xử lý trong Sprint 4:

```txt
- Chưa resume stream bằng streamId + seq.
- Chưa lưu generation session server-side.
- Autosave draft có thể chưa hoàn chỉnh.
- Chưa có UI conflict khi nhiều draft.
- Chưa có moderation UI chi tiết.
- Chưa có avatar generation.
- Chưa có model selection nâng cao trong màn generate.
- Chưa có regenerate từng field riêng lẻ.
```

---

## 18. Ghi chú cho Sprint 5

Sprint 5 sẽ làm **Model Management**.

Sprint 4 cần chuẩn bị điểm gắn cho model selection:

```txt
Create Character with AI
  Model: [Default Model v]
```

Ở Sprint 4 có thể tạm dùng default model từ backend hoặc settings hiện tại.

Sprint 5 sẽ bổ sung:

```txt
- Add model profile.
- Edit model profile.
- Set default model.
- Test connection.
- Chọn model khi chat.
- Chọn model khi generate character.
```

---

## 19. Kết luận Sprint 4

Sprint 4 là sprint biến phần streaming JSON kỹ thuật thành tính năng người dùng thực sự nhìn thấy.

Khi hoàn thành sprint này, sản phẩm sẽ có flow quan trọng nhất:

```txt
Nhập ý tưởng
  -> AI tạo character draft
  -> Form auto-fill realtime
  -> User chỉnh sửa
  -> Save thành nhân vật
  -> Chat roleplay với nhân vật đó
```

Đây là mốc demo quan trọng vì nó thể hiện rõ hướng sản phẩm mới: **một app chat với nhân vật ảo, hỗ trợ tạo nhân vật nhanh bằng AI và streaming UX tốt**.
