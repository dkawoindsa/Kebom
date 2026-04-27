# Architecture Decision Records

## 철학
MVP 속도 최우선. 외부 의존성 최소화. 데이터베이스·인증·캐시 없는 완전 무상태 서비스.
작동하는 최소 구현을 선택하되, 보안(API 키 노출, 이력서 로깅)은 타협하지 않는다.

---

### ADR-001: Next.js 15 App Router 선택
**결정**: Pages Router 대신 App Router 사용.
**이유**: Server Components로 초기 번들 크기 최소화. API Routes를 같은 레포에서 관리. `route.ts` 파일에서 Node.js 런타임 사용 가능 (pdf-parse가 Node 전용).
**트레이드오프**: App Router의 `'use client'` 경계 관리가 Pages Router보다 명시적으로 필요.
**추가 설정 상세**:
- `serverExternalPackages: ['pdf-parse']` 이유: pdf-parse가 Node.js 네이티브 모듈(canvas 등)에 의존하므로 Next.js 서버 번들링에서 제외해야 런타임 오류 없음.
- `experimental.serverActions.bodySizeLimit: '6mb'` 이유: Next.js 기본 4MB 제한 → 5MB PDF 허용을 위해 6MB로 상향 (multipart/form-data 오버헤드 포함).
- `export const runtime = 'nodejs'` in `parse-resume/route.ts`: Edge Runtime 기본값에서 Node.js Runtime 명시 필수. pdf-parse는 Edge Runtime 미지원. 미설정 시 배포 환경에서 import 오류 발생.

---

### ADR-002: useReducer 단일 상태 (Context 없음)
**결정**: 글로벌 Context 대신 WizardShell의 useReducer + prop drilling.
**이유**: 3단계 위저드는 깊이가 2레벨 이하. Context 추가 시 불필요한 리렌더 및 복잡성 증가. 상태 전이가 명확한 열거형(Action)으로 추적 가능.
**트레이드오프**: 컴포넌트 추가 시 prop 타입을 명시적으로 작성해야 함. MVP 수준에서 허용.

---

### ADR-003: pdf-parse (서버 전용)
**결정**: 브라우저 PDF 라이브러리(pdfjs-dist) 대신 서버 사이드 pdf-parse.
**이유**: 클라이언트 번들 0KB 추가. WASM 없이 순수 Node.js. 이력서 텍스트가 클라이언트를 경유하지 않아 보안상 유리. 서버에서 처리 후 구조화된 JSON만 반환.
**트레이드오프**: 오프라인 처리 불가. MVP에서는 허용.
**처리 한계 명세**:
- **스캔 이미지 PDF** (텍스트 레이어 없음): pdf-parse가 빈 문자열을 반환 → "이력서를 읽을 수 없습니다. 텍스트 기반 PDF를 사용해주세요." 메시지로 500 반환. OCR 미지원 (MVP 제외).
- **비밀번호 보호 PDF**: pdf-parse가 예외를 throw → "비밀번호로 보호된 PDF는 읽을 수 없습니다." 메시지로 500 반환.
- **손상된 PDF**: pdf-parse 예외 throw → "PDF 파일이 손상되어 읽을 수 없습니다." 메시지로 500 반환.
- **버전 1.1.1 고정 이유**: 최신 버전에서 특정 PDF 파일 파싱 회귀 버그 사례 보고 존재. MVP에서는 검증된 버전으로 고정.

---

### ADR-004: 모델 분리 (sonnet-4-6 / opus-4-7)
**결정**: 파싱(Resume, JD)은 claude-sonnet-4-6, 분석(AnalysisResult)은 claude-opus-4-7.
**이유**: 파싱은 구조화 출력 추출이므로 sonnet으로 충분하고 비용·속도 우위. 분석(heatmap + danger zone + magic fix)은 추론 품질이 핵심이므로 opus 사용.
**트레이드오프**: API 비용이 단일 모델 대비 높아질 수 있음. 분석 품질로 상쇄.
**AI 호출 파라미터 상세**:
- `temperature: 0` 이유: 구조화 JSON 출력에서 비결정적 응답 방지. 동일 입력에 대해 재현 가능한 결과 보장.
- JSON 강제 방법: system 프롬프트에 "반드시 JSON 형식으로만 응답하라. 마크다운 코드블록, 설명 텍스트 포함 금지." 명시. 응답 파싱 전 코드블록 래퍼 스트리핑.
- max_tokens 선택 근거: 파싱(sonnet) 2048 — ResumeData + JobRequirements 구조체 크기 여유. 분석(opus) 4096 — DangerQuestion 5개 + MagicFix 5개 전체 포함 여유.
- AI 응답 유효성 검증: JSON.parse 성공 후 필수 필드 존재 여부 수동 확인. score는 0–100으로 클램핑. 필수 필드 누락 시 500 반환. zod 등 런타임 검증 라이브러리 미사용 (MVP 의존성 최소화). 상세: ADR-012 참조.

---

