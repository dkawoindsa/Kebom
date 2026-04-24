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

## 점수 시각화 (ScoreDisplay)

점수는 숫자 + 원형 테두리 조합으로 표시한다. SVG 도넛 차트, 원형 프로그레스 바, 그라데이션 아크 금지.

### 시각 구조
```
border border-{color}/40 rounded-full w-16 h-16
  flex items-center justify-center
  text-2xl font-semibold text-{color}
```

### 점수 범위별 색상
| 범위 | 색상 토큰 | Tailwind |
|------|-----------|---------|
| 0–39 | red-500 | text-red-500 border-red-500/40 |
| 40–69 | amber-400 | text-amber-400 border-amber-400/40 |
| 70–100 | green-500 | text-green-500 border-green-500/40 |

### 점수 레이블
점수 원 오른쪽 또는 아래: `text-xs text-neutral-500 "/ 100점"`
섹션 레이블(위): 섹션 제목 스타일 `"MATCH SCORE"`

### 점수 0 처리
0점도 동일 컴포넌트 렌더. red-500 색상 적용. 별도 경고 문구 없음 — 히트맵이 이미 상황을 설명한다.

### 접근성
```html
<div aria-label="매칭 점수 {score}점 / 100점" role="img">
  {score}
</div>
```

## 레이아웃
- 전체 너비: max-w-3xl
- 정렬: 좌측 정렬 기본. 중앙 정렬은 빈 상태(empty state) 메시지에만 허용
- 간격: 컴포넌트 내부 gap-3, 섹션 간 space-y-6

## 반응형 / 뷰포트

최소 지원 뷰포트: 640px (sm breakpoint). 640px 미만에서는 레이아웃 보장 없음.

| 뷰포트 | 컨테이너 |
|--------|----------|
| 640px 이상 | `max-w-3xl mx-auto px-6` |
| 640px 미만 | `w-full px-4` |

### FileDropzone (모바일)
- 드래그앤드롭 이벤트 없음. 클릭 → OS 파일 선택 다이얼로그.
- 터치 기기 감지: `window.matchMedia('(pointer: coarse)')` → 안내 문구 교체
  - 기본: "이력서 PDF를 드래그하거나 클릭해서 선택하세요"
  - 터치 기기: "탭하여 이력서 PDF 선택"

### 히트맵 (좁은 화면)
640px 미만: 스킬명 `w-32 → w-24`, 근거/갭 텍스트 `hidden` (오버플로 규칙의 "더 보기"로 접근 가능).

### 카드 패딩
640px 미만: `p-6 → p-4`, `px-4 py-3 → px-3 py-2`

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
- max-height transition 금지 — "더 보기" 펼침/접힘도 transition 없이 즉시 전환

## 인터랙션 명세

### FileDropzone
```
기본:         border border-dashed border-neutral-700 rounded-lg bg-[#0f0f0f] p-8
드래그 오버:  border-neutral-500 bg-[#1a1a1a] (transition-colors만 허용)
파일 선택 후: border-solid border-neutral-700, 파일명 + 크기 표시
```

파일 선택 후 표시:
```
text-sm text-neutral-300  {파일명}
text-xs text-neutral-500 mt-0.5  {크기 MB}
```

### EditableField 키보드 동작
| 키 | 동작 |
|----|------|
| Enter (단일행 input) | 저장 후 편집 모드 종료 |
| Enter (textarea) | 줄바꿈 삽입 (저장 아님) |
| Escape | 변경 취소, 원래 값 복원, 편집 모드 종료 |
| Tab | 저장 후 다음 EditableField로 포커스 이동 |

- 편집 모드 진입: 클릭 또는 Enter/Space (키보드 접근성)
- 시각 전환: `border-neutral-800 → border-neutral-600`
- 저장 후 포커스: 편집 트리거 요소(텍스트 표시 영역)로 반환

### Skills 배열 편집 (StepRead)
- **추가**: 배열 끝 "+ 스킬 추가" Text 버튼 → 인라인 input 등장 → Enter로 확정, Escape로 취소
- **삭제**: 각 SkillBadge 오른쪽에 × 버튼 (`text-neutral-500 hover:text-white w-4 h-4`), 즉시 삭제, 확인 없음
- 빈 문자열로 Enter 시 추가하지 않고 입력 취소

