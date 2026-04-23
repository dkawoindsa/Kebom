# UI 디자인 가이드

## 디자인 원칙
1. 도구처럼 보여야 한다. 마케팅 랜딩이 아니라 매일 쓰는 분석 대시보드.
2. 데이터가 주인공이다. 히트맵 색상만 채도를 가지고, 나머지는 무채색.
3. 상태를 명확히 표현한다. 로딩/에러/성공은 색상이 아닌 텍스트와 아이콘으로 먼저 전달.

## AI 슬롭 안티패턴 — 하지 마라
| 금지 사항 | 이유 |
|-----------|------|
| backdrop-filter: blur() | glass morphism은 AI 템플릿의 가장 흔한 징후 |
| gradient-text (배경 그라데이션 텍스트) | AI가 만든 SaaS 랜딩의 1번 특징 |
| "Powered by AI" 배지 | 기능이 아니라 장식. 사용자에게 가치 없음 |
| box-shadow 글로우 애니메이션 | 네온 글로우 = AI 슬롭 |
| 보라/인디고 브랜드 색상 | "AI = 보라색" 클리셰 |
| 모든 카드에 동일한 rounded-2xl | 균일한 둥근 모서리는 템플릿 느낌 |
| 배경 gradient orb (blur-3xl 원형) | 모든 AI 랜딩 페이지에 있는 장식 |

## 색상
### 배경
| 용도 | 값 |
|------|------|
| 페이지 | #0a0a0a |
| 카드 | #141414 |
| 카드 호버/활성 | #1a1a1a |
| 구분선 | #262626 (neutral-800) |

### 텍스트
| 용도 | 값 |
|------|------|
| 주 텍스트 | #ffffff (text-white) |
| 본문 | #d4d4d4 (text-neutral-300) |
| 보조 | #a3a3a3 (text-neutral-400) |
| 비활성/플레이스홀더 | #737373 (text-neutral-500) |

### 데이터/시맨틱 색상 (히트맵 전용)
| 용도 | 값 | Tailwind |
|------|------|------|
| Match (일치) | #22c55e | text-green-500, bg-green-500/10, border-green-500/30 |
| Partial (부분일치) | #f59e0b | text-amber-400, bg-amber-400/10, border-amber-400/30 |
| Missing (미보유) | #ef4444 | text-red-500, bg-red-500/10, border-red-500/30 |
| Danger Zone 배경 | rgba(239,68,68,0.05) | bg-red-500/5, border-red-500/20 |

## 컴포넌트
### 카드
```
Primary:  rounded-lg bg-[#141414] border border-neutral-800 p-6
Nested:   rounded bg-[#1a1a1a] border border-neutral-800/60 p-4
```

### 버튼
```
Primary:   rounded-lg bg-white text-black text-sm font-medium px-4 py-2 hover:bg-neutral-200 transition-colors
Secondary: rounded-lg border border-neutral-700 text-neutral-300 text-sm px-4 py-2 hover:border-neutral-500 hover:text-white transition-colors
Text:      text-neutral-500 text-sm hover:text-neutral-300 transition-colors
```

### 입력 필드
```
rounded-lg bg-[#0a0a0a] border border-neutral-800 px-4 py-3 text-sm text-neutral-300
focus:outline-none focus:border-neutral-600
```

### SkillBadge (히트맵 핵심 컴포넌트)
```
match:   rounded border border-green-500/30 bg-green-500/10 text-green-400 text-xs px-2 py-1
partial: rounded border border-amber-400/30 bg-amber-400/10 text-amber-400 text-xs px-2 py-1
missing: rounded border border-red-500/30 bg-red-500/10 text-red-400 text-xs px-2 py-1
```

히트맵 레이아웃: **라인 리스트** 방식 (격자 타일 방식 금지).
각 행 = `[스킬명 w-32 shrink-0 font-mono] [SkillBadge] [근거/갭 텍스트 text-xs text-neutral-500]`
정렬 순서: missing → partial → match (위험한 것 먼저)

