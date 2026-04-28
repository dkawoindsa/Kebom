# Step 1: pdf-and-constants

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/docs/ARCHITECTURE.md` — AbortController 타임아웃 상수, pdf.ts 함수 시그니처
- `/docs/ADR.md` — ADR-003 (pdf-parse 서버 전용), ADR-004 (AI 호출 파라미터)
- `/src/lib/wizardReducer.ts` — 이전 step 산출물 (컨텍스트 확인용)

## 작업

아래 두 파일을 생성하라.

### src/lib/constants.ts

ARCHITECTURE.md `## AbortController 타임아웃 > 타임아웃 상수 위치` 참조:

```typescript
export const PARSE_TIMEOUT_MS = 10_000;
export const ANALYZE_TIMEOUT_MS = 30_000;
export const SLOW_LOADING_HINT_MS = 15_000;
```

### src/lib/pdf.ts

```typescript
// 서버 전용 — 이 파일은 app/api/ 라우트에서만 import한다
export async function extractTextFromPdf(buffer: Buffer): Promise<string>
```

구현 시 주의사항:
- `pdf-parse` 패키지를 사용한다: `import pdfParse from 'pdf-parse'`
- 반환값: `result.text` (추출된 텍스트 문자열)
- 빈 문자열 반환 시(`result.text.trim() === ''`): `throw new Error('이력서를 읽을 수 없습니다. 텍스트 기반 PDF를 사용해주세요.')`
- pdf-parse 자체 예외(비밀번호 보호, 손상 파일): 그대로 throw한다. 에러 메시지 래핑은 API 라우트에서 처리.
- 이 함수는 서버 전용이다. 'use server' 지시어는 붙이지 마라 (Route Handler에서 직접 import).

## 주의사항

- `src/lib/pdf.ts`를 클라이언트 컴포넌트에서 import하지 마라. 이유: pdf-parse가 Node.js 전용 모듈이다.
- `NEXT_PUBLIC_` 접두사 변수를 추가하지 마라.
- 기존 테스트(`src/__tests__/`)를 깨뜨리지 마라.

## Acceptance Criteria

```bash
npm run build
```

TypeScript 컴파일 에러 없이 빌드가 통과해야 한다.

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. `src/lib/constants.ts`와 `src/lib/pdf.ts` 두 파일이 생성됐는지 확인한다.
3. 결과에 따라 `phases/2-lib-core/index.json`의 step 1을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "src/lib/constants.ts(타임아웃 상수 3개) + src/lib/pdf.ts(extractTextFromPdf) 생성"`
   - 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
