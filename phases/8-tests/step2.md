# Step 2: wizard-tests

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/docs/TESTING.md` — 컴포넌트 테스트 전략, RTL 패턴
- `/src/components/wizard/WizardShell.tsx` — 테스트 대상
- `/src/components/wizard/StepUpload.tsx` — 테스트 대상 (props: onSubmit, loading, error)
- `/src/components/wizard/StepRead.tsx` — 테스트 대상 (props: resumeData, jobRequirements, onConfirm, loading, error)
- `/src/components/wizard/StepAnalyze.tsx` — 테스트 대상 (props: analysisResult)
- `/src/components/wizard/StepAction.tsx` — 테스트 대상 (props: analysisResult)

## 작업

`src/__tests__/components/wizard/` 디렉토리를 생성하고 아래 5개 테스트 파일을 생성하라.

### 공통 픽스처 (각 파일에 인라인으로 정의):
```typescript
const mockResumeData = {
  name: '홍길동', contactEmail: 'hong@test.com', contactPhone: '010-0000-0000',
  summary: '백엔드 개발자', skills: ['TypeScript', 'Node.js'],
  experience: [{ company: '테스트', role: '개발자', period: '2022-2024', description: '개발' }],
  education: [{ institution: '대학교', degree: '컴공', period: '2018-2022' }],
  rawText: '원문 텍스트',
};
const mockJobReq = {
  title: '백엔드 개발자', company: '회사', requiredSkills: ['TypeScript'],
  preferredSkills: ['React'], responsibilities: ['개발'], rawText: '공고 원문',
};
const mockAnalysisResult = {
  score: 75,
  skillMatches: [{ skill: 'TypeScript', status: 'match' as const, evidence: '경력에 명시됨' }],
  interviewQuestions: [{ question: '경험은?', advice: '구체적 사례 제시' }],
  magicFixes: [{ original: '원본', revised: '수정본', reason: '키워드 추가' }],
};
```

### 1. `WizardShell.test.tsx`
- fetch 모킹: `jest.spyOn(global, 'fetch')`
- upload 단계 초기 렌더 확인 (StepUpload 렌더됨)
- step 라우팅 단순 확인 (파싱 성공 후 StepRead로 전환)

### 2. `StepUpload.test.tsx`
- idle 상태에서 PDF 파일 선택 후 파일명 표시
- `loading='parsing'` 시 제출 버튼 비활성화
- `error` prop 있을 때 에러 배너 (`role="alert"`) 표시
- 이력서 없이 제출 버튼 비활성화
- JD 없이 제출 버튼 비활성화

### 3. `StepRead.test.tsx`
- resumeData 이름 표시 확인
- "확인 후 분석" 버튼 클릭 시 `onConfirm` 호출
- `loading='analyzing'` 시 버튼 비활성화
- `error` prop 있을 때 에러 배너 표시
- `jobRequirements.requiredSkills` 빈 배열 → amber 경고 표시

### 4. `StepAnalyze.test.tsx`
- score 숫자 표시 확인
- skillMatches 렌더링 확인 (각 스킬명 표시)
- 빈 skillMatches → 빈 상태 메시지 표시
- missing → partial → match 정렬 순서 확인

### 5. `StepAction.test.tsx`
- interviewQuestions 렌더링 확인
- magicFixes 렌더링 확인
- 빈 interviewQuestions → 빈 상태 메시지
- 빈 magicFixes → 빈 상태 메시지

**기존 플레이스홀더 파일 삭제:**
`src/__tests__/components/placeholder.test.tsx` 파일이 있으면 삭제하라.
(`src/__tests__/components/RootPage.test.tsx`는 유지)

## Acceptance Criteria

```bash
npm run build && npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 5개 테스트 파일 모두 통과하는지 확인한다.
3. 결과에 따라 `phases/8-tests/index.json`의 step 2를 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "wizard 컴포넌트 테스트 5개 생성 — WizardShell, StepUpload, StepRead, StepAnalyze, StepAction"`
   - 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`

## 주의사항

- 컴포넌트 내부 구현이 아닌 **동작(behavior)**을 테스트한다. DOM 구조가 아닌 텍스트/역할로 쿼리.
- fetch는 반드시 모킹한다. 실제 API 호출 금지.
- 기존 소스 파일을 수정하지 마라.
