# 아키텍처

## 디렉토리 구조
```
src/
├── app/
│   ├── page.tsx              # 메인 페이지 — WizardShell 렌더
│   ├── layout.tsx            # 루트 레이아웃 (폰트, 다크 배경)
│   └── api/
│       ├── parse-resume/
│       │   └── route.ts      # PDF + JD → ResumeData + JobRequirements (claude-sonnet-4-6)
│       └── analyze/
│           └── route.ts      # ResumeData + JobRequirements → AnalysisResult (claude-opus-4-7)
├── components/
│   ├── wizard/
│   │   ├── WizardShell.tsx   # useReducer 상태 + 3-step 라우팅 (Client)
│   │   ├── StepUpload.tsx    # JD 텍스트/이미지 + PDF 업로드 폼 (Client)
│   │   ├── StepRead.tsx      # ResumeData 검증/편집 UI (Client)
│   │   ├── StepAnalyze.tsx   # 히트맵 결과 (Client)
│   │   └── StepAction.tsx    # Danger Zone + Magic Fix (Client)
│   └── ui/
│       ├── SkillBadge.tsx    # match/partial/missing 상태 뱃지
│       ├── EditableField.tsx # 인라인 편집 가능 필드
│       ├── FileDropzone.tsx  # 파일 드래그앤드롭
│       └── ProgressBar.tsx   # 3단계 진행 표시기
├── types/
│   ├── resume.ts             # ResumeData, JobRequirements
│   ├── analysis.ts           # AnalysisResult, SkillMatch, DangerQuestion, MagicFix
│   ├── wizard.ts             # AppState, WizardAction, WizardStep, LoadingPhase
│   ├── api.ts                # API 요청/응답 타입
│   └── index.ts              # barrel re-export
├── lib/
│   ├── wizardReducer.ts      # wizardReducer + initialState
│   ├── pdf.ts                # extractTextFromPdf(buffer: Buffer): Promise<string>
│   └── ai/
│       ├── parse-resume.ts   # parseResume(pdfText): Promise<ResumeData>
│       ├── parse-jd.ts       # parseJdFromText / parseJdFromImage
│       └── analyze.ts        # analyzeResumeVsJd(resume, jd): Promise<AnalysisResult>
└── __tests__/
    ├── api/                  # API 라우트 통합 테스트
    ├── components/           # RTL 컴포넌트 테스트
    └── lib/                  # 유틸 단위 테스트
```

## 패턴
- Server Components가 기본. 'use client'는 WizardShell, Step*, UI 인터랙션 컴포넌트에만 붙인다.
- AI 로직은 src/lib/ai/ 순수 함수 → API 라우트에서 호출하는 2-레이어 구조. API 라우트는 HTTP 어댑터 역할만 한다 (요청 파싱, 응답 직렬화).
- 상태는 WizardShell의 useReducer 하나에서 관리. Context 없이 prop drilling으로 자식 전달. (단계가 3개이므로 context 오버엔지니어링 불필요)

## API 라우트 구현 상세

### 입력 검증 순서 — POST /api/parse-resume

검증은 이 순서대로 수행하고, 조건을 충족하지 않으면 즉시 반환한다.

1. `resume` 파일 존재 여부 → 없으면 400
2. `resume` MIME 타입 `application/pdf` 확인 → 아니면 400
3. `resume` 파일 크기 ≤ 5MB → 초과 시 400
4. JD 존재 여부 (`jobDescription` 또는 `jobImage` 중 하나 필수) → 둘 다 없으면 400
5. `jobImage` 존재하는 경우: MIME 타입 `image/png` 또는 `image/jpeg` 확인 → 아니면 400
6. `jobImage` 존재하는 경우: 파일 크기 ≤ 5MB → 초과 시 400
7. PDF 텍스트 추출 (`pdf-parse` 실패 또는 빈 문자열) → 500
8. AI 호출 (`Anthropic SDK` 실패 또는 JSON 파싱 실패) → 500

서버 MIME 재검증이 필요한 이유: 브라우저 FormData의 `file.type`은 클라이언트 측에서 조작 가능. 서버에서 반드시 재확인해야 실제 파일 형식을 보장할 수 있다.

### next.config.ts 필수 설정

