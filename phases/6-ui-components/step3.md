# Step 3: progress-bar

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/docs/UI_GUIDE.md` — 3단계 진행 표시기 명세
- `/src/types/wizard.ts` — WizardStep, LoadingPhase 타입
- `/src/components/wizard/WizardShell.tsx` — 현재 인라인으로 구현된 진행 표시기 코드 참조

## 작업

`src/components/ui/ProgressBar.tsx` 파일을 생성하라.

### ProgressBar 구현 요건

```typescript
interface ProgressBarProps {
  step: WizardStep;
  loading: LoadingPhase;
}

export default function ProgressBar({ step, loading }: ProgressBarProps)
```

**UI 명세 (UI_GUIDE.md 그대로):**
- 텍스트 기반 3단계 표시: `1 Read → 2 Analyze → 3 Action`
- 구분자: 문자 `→` (프로그레스 바나 원형 스텝 아이콘 금지)
- 활성 스텝: `text-white font-medium`
- 완료 스텝: `text-neutral-500`
- 대기 스텝: `text-neutral-700`

**활성 스텝 판단 로직:**
- 1 Read: `step === 'upload'`
- 2 Analyze: `step === 'read'` 또는 `loading === 'parsing'`
- 3 Action: `step === 'analyze'` 또는 `step === 'action'`

**완료 스텝 판단 로직:**
- 1 Read가 완료: step이 'read', 'analyze', 'action' 중 하나이고 loading !== 'parsing'
- 2 Analyze가 완료: step이 'analyze' 또는 'action'이고 loading !== 'analyzing'

**레이아웃:**
```
<div className="flex items-center gap-2 text-sm">
  <span>{1 Read}</span>
  <span className="text-neutral-700">→</span>
  <span>{2 Analyze}</span>
  <span className="text-neutral-700">→</span>
  <span>{3 Action}</span>
</div>
```

## Acceptance Criteria

```bash
npm run build
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. `src/components/ui/ProgressBar.tsx`가 생성됐는지 확인한다.
3. 결과에 따라 `phases/6-ui-components/index.json`의 step 3을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "src/components/ui/ProgressBar.tsx 생성 — 텍스트 기반 3단계 진행 표시기"`
   - 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`

## 주의사항

- 프로그레스 바나 원형 스텝 아이콘 사용 금지 (UI_GUIDE.md 명시 금지).
- `'use client'` 지시어 불필요 (상태/이벤트 없음). 서버 컴포넌트로 유지.
- 기존 파일을 수정하지 마라.
