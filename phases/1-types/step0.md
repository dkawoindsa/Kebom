# Step 0: type-definitions

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/docs/ARCHITECTURE.md` — 타입 정의 전체 명세 (src/types/ 섹션과 타입 정의 섹션)
- `/docs/ADR.md` — 기술 스택 결정 배경
- `/src/app/page.tsx` — 현재 앱 진입점 (컨텍스트 파악용)

## 작업

`src/types/` 디렉토리 하위에 아래 5개 파일을 생성하라. 각 파일의 내용은 ARCHITECTURE.md 의 타입 정의 섹션에 명시된 것을 그대로 따른다.

### src/types/resume.ts

```typescript
export interface ResumeData { ... }
export interface ExperienceItem { ... }
export interface EducationItem { ... }
export interface JobRequirements { ... }
```

필드 목록과 타입은 ARCHITECTURE.md `## 타입 정의 > src/types/resume.ts` 에 명시된 것과 완전히 일치해야 한다.

### src/types/analysis.ts

```typescript
export type SkillStatus = ...
export interface SkillMatch { ... }
export interface DangerQuestion { ... }
export interface MagicFix { ... }
export interface AnalysisResult { ... }
```

ARCHITECTURE.md `src/types/analysis.ts` 섹션 참조.

### src/types/wizard.ts

```typescript
export type WizardStep = ...
export type LoadingPhase = ...
export interface WizardError { ... }
export interface AppState { ... }
export type WizardAction = ...
```

WizardAction은 discriminated union이다. ARCHITECTURE.md `src/types/wizard.ts` 섹션 참조.

### src/types/api.ts

```typescript
export interface ParseResumeResponse { ... }
export interface AnalyzeRequest { ... }
export interface AnalyzeResponse { ... }
export interface ApiErrorResponse { ... }
```

rawText는 서버 내부 전용이므로 API 계약 타입에서 Omit<...,'rawText'>로 제외한다. ARCHITECTURE.md `src/types/api.ts` 섹션 참조.

### src/types/index.ts

모든 타입을 barrel re-export 한다:

```typescript
export * from './resume';
export * from './analysis';
export * from './wizard';
export * from './api';
```

## 주의사항

- 구현 로직을 작성하지 마라. 이 파일들은 순수 TypeScript 타입/인터페이스/유니온 선언만 포함한다.
- `src/lib/`, `src/components/`, `app/` 파일을 수정하지 마라. 타입 파일만 생성한다.
- NEXT_PUBLIC_ 접두사가 붙은 변수나 런타임 코드를 절대 추가하지 마라.
- 기존 `src/__tests__/` 테스트를 깨뜨리지 마라.

## Acceptance Criteria

```bash
npm run build
```

TypeScript 컴파일 에러 없이 빌드가 통과해야 한다.

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. `src/types/` 하위 5개 파일이 모두 생성됐는지 확인한다.
3. ARCHITECTURE.md의 타입 정의와 실제 파일 내용이 일치하는지 확인한다.
4. 결과에 따라 `phases/1-types/index.json`의 step 0을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "src/types/{resume,analysis,wizard,api,index}.ts 생성"`
   - 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
