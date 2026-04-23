# Architecture Decision Records

## 철학
MVP 속도 최우선. 외부 의존성 최소화. 데이터베이스·인증·캐시 없는 완전 무상태 서비스.
작동하는 최소 구현을 선택하되, 보안(API 키 노출, 이력서 로깅)은 타협하지 않는다.

---

### ADR-001: Next.js 15 App Router 선택
**결정**: Pages Router 대신 App Router 사용.
**이유**: Server Components로 초기 번들 크기 최소화. API Routes를 같은 레포에서 관리. `route.ts` 파일에서 Node.js 런타임 사용 가능 (pdf-parse가 Node 전용).
**트레이드오프**: App Router의 `'use client'` 경계 관리가 Pages Router보다 명시적으로 필요.

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

---

### ADR-004: 모델 분리 (sonnet-4-6 / opus-4-7)
**결정**: 파싱(Resume, JD)은 claude-sonnet-4-6, 분석(AnalysisResult)은 claude-opus-4-7.
**이유**: 파싱은 구조화 출력 추출이므로 sonnet으로 충분하고 비용·속도 우위. 분석(heatmap + danger zone + magic fix)은 추론 품질이 핵심이므로 opus 사용.
**트레이드오프**: API 비용이 단일 모델 대비 높아질 수 있음. 분석 품질로 상쇄.

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
