# Step 1: analyze-route

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/docs/ARCHITECTURE.md` — 데이터 흐름, 보안 명세
- `/docs/ADR.md` — ADR-010 (에러 처리), ADR-014 (rawText 제외)
- `/src/types/api.ts` — AnalyzeRequest, AnalyzeResponse
- `/src/lib/ai/analyze.ts` — analyzeResumeVsJd 함수
- `/src/app/api/parse-resume/route.ts` — 이전 step 산출물 (패턴 참조용)

## 작업

`src/app/api/analyze/route.ts` 파일을 생성하라.

### POST 핸들러

```typescript
export async function POST(request: Request): Promise<Response>
```

### 요청 처리 순서

1. `process.env.ANTHROPIC_API_KEY` 확인 → 없으면 `{ error: 'API 키가 설정되지 않았습니다.' }` + 500
2. `request.json()`으로 `AnalyzeRequest` 파싱
3. 입력 검증:
   - `resumeData` 존재 여부 → 없으면 `{ error: '이력서 데이터가 없습니다.' }` + 400
   - `jobRequirements` 존재 여부 → 없으면 `{ error: '채용 공고 데이터가 없습니다.' }` + 400
4. `analyzeResumeVsJd(resumeData, jobRequirements)` 호출
5. 실패 시: `{ error: 'AI 분석에 실패했습니다. 잠시 후 다시 시도해주세요.' }` + 500
6. 성공 시: `AnalyzeResponse` — `{ result: AnalysisResult }` + 200

### Edge Runtime 설정

이 라우트는 PDF를 처리하지 않으므로 `export const runtime = 'nodejs'`는 생략해도 되지만,
Anthropic SDK가 Node.js fetch를 사용하므로 명시하는 것이 안전하다.

## 주의사항

- `console.log`에 resumeData, jobRequirements를 기록하지 마라.
- 기존 파일을 수정하지 마라.
- try/catch로 모든 에러를 잡는다. 에러를 삼키지 마라.

## Acceptance Criteria

```bash
npm run build
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. `src/app/api/analyze/route.ts`가 생성됐는지 확인한다.
3. 결과에 따라 `phases/4-api-routes/index.json`의 step 1을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "src/app/api/analyze/route.ts 생성 — AnalyzeRequest 검증 + analyzeResumeVsJd 호출"`
   - 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
