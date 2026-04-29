# Step 2: step-analyze

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/docs/UI_GUIDE.md` — SkillBadge 히트맵 레이아웃, ScoreDisplay 명세, 콘텐츠 오버플로 규칙("더 보기"), 빈 상태
- `/src/types/analysis.ts` — AnalysisResult, SkillMatch, SkillStatus
- `/src/components/ui/SkillBadge.tsx` — 이미 생성된 컴포넌트

## 작업

`src/components/wizard/StepAnalyze.tsx` 파일을 생성하라.

### StepAnalyze 구현 요건

```typescript
'use client'

interface StepAnalyzeProps {
  analysisResult: AnalysisResult;
}

export default function StepAnalyze({ analysisResult }: StepAnalyzeProps)
```

**ScoreDisplay:**
- 점수 원형 표시. SVG 도넛 차트 금지. 숫자 + 원형 border 조합.
- 범위별 색상:
  - 0–39: `text-red-500 border-red-500/40`
  - 40–69: `text-amber-400 border-amber-400/40`
  - 70–100: `text-green-500 border-green-500/40`
- 구조: `border border-{color}/40 rounded-full w-16 h-16 flex items-center justify-center text-2xl font-semibold text-{color}`
- 접근성: `aria-label="매칭 점수 {score}점 / 100점" role="img"`
- 점수 오른쪽/아래: `text-xs text-neutral-500 "/ 100점"`
- 섹션 레이블(위): `"MATCH SCORE"` 섹션 제목 스타일

**히트맵 (SkillMatches):**
- 정렬 순서: missing → partial → match (위험한 것 먼저)
- 각 행: `[스킬명 w-32 shrink-0 font-mono text-sm] [SkillBadge] [근거/갭 텍스트 text-xs text-neutral-500]`
- SkillBadge에 `onDelete` 없음 (읽기 전용)
- evidence/suggestion 텍스트: 기본 `line-clamp-2`. "더 보기" 버튼으로 펼침/접힘. 각 행 독립적.
- 빈 배열: `"분석된 스킬 매칭 결과가 없습니다."` text-neutral-500

**"더 보기" / "접기" 버튼:**
- 스타일: `text-neutral-500 text-xs hover:text-neutral-300 transition-colors mt-1`
- `aria-expanded` 토글
- 애니메이션 없음 (즉시 전환)

**카드 스타일:** `rounded-lg bg-[#141414] border border-neutral-800 p-6`

## Acceptance Criteria

```bash
npm run build
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. `src/components/wizard/StepAnalyze.tsx`가 생성됐는지 확인한다.
3. 결과에 따라 `phases/7-ui-steps/index.json`의 step 2를 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "src/components/wizard/StepAnalyze.tsx 생성 — ScoreDisplay, 히트맵 정렬, SkillBadge, 더 보기"`
   - 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`

## 주의사항

- SVG 도넛 차트, 원형 프로그레스 바, 그라데이션 아크 금지.
- backdrop-blur, 그라데이션 텍스트 등 AI 슬롭 패턴 금지.
- 기존 파일을 수정하지 마라.
