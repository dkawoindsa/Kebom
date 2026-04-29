# Step 0: lib-tests

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/docs/TESTING.md` — 테스트 전략, 커버리지 기준, 모킹 규칙
- `/src/lib/wizardReducer.ts` — 테스트 대상: 순수 함수, 모킹 금지
- `/src/lib/pdf.ts` — 테스트 대상: pdf-parse 모킹 필요
- `/src/types/wizard.ts` — AppState, WizardAction (테스트에서 사용)
- `/src/types/resume.ts` — 테스트 픽스처 생성에 필요

## 작업

아래 두 테스트 파일을 생성하라.

### 1. `src/__tests__/lib/wizardReducer.test.ts`

`wizardReducer`의 모든 Action에 대한 상태 전이를 검증한다. 모킹 금지, 실제 함수 실행.

테스트할 Action (각각 독립 테스트):
- `PARSE_START`: loading → 'parsing', error → null
- `PARSE_SUCCESS`: step → 'read', loading → 'idle', resumeData 저장, jobRequirements 저장
- `PARSE_ERROR`: error 저장, loading → 'idle', step → 'upload'
- `CONFIRM_READ`: loading → 'analyzing', resumeData payload로 갱신
- `ANALYZE_SUCCESS`: step → 'action', loading → 'idle', analysisResult 저장
- `ANALYZE_ERROR`: error 저장, loading → 'idle', step → 'read'
- `CLEAR_ERROR`: error → null, loading → 'idle', step 유지
- `RESET`: 전체 초기화 (initialState와 동일)
- 불법 전이 무시: parsing 중 PARSE_START 재호출 → 상태 그대로 유지

커버리지 목표: 100%

### 2. `src/__tests__/lib/pdf.test.ts`

```typescript
jest.mock('pdf-parse');
import pdfParse from 'pdf-parse';
import { extractTextFromPdf } from '@/lib/pdf';

describe('extractTextFromPdf', () => {
  it('Buffer에서 텍스트를 추출한다', ...)
  it('빈 텍스트 반환 시 에러를 throw한다', ...)
  it('pdf-parse 실패 시 에러를 throw한다', ...)
})
```

**기존 플레이스홀더 파일 삭제:**
`src/__tests__/lib/placeholder.test.ts` 파일이 있으면 삭제하라.

## Acceptance Criteria

```bash
npm run build && npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. `wizardReducer.test.ts`, `pdf.test.ts` 모두 통과하는지 확인한다.
3. 결과에 따라 `phases/8-tests/index.json`의 step 0을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "wizardReducer.test.ts (모든 Action 전이), pdf.test.ts (pdf-parse 모킹) 생성"`
   - 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`

## 주의사항

- `wizardReducer`는 순수 함수이므로 모킹 금지. 실제 함수를 호출해 상태를 검증한다.
- 기존 소스 파일을 수정하지 마라. 테스트 파일만 생성/삭제한다.