### Experience / Education 배열 편집 (StepRead)
- **추가**: "경력 추가" / "학력 추가" Text 버튼 → 새 항목이 배열 끝에 빈 카드로 삽입
- **삭제**: 항목 카드 상단 오른쪽 "삭제" Text 버튼, 즉시 삭제, 확인 없음
- 배열 0개 허용 (빈 상태 명세 참조)

### "확인 후 분석" 버튼 (StepRead)
```
클릭 직후:  disabled=true, 텍스트 "분석 중..." (아이콘/스피너 없음)
비활성 스타일: opacity-50 cursor-not-allowed (기존 Primary 버튼에 추가)
~200ms 후: WizardShell loading='analyzing' → StepRead 언마운트 → 스켈레톤 마운트
```

### JD 텍스트 입력 (textarea)
```
min-h-[120px] max-h-[320px] resize-y overflow-y-auto
```
auto-resize 없음. 사용자가 수직 핸들로 직접 조절. 수평 resize 금지 (`resize-y`).

### Magic Fix 클립보드 복사
- 각 MagicFix의 "수정 후" 텍스트 오른쪽에 "복사" Text 버튼
- 복사 성공: "복사됨" 텍스트로 1.5초간 교체 후 "복사"로 복원 (setTimeout, 애니메이션 없음)
- `navigator.clipboard` 미지원 환경: 버튼 미노출 (`'clipboard' in navigator` 체크)

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

## 빈 상태 (Empty States)

빈 상태 텍스트는 레이아웃 중앙 정렬 허용. 아이콘 없음 (아이콘 컨테이너 박스 금지 규칙 적용).

### FileDropzone (파일 미선택)
```
중앙 배치:
  text-sm text-neutral-500  "이력서 PDF를 드래그하거나 클릭해서 선택하세요"
  text-xs text-neutral-600 mt-1  "최대 5MB · PDF 전용"
```

### SkillMatches 배열이 비어있을 때
```
text-sm text-neutral-500  "분석된 스킬 매칭 결과가 없습니다."
```
히트맵 영역 전체를 대체. 점수(ScoreDisplay)는 정상 표시.

### DangerQuestions 배열이 비어있을 때
```
text-sm text-neutral-500  "면접 위험 질문이 도출되지 않았습니다."
```
Danger Zone 카드 내부에 위치. 카드 자체는 그대로 렌더.

### MagicFixes 배열이 비어있을 때
```
text-sm text-neutral-500  "수정 제안이 없습니다. 이력서가 공고와 잘 맞습니다."
```
Magic Fix 카드 내부에 위치.

### 점수 0점
ScoreDisplay 정상 렌더 (red-500 색상). 별도 경고 없음 — 히트맵이 상황 설명.

### jobRequirements.requiredSkills 빈 배열 (파싱 결과)
StepRead 상단 인라인 경고:
```
rounded bg-amber-500/10 border border-amber-500/20 px-3 py-2
text-xs text-amber-400  "채용공고에서 요구 스킬을 찾을 수 없습니다. 공고 내용을 확인해주세요."
```
진행은 허용 (분석 버튼 활성).

### resumeData.skills 빈 배열 + experience 빈 배열 (파싱 결과)
StepRead 상단 인라인 경고:
```
text-xs text-amber-400  "이력서에서 경력 또는 스킬 정보를 찾을 수 없습니다. 직접 추가해주세요."
```
진행은 허용 (사용자가 직접 추가 가능).

## 콘텐츠 오버플로 규칙

### 스킬명 (SkillBadge 내)
최대 표시: 20자. 초과 시 `overflow-hidden text-ellipsis whitespace-nowrap`.
20자 초과는 AI 파싱 이상으로 간주 — 툴팁 없음, 사용자 편집으로 해결.

### 히트맵 근거/갭 텍스트 (evidence / suggestion)
기본: 2줄 제한 (`line-clamp-2`). 초과 시 "더 보기" Text 버튼.
"더 보기" 클릭 → `line-clamp-2` 제거, 버튼 텍스트 "접기"로 교체.
애니메이션 없음 (즉시 전환). 각 행 독립적으로 펼침/접힘.

### DangerQuestion 질문 / advice
최대 3줄 (`line-clamp-3`). 초과 시 "더 보기" Text 버튼. question과 advice 각각 독립.

### MagicFix original / revised
각각 최대 4줄 (`line-clamp-4`). 각각 독립적으로 펼침/접힘.

