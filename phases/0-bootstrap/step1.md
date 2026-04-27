# Step 1: app-entry

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/docs/ARCHITECTURE.md` — 디렉토리 구조, Server Component 규칙, 다크 테마(#0a0a0a)
- `/docs/UI_GUIDE.md` — 색상 팔레트, 폰트, 레이아웃 명세
- `/docs/SETUP.md` — globals.css Tailwind v4 import 방식
- `/CLAUDE.md` — 'use client' 사용 규칙
- `package.json` — 설치된 의존성 확인

이전 step에서 만들어진 설정 파일들을 확인한 뒤 작업하라.

## 작업

### 1. 의존성 설치

```bash
npm install
```

설치 완료 후 다음으로 넘어간다.

### 2. `src/app/globals.css`

Tailwind v4는 별도 config 없이 아래 한 줄로 동작한다:

```css
@import 'tailwindcss';
```

이것만 작성하라. 추가 커스텀 CSS는 작성하지 않는다.

### 3. `src/app/layout.tsx`

Server Component (기본값, 'use client' 없음). 아래 요구사항을 충족하라:

- 배경색: `#0a0a0a` (다크 테마)
- 전경색: `#ededed`
- `<html lang="ko">`
- `<body>`에 globals.css 적용
- metadata: `title: '캐봄'`, `description: '이력서와 공고를 비교해 합격 전략을 알려드립니다'`
- Next.js 15의 `Metadata` 타입 사용

시그니처:
```typescript
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = { ... };

export default function RootLayout({ children }: { children: React.ReactNode }) { ... }
```

### 4. `src/app/page.tsx`

Server Component (기본값). 지금은 플레이스홀더만 구현한다. 이후 Phase에서 WizardShell로 교체되므로 최소한으로 작성하라.

요구사항:
- 화면 중앙에 "캐봄" 제목과 "이력서 분석 서비스" 부제 표시
- Tailwind 클래스로 스타일링
- 'use client' 없음

## 주의사항

- `src/app/` 경로로 생성하라. `app/` (src 없이)가 아니다. ARCHITECTURE.md의 디렉토리 구조를 따른다.
- 'use client'를 layout.tsx나 page.tsx에 붙이지 마라. 이 파일들은 Server Component다.
- `tailwind.config.js`를 생성하지 마라. Tailwind v4는 globals.css의 `@import 'tailwindcss'` 한 줄로 동작한다.
- npm install 중 peer dependency 경고는 무시해도 된다. 에러가 아닌 warning은 통과로 간주한다.

## Acceptance Criteria

```bash
npm run build
```

빌드가 에러 없이 통과해야 한다. warning은 허용된다.

생성된 파일 확인:
- `src/app/globals.css` 존재
- `src/app/layout.tsx` 존재, `lang="ko"` 포함
- `src/app/page.tsx` 존재
- `node_modules/` 존재 (npm install 완료)

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트를 확인한다:
   - ARCHITECTURE.md 디렉토리 구조를 따르는가?
   - ADR 기술 스택을 벗어나지 않았는가?
   - CLAUDE.md CRITICAL 규칙을 위반하지 않았는가?
3. 결과에 따라 `phases/0-bootstrap/index.json`의 step 1을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- `tailwind.config.js`를 생성하지 마라. Tailwind v4에서는 불필요하며 오히려 충돌을 유발한다.
- `src/app/layout.tsx`에 'use client'를 붙이지 마라. Root Layout은 Server Component여야 한다.
- 기존 테스트를 깨뜨리지 마라.