### ADR-005: 데이터베이스/영속성 없음
**결정**: 세션 스토리지나 DB 없이 완전 메모리 처리. 페이지 새로고침 시 상태 초기화.
**이유**: 익명 MVP이므로 개인정보 저장 부담 없음. 인프라 복잡도 0. 이력서 데이터가 서버 어디에도 기록되지 않으므로 개인정보 규정 리스크 최소.
**트레이드오프**: 새로고침 시 재업로드 필요. MVP 수준에서 허용.

---

### ADR-006: 단일 /api/parse-resume 라우트에서 JD + 이력서 동시 처리
**결정**: `/api/parse-jd`를 별도로 만들지 않고 `/api/parse-resume`에서 FormData로 JD(텍스트/이미지) + PDF를 한 번에 받아 처리.
**이유**: 사용자가 두 파일을 함께 제출하므로 라운드트립 1회로 줄임. 에러 처리 단순화.
**트레이드오프**: 라우트 핸들러 책임이 커짐. 명확한 함수 분리(src/lib/ai/)로 복잡성 관리.
**JD 처리 우선순위 및 이미지 인코딩**:
- 텍스트(`jobDescription`)와 이미지(`jobImage`)가 동시 제출된 경우: 텍스트를 우선 사용. 이미지 무시. 서버에서 `if (jobDescription)` 분기 우선.
- 이미지 JD base64 인코딩: `jobImage.arrayBuffer()` → `Buffer` → `base64 string` → Claude API content 블록의 `{ type: 'image', source: { type: 'base64', media_type, data } }` 형식으로 전달.

---

### ADR-007: Jest + React Testing Library 선택
**결정**: Vitest 대신 Jest, Playwright 대신 React Testing Library.
**이유**: Next.js 15 공식 문서가 Jest + RTL을 권장. App Router의 서버 컴포넌트 테스트에 `jest-environment-jsdom` + `@testing-library/react`의 공식 지원이 안정적. Vitest는 Vite 기반 프로젝트에 더 적합하고 Next.js와의 통합 설정이 더 복잡함.
**트레이드오프**: Vitest 대비 초기 설정 파일(jest.config.ts, jest.setup.ts)이 다소 많음. MVP 수준에서 허용.

---

### ADR-008: Tailwind CSS v4 선택
**결정**: Tailwind v3 대신 v4, CSS Modules/styled-components 사용 안 함.
**이유**: v4는 `@import 'tailwindcss'` 한 줄로 설정 완료(zero-config). PostCSS 플러그인 방식 제거로 빌드 의존성 단순화. CSS 변수 기반 테마로 다크 테마 구현이 자연스러움. 번들 사이즈는 v3 대비 동등하거나 작음.
**트레이드오프**: v4는 일부 v3 유틸리티 클래스 이름이 변경됨. 외부 라이브러리 Tailwind 연동 시 주의 필요. MVP에서 외부 컴포넌트 라이브러리를 쓰지 않으므로 문제 없음.

---

