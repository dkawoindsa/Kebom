# 프로젝트 셋업 가이드

## 사전 요구사항
- Node.js 20 이상
- Python 3.11 이상 (Harness 실행용)
- Anthropic API 키 (https://console.anthropic.com)

---

## 부트스트랩 순서 (최초 1회)

소스 코드가 없는 상태에서 시작할 때 반드시 이 순서를 따른다.

### 1. package.json

```json
{
  "name": "kebom",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint && tsc --noEmit",
    "test": "jest --passWithNoTests",
    "test:watch": "jest --watch"
  },
  "dependencies": {
    "next": "15.3.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@anthropic-ai/sdk": "^0.39.0",
    "pdf-parse": "^1.1.1"
  },
  "devDependencies": {
    "typescript": "^5.8.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/pdf-parse": "^1.1.4",
    "tailwindcss": "^4.1.0",
    "@tailwindcss/postcss": "^4.1.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "15.3.0",
    "jest": "^29.0.0",
    "jest-environment-jsdom": "^29.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0",
    "ts-jest": "^29.0.0"
  }
}
```

### 2. tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 3. next.config.ts

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdf-parse'],
};

export default nextConfig;
```

`serverExternalPackages`에 `pdf-parse`를 추가해야 서버 번들링 오류를 방지할 수 있다.

### 4. jest.config.ts

```typescript
import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
};

export default createJestConfig(config);
```

### 5. jest.setup.ts

```typescript
import '@testing-library/jest-dom';
```

### 6. src/app/globals.css

```css
@import 'tailwindcss';
```

Tailwind v4는 별도 `tailwind.config.js` 없이 이 한 줄로 동작한다.

### 7. .env.local

```
ANTHROPIC_API_KEY=sk-ant-여기에_실제_키_입력
```

이 파일은 `.gitignore`에 포함되어 있어야 하며 절대 커밋하지 않는다.

### 8. 의존성 설치

```bash
npm install
```

---

## 개발 서버 실행

```bash
npm run dev
# → http://localhost:3000
```

---

## 빌드 검증

```bash
npm run build   # 타입 에러, 린트 에러 없이 통과해야 함
npm run lint    # ESLint + tsc --noEmit
npm run test    # Jest 전체 실행
```

각 Phase 완료 후 `npm run build`가 0 오류로 통과하는지 반드시 확인한다.

---

## 디렉토리 초기 생성 순서

소스 코드 구현 시 아래 순서로 파일을 생성한다:

1. `src/types/` — 타입 정의 먼저 (구현보다 타입이 선행)
2. `src/lib/` — 순수 함수 유틸리티
3. `src/lib/ai/` — AI 호출 로직
4. `src/app/api/` — API 라우트
5. `src/components/ui/` — 공통 UI 컴포넌트
6. `src/components/wizard/` — 위저드 스텝 컴포넌트
7. `src/app/page.tsx`, `src/app/layout.tsx` — 진입점

---

## Harness 실행

```bash
# phases/ 디렉토리에 phase 파일 생성 후:
python3 scripts/execute.py {phase-name}

# 완료 후 자동 push:
python3 scripts/execute.py {phase-name} --push
```

자세한 내용: `.claude/commands/harness.md`
