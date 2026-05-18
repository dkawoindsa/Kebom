'use client';

import { useState } from 'react';
import FileDropzone from '@/components/ui/FileDropzone';
import type { LoadingPhase, WizardError } from '@/types/wizard';

interface StepUploadProps {
  onSubmit: (formData: FormData) => Promise<void>;
  loading: LoadingPhase;
  error: WizardError | null;
}

export default function StepUpload({ onSubmit, loading, error }: StepUploadProps) {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDescText, setJobDescText] = useState('');
  const [jobImageFile, setJobImageFile] = useState<File | null>(null);
  const [jdMode, setJdMode] = useState<'text' | 'image'>('text');

  const isParsing = loading === 'parsing';
  const canSubmit = !!resumeFile && (jobDescText.trim().length > 0 || !!jobImageFile);

  function switchJdMode(mode: 'text' | 'image') {
    setJdMode(mode);
    if (mode === 'text') setJobImageFile(null);
    else setJobDescText('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resumeFile) return;
    if (!jobDescText.trim() && !jobImageFile) return;

    const formData = new FormData();
    formData.append('resume', resumeFile);
    if (jobDescText.trim()) {
      formData.append('jobDescription', jobDescText.trim());
    } else if (jobImageFile) {
      formData.append('jobImage', jobImageFile);
    }
    await onSubmit(formData);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-lg bg-red-950/50 border border-red-800/60 px-4 py-3 text-sm text-red-300 flex items-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          {error.message}
        </div>
      )}

      <div className="rounded-lg bg-[#141414] border border-neutral-800 p-6 space-y-3">
        <p className="text-sm font-medium text-neutral-400 uppercase tracking-wider">이력서</p>
        <FileDropzone
          onFileSelect={setResumeFile}
          accept="application/pdf"
          maxSizeMB={5}
          selectedFile={resumeFile}
        />
      </div>

      <div className="rounded-lg bg-[#141414] border border-neutral-800 p-6 space-y-4">
        <p className="text-sm font-medium text-neutral-400 uppercase tracking-wider">채용공고</p>

        <div className="flex border-b border-neutral-800">
          <button
            type="button"
            onClick={() => switchJdMode('text')}
            className={`px-4 py-2 text-xs font-medium transition-colors cursor-pointer ${
              jdMode === 'text'
                ? 'text-white border-b-2 border-white -mb-px'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            텍스트 입력
          </button>
          <button
            type="button"
            onClick={() => switchJdMode('image')}
            className={`px-4 py-2 text-xs font-medium transition-colors cursor-pointer ${
              jdMode === 'image'
                ? 'text-white border-b-2 border-white -mb-px'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            이미지 업로드
          </button>
        </div>

        {jdMode === 'text' && (
          <div className="animate-fade-in">
            <textarea
              id="jd-text"
              value={jobDescText}
              onChange={(e) => setJobDescText(e.target.value)}
              placeholder="채용공고 내용을 붙여넣으세요"
              className="w-full rounded-lg bg-[#0a0a0a] border border-neutral-800 px-4 py-3 text-sm text-neutral-300 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 min-h-[120px] max-h-[320px] resize-y overflow-y-auto"
            />
          </div>
        )}

        {jdMode === 'image' && (
          <div className="animate-fade-in">
            <FileDropzone
              onFileSelect={setJobImageFile}
              accept="image/png,image/jpeg"
              maxSizeMB={5}
              label={
                typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
                  ? '탭하여 채용공고 이미지 선택'
                  : '채용공고 이미지를 드래그하거나 클릭해서 선택하세요'
              }
              selectedFile={jobImageFile}
            />
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isParsing || !canSubmit}
        className="w-full rounded-lg bg-white text-black text-sm font-medium px-4 py-2 hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isParsing ? '분석 중...' : '분석 시작'}
      </button>
    </form>
  );
}