### ADR-009: Harness 자동화 프레임워크 채택
**결정**: Claude Code를 직접 대화 방식으로 구현하는 대신 `scripts/execute.py`를 통한 단계별 자동화 실행.
**이유**: 각 스텝 실행 시 CLAUDE.md + 전체 docs/*.md를 guardrails로 자동 주입하여 컨텍스트 손실 방지. 스텝 간 결과 요약 누적으로 장시간 세션에서도 일관성 유지. 3회 자기교정(self-correction) 재시도로 일시적 오류 자동 복구. 2-phase 커밋(`feat:`/`chore:`)으로 구현 변경과 메타데이터 분리.
**트레이드오프**: Python 환경(3.11+) 필요. 각 스텝을 미리 step*.md로 설계해야 함. 상호작용적 탐색보다 사전 설계 비용이 높음.

---

### ADR-010: 에러 처리 전략
**결정**: API 라우트에서 모든 에러를 `throw`로 전파. HTTP 상태코드: 클라이언트 입력 오류 400, AI·서버 내부 오류 500. 422 미사용. 클라이언트 에러 메시지는 한국어. 에러 swallow 금지.
**이유**:
- throw 전파: catch에서 에러를 삼키면 원인 추적 불가. 모든 에러는 API 라우트 최상위 try/catch에서 일괄 처리.
- 400 vs 422: RFC 9110 기준 422는 WebDAV 확장 상태코드. 이 프로젝트는 REST API이므로 클라이언트 잘못된 입력은 단순 400 사용.
- 한국어 메시지: 최종 사용자(취준생)가 영어 에러 코드를 보지 않도록. 내부 스택 트레이스는 절대 노출하지 않음.
**트레이드오프**: 400/500 이분법은 세분화가 부족할 수 있음. MVP 규모에서 충분하며 클라이언트 에러 처리 로직이 단순화된다.

---

### ADR-011: 클라이언트 AbortController 타임아웃 전략
**결정**: 파싱 10초, 분석 30초 타임아웃을 클라이언트 `AbortController`로 구현. 서버 측 타임아웃 설정 미사용. `AbortError`와 일반 에러는 `catch`에서 `err.name === 'AbortError'` 조건으로 분기.
**이유**:
- 파싱 10초 근거: claude-sonnet-4-6 p95 응답 시간이 10초 이내 (PRD.md 성공 지표). 초과 시 재시도가 UX상 유리.
- 분석 30초 근거: claude-opus-4-7 p95 응답 시간 30초 이내. 고품질 분석을 위한 충분한 대기 시간.
- 클라이언트 타임아웃 선택 이유: Next.js API 라우트 서버 타임아웃(기본 30초)은 Vercel 배포 환경에서 설정이 복잡. 클라이언트에서 `abort()`하면 서버 연결도 종료. UX 제어권이 클라이언트에 있어 즉각적인 에러 메시지 표시 가능.
- 15초 보조 메시지: 분석 30초 타임아웃 중 15초 경과 시 "(시간이 더 걸릴 수 있어요)" 노출. 사용자 불안 감소.
**트레이드오프**: 클라이언트 타임아웃 후 서버는 여전히 처리 중일 수 있어 Anthropic API 비용 낭비 가능. MVP에서 허용. (향후: 서버 측 AbortSignal 전달로 해결 가능)

---

### ADR-012: AI 응답 JSON 파싱 및 유효성 검증 전략
**결정**: AI 응답 텍스트를 `JSON.parse()`로 파싱. 실패 시 즉시 500 반환. 파싱 성공 후 필수 필드 존재 여부를 수동으로 검증. score는 0–100 범위로 클램핑. 런타임 타입 체크 전용 라이브러리(zod, io-ts 등) 미사용.
**이유**:
- JSON.parse 실패 → 500: AI가 JSON 외 텍스트를 반환했다는 것은 프롬프트 설계 이상 또는 API 오류. 클라이언트에게 파싱되지 않은 데이터를 반환하는 것보다 500이 안전.
- score 클램핑 (0–100): AI가 범위 외 값을 반환하는 경우 에러 대신 클램핑. 사용자 경험 연속성 우선.
- 수동 검증 선택 이유: MVP 의존성 최소화. 검증 대상 타입이 5개 이하로 수동 관리 가능. `typeof` 체크 + 배열 여부 확인 + 필수 키 존재 여부로 충분.
**트레이드오프**: 수동 검증은 타입이 추가될 때 누락 위험. 향후 AnalysisResult 복잡도 증가 시 zod 도입 검토.

---

### ADR-013: 파일 업로드 보안 검증 전략
**결정**: 클라이언트(accept 속성, 파일 크기 체크)와 서버(MIME 타입 재검증, 크기 재검증, bodySizeLimit) 이중 검증 채택. PDF 매직 바이트(`%PDF-`) 검증은 MVP에서 제외.
**이유**:
- 이중 검증 필요성: 클라이언트의 `<input accept="application/pdf">`와 JavaScript 크기 체크는 UX 편의용. 브라우저 개발자 도구로 FormData를 조작하면 우회 가능. 서버에서 반드시 재검증해야 실제 보안 보장.
- MIME 검증 방법: FormData로 수신된 File 객체의 `.type` 속성 확인. MVP에서 이 수준으로 충분.
- PDF 매직 바이트 제외 이유: 서버에서 pdf-parse가 텍스트 추출만 수행 — 악의적 파일 실행 경로 없음. 추가 구현 복잡도 대비 MVP에서 위협 시나리오 불명확.
**트레이드오프**: MIME 타입 검증은 완전한 보안이 아님. 실제 파일 내용 검증(magic bytes, antivirus 등) 없음. MVP에서 허용.

---

### ADR-014: API 응답에서 rawText 제외 설계
**결정**: `ResumeData`와 `JobRequirements`의 `rawText` 필드를 API 응답에서 제외. 서버 내부 AI 호출에만 사용. 클라이언트와의 계약 타입은 `Omit<ResumeData, 'rawText'>`, `Omit<JobRequirements, 'rawText'>` 사용.
**이유**:
- rawText 미전송 이유: rawText는 AI 호출을 위한 내부 처리 데이터. 클라이언트에서 표시하거나 재사용할 이유 없음. 전송 시 응답 크기 불필요 증가(이력서 전체 텍스트 → 수 KB).
- 타입 수준 강제: 런타임 제거(`delete obj.rawText`)보다 `Omit<>` 타입이 더 안전. 실수로 rawText를 포함한 응답을 작성하면 TypeScript 컴파일 에러 발생.
- `/api/analyze` 요청 타입도 `Omit<ResumeData, 'rawText'>`: 클라이언트는 rawText를 보유하지 않으므로 전송할 수 없음. `analyze.ts`는 구조화된 데이터(skills, experience 등)만으로 분석 수행.
**트레이드오프**: rawText를 클라이언트에 보내면 `/api/analyze`에서 원본 텍스트를 재활용해 분석 품질 향상 가능성 존재. 그러나 이력서 원문을 클라이언트에 노출하는 개인정보 리스크가 더 큼.
