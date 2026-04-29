# Step 0: step-upload

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/docs/UI_GUIDE.md` — FileDropzone 인터랙션, 에러 스타일, JD textarea 명세
- `/docs/PRD.md` — 에러 메시지 문자열, 파일 제약
- `/src/types/wizard.ts` — LoadingPhase, WizardError
- `/src/components/ui/FileDropzone.tsx` — 이미 생성된 컴포넌트 사용

## 작업

`src/components/wizard/StepUpload.tsx` 파일을 생성하라.

### StepUpload 구현 요건

```typescript
'use client'

interface StepUploadProps {
  onSubmit: (formData: FormData) => Promise<void>;
  loading: LoadingPhase;
  error: WizardError | null;
}

export default function StepUpload({ onSubmit, loading, error }: StepUploadProps)
```

**내부 상태:**
- `resumeFile: File | null` — 선택된 이력서 PDF
- `jobDescText: string` — JD 텍스트 입력값
- `jobImageFile: File | null` — JD 이미지 파일

**폼 구조:**

1. **이력서 섹션**: FileDropzone 컴포넌트 사용. accept="application/pdf", maxSizeMB=5.
2. **채용공고 섹션**: 텍스트 textarea + 이미지 업로드 (선택). 둘 중 하나 필수.
   - textarea: `min-h-[120px] max-h-[320px] resize-y overflow-y-auto` (UI_GUIDE.md 명세)
   - 이미지 FileDropzone: accept="image/png,image/jpeg", maxSizeMB=5.
3. **제출 버튼**: "분석 시작" Primary 버튼. `loading === 'parsing'` 시 비활성화 + "분석 중..." 텍스트.

**제출 핸들러:**
```typescript
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  if (!resumeFile) return;
  if (!jobDescText.trim() && !jobImageFile) return;

  const formData = new FormData();
  formData.append('resume', resumeFile);
  if (jobDescText.trim()) {
    formData.append('jobDescription', jobDescText.trim());
  } else if (jobImageFile) {
    formData.append('jobImage', jobImageFile);
  }
  await onSubmit(formData);
}
```

**에러 배너:**
`error` prop이 있을 때 에러 배너 렌더링:
```
rounded-lg bg-red-950/50 border border-red-800/60 px-4 py-3 text-sm text-red-300
role="alert" aria-live="assertive"
```

**제출 버튼 비활성화 조건:**
- `loading === 'parsing'`
- `!resumeFile`
- `!jobDescText.trim() && !jobImageFile`

**Tab 순서 (UI_GUIDE.md):**
1. PDF 업로드 드롭존
2. JD 텍스트 textarea
3. JD 이미지 업로드 input
4. "분석 시작" 제출 버튼

## Acceptance Criteria

```bash
npm run build
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. `src/components/wizard/StepUpload.tsx`가 생성됐는지 확인한다.
3. 결과에 따라 `phases/7-ui-steps/index.json`의 step 0을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "src/components/wizard/StepUpload.tsx 생성 — PDF/JD 폼, FileDropzone, 제출 비활성화, 에러 배너"`
   - 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`

## 주의사항

- `'use client'` 지시어 필수.
- Anthropic SDK를 직접 import하지 마라. fetch로 API 라우트를 호출하는 것은 WizardShell이 담당한다.
- 기존 파일을 수정하지 마라.
