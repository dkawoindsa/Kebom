# Step 0: final-build

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 현재 상태를 파악하라:

- `/src/components/wizard/WizardShell.tsx`
- `/src/components/wizard/StepUpload.tsx`
- `/src/components/wizard/StepRead.tsx`
- `/src/components/wizard/StepAnalyze.tsx`
- `/src/components/wizard/StepAction.tsx`
- `/src/components/ui/SkillBadge.tsx`
- `/src/components/ui/EditableField.tsx`
- `/src/components/ui/FileDropzone.tsx`
- `/src/components/ui/ProgressBar.tsx`

## 작업

최종 빌드 및 테스트를 실행하고, 발견된 모든 오류를 수정하라.

### 실행 순서

1. `npm run build` 실행.
2. 빌드 실패 시 에러 메시지를 확인하고 수정 후 재시도.
3. `npm test` 실행.
4. 테스트 실패 시 원인을 파악하고 수정 후 재시도.

### 자주 발생하는 문제 유형

**TypeScript 에러:**
- 타입 불일치: prop 타입이 컴포넌트 정의와 다름
- Non-null assertion 누락: 선택적 값 접근 시 타입 가드 필요
- 미사용 import: 컴파일러 에러

**ESLint 에러 (빌드 실패 원인):**
- `@typescript-eslint/no-unused-vars`: 정의만 하고 사용 안 한 변수
- `react-hooks/exhaustive-deps`: useEffect 의존성 누락 (Warning은 허용, Error만 수정)

**테스트 실패:**
- 컴포넌트 렌더링 에러: import 경로, prop 타입 확인
- RTL 쿼리 실패: 역할/텍스트가 실제 DOM과 불일치
- 모킹 문제: jest.mock 순서, clearMocks 설정

### 수정 완료 후

모든 파일에서 불필요한 `console.log` 제거.
이력서 개인정보, rawText, ResumeData 전체를 로깅하는 코드가 없는지 확인.

## Acceptance Criteria

```bash
npm run build && npm test
```

두 커맨드 모두 에러 없이 통과해야 한다.

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 결과에 따라 `phases/9-build-polish/index.json`의 step 0을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "최종 빌드 및 테스트 통과 — npm run build && npm test 모두 성공"`
   - 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용 및 미해결 사항"`

## 주의사항

- 이 step에서는 기능 추가 금지. 빌드/테스트 통과를 위한 버그 수정만 허용.
- NEXT_PUBLIC_ 환경변수 추가 금지.
- Anthropic SDK를 클라이언트 컴포넌트에서 직접 import하지 마라.
