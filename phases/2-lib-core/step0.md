# Step 0: wizard-reducer

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/docs/ARCHITECTURE.md` — 상태 관리, 상태 전이 테이블, AppState/WizardAction 타입
- `/docs/ADR.md` — ADR-002 (useReducer 단일 상태)
- `/src/types/wizard.ts` — WizardStep, LoadingPhase, WizardError, AppState, WizardAction
- `/src/types/resume.ts` — ResumeData, JobRequirements
- `/src/types/analysis.ts` — AnalysisResult

## 작업

`src/lib/wizardReducer.ts` 파일을 생성하라.

### 구현 내용

```typescript
// initialState: AppState
export const initialState: AppState = { ... }

// wizardReducer: 순수 함수
export function wizardReducer(state: AppState, action: WizardAction): AppState { ... }
```

**상태 전이 규칙** — ARCHITECTURE.md `## 상태 관리 > 상태 전이 테이블` 참조:

| Action | loading 전 | step 전 | loading 후 | step 후 | 변경 필드 |
|--------|-----------|---------|-----------|---------|----------|
| `PARSE_START` | idle | upload | parsing | upload | error → null |
| `PARSE_SUCCESS` | parsing | upload | idle | read | resumeData, jobRequirements 저장 |
| `PARSE_ERROR` | parsing | upload | idle | upload | error 저장 |
| `CONFIRM_READ` | idle | read | analyzing | read | resumeData payload로 갱신 |
| `ANALYZE_START` | analyzing | read | analyzing | read | — |
| `ANALYZE_SUCCESS` | analyzing | read | idle | action | analysisResult 저장 |
| `ANALYZE_ERROR` | analyzing | read | idle | read | error 저장 |
| `CLEAR_ERROR` | any | any | idle | 유지 | error → null |
| `RESET` | any | any | idle | upload | 전체 초기화 |

**불법 상태 전이 처리**: 잘못된 전이는 현재 상태를 그대로 반환(무시)한다.
예: parsing 중 PARSE_START 재호출 → state 그대로 반환.

**CONFIRM_READ 처리**: `loading`을 `'analyzing'`으로, `resumeData`를 payload로 갱신한다. `step`은 `'read'`로 유지.

## 주의사항

- wizardReducer는 순수 함수여야 한다. side effect(console.log, fetch 등) 금지.
- `src/lib/ai/`, `app/api/`, `src/components/` 파일을 수정하지 마라.
- 기존 테스트(`src/__tests__/`)를 깨뜨리지 마라.

## Acceptance Criteria

```bash
npm run build
```

TypeScript 컴파일 에러 없이 빌드가 통과해야 한다.

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. ARCHITECTURE.md 상태 전이 테이블과 구현이 일치하는지 확인한다.
3. 결과에 따라 `phases/2-lib-core/index.json`의 step 0을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "src/lib/wizardReducer.ts 생성 — initialState + wizardReducer 순수 함수"`
   - 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