```typescript
const nextConfig = {
  serverExternalPackages: ['pdf-parse'],
  // pdf-parse는 Node.js 네이티브 모듈 의존성(canvas 등)을 사용하므로
  // Next.js 서버 번들링에서 제외해야 런타임 오류 없음.

  experimental: {
    serverActions: {
      bodySizeLimit: '6mb',
      // Next.js 기본 body 크기 제한: 4MB.
      // 이력서 PDF 최대 허용: 5MB.
      // 6MB로 설정하는 이유: 5MB 파일 + multipart/form-data 오버헤드(~15%) 흡수.
    },
  },
};
```

### Node.js 런타임 명시

`app/api/parse-resume/route.ts` 최상단에 필수:

```typescript
export const runtime = 'nodejs';
// pdf-parse는 Edge Runtime 미지원.
// 미설정 시 Next.js 기본 Edge Runtime에서 실행되어 import 오류 발생.
```

### 이미지 JD base64 인코딩

Claude API는 이미지를 base64 인코딩 후 content 블록으로 전달한다.

```typescript
const imageBuffer = Buffer.from(await jobImage.arrayBuffer());
const base64 = imageBuffer.toString('base64');
const mediaType = jobImage.type as 'image/png' | 'image/jpeg';

// Claude messages content 구조:
{
  type: 'image',
  source: { type: 'base64', media_type: mediaType, data: base64 }
}
```

JD 텍스트와 이미지가 동시에 제출된 경우: `jobDescription`이 존재하면 텍스트를 우선 사용하고 이미지는 무시한다.

### AI 응답 JSON 파싱 절차

```typescript
const text = response.content[0]?.text ?? '';

let parsed: unknown;
try {
  // AI가 마크다운 코드블록으로 감싸는 경우를 대비해 스트리핑
  const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  parsed = JSON.parse(cleaned);
} catch {
  throw new Error('AI 응답을 파싱할 수 없습니다.');  // → 500
}

// 필수 필드 존재 여부 수동 검증 (zod 미사용 — MVP 의존성 최소화)
// score는 0–100 범위로 클램핑
const score = Math.min(100, Math.max(0, Number(parsed.score ?? 0)));
```

## 데이터 흐름
```
사용자 파일 업로드
  → FileDropzone (Client) — FormData 생성
  → POST /api/parse-resume  — pdf-parse로 텍스트 추출, Claude sonnet으로 파싱
  → ResumeData + JobRequirements JSON 반환
  → WizardShell dispatch(PARSE_SUCCESS)
  → StepRead — 사용자가 ResumeData 검증/수정
  → dispatch(CONFIRM_READ)
  → WizardShell useEffect — POST /api/analyze 자동 호출
  → Claude opus로 분석
  → AnalysisResult JSON 반환
  → dispatch(ANALYZE_SUCCESS)
  → StepAnalyze + StepAction 렌더
```

## 상태 관리
- 클라이언트 UI 상태: WizardShell의 useReducer (AppState)
- 서버 상태: 없음 (무상태 API, 인증 없음, DB 없음)
- 파일 데이터: FormData로 전송 후 서버에서 즉시 처리, 클라이언트에 원본 보관하지 않음
- 페이지 새로고침 시 상태 초기화 (세션 스토리지 미사용 — MVP)

### 상태 전이 테이블

| Action | loading 전 | step 전 | loading 후 | step 후 | 변경 필드 |
|--------|-----------|---------|-----------|---------|----------|
| `PARSE_START` | idle | upload | parsing | upload | error → null |
| `PARSE_SUCCESS` | parsing | upload | idle | read | resumeData, jobRequirements 저장 |
| `PARSE_ERROR` | parsing | upload | idle | upload | error 저장 |
| `CONFIRM_READ` | idle | read | analyzing | read | resumeData payload로 갱신 |
| `ANALYZE_START` | analyzing | read | analyzing | read | — |
| `ANALYZE_SUCCESS` | analyzing | read | idle | action | analysisResult 저장 |
| `ANALYZE_ERROR` | analyzing | read | idle | read | error 저장 |
| `CLEAR_ERROR` | any | any | idle | 유지 | error → null |
| `RESET` | any | any | idle | upload | 전체 초기화 |

**불법 상태 전이 처리**: parsing 중 PARSE_START 재호출 등 잘못된 전이는 reducer가 현재 상태를 그대로 반환(무시). UI 레이어에서 loading='parsing' 동안 제출 버튼 비활성화로 선행 차단.