### "더 보기" / "접기" 버튼 공통 스타일
```
Text 버튼 스타일: text-neutral-500 text-xs hover:text-neutral-300 transition-colors mt-1
```

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

### StepRead 스켈레톤 (`loading === 'parsing'`)

```
[섹션 레이블]  h-3 w-24                          (SUMMARY)
[본문 3줄]     h-4 w-full                         space-y-2 mt-2
               h-4 w-5/6
               h-4 w-4/6
[섹션 레이블]  h-3 w-16 mt-6                      (SKILLS)
[배지 행]      flex gap-2 mt-2
               h-6 w-16 | h-6 w-20 | h-6 w-14 | h-6 w-18
[섹션 레이블]  h-3 w-20 mt-6                      (EXPERIENCE)
[카드]         h-32 w-full rounded-lg mt-2
[카드]         h-32 w-full rounded-lg mt-3
[섹션 레이블]  h-3 w-20 mt-6                      (EDUCATION)
[카드]         h-24 w-full rounded-lg mt-2
```

### StepAnalyze + StepAction 스켈레톤 (`loading === 'analyzing'`)

```
[점수 원]       h-16 w-16 rounded-full
[스킬 행 × 5]  각 행: flex gap-3 items-center mt-3
               h-4 w-32  |  h-6 w-16  |  h-4 w-48
[섹션 레이블]  h-3 w-24 mt-8                      (DANGER ZONE)
[질문 카드 × 3] h-20 w-full rounded-lg mt-3
[섹션 레이블]  h-3 w-24 mt-8                      (MAGIC FIX)
[수정 카드 × 3] h-28 w-full rounded-lg mt-3
```

### 로딩 타임아웃 UX (30초 초과)

- 클라이언트: `AbortController` 30초 타임아웃 설정
- **15초 경과 시**: 로딩 메시지 아래 보조 텍스트 추가 (정적, animate-pulse 없음)
  ```
  text-xs text-neutral-500 mt-1  "(시간이 더 걸릴 수 있어요)"
  ```
- **30초 초과 시**: `AbortController.abort()` → `ANALYZE_ERROR` dispatch
  - 에러 메시지: "분석이 너무 오래 걸리고 있어요. 잠시 후 다시 시도해주세요."
  - 파싱 타임아웃(10초 초과): "이력서 읽기가 너무 오래 걸리고 있어요. 잠시 후 다시 시도해주세요."

## 접근성

| 요소 | 적용 속성 |
|------|-----------|
| FileDropzone | `role="button"`, `tabIndex={0}`, `aria-label="이력서 PDF 업로드"` |
| 로딩 상태 | `aria-busy="true"` on container, `aria-live="polite"` on message |
| 에러 배너 | `role="alert"`, `aria-live="assertive"` |
| 점수 표시 | `aria-label="매칭 점수 {score}점 / 100점"`, `role="img"` |
| SkillBadge | `aria-label="{skill}: {status}"` |
| 편집 가능 필드 | `aria-label` 명시, `aria-multiline` (textarea인 경우) |
| × 삭제 버튼 | `aria-label="스킬 {이름} 삭제"` |
| "더 보기" 버튼 | `aria-expanded="false"`, 펼침 후 `aria-expanded="true"` |

키보드 탐색: 모든 인터랙티브 요소는 `Tab` 순서 내에 있어야 하고 `focus-visible` 링 표시.

### 포커스 관리

| 전환 이벤트 | 포커스 이동 대상 |
|-------------|----------------|
| upload → read (파싱 완료) | StepRead 첫 번째 EditableField |
| read → analyzing (스켈레톤) | 로딩 메시지 요소 (`aria-live="polite"` 자동 공지) |
| analyzing → action (분석 완료) | ScoreDisplay 요소 |
| 에러 배너 등장 | `role="alert"` 요소 (`useEffect` + `element.focus()`) |
| 에러 배너 닫힘 | 재시도 버튼이 있던 자리의 다음 인터랙티브 요소 |

구현: WizardShell에서 step 전환 시 `useEffect(() => { ref.current?.focus() }, [step])`.
포커스 이동은 항상 step 변경 직후 (스켈레톤 마운트 후) 수행.

#### FileDropzone 내부 Tab 순서
1. PDF 업로드 input (또는 드롭존 전체 영역)
2. JD 텍스트 textarea
3. JD 이미지 업로드 input (선택 항목)
4. "분석 시작" 제출 버튼
