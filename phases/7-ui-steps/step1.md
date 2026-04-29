# Step 1: step-read

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/docs/UI_GUIDE.md` — Skills 배열 편집, Experience/Education 편집, "확인 후 분석" 버튼 동작, 빈 상태 경고, 에러 배너, 섹션 레이블 스타일
- `/docs/PRD.md` — 에러 시나리오 (이름/이메일 필수, 빈 스킬/경력 경고)
- `/src/types/resume.ts` — ResumeData, JobRequirements, ExperienceItem, EducationItem
- `/src/types/wizard.ts` — LoadingPhase, WizardError
- `/src/components/ui/EditableField.tsx` — 인라인 편집 컴포넌트

## 작업

`src/components/wizard/StepRead.tsx` 파일을 생성하라.

### StepRead 구현 요건

```typescript
'use client'

interface StepReadProps {
  resumeData: ResumeData;
  jobRequirements: JobRequirements;
  onConfirm: (updatedResumeData: ResumeData) => void;
  loading: LoadingPhase;
  error: WizardError | null;
}

export default function StepRead({ resumeData, jobRequirements, onConfirm, loading, error }: StepReadProps)
```

**내부 상태:**
- `draft: ResumeData` — `resumeData` prop을 초기값으로 복사한 편집용 상태
- 편집 내용은 `draft`에 반영하고, "확인 후 분석" 버튼 클릭 시 `onConfirm(draft)` 호출.

**렌더링할 섹션:**

1. **인라인 경고** (상단, 조건부):
   - `jobRequirements.requiredSkills` 빈 배열: `"채용공고에서 요구 스킬을 찾을 수 없습니다. 공고 내용을 확인해주세요."` (amber 경고)
   - `draft.skills` 빈 배열 AND `draft.experience` 빈 배열: `"이력서에서 경력 또는 스킬 정보를 찾을 수 없습니다. 직접 추가해주세요."` (amber 경고)

2. **에러 배너** (조건부): `error` prop이 있을 때.

3. **기본 정보**: 이름(`name`), 이메일(`contactEmail`), 전화(`contactPhone`) — EditableField 사용.
   - 이름/이메일은 비어있으면 인라인 에러 표시 (`text-xs text-red-400 mt-1`).

4. **요약**: `summary` — EditableField `multiline=true`.

5. **스킬 배열**: SkillBadge 컴포넌트 사용하되 `status="match"` 고정 (읽기용이므로), `onDelete` 제공.
   - 배열 끝 "+ 스킬 추가" Text 버튼 → 인라인 input → Enter 확정, Escape 취소.
   - 빈 문자열 Enter 시 추가하지 않음.

6. **경력 배열**: 각 항목은 company, role, period, description 편집 가능. "삭제" Text 버튼. "경력 추가" Text 버튼.

7. **학력 배열**: 각 항목은 institution, degree, period 편집 가능. "삭제" Text 버튼. "학력 추가" Text 버튼.

**"확인 후 분석" 버튼:**
- 이름 또는 이메일이 비어있으면 비활성화.
- `loading === 'analyzing'` 일 때: `disabled=true`, "분석 중..." 텍스트, `opacity-50 cursor-not-allowed`.
- 클릭: `onConfirm(draft)` 호출.

**섹션 레이블 스타일:** `text-sm font-medium text-neutral-400 uppercase tracking-wider`

**카드 스타일:** `rounded-lg bg-[#141414] border border-neutral-800 p-6`

## Acceptance Criteria

```bash
npm run build
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. `src/components/wizard/StepRead.tsx`가 생성됐는지 확인한다.
3. 결과에 따라 `phases/7-ui-steps/index.json`의 step 1을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "src/components/wizard/StepRead.tsx 생성 — ResumeData 편집, 스킬/경력/학력 배열 편집, 분석 버튼"`
   - 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`

## 주의사항

- `resumeData` prop을 직접 수정하지 마라. 항상 `draft` 복사본을 사용한다.
- 기존 파일을 수정하지 마라.
