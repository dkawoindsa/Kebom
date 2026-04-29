'use client';

import { useState } from 'react';
import type { AnalysisResult, DangerQuestion, MagicFix } from '@/types/analysis';

interface StepActionProps {
  analysisResult: AnalysisResult;
}

function DangerCard({ item }: { item: DangerQuestion }) {
  const [questionExpanded, setQuestionExpanded] = useState(false);
  const [adviceExpanded, setAdviceExpanded] = useState(false);

  return (
    <div className="rounded bg-[#1a1a1a] border border-neutral-800/60 p-4 space-y-3">
      <div>
        <p className={`text-sm font-medium text-white leading-relaxed ${questionExpanded ? '' : 'line-clamp-3'}`}>
          {item.question}
        </p>
        <button
          type="button"
          onClick={() => setQuestionExpanded((prev) => !prev)}
          aria-expanded={questionExpanded}
          className="text-neutral-500 text-xs hover:text-neutral-300 transition-colors mt-1"
        >
          {questionExpanded ? '접기' : '더 보기'}
        </button>
      </div>
      <div>
        <p className={`text-sm text-neutral-400 leading-relaxed ${adviceExpanded ? '' : 'line-clamp-3'}`}>
          {item.advice}
        </p>
        <button
          type="button"
          onClick={() => setAdviceExpanded((prev) => !prev)}
          aria-expanded={adviceExpanded}
          className="text-neutral-500 text-xs hover:text-neutral-300 transition-colors mt-1"
        >
          {adviceExpanded ? '접기' : '더 보기'}
        </button>
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  if (!('clipboard' in navigator)) return null;

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="text-neutral-500 text-xs hover:text-neutral-300 transition-colors shrink-0 self-start mt-0.5"
    >
      {copied ? '복사됨' : '복사'}
    </button>
  );
}

function MagicFixCard({ item }: { item: MagicFix }) {
  const [originalExpanded, setOriginalExpanded] = useState(false);
  const [revisedExpanded, setRevisedExpanded] = useState(false);

  return (
    <div className="rounded bg-[#1a1a1a] border border-neutral-800/60 p-4 space-y-3">
      <div>
        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">수정 전</p>
        <p className={`text-sm text-neutral-500 leading-relaxed ${originalExpanded ? '' : 'line-clamp-4'}`}>
          {item.original}
        </p>
        <button
          type="button"
          onClick={() => setOriginalExpanded((prev) => !prev)}
          aria-expanded={originalExpanded}
          className="text-neutral-500 text-xs hover:text-neutral-300 transition-colors mt-1"
        >
          {originalExpanded ? '접기' : '더 보기'}
        </button>
      </div>
      <div>
        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">수정 후</p>
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className={`text-sm text-neutral-300 leading-relaxed ${revisedExpanded ? '' : 'line-clamp-4'}`}>
              {item.revised}
            </p>
            <button
              type="button"
              onClick={() => setRevisedExpanded((prev) => !prev)}
              aria-expanded={revisedExpanded}
              className="text-neutral-500 text-xs hover:text-neutral-300 transition-colors mt-1"
            >
              {revisedExpanded ? '접기' : '더 보기'}
            </button>
          </div>
          <CopyButton text={item.revised} />
        </div>
      </div>
      <p className="text-xs text-neutral-500">{item.reason}</p>
    </div>
  );
}

export default function StepAction({ analysisResult }: StepActionProps) {
  const questions = analysisResult.interviewQuestions.slice(0, 5);
  const fixes = analysisResult.magicFixes.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Danger Zone */}
      <div className="rounded-lg bg-red-500/5 border border-red-500/20 p-6 space-y-4">
        <p className="text-sm font-medium text-neutral-400 uppercase tracking-wider">DANGER ZONE</p>
        {questions.length === 0 ? (
          <p className="text-sm text-neutral-500">면접 위험 질문이 도출되지 않았습니다.</p>
        ) : (
          <div className="space-y-3">
            {questions.map((item, i) => (
              <DangerCard key={i} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* Magic Fix */}
      <div className="rounded-lg bg-[#141414] border border-neutral-800 p-6 space-y-4">
        <p className="text-sm font-medium text-neutral-400 uppercase tracking-wider">MAGIC FIX</p>
        {fixes.length === 0 ? (
          <p className="text-sm text-neutral-500">수정 제안이 없습니다. 이력서가 공고와 잘 맞습니다.</p>
        ) : (
          <div className="space-y-3">
            {fixes.map((item, i) => (
              <MagicFixCard key={i} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