## 레이아웃
- 전체 너비: max-w-3xl
- 정렬: 좌측 정렬 기본. 중앙 정렬은 빈 상태(empty state) 메시지에만 허용
- 간격: 컴포넌트 내부 gap-3, 섹션 간 space-y-6

## 타이포그래피
| 용도 | 스타일 |
|------|--------|
| 페이지 제목 | text-xl font-semibold text-white |
| 섹션 제목 | text-sm font-medium text-neutral-400 uppercase tracking-wider |
| 카드 제목 | text-sm font-medium text-white |
| 본문 | text-sm text-neutral-300 leading-relaxed |
| 메타/라벨 | text-xs text-neutral-500 |
| 코드/키워드 | font-mono text-xs bg-neutral-900 px-1.5 py-0.5 rounded text-neutral-300 |

## 애니메이션
- fade-in: opacity 0→1, duration-200 (페이지/카드 전환)
- 스켈레톤 로딩: animate-pulse bg-neutral-800 (AI 처리 대기 중)
- 그 외 모든 애니메이션 금지 (slide, bounce, scale, rotate 등)

## 아이콘
- SVG 인라인, strokeWidth 1.5, 크기 16px (w-4 h-4) 또는 20px (w-5 h-5)
- 아이콘 컨테이너(둥근 배경 박스)로 감싸지 않는다
- 텍스트와 함께 쓸 때: flex items-center gap-1.5

## 3단계 진행 표시기
- 상단에 텍스트 기반 스텝 표시: "1 Read → 2 Analyze → 3 Action"
- 활성: text-white font-medium
- 완료: text-neutral-500
- 대기: text-neutral-700
- 프로그레스 바나 원형 스텝 아이콘 금지. → 구분자는 문자 그대로 사용

## 에러 상태 스타일

```
에러 배너 (페이지 상단):
  rounded-lg bg-red-950/50 border border-red-800/60 px-4 py-3
  text-sm text-red-300 flex items-center gap-2

인라인 에러 (필드 하단):
  text-xs text-red-400 mt-1

재시도 버튼:
  Secondary 버튼 스타일 사용 (border variant)
  텍스트: "다시 시도" 또는 "분석 재시도"
```

에러 배너에 아이콘 사용 시: `⚠` 또는 SVG 경고 아이콘 (strokeWidth 1.5, w-4 h-4).
에러 상태에서도 레이아웃 시프트 없이 배너가 콘텐츠 위에 삽입되어야 한다.

## 스켈레톤 로딩 패턴

```
스켈레톤 베이스: bg-[#1f1f1f] animate-pulse rounded

크기별 용도:
  텍스트 한 줄:  h-4 w-3/4  (본문)
  텍스트 짧은줄: h-4 w-1/2  (메타)
  스킬 배지:     h-6 w-20   (SkillBadge 자리)
  카드 전체:     h-32 w-full (섹션 카드)
  점수 원:       h-16 w-16  (score circle)
```

스켈레톤은 실제 렌더될 레이아웃과 동일한 구조로 작성해야 한다.
`space-y-3`, `gap-3` 등 실제 간격을 유지해 로딩 후 레이아웃 시프트 최소화.

## 접근성

| 요소 | 적용 속성 |
|------|-----------|
| FileDropzone | `role="button"`, `tabIndex={0}`, `aria-label="이력서 PDF 업로드"` |
| 로딩 상태 | `aria-busy="true"` on container, `aria-live="polite"` on message |
| 에러 배너 | `role="alert"`, `aria-live="assertive"` |
| 점수 표시 | `aria-label="매칭 점수 {score}점 / 100점"` |
| SkillBadge | `aria-label="{skill}: {status}"` |
| 편집 가능 필드 | `aria-label` 명시, `aria-multiline` (textarea인 경우) |

키보드 탐색: 모든 인터랙티브 요소는 `Tab` 순서 내에 있어야 하고 `focus-visible` 링 표시.
