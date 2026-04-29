'use client';

import { useReducer, useEffect, useState } from 'react';
import { wizardReducer, initialState } from '@/lib/wizardReducer';
import { PARSE_TIMEOUT_MS, ANALYZE_TIMEOUT_MS, SLOW_LOADING_HINT_MS } from '@/lib/constants';
import type { ResumeData, JobRequirements } from '@/types/resume';
import type { AnalysisResult } from '@/types/analysis';
import type { ParseResumeResponse, AnalyzeRequest, AnalyzeResponse, ApiErrorResponse } from '@/types/api';
import StepUpload from './StepUpload';
import StepRead from './StepRead';
import StepAnalyze from './StepAnalyze';
import StepAction from './StepAction';
import ProgressBar from '@/components/ui/ProgressBar';

async function fetchAnalyze(
  resumeData: Omit<ResumeData, 'rawText'>,
  jobRequirements: Omit<JobRequirements, 'rawText'>,
  signal: AbortSignal
): Promise<AnalysisResult> {
  const body: AnalyzeRequest = { resumeData, jobRequirements };
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const err: ApiErrorResponse = await res.json();
    throw new Error(err.error ?? '분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
  }

  const data: AnalyzeResponse = await res.json();
  return data.result;
}

function ParsingSkeletonUI() {
  return (
    <div className="animate-pulse space-y-6">
      <p className="text-sm text-neutral-400">이력서와 공고를 읽고 있어요...</p>
      <div className="space-y-2">
        <div className="h-3 w-24 rounded bg-[#1f1f1f]" />
        <div className="mt-2 space-y-2">
          <div className="h-4 w-full rounded bg-[#1f1f1f]" />
          <div className="h-4 w-5/6 rounded bg-[#1f1f1f]" />
          <div className="h-4 w-4/6 rounded bg-[#1f1f1f]" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-16 rounded bg-[#1f1f1f]" />
        <div className="mt-2 flex gap-2">
          <div className="h-6 w-16 rounded bg-[#1f1f1f]" />
          <div className="h-6 w-20 rounded bg-[#1f1f1f]" />
          <div className="h-6 w-14 rounded bg-[#1f1f1f]" />
          <div className="h-6 w-18 rounded bg-[#1f1f1f]" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-20 rounded bg-[#1f1f1f]" />
        <div className="mt-2 h-32 w-full rounded-lg bg-[#1f1f1f]" />
        <div className="mt-3 h-32 w-full rounded-lg bg-[#1f1f1f]" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-20 rounded bg-[#1f1f1f]" />
        <div className="mt-2 h-24 w-full rounded-lg bg-[#1f1f1f]" />
      </div>
    </div>
  );
}

function AnalyzingSkeletonUI({ showSlowHint }: { showSlowHint: boolean }) {
  return (
    <div className="animate-pulse space-y-4">
      <div>
        <p className="text-sm text-neutral-400">강점과 약점을 분석하고 있어요...</p>
        {showSlowHint && (
          <p className="mt-1 text-xs text-neutral-500">(시간이 더 걸릴 수 있어요)</p>
        )}
      </div>
      <div className="h-16 w-16 rounded-full bg-[#1f1f1f]" />
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-4 w-32 rounded bg-[#1f1f1f]" />
            <div className="h-6 w-16 rounded bg-[#1f1f1f]" />
            <div className="h-4 w-48 rounded bg-[#1f1f1f]" />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <div className="h-3 w-24 rounded bg-[#1f1f1f]" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="mt-3 h-20 w-full rounded-lg bg-[#1f1f1f]" />
        ))}
      </div>
      <div className="space-y-2">
        <div className="h-3 w-24 rounded bg-[#1f1f1f]" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="mt-3 h-28 w-full rounded-lg bg-[#1f1f1f]" />
        ))}
      </div>
    </div>
  );
}

