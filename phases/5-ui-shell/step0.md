# Step 0: wizard-shell

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/docs/ARCHITECTURE.md` — 상태 관리, 데이터 흐름, AbortController 타임아웃 구현 패턴
- `/docs/ADR.md` — ADR-002 (useReducer 단일 상태), ADR-011 (AbortController 타임아웃)
- `/docs/UI_GUIDE.md` — 레이아웃, 색상, 타이포그래피
- `/src/types/wizard.ts` — AppState, WizardAction
- `/src/types/api.ts` — ParseResumeResponse, AnalyzeRequest, AnalyzeResponse, ApiErrorResponse
- `/src/lib/wizardReducer.ts` — wizardReducer, initialState
- `/src/lib/constants.ts` — PARSE_TIMEOUT_MS, ANALYZE_TIMEOUT_MS, SLOW_LOADING_HINT_MS
- `/src/app/page.tsx` — 현재 진입점 (WizardShell을 여기서 렌더링한다)

## 작업

`src/components/wizard/WizardShell.tsx` 파일을 생성하고, `src/app/page.tsx`를 수정하여 WizardShell을 렌더링하라.

### WizardShell 구현 요건

```typescript
'use client'

export default function WizardShell()
```

**1. 상태 관리**
```typescript
const [state, dispatch] = useReducer(wizardReducer, initialState);
```

**2. AbortController useEffect** — ARCHITECTURE.md `## AbortController 타임아웃 > 구현 위치 및 패턴` 코드를 그대로 따른다:
- `state.loading === 'analyzing'` 일 때 분석 API 호출
- ANALYZE_TIMEOUT_MS 기준 AbortController
- cleanup: clearTimeout + controller.abort()
- 성공: `dispatch({ type: 'ANALYZE_SUCCESS', payload: result })`
- AbortError: `dispatch({ type: 'ANALYZE_ERROR', payload: '분석이 너무 오래 걸리고 있어요. 잠시 후 다시 시도해주세요.' })`
- 일반 에러: `dispatch({ type: 'ANALYZE_ERROR', payload: '네트워크 연결을 확인해주세요.' })`

**3. fetch 분석 API 헬퍼 함수 (컴포넌트 외부 또는 내부)**
```typescript
async function fetchAnalyze(
  resumeData: Omit<ResumeData, 'rawText'>,
  jobRequirements: Omit<JobRequirements, 'rawText'>,
  signal: AbortSignal
): Promise<AnalysisResult>
```
- POST `/api/analyze`에 `AnalyzeRequest` 전송
- 응답 `AnalyzeResponse.result` 반환
- 에러 응답 시 `ApiErrorResponse.error` 메시지로 throw

**4. PARSE_START dispatch 및 파싱 API 호출**
StepUpload에서 폼 제출 시 호출할 핸들러를 WizardShell에서 prop으로 내려준다:
```typescript
async function handleParseSubmit(formData: FormData): Promise<void>
```
- `dispatch({ type: 'PARSE_START' })`
- POST `/api/parse-resume` with AbortController (PARSE_TIMEOUT_MS)
- 성공: `dispatch({ type: 'PARSE_SUCCESS', payload: { resumeData, jobRequirements } })`
- 실패: `dispatch({ type: 'PARSE_ERROR', payload: message })`

**5. step 라우팅**
```typescript
if (state.loading === 'parsing') return <스켈레톤 />
if (state.loading === 'analyzing') return <스켈레톤 />
if (state.step === 'upload') return <StepUpload />
if (state.step === 'read') return <StepRead />
if (state.step === 'analyze' || state.step === 'action') return <StepAnalyze /> + <StepAction />
```

스켈레톤 구현:
- parsing: `<div className="animate-pulse ...">` + 메시지 "이력서와 공고를 읽고 있어요..."
- analyzing: + 메시지 "강점과 약점을 분석하고 있어요...", SLOW_LOADING_HINT_MS 경과 후 보조 메시지 "(시간이 더 걸릴 수 있어요)" 표시

**6. 에러 표시**
각 Step 컴포넌트에 `error={state.error}` prop 전달. WizardShell 자체에서는 에러 배너를 렌더링하지 않는다.

**7. CONFIRM_READ 핸들러**
```typescript
function handleConfirmRead(updatedResumeData: ResumeData): void {
  dispatch({ type: 'CONFIRM_READ', payload: updatedResumeData });
}
```
StepRead에 prop으로 전달.

**8. RESET 핸들러**
```typescript
function handleReset(): void {
  dispatch({ type: 'RESET' });
}
```

### 레이아웃

```typescript
<main className="min-h-screen bg-[#0a0a0a] text-white">
  <div className="max-w-3xl mx-auto px-6 py-12 sm:py-16">
    {/* 헤더: 앱 이름 + RESET 버튼 (upload step이 아닐 때만 표시) */}
    {/* step content */}
  </div>
</main>
```

UI_GUIDE.md 디자인 원칙과 색상 규칙을 따른다. 금지된 AI 슬롭 패턴(backdrop-blur, 그라데이션 텍스트 등)을 사용하지 마라.

### app/page.tsx 수정

현재 플레이스홀더를 WizardShell import 및 렌더로 교체하라.

## 주의사항

- StepUpload, StepRead, StepAnalyze, StepAction 컴포넌트는 아직 없다. 이 파일들은 다음 Phase에서 생성된다. 지금은 임시 플레이스홀더(`<div>StepUpload placeholder</div>` 등)로 대체하라.
- WizardShell은 반드시 `'use client'` 지시어가 필요하다.
- Anthropic SDK를 WizardShell에서 직접 import하지 마라. fetch로 API 라우트를 호출한다.
- NEXT_PUBLIC_ 변수 금지.

## Acceptance Criteria

```bash
npm run build
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. `src/components/wizard/WizardShell.tsx`가 생성됐는지 확인한다.
3. 결과에 따라 `phases/5-ui-shell/index.json`의 step 0을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "src/components/wizard/WizardShell.tsx 생성 — useReducer, AbortController, step 라우팅, 스켈레톤"`
   - 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
