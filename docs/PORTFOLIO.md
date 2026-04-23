# 캐봄 (Kebom) — 포트폴리오 / 자소서 기록

> 개발 진행에 따라 꾸준히 업데이트하는 살아있는 문서.
> 상단 요약 테이블은 자소서 항목 복붙용, 하단 세부 섹션은 포트폴리오 본문용.

---

## 요약

| 항목 | 내용 |
|------|------|
| **프로젝트 제목** | 캐봄 (Kebom) |
| **프로젝트 소개** | 이력서와 채용공고를 AI로 비교 분석해 매칭 점수·약점 질문·문장 개선안을 제시하는 취준생용 서류 전략 도구 |
| **프로젝트 기간** | 2026.04 ~ 진행 중 |
| **담당 파트 / 포지션** | 풀스택 (1인 기획·설계·개발) |
| **사용 언어 및 개발 환경** | TypeScript, Next.js 15 (App Router), Tailwind CSS v4, Anthropic Claude API (claude-sonnet-4-6 / claude-opus-4-7), pdf-parse, Jest + React Testing Library |
| **담당 구현 기능 및 수행 내용** | PDF 이력서 파싱 및 AI 구조화 API 구현 / 이력서-공고 스킬 매칭 히트맵 및 점수 산출 / 면접 예상 약점 질문(Danger Zone) 및 문장 개선 제안(Magic Fix) 생성 / useReducer 기반 3단계 위저드 상태 관리 / TDD 방식으로 단위·통합·컴포넌트 테스트 작성 |
| **성과 및 기여** | > TODO: 개발 완료 후 작성 (서비스 배포, 완료율, 응답 시간 등) |
| **참고 링크** | GitHub: https://github.com/dkawoindsa/Kebom |

---

## 프로젝트 배경

취업 준비 중 서류 탈락의 원인을 파악하기 어렵다는 문제를 발견했다. 이력서를 아무리 다듬어도 "채용공고가 원하는 것"과 "내가 쓴 것" 사이의 간극을 스스로 인식하기 어렵고, AI 피드백 서비스는 있지만 대부분 AI가 어떻게 이력서를 읽었는지 먼저 보여주지 않아 신뢰하기 어렵다.

캐봄은 두 가지 문제를 동시에 해결하려 했다.

1. **신뢰 기반 확보**: AI가 내 이력서에서 뭘 뽑아냈는지 사용자가 직접 확인하고 수정한 뒤 분석을 진행한다.
2. **실행 가능한 전략 제시**: 단순 점수 결과가 아니라 면접관이 태클 걸 약점 질문과 공고 맞춤 문장 개선안까지 제공한다.

---

## 프로젝트 개요

### 서비스 흐름

```
1. Read   — 이력서 PDF + 채용공고(텍스트/이미지) 업로드
           → AI가 구조화한 이력서 데이터를 사용자가 직접 확인·수정

2. Analyze — 공고 요구 스킬과 이력서를 비교
           → match / partial / missing 3단계 히트맵 + 종합 점수 (0~100)

3. Action  — Danger Zone: 면접관 관점 약점 질문 최대 5개 + 대응 방향
           → Magic Fix: 공고 키워드를 반영한 이력서 문장 개선안 최대 5개
```

### 기술 스택 선택 이유

| 기술 | 선택 이유 |
|------|-----------|
| **Next.js 15 App Router** | Server Components로 초기 번들 최소화. API Routes에서 Node.js 런타임 사용 가능 → pdf-parse 서버 전용 처리 |
| **TypeScript strict** | `noUncheckedIndexedAccess`까지 활성화해 배열 접근 null-safety 강제. AI 응답 파싱 오류를 컴파일 타임에 차단 |
| **Tailwind CSS v4** | `@import 'tailwindcss'` 한 줄로 zero-config 설정 완료. CSS 변수 기반 다크 테마 |
| **claude-sonnet-4-6 (파싱)** | 구조화 출력 추출은 sonnet으로 충분 → 비용·속도 우위 |
| **claude-opus-4-7 (분석)** | 히트맵 + Danger Zone + Magic Fix는 추론 품질이 핵심 → opus 사용 |
| **pdf-parse (서버)** | 클라이언트 번들 0KB. 이력서 원문이 서버 밖으로 나가지 않아 보안 유리 |
| **Jest + RTL** | Next.js 15 공식 권장 조합. App Router 서버 컴포넌트 테스트 안정 지원 |

---

## 담당 구현 기능 전체 소개

### 1. PDF 이력서 파싱 + AI 구조화 — `POST /api/parse-resume`

**구현 내용**

사용자가 업로드한 PDF를 서버에서 `pdf-parse`로 텍스트를 추출하고, 채용공고(텍스트 또는 이미지)와 함께 claude-sonnet-4-6에 전달해 `ResumeData`와 `JobRequirements` JSON을 반환한다.

```
FormData (PDF + JD) → pdf-parse 텍스트 추출 → claude-sonnet-4-6 프롬프트
→ JSON 파싱 → { resumeData, jobRequirements } 반환
```

