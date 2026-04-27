# Step 0: project-config

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/docs/SETUP.md` — 모든 설정 파일의 정확한 내용이 여기 있다. 반드시 읽고 그대로 생성하라.
- `/docs/ARCHITECTURE.md` — next.config.ts 에 필요한 추가 설정(serverExternalPackages, bodySizeLimit)이 여기 있다.
- `/CLAUDE.md` — 프로젝트 규칙과 금지사항

## 작업

아래 루트 설정 파일들을 생성하라. 각 파일의 정확한 내용은 `/docs/SETUP.md`를 참조한다.

### 1. `package.json`

`/docs/SETUP.md`의 내용을 그대로 사용한다.

### 2. `tsconfig.json`

`/docs/SETUP.md`의 내용을 그대로 사용한다.

### 3. `next.config.ts`

`/docs/SETUP.md` 기본 내용에 `/docs/ARCHITECTURE.md`의 추가 설정을 반영한다:
- `serverExternalPackages: ['pdf-parse']`
- `experimental.serverActions.bodySizeLimit: '6mb'`

### 4. `jest.config.ts`

`/docs/SETUP.md`의 내용을 그대로 사용한다. 단, `setupFilesAfterFramework` 오타에 주의하라 — 올바른 키는 `setupFilesAfterFramework`가 아니라 `setupFilesAfterFramework`가 아닌 **`setupFilesAfterEnv`** 이다.

### 5. `postcss.config.mjs`

Tailwind v4 + Next.js 조합에 필요한 최소 설정:
```js
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
export default config;
```

### 6. `eslint.config.mjs`

Next.js 15 기본 ESLint 설정:
```js
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
];

export default eslintConfig;
```

### 7. `.gitignore`

아직 없으면 생성하라. 반드시 포함해야 할 항목:
- `.env.local`, `.env*.local`
- `node_modules/`
- `.next/`
- `out/`
- `*.tsbuildinfo`

## 주의사항

- `jest.config.ts`의 `setupFilesAfterFramework`는 오타다. 반드시 `setupFilesAfterEnv`로 작성하라. 오타 그대로 쓰면 jest가 setup 파일을 로드하지 않는다.
- `next.config.ts`에 `serverExternalPackages`와 `experimental.serverActions.bodySizeLimit` 둘 다 포함하지 않으면 Step 4(API 라우트)에서 런타임 오류가 발생한다. 지금 올바르게 설정하라.
- `.env.local`은 이미 존재하므로 건드리지 마라. `.gitignore`에 포함되어 있는지만 확인하라.

## Acceptance Criteria

```bash
# 아래 파일들이 모두 존재해야 한다
ls package.json tsconfig.json next.config.ts jest.config.ts postcss.config.mjs eslint.config.mjs .gitignore
```

파일 내용이 올바른지 확인:
- `package.json`: `"next": "15.3.0"` 포함
- `tsconfig.json`: `"strict": true`, `"noUncheckedIndexedAccess": true` 포함
- `next.config.ts`: `serverExternalPackages` + `bodySizeLimit: '6mb'` 포함
- `jest.config.ts`: `setupFilesAfterEnv` (오타 없이)
- `.gitignore`: `.env.local` 포함

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트를 확인한다:
   - ARCHITECTURE.md 디렉토리 구조를 따르는가?
   - ADR 기술 스택을 벗어나지 않았는가?
   - CLAUDE.md CRITICAL 규칙을 위반하지 않았는가?
3. 결과에 따라 `phases/0-bootstrap/index.json`의 step 0을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`

## 금지사항

- `.env.local` 파일을 수정하거나 재생성하지 마라. 이미 API 키가 설정되어 있다.
- `tailwind.config.js`를 생성하지 마라. Tailwind v4는 별도 설정 파일 없이 동작한다.
- 기존 테스트를 깨뜨리지 마라.
