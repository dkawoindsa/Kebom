# 프로젝트: 캐봄 (Kebom)

## 기술 스택
- Next.js 15 (App Router, Server Components 기본)
- TypeScript strict mode (strict: true, noUncheckedIndexedAccess: true)
- Tailwind CSS v4
- Google Gemini API (gemini-2.5-flash 파싱, gemini-2.5-pro 분석)
- pdf-parse (서버 전용 API 라우트에서만 사용)
- Jest + React Testing Library

## 아키텍처 규칙
- CRITICAL: 모든 AI API 호출과 PDF 처리는 반드시 app/api/ 라우트 핸들러에서만 수행한다. 클라이언트 컴포넌트에서 Google Generative AI SDK를 직접 임포트하거나 호출하지 마라.
- CRITICAL: GOOGLE_AI_API_KEY는 process.env에서만 읽는다. 클라이언트 번들에 노출되지 않도록 NEXT_PUBLIC_ 접두사를 붙이지 마라.
- CRITICAL: 사용자 이력서 데이터를 서버 로그에 기록하지 마라. console.log에 ResumeData, raw PDF 텍스트, 또는 개인정보가 포함된 문자열을 넘기지 마라.
- 컴포넌트는 src/components/, 타입은 src/types/, AI 로직은 src/lib/ai/, 유틸리티는 src/lib/ 에 분리한다.
- API 라우트는 app/api/ 하위에만 둔다. 파일 업로드 파싱은 API 라우트에서 처리하고 완료 즉시 메모리에서 해제한다 (임시 파일 디스크 저장 금지).
- 'use client' 지시어는 상태나 이벤트 핸들러가 필요한 리프 컴포넌트에만 붙인다.

## 환경 변수
`.env.local` 파일 (절대 커밋 금지, `.gitignore`에 포함):
```
GOOGLE_AI_API_KEY=AIza...
```
- `NEXT_PUBLIC_` 접두사 절대 금지 — 클라이언트 번들에 API 키 노출됨
- `process.env.GOOGLE_AI_API_KEY`는 `app/api/` 라우트와 `src/lib/ai/` 에서만 참조
- 키 미설정 시 API 라우트에서 즉시 500 반환 (키 없이 Gemini SDK 호출 시도 금지)

## 프로젝트 부트스트랩
소스 코드가 없는 상태에서 처음 시작할 때 순서:
1. `package.json`, `tsconfig.json`, `next.config.ts`, `jest.config.ts` 생성
2. `npm install`
3. `.env.local` 생성 후 GOOGLE_AI_API_KEY 입력
4. `npm run dev`로 확인

전체 설정 파일 내용은 `docs/SETUP.md` 참조.

## 커밋 메시지 규약
Conventional Commits 필수:
- `feat:` — 새 기능
- `fix:` — 버그 수정
- `test:` — 테스트 추가/수정
- `docs:` — 문서 변경
- `chore:` — 설정, 의존성, 메타데이터

Harness 2-phase 패턴: `feat:` 커밋(구현) → `chore:` 커밋(phase 메타데이터 업데이트) 순서.

## 에러 핸들링 규약
- API 라우트: 모든 핸들러에 `try/catch` 필수. 에러 시 `{ error: string }` + 적절한 HTTP 상태코드 반환
  - 잘못된 입력: 400, AI 서비스 실패: 500, 파일 없음: 400
- 에러를 삼키는(swallow) 코드 금지 — 반드시 `throw` 또는 사용자에게 노출
- 클라이언트: 에러는 `WizardState.error`에 저장, 해당 Step 컴포넌트가 에러 배너로 표시
- 에러 메시지는 사용자가 이해할 수 있는 한국어로 작성 (내부 스택 트레이스 노출 금지)

## 테스트 규약
- 테스트 파일 위치: `src/__tests__/{layer}/` (layer = `api`, `components`, `lib`)
- 각 테스트 파일명: `{TargetName}.test.ts(x)`
- Google Generative AI SDK 모킹: `jest.mock('@google/generative-ai')`
- pdf-parse 모킹: `jest.mock('pdf-parse')`
- `wizardReducer`는 순수 함수이므로 모킹 금지 — 실제 실행으로 테스트
- 자세한 패턴과 커버리지 기준: `docs/TESTING.md` 참조

## Harness 워크플로우
자동화 스크립트를 사용한 단계별 구현:
```bash
# 1. phases/{task}/index.json 및 step*.md 파일 생성
# 2. 실행
python3 scripts/execute.py {task-name}
# 3. (선택) 완료 후 자동 push
python3 scripts/execute.py {task-name} --push
```
자세한 내용: `.claude/commands/harness.md`

## 개발 프로세스
- CRITICAL: 새 기능 구현 시 반드시 테스트를 먼저 작성하고, 테스트가 통과하는 구현을 작성할 것 (TDD)
- 각 Phase 완료 후 `npm run build`가 에러 없이 통과해야 한다.

## 명령어
```bash
npm run dev        # 개발 서버 (http://localhost:3000)
npm run build      # 프로덕션 빌드
npm run lint       # ESLint + type-check
npm run test       # Jest 전체 실행
npm run test:watch # 개발 중 watch 모드
```
