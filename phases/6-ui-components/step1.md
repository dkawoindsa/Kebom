# Step 1: editable-field

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/docs/UI_GUIDE.md` — EditableField 키보드 동작, 인터랙션 명세, 입력 필드 스타일

## 작업

`src/components/ui/EditableField.tsx` 파일을 생성하라.

### EditableField 구현 요건

```typescript
'use client'

interface EditableFieldProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  multiline?: boolean;
  placeholder?: string;
}

export default function EditableField({ value, onChange, label, multiline, placeholder }: EditableFieldProps)
```

**렌더링 구조:**
- `editing === false` (뷰 모드): 값을 `<span>` 또는 `<p>`로 표시. 클릭/Enter/Space로 편집 모드 진입.
- `editing === true` (편집 모드): `multiline`이 `true`면 `<textarea>`, 아니면 `<input type="text">`.

**키보드 동작 (UI_GUIDE.md 명세 그대로):**
- Enter (input): 저장 + 편집 모드 종료
- Enter (textarea): 줄바꿈 삽입 (저장 아님)
- Escape: 변경 취소, 원래 값 복원, 편집 모드 종료
- Tab: 저장 + 편집 모드 종료 (다음 요소로 포커스 이동은 브라우저 기본 동작에 맡김)

**뷰 모드 진입 핸들러:**
- 클릭: `onClick={() => setEditing(true)}`
- 키보드: `onKeyDown`에서 Enter/Space → `setEditing(true)`
- `tabIndex={0}`, `role="button"`

**편집 모드 포커스:**
- 편집 모드 진입 시 input/textarea에 자동 포커스 (`autoFocus` 또는 `useEffect + ref.focus()`).
- 포커스 이동 후 커서를 텍스트 끝에 위치.

**저장 후 포커스:**
- 저장(Enter/Tab) 완료 후 뷰 모드 요소로 포커스 반환 (`ref.current?.focus()`).

**스타일:**
- 뷰 모드: `text-sm text-neutral-300 cursor-pointer hover:text-white transition-colors`
- 편집 모드 input/textarea: `rounded-lg bg-[#0a0a0a] border border-neutral-600 px-4 py-3 text-sm text-neutral-300 focus:outline-none w-full`
- 뷰→편집 전환 시 border 색상: `border-neutral-800 → border-neutral-600`

**접근성:**
- `aria-label={label}` 뷰 모드 요소에 추가.
- textarea에 `aria-multiline="true"`.

## Acceptance Criteria

```bash
npm run build
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. `src/components/ui/EditableField.tsx`가 생성됐는지 확인한다.
3. 결과에 따라 `phases/6-ui-components/index.json`의 step 1을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "src/components/ui/EditableField.tsx 생성 — 뷰/편집 토글, Enter/Escape/Tab 키보드 동작, autoFocus"`
   - 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`

## 주의사항

- slide, bounce, scale 등 transition 애니메이션 금지. opacity transition 허용.
- 기존 파일을 수정하지 마라.
