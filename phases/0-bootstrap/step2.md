# Step 2: test-infra

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/docs/TESTING.md` — 테스트 구조, 모킹 패턴, 커버리지 기준
- `/CLAUDE.md` — 테스트 규약 (파일 위치, 네이밍, TDD 원칙)
- `jest.config.ts` — setupFilesAfterEnv 경로 확인
- `src/app/page.tsx` — 이전 step에서 생성된 파일 (smoke test 대상)

## 작업

### 1. `jest.setup.ts` (루트)

```typescript
import '@testing-library/jest-dom';
```

### 2. 테스트 디렉토리 구조 생성

아래 디렉토리와 각각 placeholder smoke test 1개씩 생성하라:

**`src/__tests__/lib/placeholder.test.ts`**
```typescript
describe('lib placeholder', () => {
  it('passes', () => {
    expect(true).toBe(true);
  });
});
```

**`src/__tests__/api/placeholder.test.ts`**
```typescript
describe('api placeholder', () => {
  it('passes', () => {
    expect(true).toBe(true);
  });
});
```

**`src/__tests__/components/placeholder.test.tsx`**
```typescript
describe('components placeholder', () => {
  it('passes', () => {
    expect(true).toBe(true);
  });
});
```

### 3. `src/__tests__/components/RootPage.test.tsx`

page.tsx의 기본 렌더 smoke test:

```typescript
import { render, screen } from '@testing-library/react';
import Page from '@/app/page';

describe('RootPage', () => {
  it('캐봄 제목을 렌더한다', () => {
    render(<Page />);
    expect(screen.getByText('캐봄')).toBeInTheDocument();
  });
});
```

page.tsx가 Server Component이므로 RTL에서 직접 렌더 가능하다. 'use client'가 없는지 먼저 확인하라.

## 주의사항

- `jest.setup.ts`의 경로가 `jest.config.ts`의 `setupFilesAfterEnv` 값과 일치해야 한다. (`<rootDir>/jest.setup.ts`)
- placeholder test 파일은 이후 실제 테스트로 교체될 예정이므로 최소한으로만 작성하라.
- Server Component(`page.tsx`)를 RTL로 테스트할 때 async/await가 필요할 수 있다. 빌드 에러가 나면 `async function Page()`인지 확인하라.
- `@testing-library/jest-dom` import 오류가 나면 `jest.setup.ts`가 `setupFilesAfterEnv`에 올바르게 등록되었는지 확인하라.

## Acceptance Criteria

```bash
npm run build && npm test
```

- `npm run build`: 에러 없이 통과
- `npm test`: 모든 테스트 통과 (4개 이상: placeholder 3 + RootPage 1)

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트를 확인한다:
   - ARCHITECTURE.md 디렉토리 구조를 따르는가?
   - ADR 기술 스택을 벗어나지 않았는가?
   - CLAUDE.md CRITICAL 규칙을 위반하지 않았는가?
3. 결과에 따라 `phases/0-bootstrap/index.json`의 step 2를 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`

## 금지사항

- 실제 비즈니스 로직 테스트를 작성하지 마라. placeholder만 작성한다. 실제 테스트는 각 Phase에서 해당 모듈과 함께 작성한다.
- `jest.config.ts`를 수정하지 마라. 이전 step에서 올바르게 생성되었다.
- 기존 테스트를 깨뜨리지 마라.
