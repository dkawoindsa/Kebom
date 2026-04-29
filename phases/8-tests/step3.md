# Step 3: ui-tests

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/docs/TESTING.md` — 컴포넌트 테스트 전략
- `/src/components/ui/SkillBadge.tsx` — 테스트 대상
- `/src/components/ui/FileDropzone.tsx` — 테스트 대상
- `/src/components/ui/EditableField.tsx` — 테스트 대상

## 작업

`src/__tests__/components/ui/` 디렉토리를 생성하고 아래 3개 테스트 파일을 생성하라.

### 1. `src/__tests__/components/ui/SkillBadge.test.tsx`

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SkillBadge from '@/components/ui/SkillBadge';
```

테스트 케이스:
- `status='match'` → green 색상 클래스 포함 (예: `text-green-400` 확인)
- `status='partial'` → amber 색상 클래스 포함
- `status='missing'` → red 색상 클래스 포함
- 스킬명 텍스트 렌더링 확인
- `onDelete` 없으면 × 버튼 없음
- `onDelete` 있으면 × 버튼 표시 및 클릭 시 호출
- `aria-label` 속성 확인 (`"{skill}: {status}"`)

### 2. `src/__tests__/components/ui/FileDropzone.test.tsx`

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileDropzone from '@/components/ui/FileDropzone';
```

테스트 케이스:
- 기본 렌더: 안내 문구 표시 확인
- 파일 선택 후 파일명 표시 확인
- PDF 파일 선택 → `onFileSelect` 호출
- 잘못된 MIME 타입 파일 → 에러 표시, `onFileSelect` 미호출
- 5MB 초과 파일 → 에러 표시
- `role="button"` 존재 확인
- 드래그 오버 시 스타일 변경 (클래스 변경 확인)

**파일 선택 테스트 패턴:**
```typescript
const input = screen.getByTestId('file-input') // 또는 labelText로 쿼리
const file = new File(['content'], 'resume.pdf', { type: 'application/pdf' });
await userEvent.upload(input, file);
```

### 3. `src/__tests__/components/ui/EditableField.test.tsx`

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditableField from '@/components/ui/EditableField';
```

테스트 케이스:
- 초기 렌더: value 텍스트 표시, input/textarea 없음
- 클릭 시 편집 모드 진입 (input 나타남)
- Enter 키로 편집 모드 진입
- 값 변경 후 Enter → `onChange` 호출, 편집 모드 종료
- Escape → 원래 값 복원, 편집 모드 종료
- `multiline=true` → textarea 렌더 (input 아님)
- `label` prop이 aria-label로 설정됨

## Acceptance Criteria

```bash
npm run build && npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 3개 테스트 파일 모두 통과하는지 확인한다.
3. 결과에 따라 `phases/8-tests/index.json`의 step 3을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "UI 컴포넌트 테스트 3개 생성 — SkillBadge, FileDropzone, EditableField"`
   - 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`

## 주의사항

- 컴포넌트 내부 구현이 아닌 **동작(behavior)**을 테스트한다.
- FileDropzone의 숨겨진 input에 접근하기 위해 `data-testid="file-input"` 속성을 컴포넌트에 추가해야 할 수도 있다. 필요 시 FileDropzone.tsx를 수정한다.
- 기존 소스 파일은 테스트 용이성을 위한 최소 변경(data-testid 추가 등)만 허용한다.