**핵심 의사결정**

- `/api/parse-resume` 하나에서 JD + PDF를 동시에 처리 (라운드트립 1회 감소)
- `rawText`는 서버 내부 AI 호출에만 사용하고 API 응답에서 제거 — 이력서 원문이 클라이언트에 노출되지 않음
- 파일은 메모리에서 처리 후 즉시 해제, 디스크 임시 저장 금지

**관련 파일**: `src/app/api/parse-resume/route.ts`, `src/lib/ai/parse-resume.ts`, `src/lib/ai/parse-jd.ts`, `src/lib/pdf.ts`

---

### 2. 스킬 매칭 히트맵 + 점수 산출 — `POST /api/analyze`

**구현 내용**

사용자가 Step 1에서 수정한 `resumeData`와 `jobRequirements`를 받아 claude-opus-4-7로 분석한다. 각 요구 스킬에 대해 `match / partial / missing` 상태와 이력서 근거 문장·개선 제안을 포함한 `SkillMatch[]`를 반환한다.

```typescript
interface SkillMatch {
  skill: string;
  status: 'match' | 'partial' | 'missing';
  evidence?: string;    // 이력서에서 발견된 근거 문장
  suggestion?: string;  // partial/missing일 때 개선 제안
}
```

정렬 순서: `missing → partial → match` (위험 항목 먼저 노출)

**관련 파일**: `src/app/api/analyze/route.ts`, `src/lib/ai/analyze.ts`, `src/components/wizard/StepAnalyze.tsx`, `src/components/ui/SkillBadge.tsx`

---

### 3. Danger Zone + Magic Fix — `StepAction`

**구현 내용**

- **Danger Zone**: 면접관 관점에서 이력서의 약점을 파고들 예상 질문 최대 5개와 각 질문에 대한 대응 방향 제시
- **Magic Fix**: 이력서의 기존 문장을 채용공고 키워드를 반영해 개선한 버전 최대 5개 (원문 → 수정본 + 수정 이유)

분석 결과(`AnalysisResult`)에 포함되어 `POST /api/analyze` 응답에서 함께 반환된다.

**관련 파일**: `src/components/wizard/StepAction.tsx`

---

### 4. WizardReducer 기반 상태 관리

**구현 내용**

3단계 위저드 전체 상태를 `useReducer` 하나로 관리한다. 전역 Context 없이 `WizardShell`에서 prop drilling으로 자식에 전달.

```typescript
type WizardAction =
  | { type: 'PARSE_START' }
  | { type: 'PARSE_SUCCESS'; payload: { resumeData; jobRequirements } }
  | { type: 'PARSE_ERROR'; payload: string }
  | { type: 'CONFIRM_READ'; payload: ResumeData }
  | { type: 'ANALYZE_START' }
  | { type: 'ANALYZE_SUCCESS'; payload: AnalysisResult }
  | { type: 'ANALYZE_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET' };
```

순수 함수이므로 테스트 시 모킹 없이 실제 실행으로 검증 (커버리지 100% 목표).

**의사결정**: 단계가 3개(깊이 2레벨 이하)이므로 Zustand나 Context 추가는 오버엔지니어링. Action 타입 열거형으로 상태 전이가 명확히 추적 가능.

**관련 파일**: `src/lib/wizardReducer.ts`, `src/components/wizard/WizardShell.tsx`

---

### 5. TDD 기반 테스트 구성

단위(lib) → 통합(api) → 컴포넌트 3-레이어 구조로 테스트를 작성한다.

| 레이어 | 대상 | 전략 |
|--------|------|------|
| Unit | `wizardReducer`, `pdf.ts` | 모킹 없이 순수 함수 실행 |
| Integration | `parse-resume`, `analyze` route | Anthropic SDK, pdf-parse jest.mock |
| Component | `StepUpload`, `StepRead`, `StepAnalyze` | RTL userEvent, loading/error/success 각 상태 테스트 |

---

## 트러블슈팅

> TODO: 개발 진행 중 발생한 문제를 아래 템플릿으로 추가한다.

<!--
### [문제 제목]

**문제 상황**
어떤 상황에서 어떤 증상이 발생했는가.

**원인 분석**
왜 이 문제가 발생했는가. 디버깅 과정에서 확인한 것.

**해결 방법**
어떻게 해결했는가. 코드 변경 또는 설정 변경 내용.

**성과 및 배운 점**
이 트러블슈팅을 통해 무엇을 배웠는가.
-->

---

## 최적화 / 개선 작업

> TODO: 개발 진행 중 최적화 작업 발생 시 아래 템플릿으로 추가한다.

<!--
### [개선 주제]

**발생 이슈**
어떤 성능/품질 문제가 있었는가.

**작업 방식 및 의사결정**
어떤 접근법을 선택했고 왜 그 방법을 골랐는가. 고려했던 대안은 무엇인가.

**처리 결과 및 성과**
개선 전후 수치, 또는 정성적 변화.
-->
