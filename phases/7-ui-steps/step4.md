# Step 4: wizard-wire

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/src/components/wizard/WizardShell.tsx` — 현재 구현 (플레이스홀더 div 포함)
- `/src/components/wizard/StepUpload.tsx` — 방금 생성된 컴포넌트와 props
- `/src/components/wizard/StepRead.tsx` — 방금 생성된 컴포넌트와 props
- `/src/components/wizard/StepAnalyze.tsx` — 방금 생성된 컴포넌트와 props
- `/src/components/wizard/StepAction.tsx` — 방금 생성된 컴포넌트와 props
- `/src/components/ui/ProgressBar.tsx` — 방금 생성된 컴포넌트와 props

## 작업

`src/components/wizard/WizardShell.tsx`를 수정하여 플레이스홀더 div를 실제 Step 컴포넌트로 교체하라.

### 변경 사항

**1. import 추가:**
```typescript
import StepUpload from './StepUpload';
import StepRead from './StepRead';
import StepAnalyze from './StepAnalyze';
import StepAction from './StepAction';
import ProgressBar from '@/components/ui/ProgressBar';
```

**2. step 라우팅 교체:**
플레이스홀더 div(`<div className="text-sm text-neutral-500">StepUpload placeholder</div>` 등)를 실제 컴포넌트로 교체:

```typescript
// upload 단계
if (state.step === 'upload') {
  content = <StepUpload onSubmit={handleParseSubmit} loading={state.loading} error={state.error} />;
}

// read 단계 (state.resumeData, state.jobRequirements가 null이 아님을 보장)
if (state.step === 'read') {
  // state.resumeData와 state.jobRequirements는 PARSE_SUCCESS 이후 반드시 존재한다
  content = (
    <>
      <StepRead
        resumeData={state.resumeData!}
        jobRequirements={state.jobRequirements!}
        onConfirm={handleConfirmRead}
        loading={state.loading}
        error={state.error}
      />
    </>
  );
}

// analyze + action 단계 (state.analysisResult가 null이 아님을 보장)
if (state.step === 'analyze' || state.step === 'action') {
  content = (
    <div className="space-y-6">
      <StepAnalyze analysisResult={state.analysisResult!} />
      <StepAction analysisResult={state.analysisResult!} />
    </div>
  );
}
```

**3. ProgressBar 사용:**
WizardShell 헤더의 인라인 진행 표시기(`<div className="mb-8 flex items-center gap-2 text-sm">...`)를 ProgressBar 컴포넌트로 교체:
```typescript
<ProgressBar step={state.step} loading={state.loading} />
```

**4. eslint-disable 제거:**
`handleParseSubmit`의 `// eslint-disable-next-line @typescript-eslint/no-unused-vars` 주석을 제거한다.
(이제 StepUpload에 prop으로 전달되므로 사용됨)

**5. WizardShellProps 정리:**
파일 하단의 미사용 `WizardShellProps` interface와 `export type { WizardShellProps }` 제거.

**6. handleClearError:**
WizardShell 자체에서는 에러 배너를 렌더링하지 않으므로 `handleClearError`는 StepUpload/StepRead에서 처리된다. WizardShell의 `handleClearError` 함수 정의는 유지하되, content 빌드 코드에서 사용하던 인라인 에러 렌더링은 제거한다.

## Acceptance Criteria

```bash
npm run build
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 빌드 에러 없이 통과하는지 확인한다.
3. 결과에 따라 `phases/7-ui-steps/index.json`의 step 4를 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "WizardShell.tsx 업데이트 — 플레이스홀더 → 실제 Step 컴포넌트, ProgressBar 연결"`
   - 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`

## 주의사항

- WizardShell의 상태 관리 로직(useReducer, useEffect, AbortController)을 수정하지 마라. 오직 렌더링 부분(step 라우팅, ProgressBar)만 교체한다.
- `state.resumeData!`와 `state.analysisResult!` Non-null assertion은 상태 전이 테이블에 의해 보장된다. 이 시점에 null일 수 없다.