export default function WizardShell() {
  const [state, dispatch] = useReducer(wizardReducer, initialState);
  const [showSlowHint, setShowSlowHint] = useState(false);

  useEffect(() => {
    if (state.loading !== 'analyzing') {
      setShowSlowHint(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ANALYZE_TIMEOUT_MS);
    const slowHintId = setTimeout(() => setShowSlowHint(true), SLOW_LOADING_HINT_MS);

    const resumeData = state.resumeData;
    const jobRequirements = state.jobRequirements;

    if (!resumeData || !jobRequirements) {
      clearTimeout(timeoutId);
      clearTimeout(slowHintId);
      dispatch({ type: 'ANALYZE_ERROR', payload: '이력서 데이터가 없습니다.' });
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { rawText: _rr, ...resumeWithoutRaw } = resumeData;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { rawText: _jr, ...jobReqWithoutRaw } = jobRequirements;

    fetchAnalyze(resumeWithoutRaw, jobReqWithoutRaw, controller.signal)
      .then((result) => dispatch({ type: 'ANALYZE_SUCCESS', payload: result }))
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === 'AbortError') {
          dispatch({ type: 'ANALYZE_ERROR', payload: '분석이 너무 오래 걸리고 있어요. 잠시 후 다시 시도해주세요.' });
        } else {
          dispatch({ type: 'ANALYZE_ERROR', payload: '네트워크 연결을 확인해주세요.' });
        }
      });

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(slowHintId);
      controller.abort();
    };
  }, [state.loading]);

  async function handleParseSubmit(formData: FormData): Promise<void> {
    dispatch({ type: 'PARSE_START' });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PARSE_TIMEOUT_MS);

    try {
      const res = await fetch('/api/parse-resume', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const err: ApiErrorResponse = await res.json();
        dispatch({ type: 'PARSE_ERROR', payload: err.error ?? '분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' });
        return;
      }

      const data: ParseResumeResponse = await res.json();
      dispatch({
        type: 'PARSE_SUCCESS',
        payload: {
          resumeData: { ...data.resumeData, rawText: '' },
          jobRequirements: { ...data.jobRequirements, rawText: '' },
        },
      });
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        dispatch({ type: 'PARSE_ERROR', payload: '이력서 읽기가 너무 오래 걸리고 있어요. 잠시 후 다시 시도해주세요.' });
      } else {
        dispatch({ type: 'PARSE_ERROR', payload: '네트워크 연결을 확인해주세요.' });
      }
    }
  }

  function handleConfirmRead(updatedResumeData: ResumeData): void {
    dispatch({ type: 'CONFIRM_READ', payload: updatedResumeData });
  }

  function handleReset(): void {
    dispatch({ type: 'RESET' });
  }

  let content: React.ReactNode;

  if (state.loading === 'parsing') {
    content = <ParsingSkeletonUI />;
  } else if (state.loading === 'analyzing') {
    content = <AnalyzingSkeletonUI showSlowHint={showSlowHint} />;
  } else if (state.step === 'upload') {
    content = <StepUpload onSubmit={handleParseSubmit} loading={state.loading} error={state.error} />;
  } else if (state.step === 'read') {
    content = (
      <StepRead
        resumeData={state.resumeData!}
        jobRequirements={state.jobRequirements!}
        onConfirm={handleConfirmRead}
        loading={state.loading}
        error={state.error}
      />
    );
  } else {
    content = (
      <div className="space-y-6">
        <StepAnalyze analysisResult={state.analysisResult!} />
        <StepAction analysisResult={state.analysisResult!} />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-3xl mx-auto px-6 py-12 sm:py-16">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white">캐봄</h1>
          {state.step !== 'upload' && (
            <button
              onClick={handleReset}
              className="rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-300 transition-colors hover:border-neutral-500 hover:text-white"
            >
              새 분석 시작
            </button>
          )}
        </div>
        <div className="mb-8">
          <ProgressBar step={state.step} loading={state.loading} />
        </div>
        {content}
      </div>
    </main>
  );
}
