# Step 2: analyze-ai

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/docs/ARCHITECTURE.md` — AI 응답 JSON 파싱 절차, AnalysisResult 타입
- `/docs/ADR.md` — ADR-004 (claude-opus-4-7, max_tokens:4096), ADR-012, ADR-014
- `/src/types/resume.ts` — ResumeData, JobRequirements
- `/src/types/analysis.ts` — AnalysisResult, SkillMatch, DangerQuestion, MagicFix
- `/src/lib/ai/parse-resume.ts` — 이전 step 산출물 (패턴 참조용)

## 작업

`src/lib/ai/analyze.ts` 파일을 생성하라.

### 함수 시그니처

```typescript
export async function analyzeResumeVsJd(
  resume: Omit<ResumeData, 'rawText'>,
  jd: Omit<JobRequirements, 'rawText'>
): Promise<AnalysisResult>
```

파라미터가 `Omit<..., 'rawText'>` 인 이유: ADR-014 참조. 클라이언트는 rawText를 보유하지 않으므로 `/api/analyze`에서 rawText 없이 분석을 수행한다.

### 구현 요건

1. **Anthropic SDK 사용**: `import Anthropic from '@anthropic-ai/sdk'`
   - 모델: `claude-opus-4-7`
   - `temperature: 0`
   - `max_tokens: 4096`

2. **API 키 처리**: 없으면 즉시 throw.

3. **user 프롬프트**: resume과 jd를 JSON 문자열로 전달. AnalysisResult 구조 반환 요청.
   반환할 JSON 구조:
   ```
   {
     score: number (0-100),
     skillMatches: [{ skill, status('match'|'partial'|'missing'), evidence?, suggestion? }],
     interviewQuestions: [{ question, advice }],
     magicFixes: [{ original, revised, reason }]
   }
   ```

4. **응답 파싱**:
   - 코드블록 스트리핑 + JSON.parse
   - `score`: `Math.min(100, Math.max(0, Number(parsed.score ?? 0)))` — ARCHITECTURE.md 참조
   - 필수 필드 검증: `skillMatches` (배열), `interviewQuestions` (배열), `magicFixes` (배열)
   - 필드 누락 시 throw

5. **보안**: console.log에 resume이나 jd 데이터를 기록하지 마라.

## 주의사항

- 모델이 `claude-opus-4-7` 인지 반드시 확인하라 (sonnet이 아니다).
- 이 파일은 서버 전용이다.
- 기존 파일을 수정하지 마라.

## Acceptance Criteria

```bash
npm run build
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. `src/lib/ai/analyze.ts`가 생성됐는지 확인한다.
3. 결과에 따라 `phases/3-ai-layer/index.json`의 step 2를 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "src/lib/ai/analyze.ts 생성 — analyzeResumeVsJd claude-opus-4-7"`
   - 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
