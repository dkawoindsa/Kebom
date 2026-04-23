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
  resumeData: ResumeData | null;
  jobRequirements: JobRequirements | null;
  analysisResult: AnalysisResult | null;
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
