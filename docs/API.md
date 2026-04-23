# API 명세

모든 API 라우트는 `app/api/` 하위에 위치한다.
에러 응답 형식은 항상 `{ error: string }` + 적절한 HTTP 상태코드.

---

## POST /api/parse-resume

이력서 PDF와 채용공고(텍스트 또는 이미지)를 받아 구조화된 데이터를 반환한다.
내부적으로 claude-sonnet-4-6을 사용한다.

### 요청

`Content-Type: multipart/form-data`

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `resume` | File (PDF) | ✅ | 이력서 PDF, 최대 5MB |
| `jobDescription` | string | 둘 중 하나 | 채용공고 텍스트 |
| `jobImage` | File (image) | 둘 중 하나 | 채용공고 스크린샷 (PNG/JPG) |

`jobDescription`과 `jobImage` 중 하나는 반드시 있어야 한다.

### 응답

**200 OK**
```typescript
{
  resumeData: ResumeData;
  jobRequirements: JobRequirements;
}
```

**400 Bad Request**
```typescript
{ error: "이력서 파일이 없습니다." }
{ error: "채용공고를 입력하거나 이미지를 업로드해주세요." }
{ error: "PDF 파일만 업로드 가능합니다." }
{ error: "파일 크기는 5MB 이하여야 합니다." }
```

**500 Internal Server Error**
```typescript
{ error: "이력서를 읽을 수 없습니다. 텍스트 기반 PDF를 사용해주세요." }
{ error: "분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." }
```

### 타입 정의

```typescript
interface ResumeData {
  name: string;
  contactEmail: string;
  contactPhone?: string;
  summary: string;
  skills: string[];
  experience: ExperienceItem[];
  education: EducationItem[];
  rawText: string;          // 원본 텍스트 (클라이언트 미전송 — 서버 내부 처리용)
}

interface ExperienceItem {
  company: string;
  role: string;
  period: string;
  description: string;
}

interface EducationItem {
  institution: string;
  degree: string;
  period: string;
}

interface JobRequirements {
  title: string;
  company?: string;
  requiredSkills: string[];
  preferredSkills: string[];
  responsibilities: string[];
  rawText: string;
}
```

> **보안 주의**: `rawText`는 API 응답에 포함되지 않아야 한다. 서버에서 파싱 후 AI 호출에만 사용하고 클라이언트에 반환하지 않는다. `console.log`에 `rawText`나 `ResumeData` 전체를 출력하지 마라.

---

## POST /api/analyze

파싱된 이력서와 채용공고를 받아 매칭 분석 결과를 반환한다.
내부적으로 claude-opus-4-7을 사용한다.

### 요청

`Content-Type: application/json`

```typescript
{
  resumeData: Omit<ResumeData, 'rawText'>;
  jobRequirements: Omit<JobRequirements, 'rawText'>;
}
```

사용자가 Step 1에서 수정한 `resumeData`를 그대로 전달한다.

### 응답

**200 OK**
```typescript
{
  result: AnalysisResult;
}
```

**400 Bad Request**
```typescript
{ error: "요청 형식이 올바르지 않습니다." }
{ error: "이력서 데이터가 없습니다." }
```

**500 Internal Server Error**
```typescript
{ error: "분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." }
```

### 타입 정의

```typescript
type SkillStatus = 'match' | 'partial' | 'missing';

interface SkillMatch {
  skill: string;
  status: SkillStatus;
  evidence?: string;      // 이력서에서 발견된 근거 텍스트
  suggestion?: string;    // 개선 제안 (partial/missing인 경우)
}

interface DangerQuestion {
  question: string;       // 면접관이 물어볼 질문
  advice: string;         // 대응 방향
}

interface MagicFix {
  original: string;       // 이력서의 기존 문장/표현
  revised: string;        // 공고 키워드를 반영한 개선 버전
  reason: string;         // 수정 이유
}

interface AnalysisResult {
  score: number;                      // 0–100 정수
  skillMatches: SkillMatch[];         // 정렬: missing → partial → match
  interviewQuestions: DangerQuestion[]; // 최대 5개
  magicFixes: MagicFix[];             // 최대 5개
}
```

---

## 공통 규칙

### 파일 처리
- 업로드된 파일은 API 라우트 핸들러 내에서 처리하고 완료 즉시 메모리에서 해제
- 임시 파일을 디스크에 저장하지 않는다
- `next.config.ts`의 `serverExternalPackages: ['pdf-parse']` 필수

### AI 호출 패턴
```typescript
// 공통 구조
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// parse-resume: sonnet-4-6 사용
const response = await client.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 2048,
  messages: [{ role: 'user', content: prompt }],
});

// analyze: opus-4-7 사용
const response = await client.messages.create({
  model: 'claude-opus-4-7',
  max_tokens: 4096,
  messages: [{ role: 'user', content: prompt }],
});
```

AI 응답은 JSON 형식으로 파싱. 파싱 실패 시 500 반환.

### 타임아웃 기대치
| 라우트 | p50 | p95 |
|--------|-----|-----|
| /api/parse-resume | 5초 | 10초 |
| /api/analyze | 15초 | 30초 |

Next.js 기본 API 라우트 타임아웃(30초)으로 충분하다.
