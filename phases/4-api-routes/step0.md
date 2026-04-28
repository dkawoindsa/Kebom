# Step 0: parse-resume-route

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/docs/ARCHITECTURE.md` — POST /api/parse-resume 입력 검증 순서, Node.js 런타임 명시, 이미지 JD base64 인코딩
- `/docs/ADR.md` — ADR-001 (Node.js 런타임), ADR-006 (JD 처리 우선순위), ADR-010 (에러 처리), ADR-013 (파일 업로드 보안), ADR-014 (rawText 제외)
- `/src/types/api.ts` — ParseResumeResponse
- `/src/lib/pdf.ts` — extractTextFromPdf 함수
- `/src/lib/ai/parse-resume.ts` — parseResume 함수
- `/src/lib/ai/parse-jd.ts` — parseJdFromText, parseJdFromImage 함수

## 작업

`src/app/api/parse-resume/route.ts` 파일을 생성하라.

### 필수 선언

파일 최상단에 반드시 포함:
```typescript
export const runtime = 'nodejs';
```
이유: pdf-parse는 Edge Runtime 미지원. 미설정 시 import 오류 발생.

### POST 핸들러 입력 검증 순서

ARCHITECTURE.md `## 입력 검증 순서 — POST /api/parse-resume` 에 명시된 순서를 그대로 따른다:

1. `resume` 파일 존재 여부 → 없으면 `{ error: '이력서 PDF 파일을 업로드해주세요.' }` + 400
2. `resume` MIME 타입 `application/pdf` 확인 → 아니면 `{ error: '이력서는 PDF 파일만 업로드할 수 있습니다.' }` + 400
3. `resume` 파일 크기 ≤ 5MB (5 * 1024 * 1024) → 초과 시 `{ error: '이력서 파일 크기는 5MB를 초과할 수 없습니다.' }` + 400
4. JD 존재 여부 (`jobDescription` 또는 `jobImage` 중 하나 필수) → 둘 다 없으면 `{ error: '채용 공고를 입력해주세요.' }` + 400
5. `jobImage` 존재하는 경우: MIME 타입 확인 (`image/png` 또는 `image/jpeg`) → 아니면 `{ error: '채용 공고 이미지는 PNG 또는 JPEG 파일만 업로드할 수 있습니다.' }` + 400
6. `jobImage` 존재하는 경우: 파일 크기 ≤ 5MB → 초과 시 `{ error: '채용 공고 이미지 파일 크기는 5MB를 초과할 수 없습니다.' }` + 400
7. PDF 텍스트 추출 (`extractTextFromPdf` 실패 또는 빈 문자열): `{ error: 에러 메시지 }` + 500
8. AI 호출 실패 또는 JSON 파싱 실패: `{ error: 'AI가 이력서를 분석하는 데 실패했습니다. 잠시 후 다시 시도해주세요.' }` + 500

### JD 처리 우선순위

ADR-006: `jobDescription` 텍스트가 있으면 이미지보다 우선 사용. 동시 제출 시 이미지 무시.

### 응답 형식

성공 시: `ParseResumeResponse` — `{ resumeData: Omit<ResumeData, 'rawText'>, jobRequirements: Omit<JobRequirements, 'rawText'> }`
rawText는 응답에 포함하지 않는다 (ADR-014).

### API 키 확인

핸들러 진입 직후 `process.env.ANTHROPIC_API_KEY` 존재 여부를 확인하라.
없으면 `{ error: 'API 키가 설정되지 않았습니다.' }` + 500. SDK 호출 시도 금지.

## 주의사항

- `console.log`에 PDF 텍스트, ResumeData, JobRequirements 전체 또는 개인정보를 기록하지 마라.
- FormData에서 수신한 파일을 디스크에 저장하지 마라. 메모리에서만 처리.
- 기존 파일을 수정하지 마라.

## Acceptance Criteria

```bash
npm run build
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. `src/app/api/parse-resume/route.ts`가 생성됐는지 확인한다.
3. 결과에 따라 `phases/4-api-routes/index.json`의 step 0을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "src/app/api/parse-resume/route.ts 생성 — runtime=nodejs, 8단계 검증, PDF+JD 파싱"`
   - 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
