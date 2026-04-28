# Step 1: parse-jd-ai

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/docs/ARCHITECTURE.md` — 이미지 JD base64 인코딩, AI 응답 JSON 파싱 절차
- `/docs/ADR.md` — ADR-004 (모델 분리), ADR-006 (JD 처리 우선순위 및 이미지 인코딩), ADR-012
- `/src/types/resume.ts` — JobRequirements 타입 (파싱 대상)
- `/src/lib/ai/parse-resume.ts` — 이전 step 산출물 (패턴 참조용)

## 작업

`src/lib/ai/parse-jd.ts` 파일을 생성하라.

### 함수 시그니처

```typescript
export async function parseJdFromText(jobDescriptionText: string): Promise<JobRequirements>
export async function parseJdFromImage(imageBuffer: Buffer, mediaType: 'image/png' | 'image/jpeg'): Promise<JobRequirements>
```

### 구현 요건

1. **Anthropic SDK 사용**: `import Anthropic from '@anthropic-ai/sdk'`
   - 모델: `claude-sonnet-4-6`
   - `temperature: 0`
   - `max_tokens: 2048`

2. **API 키 처리**: `process.env.ANTHROPIC_API_KEY` 없으면 즉시 throw.

3. **parseJdFromText**: 텍스트를 user 메시지로 전달. JobRequirements 구조 추출 요청.
   반환할 JSON 구조: `{ title, company?, requiredSkills, preferredSkills, responsibilities, rawText }`
   rawText는 jobDescriptionText 그대로 포함하도록 프롬프트에 명시.

4. **parseJdFromImage**: 이미지를 base64로 인코딩하여 Claude의 vision 기능으로 처리.
   ARCHITECTURE.md `## 이미지 JD base64 인코딩` 참조:
   ```typescript
   const base64 = imageBuffer.toString('base64');
   // Claude messages content: { type: 'image', source: { type: 'base64', media_type, data: base64 } }
   ```
   rawText: 이미지에서 추출한 텍스트를 Claude에게 함께 반환하도록 요청한다.

5. **응답 파싱** — parse-resume.ts와 동일한 패턴:
   - 코드블록 스트리핑
   - JSON.parse 실패 시 throw
   - 필수 필드 검증: `title`, `requiredSkills` (배열), `preferredSkills` (배열), `responsibilities` (배열)

6. **보안**: console.log에 JD 원문이나 이미지 데이터를 기록하지 마라.

## 주의사항

- 이 파일은 서버 전용이다.
- `NEXT_PUBLIC_` 접두사 변수 금지.
- 기존 파일을 수정하지 마라.

## Acceptance Criteria

```bash
npm run build
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. `src/lib/ai/parse-jd.ts`가 생성됐는지 확인한다.
3. 결과에 따라 `phases/3-ai-layer/index.json`의 step 1을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "src/lib/ai/parse-jd.ts 생성 — parseJdFromText + parseJdFromImage"`
   - 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
