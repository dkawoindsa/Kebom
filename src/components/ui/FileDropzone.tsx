'use client';

import { useRef, useState } from 'react';

interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  accept: string;
  maxSizeMB: number;
  label?: string;
  selectedFile?: File | null;
}

function isTouch(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
}

function formatMB(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1);
}

function acceptLabel(accept: string): string {
  if (accept === 'application/pdf') return 'PDF';
  if (accept.includes('image')) return 'PNG/JPG';
  return accept;
}

export default function FileDropzone({
  onFileSelect,
  accept,
  maxSizeMB,
  label,
  selectedFile,
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function validate(file: File): string | null {
    const types = accept.split(',').map((t) => t.trim());
    if (!types.includes(file.type)) {
      if (accept === 'application/pdf') return '이력서는 PDF 파일만 지원합니다.';
      return 'PNG 또는 JPG 이미지만 업로드 가능합니다.';
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `파일 크기는 ${maxSizeMB}MB 이하여야 합니다.`;
    }
    return null;
  }

  function handleFile(file: File) {
    const err = validate(file);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    onFileSelect(file);
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function onDragEnter(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function onDragLeave() {
    setIsDragging(false);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    handleFile(file);
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    handleFile(file);
    e.target.value = '';
  }

  function onClick() {
    inputRef.current?.click();
  }

  const defaultLabel = isTouch()
    ? '탭하여 이력서 PDF 선택'
    : '이력서 PDF를 드래그하거나 클릭해서 선택하세요';

  const guideLabel = label ?? defaultLabel;

  const borderClass = isDragging
    ? 'border-neutral-500 bg-[#1a1a1a]'
    : selectedFile
    ? 'border-solid border-neutral-700'
    : 'border-dashed border-neutral-700';

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label="이력서 PDF 업로드"
        className={`border rounded-lg bg-[#0f0f0f] p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${borderClass}`}
        onDragOver={onDragOver}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={onInputChange}
        />

        {selectedFile ? (
          <>
            <p className="text-sm text-neutral-300">{selectedFile.name}</p>
            <p className="text-xs text-neutral-500 mt-0.5">{formatMB(selectedFile.size)} MB</p>
          </>
        ) : (
          <>
            <p className="text-sm text-neutral-500">{guideLabel}</p>
            <p className="text-xs text-neutral-600 mt-1">
              최대 {maxSizeMB}MB · {acceptLabel(accept)}
            </p>
          </>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-400 mt-1">{error}</p>
      )}
    </div>
  );
}
