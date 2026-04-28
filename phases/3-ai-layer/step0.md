# Step 0: parse-resume-ai

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/docs/ARCHITECTURE.md` — AI 응답 JSON 파싱 절차, 보안 명세
- `/docs/ADR.md` — ADR-004 (모델 분리, temperature:0, max_tokens), ADR-012 (AI 응답 파싱 전략)
- `/src/types/resume.ts` — ResumeData 타입 (파싱 대상)

## 작업

`src/lib/ai/parse-resume.ts` 파일을 생성하라.

### 함수 시그니처

```typescript
export async function parseResume(pdfText: string): Promise<ResumeData>
```

### 구현 요건

1. **Anthropic SDK 사용**: `import Anthropic from '@anthropic-ai/sdk'`
   - 모델: `claude-sonnet-4-6`
   - `temperature: 0`
   - `max_tokens: 2048`

2. **API 키 처리**:
   - `process.env.ANTHROPIC_API_KEY`를 읽는다.
   - 키가 없으면 `throw new Error('ANTHROPIC_API_KEY가 설정되지 않았습니다.')`

3. **system 프롬프트**: "반드시 JSON 형식으로만 응답하라. 마크다운 코드블록, 설명 텍스트 포함 금지."

4. **user 프롬프트**: PDF 텍스트를 전달하고 ResumeData 구조로 추출 요청.
   반환할 JSON 구조를 명시한다: `{ name, contactEmail, contactPhone?, summary, skills, experience, education, rawText }`
   rawText는 pdfText 그대로 포함하도록 프롬프트에 명시.

5. **응답 파싱** — ARCHITECTURE.md `## API 라우트 구현 상세 > AI 응답 JSON 파싱 절차` 참조:
   - `response.content[0]?.text` 추출
   - 코드블록 래퍼 스트리핑: `` /^```(?:json)?\n?/ `` 와 `` /\n?```$/ ``
   - `JSON.parse()` 실패 시 `throw new Error('AI 응답을 파싱할 수 없습니다.')`
   - 필수 필드 검증: `name`, `skills` (배열), `experience` (배열), `education` (배열) 존재 여부 확인
   - 필드 누락 시 `throw new Error('AI 응답에 필수 필드가 없습니다.')`
   - `rawText`가 없으면 `pdfText`로 채운다.

6. **보안 주의**: `console.log`에 `pdfText`, `ResumeData` 전체, 또는 개인정보를 절대 기록하지 마라.

## 주의사항

- 이 파일은 서버 전용이다. `'use client'` 지시어를 붙이지 마라.
- `NEXT_PUBLIC_` 접두사 변수를 사용하지 마라.
- `src/components/`, `app/`, `src/lib/wizardReducer.ts` 파일을 수정하지 마라.

## Acceptance Criteria

```bash
npm run build
```

TypeScript 컴파일 에러 없이 빌드가 통과해야 한다.

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. `src/lib/ai/parse-resume.ts`가 생성됐는지 확인한다.
3. 결과에 따라 `phases/3-ai-layer/index.json`의 step 0을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "src/lib/ai/parse-resume.ts 생성 — parseResume(pdfText) claude-sonnet-4-6"`
   - 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