**CLEAR_ERROR 후 정확한 상태**: step은 에러 발생 시점 step 그대로 유지, loading='idle', error=null.
- 파싱 에러(step='upload') → CLEAR_ERROR 후 StepUpload 폼 재노출
- 분석 에러(step='read') → CLEAR_ERROR 후 StepRead 재노출. 사용자가 "분석 재시도" 클릭 → dispatch(CONFIRM_READ) 재호출

## 타입 정의

### src/types/resume.ts
```typescript
export interface ResumeData {
  name: string;
  contactEmail: string;
  contactPhone?: string;
  summary: string;
  skills: string[];
  experience: ExperienceItem[];
  education: EducationItem[];
  rawText: string;
}

export interface ExperienceItem {
  company: string;
  role: string;
  period: string;
  description: string;
}

export interface EducationItem {
  institution: string;
  degree: string;
  period: string;
}

export interface JobRequirements {
  title: string;
  company?: string;
  requiredSkills: string[];
  preferredSkills: string[];
  responsibilities: string[];
  rawText: string;
}
```

### src/types/analysis.ts
```typescript
export type SkillStatus = 'match' | 'partial' | 'missing';

export interface SkillMatch {
  skill: string;
  status: SkillStatus;
  evidence?: string;
  suggestion?: string;
}

export interface DangerQuestion {
  question: string;
  advice: string;
}

export interface MagicFix {
  original: string;
  revised: string;
  reason: string;
}

export interface AnalysisResult {
  score: number;              // 0–100
  skillMatches: SkillMatch[];
  interviewQuestions: DangerQuestion[];
  magicFixes: MagicFix[];
}
```

### src/types/wizard.ts
```typescript
export type WizardStep = 'upload' | 'read' | 'analyze' | 'action';
export type LoadingPhase = 'idle' | 'parsing' | 'analyzing';

export interface WizardError {
  step: WizardStep;
  message: string;
}

export interface AppState {
  step: WizardStep;
  loading: LoadingPhase;
  error: WizardError | null;
  resumeData: ResumeData | null;       // import { ResumeData } from './resume'
  jobRequirements: JobRequirements | null; // import { JobRequirements } from './resume'
  analysisResult: AnalysisResult | null;  // import { AnalysisResult } from './analysis'
}

export type WizardAction =
  | { type: 'PARSE_START' }
  | { type: 'PARSE_SUCCESS'; payload: { resumeData: ResumeData; jobRequirements: JobRequirements } }
  | { type: 'PARSE_ERROR'; payload: string }
  | { type: 'CONFIRM_READ'; payload: ResumeData }
  | { type: 'ANALYZE_START' }
  | { type: 'ANALYZE_SUCCESS'; payload: AnalysisResult }
  | { type: 'ANALYZE_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET' };
```

### src/types/api.ts
```typescript
import type { ResumeData, JobRequirements } from './resume';
import type { AnalysisResult } from './analysis';

// API HTTP 레이어의 요청/응답 계약 타입
// rawText는 서버 내부 처리 전용으로 클라이언트에 전송하지 않는다 (ADR-014)

export interface ParseResumeResponse {
  resumeData: Omit<ResumeData, 'rawText'>;
  jobRequirements: Omit<JobRequirements, 'rawText'>;
}

export interface AnalyzeRequest {
  resumeData: Omit<ResumeData, 'rawText'>;
  jobRequirements: Omit<JobRequirements, 'rawText'>;
}

export interface AnalyzeResponse {
  result: AnalysisResult;
}

export interface ApiErrorResponse {
  error: string;
}
```

## 보안 명세

### API 키 보호
- `ANTHROPIC_API_KEY`는 `app/api/`와 `src/lib/ai/` 에서만 참조.
- `NEXT_PUBLIC_` 접두사 절대 금지 — 클라이언트 번들에 키 노출됨.
- 키 미설정 시 API 라우트 진입 직후 즉시 500 반환. SDK 호출 시도 금지.

### 이력서 데이터 보호
- `rawText`, `ResumeData` 전체를 `console.log`에 출력 금지.
- 업로드 파일은 API 라우트 핸들러 메모리에서만 처리. 디스크 임시 파일 저장 금지.
- 처리 완료 후 `Buffer`는 GC에 위임. 명시적 해제 불필요.

