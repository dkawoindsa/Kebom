# Step 2: file-dropzone

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/docs/UI_GUIDE.md` — FileDropzone 인터랙션 명세, 모바일 처리, 접근성, 빈 상태 텍스트
- `/docs/PRD.md` — 파일 형식 제약 (PDF 5MB, 이미지 PNG/JPEG 5MB)

## 작업

`src/components/ui/FileDropzone.tsx` 파일을 생성하라.

### FileDropzone 구현 요건

```typescript
'use client'

interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  accept: string;           // e.g. 'application/pdf' or 'image/png,image/jpeg'
  maxSizeMB: number;
  label?: string;           // 커스텀 안내 문구
  selectedFile?: File | null;
}

export default function FileDropzone({ onFileSelect, accept, maxSizeMB, label, selectedFile }: FileDropzoneProps)
```

**상태:**
- `isDragging: boolean` — 드래그 오버 중 여부
- `error: string | null` — 파일 유효성 검사 에러

**드래그 앤 드롭 이벤트:**
- `onDragOver`, `onDragEnter`: `isDragging = true`, `e.preventDefault()`
- `onDragLeave`, `onDrop`: `isDragging = false`
- `onDrop`: `e.dataTransfer.files[0]`를 검증 후 `onFileSelect` 호출.

**파일 검증:**
1. 파일 MIME 타입이 `accept`에 포함되는지 확인. 아니면 에러 표시.
2. 파일 크기 ≤ `maxSizeMB * 1024 * 1024`. 초과 시 에러 표시.
3. 여러 파일 드롭 시 첫 번째 파일만 처리.

**클릭 → 파일 선택:**
- 숨겨진 `<input type="file" accept={accept}>` + `useRef`
- 드롭존 클릭 시 `inputRef.current?.click()`

**터치 기기 감지:**
- `typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches`
- 터치: "탭하여 이력서 PDF 선택" (또는 `label` prop 사용)
- 기본: "이력서 PDF를 드래그하거나 클릭해서 선택하세요" (또는 `label` prop 사용)

**파일 선택 후 표시:**
```
text-sm text-neutral-300  {파일명}
text-xs text-neutral-500 mt-0.5  {크기 MB 소수점 1자리}
```

**스타일:**
```
기본:         border border-dashed border-neutral-700 rounded-lg bg-[#0f0f0f] p-8
드래그 오버:  border-neutral-500 bg-[#1a1a1a] transition-colors
파일 선택 후: border-solid border-neutral-700
```

**빈 상태 텍스트 (파일 미선택):**
```
text-sm text-neutral-500  (안내 문구)
text-xs text-neutral-600 mt-1  "최대 {maxSizeMB}MB · {형식}"
```

**접근성:**
- `role="button"`, `tabIndex={0}`, `aria-label="이력서 PDF 업로드"`

## Acceptance Criteria

```bash
npm run build
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. `src/components/ui/FileDropzone.tsx`가 생성됐는지 확인한다.
3. 결과에 따라 `phases/6-ui-components/index.json`의 step 2를 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "src/components/ui/FileDropzone.tsx 생성 — 드래그앤드롭, 파일 검증, 터치 감지, 접근성"`
   - 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`

## 주의사항

- backdrop-blur, 그라데이션 배경 금지.
- 파일을 디스크에 저장하지 않는다. 메모리의 File 객체만 부모에게 전달.
- 기존 파일을 수정하지 마라.
