# Step 1: api-tests

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/docs/TESTING.md` — API 통합 테스트 전략, 모킹 규칙
- `/src/app/api/parse-resume/route.ts` — 테스트 대상
- `/src/app/api/analyze/route.ts` — 테스트 대상
- `/src/types/api.ts` — ParseResumeResponse, AnalyzeRequest, AnalyzeResponse

## 작업

아래 두 테스트 파일을 생성하라. API 라우트 핸들러를 직접 import하여 테스트한다.

### 1. `src/__tests__/api/parse-resume.test.ts`

```typescript
jest.mock('@anthropic-ai/sdk');
jest.mock('pdf-parse');

import { POST } from '@/app/api/parse-resume/route';
```

테스트 케이스:
- 유효한 PDF + JD 텍스트 → 200 + ParseResumeResponse
- 유효한 PDF + JD 이미지 → 200 + ParseResumeResponse
- 이력서 파일 없음 → 400
- PDF 아닌 파일 → 400
- PDF 5MB 초과 → 400
- JD 없음 → 400
- 지원하지 않는 이미지 형식 → 400
- JD 텍스트+이미지 동시 제출 → 텍스트 우선 처리 (200)
- Anthropic SDK 실패 → 500
- ANTHROPIC_API_KEY 미설정 → 500

**Anthropic SDK 모킹 패턴:**
```typescript
import Anthropic from '@anthropic-ai/sdk';
const mockCreate = jest.fn();
(Anthropic as jest.Mock).mockImplementation(() => ({
  messages: { create: mockCreate }
}));
```

**pdf-parse 모킹:**
```typescript
import pdfParse from 'pdf-parse';
(pdfParse as jest.Mock).mockResolvedValue({ text: '이력서 텍스트 내용...' });
```

**Request 생성 헬퍼:**
```typescript
function makeRequest(formData: FormData) {
  return new Request('http://localhost/api/parse-resume', { method: 'POST', body: formData });
}
```

**환경 변수 처리:**
각 테스트에서 `process.env.ANTHROPIC_API_KEY`를 설정/초기화한다.

### 2. `src/__tests__/api/analyze.test.ts`

```typescript
jest.mock('@anthropic-ai/sdk');

import { POST } from '@/app/api/analyze/route';
```

테스트 케이스:
- 유효한 resumeData + jobRequirements → 200 + AnalyzeResponse
- resumeData 없음 → 400
- jobRequirements 없음 → 400
- Anthropic SDK 실패 → 500
- ANTHROPIC_API_KEY 미설정 → 500

**기존 플레이스홀더 파일 삭제:**
`src/__tests__/api/placeholder.test.ts` 파일이 있으면 삭제하라.

## Acceptance Criteria

```bash
npm run build && npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 두 테스트 파일 모두 통과하는지 확인한다.
3. 결과에 따라 `phases/8-tests/index.json`의 step 1을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "parse-resume.test.ts, analyze.test.ts 생성 — API 라우트 직접 import, SDK 모킹"`
   - 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`

## 주의사항

- Anthropic SDK는 반드시 모킹한다. 실제 API 키로 호출하지 마라.
- pdf-parse는 반드시 모킹한다. 실제 PDF 파일 불필요.
- 기존 소스 파일을 수정하지 마라.
