# Step 0: skill-badge

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/docs/UI_GUIDE.md` — SkillBadge 스타일 명세, 색상 규칙, AI 슬롭 금지사항
- `/src/types/analysis.ts` — SkillStatus 타입 ('match' | 'partial' | 'missing')

## 작업

`src/components/ui/SkillBadge.tsx` 파일을 생성하라.

### SkillBadge 구현 요건

```typescript
'use client'

interface SkillBadgeProps {
  skill: string;
  status: SkillStatus;
  onDelete?: () => void;
}

export default function SkillBadge({ skill, status, onDelete }: SkillBadgeProps)
```

**스타일 (UI_GUIDE.md 명세 그대로):**
```
match:   rounded border border-green-500/30 bg-green-500/10 text-green-400 text-xs px-2 py-1
partial: rounded border border-amber-400/30 bg-amber-400/10 text-amber-400 text-xs px-2 py-1
missing: rounded border border-red-500/30 bg-red-500/10 text-red-400 text-xs px-2 py-1
```

**콘텐츠 오버플로:**
- 스킬명은 최대 20자까지만 표시. 초과 시 `overflow-hidden text-ellipsis whitespace-nowrap` 적용.
- 배지 자체는 `inline-flex items-center gap-1`.

**onDelete 버튼:**
- `onDelete` prop이 제공된 경우에만 × 버튼 렌더링.
- 스타일: `text-neutral-500 hover:text-white w-4 h-4 flex items-center justify-center`
- aria-label: `"스킬 {skill} 삭제"`
- 버튼 클릭이 외부 클릭 이벤트와 충돌하지 않도록 `e.stopPropagation()` 추가.

**접근성:**
- 컨테이너에 `aria-label="{skill}: {status}"` 추가.

## Acceptance Criteria

```bash
npm run build
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. `src/components/ui/SkillBadge.tsx`가 생성됐는지 확인한다.
3. 결과에 따라 `phases/6-ui-components/index.json`의 step 0을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "src/components/ui/SkillBadge.tsx 생성 — match/partial/missing 스타일, onDelete 버튼, 접근성"`
   - 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`

## 주의사항

- backdrop-blur, 그라데이션 텍스트, 글로우 애니메이션 금지 (AI 슬롭 안티패턴).
- 기존 파일을 수정하지 마라.