### 서버 측 MIME 재검증
클라이언트 FormData의 `file.type`은 브라우저가 설정하나 개발자 도구로 조작 가능.
서버에서 반드시 재검증:
- `resume`: `file.type === 'application/pdf'`
- `jobImage`: `['image/png', 'image/jpeg'].includes(file.type)`

PDF 매직 바이트(`%PDF-`) 검증: MVP에서 제외. 이유는 ADR-013 참조.

## 에러 상태 흐름
```
파싱 실패:
  PARSE_ERROR 발생 → state.error = { step: 'upload', message }
  → StepUpload가 에러 배너 렌더링
  → "다시 시도" 버튼 → dispatch(CLEAR_ERROR) → 폼 초기화

분석 실패:
  ANALYZE_ERROR 발생 → state.error = { step: 'read', message }
  → StepRead가 에러 배너 렌더링
  → "분석 재시도" 버튼 → dispatch(CLEAR_ERROR) → dispatch(CONFIRM_READ) 재호출
```

에러 메시지는 사용자가 이해할 수 있는 한국어로 작성. HTTP 에러 코드나 내부 스택 트레이스 노출 금지.

### 네트워크 오류 처리
fetch 자체가 throw되는 경우 (네트워크 단절, DNS 실패, CORS 등):

```typescript
catch (err) {
  if (err instanceof Error && err.name === 'AbortError') {
    // AbortController 타임아웃으로 인한 취소
    dispatch({ type: 'PARSE_ERROR', payload: '이력서 읽기가 너무 오래 걸리고 있어요. 잠시 후 다시 시도해주세요.' });
  } else {
    // 일반 네트워크 오류
    dispatch({ type: 'PARSE_ERROR', payload: '네트워크 연결을 확인해주세요.' });
  }
}
```

분석 단계에서 에러 발생 시 `PARSE_ERROR` 대신 `ANALYZE_ERROR`로 dispatch. 에러 메시지 문자열은 PRD.md 에러 시나리오 테이블과 일치해야 한다.

## 로딩 상태 렌더링
```
state.loading === 'parsing'
  → StepRead 대신 스켈레톤 렌더링
  → 메시지: "이력서와 공고를 읽고 있어요..."

state.loading === 'analyzing'
  → StepAnalyze/StepAction 대신 스켈레톤 렌더링
  → 메시지: "강점과 약점을 분석하고 있어요..."
```

스켈레톤 컴포넌트는 실제 렌더될 레이아웃과 동일한 구조를 유지해야 한다 (레이아웃 시프트 방지).

## AbortController 타임아웃

### 타임아웃 상수 위치
`src/lib/constants.ts` 에 정의:

```typescript
export const PARSE_TIMEOUT_MS = 10_000;     // 파싱 타임아웃: 10초
export const ANALYZE_TIMEOUT_MS = 30_000;   // 분석 타임아웃: 30초
export const SLOW_LOADING_HINT_MS = 15_000; // 분석 단계 보조 메시지 표시 기준: 15초
```

### 구현 위치 및 패턴
WizardShell의 useEffect 내부. CONFIRM_READ dispatch 직후 분석 API 호출 시 생성.

```typescript
useEffect(() => {
  if (state.loading !== 'analyzing') return;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ANALYZE_TIMEOUT_MS);

  fetchAnalyze(state.resumeData, state.jobRequirements, controller.signal)
    .then(result => dispatch({ type: 'ANALYZE_SUCCESS', payload: result }))
    .catch(err => {
      if (err instanceof Error && err.name === 'AbortError') {
        dispatch({ type: 'ANALYZE_ERROR', payload: '분석이 너무 오래 걸리고 있어요. 잠시 후 다시 시도해주세요.' });
      } else {
        dispatch({ type: 'ANALYZE_ERROR', payload: '네트워크 연결을 확인해주세요.' });
      }
    });

  return () => {
    clearTimeout(timeoutId);
    controller.abort(); // 컴포넌트 언마운트 또는 step 변경 시 진행 중인 요청 취소
  };
}, [state.loading]);
```

### AbortError 구분
`controller.abort()` 호출 시 fetch는 `DOMException`을 throw하고 `error.name === 'AbortError'`.
이 조건으로 타임아웃 에러와 일반 네트워크 에러를 구분하여 다른 메시지를 표시한다.
타임아웃 에러 메시지와 일반 에러 메시지는 PRD.md 에러 시나리오 테이블 참조.
