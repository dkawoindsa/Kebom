# Step 3: step-action

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/docs/UI_GUIDE.md` — Danger Zone 스타일, Magic Fix 클립보드 복사, 콘텐츠 오버플로 규칙, 빈 상태
- `/docs/PRD.md` — Danger Zone advice 포맷, Magic Fix 명세
- `/src/types/analysis.ts` — AnalysisResult, DangerQuestion, MagicFix

## 작업

`src/components/wizard/StepAction.tsx` 파일을 생성하라.

### StepAction 구현 요건

```typescript
'use client'

interface StepActionProps {
  analysisResult: AnalysisResult;
}

export default function StepAction({ analysisResult }: StepActionProps)
```

**Danger Zone 섹션:**
- 배경: `bg-red-500/5 border-red-500/20`
- `interviewQuestions` 배열에서 최대 5개 표시.
- 각 질문 카드: question (bold) + advice.
- question: `line-clamp-3`, "더 보기" 버튼. advice: `line-clamp-3`, "더 보기" 버튼. 독립적 토글.
- 빈 배열: `"면접 위험 질문이 도출되지 않았습니다."` text-neutral-500

**Magic Fix 섹션:**
- `magicFixes` 배열에서 최대 5개 표시.
- 각 수정 카드:
  - "수정 전": `original` 텍스트 (취소선 없음, text-neutral-500)
  - "수정 후": `revised` 텍스트 (text-neutral-300) + 오른쪽에 "복사" 버튼
  - reason: text-xs text-neutral-500
- original: `line-clamp-4`, 독립 토글. revised: `line-clamp-4`, 독립 토글.
- 빈 배열: `"수정 제안이 없습니다. 이력서가 공고와 잘 맞습니다."` text-neutral-500

**클립보드 복사 (Magic Fix):**
- 복사 버튼: `'clipboard' in navigator` 일 때만 렌더링.
- 복사 성공: "복사됨" 텍스트로 1.5초 후 "복사"로 복원 (setTimeout, 애니메이션 없음).
- `navigator.clipboard.writeText(revised)` 사용.

**카드 스타일:**
- Primary card: `rounded-lg bg-[#141414] border border-neutral-800 p-6`
- Nested card: `rounded bg-[#1a1a1a] border border-neutral-800/60 p-4`

**섹션 레이블:** `text-sm font-medium text-neutral-400 uppercase tracking-wider`

## Acceptance Criteria

```bash
npm run build
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. `src/components/wizard/StepAction.tsx`가 생성됐는지 확인한다.
3. 결과에 따라 `phases/7-ui-steps/index.json`의 step 3을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "src/components/wizard/StepAction.tsx 생성 — Danger Zone, Magic Fix, 클립보드 복사, 더 보기"`
   - 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`

## 주의사항

- `navigator.clipboard` 미지원 브라우저 처리 필수 (`'clipboard' in navigator` 체크).
- backdrop-blur, 그라데이션 텍스트 등 AI 슬롭 패턴 금지.
- 기존 파일을 수정하지 마라.
