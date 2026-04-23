# 테스트 가이드

## 원칙

- **TDD 필수**: 구현 전 테스트를 먼저 작성한다. 테스트가 실패하는 것을 확인한 후 구현한다.
- 테스트는 구현 세부사항이 아닌 **동작(behavior)**을 검증한다.
- 각 테스트는 독립적으로 실행 가능해야 한다 (공유 상태 금지).

---

## 디렉토리 구조

```
src/__tests__/
├── lib/
│   ├── wizardReducer.test.ts   # useReducer 상태 전이 단위 테스트
│   └── pdf.test.ts             # PDF 텍스트 추출 단위 테스트
├── api/
│   ├── parse-resume.test.ts    # POST /api/parse-resume 통합 테스트
│   └── analyze.test.ts         # POST /api/analyze 통합 테스트
└── components/
    ├── wizard/
    │   ├── WizardShell.test.tsx
    │   ├── StepUpload.test.tsx
    │   ├── StepRead.test.tsx
    │   ├── StepAnalyze.test.tsx
    │   └── StepAction.test.tsx
    └── ui/
        ├── SkillBadge.test.tsx
        ├── FileDropzone.test.tsx
        └── EditableField.test.tsx
```

---

## 레이어별 테스트 전략

### Unit — src/lib/

**wizardReducer.ts**

모든 `WizardAction`에 대한 상태 전이를 완전히 검증한다.

```typescript
describe('wizardReducer', () => {
  it('PARSE_START: loading을 parsing으로 변경', () => {
    const state = wizardReducer(initialState, { type: 'PARSE_START' });
    expect(state.loading).toBe('parsing');
    expect(state.error).toBeNull();
  });

  it('PARSE_SUCCESS: resumeData 저장 및 step을 read로 변경', () => {
    const payload = { resumeData: mockResumeData, jobRequirements: mockJobReq };
    const state = wizardReducer(
      { ...initialState, loading: 'parsing' },
      { type: 'PARSE_SUCCESS', payload }
    );
    expect(state.step).toBe('read');
    expect(state.loading).toBe('idle');
    expect(state.resumeData).toEqual(mockResumeData);
  });

  it('PARSE_ERROR: error 상태 저장', () => {
    const state = wizardReducer(initialState, { type: 'PARSE_ERROR', payload: '오류 메시지' });
    expect(state.error).toEqual({ step: 'upload', message: '오류 메시지' });
    expect(state.loading).toBe('idle');
  });

  // CONFIRM_READ, ANALYZE_START, ANALYZE_SUCCESS, ANALYZE_ERROR, CLEAR_ERROR, RESET 각각 테스트
});
```

`wizardReducer`는 순수 함수이므로 모킹 없이 실제 실행으로 테스트한다.

**pdf.ts**

```typescript
jest.mock('pdf-parse');
import pdfParse from 'pdf-parse';

it('Buffer에서 텍스트를 추출한다', async () => {
  (pdfParse as jest.Mock).mockResolvedValue({ text: '추출된 텍스트' });
  const result = await extractTextFromPdf(Buffer.from(''));
  expect(result).toBe('추출된 텍스트');
});

it('pdf-parse 실패 시 에러를 throw한다', async () => {
  (pdfParse as jest.Mock).mockRejectedValue(new Error('파싱 실패'));
  await expect(extractTextFromPdf(Buffer.from(''))).rejects.toThrow();
});
```

---

### Integration — src/app/api/

API 라우트 핸들러를 직접 import하여 테스트한다. Anthropic SDK는 모킹, pdf-parse는 모킹.

```typescript
// parse-resume.test.ts
jest.mock('@anthropic-ai/sdk');
jest.mock('pdf-parse');

import { POST } from '@/app/api/parse-resume/route';

describe('POST /api/parse-resume', () => {
  it('유효한 PDF + JD 텍스트 → 200 + ResumeData', async () => {
    mockAnthropicResponse(mockParsedResumeJson);
    mockPdfParse('이력서 텍스트');

    const formData = new FormData();
    formData.append('resume', new Blob([''], { type: 'application/pdf' }), 'resume.pdf');
    formData.append('jobDescription', '백엔드 개발자 채용');

    const req = new Request('http://localhost/api/parse-resume', {
      method: 'POST',
      body: formData,
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.resumeData).toBeDefined();
    expect(body.jobRequirements).toBeDefined();
  });

  it('이력서 파일 없음 → 400', async () => {
    const formData = new FormData();
    formData.append('jobDescription', '채용공고');
    const req = new Request('http://localhost/api/parse-resume', {
      method: 'POST',
      body: formData,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('Anthropic SDK 실패 → 500', async () => {
    mockAnthropicError();
    // ...
    expect(res.status).toBe(500);
  });
});
```

---

### Component — src/components/

React Testing Library + userEvent를 사용한다.

```typescript
// StepUpload.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('StepUpload', () => {
  it('PDF 파일을 선택하면 파일명이 표시된다', async () => {
    const onSubmit = jest.fn();
    render(<StepUpload onSubmit={onSubmit} loading="idle" />);

    const input = screen.getByLabelText('이력서 PDF 업로드');
    const file = new File(['content'], 'resume.pdf', { type: 'application/pdf' });
    await userEvent.upload(input, file);

    expect(screen.getByText('resume.pdf')).toBeInTheDocument();
  });

  it('loading=parsing일 때 제출 버튼이 비활성화된다', () => {
    render(<StepUpload onSubmit={jest.fn()} loading="parsing" />);
    expect(screen.getByRole('button', { name: /분석 시작/ })).toBeDisabled();
  });

  it('에러 상태를 표시한다', () => {
    render(
      <StepUpload
        onSubmit={jest.fn()}
        loading="idle"
        error={{ step: 'upload', message: '오류 메시지' }}
      />
    );
    expect(screen.getByRole('alert')).toHaveTextContent('오류 메시지');
  });
});
```

각 컴포넌트는 **idle(기본)**, **loading(로딩 중)**, **error(에러)**, **success(성공)** 상태를 각각 테스트한다.

---

## 모킹 규칙

| 대상 | 방법 | 이유 |
|------|------|------|
| `@anthropic-ai/sdk` | `jest.mock('@anthropic-ai/sdk')` | 외부 API 호출 방지 |
| `pdf-parse` | `jest.mock('pdf-parse')` | Node.js 네이티브 의존성 격리 |
| `fetch` | `jest.spyOn(global, 'fetch')` | 컴포넌트의 API 호출 제어 |
| `wizardReducer` | **모킹 금지** | 순수 함수 — 실제 실행으로 테스트 |
| `next/navigation` | `jest.mock('next/navigation')` | 라우터 의존성 제거 |

---

## 커버리지 기준

| 파일 | 목표 |
|------|------|
| `src/lib/wizardReducer.ts` | 100% |
| `src/app/api/**/route.ts` | 80%+ |
| `src/lib/ai/*.ts` | 70%+ |
| `src/components/wizard/*.tsx` | 70%+ |
| `src/components/ui/*.tsx` | 60%+ |

커버리지 리포트 실행:
```bash
npm run test -- --coverage
```

---

## 테스트 실행

```bash
npm run test           # 전체 실행 (CI 환경)
npm run test:watch     # 개발 중 변경 감지 모드
npm run test -- --testPathPattern=wizardReducer  # 특정 파일만
```
