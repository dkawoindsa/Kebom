'use client';

import { useState, useRef, useEffect } from 'react';
import type { AnalysisResult, DangerQuestion, GapSuggestion } from '@/types/analysis';

interface StepActionProps {
  analysisResult: AnalysisResult;
}

function DangerCard({ item }: { item: DangerQuestion }) {
  const [questionExpanded, setQuestionExpanded] = useState(false);
  const [adviceExpanded, setAdviceExpanded] = useState(false);
  const [questionOverflows, setQuestionOverflows] = useState(false);
  const [adviceOverflows, setAdviceOverflows] = useState(false);
  const questionRef = useRef<HTMLParagraphElement>(null);
  const adviceRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (questionRef.current) setQuestionOverflows(questionRef.current.scrollHeight > questionRef.current.clientHeight);
    if (adviceRef.current) setAdviceOverflows(adviceRef.current.scrollHeight > adviceRef.current.clientHeight);
  }, []);

  return (
    <div className="rounded bg-[#1a1a1a] border border-neutral-800/60 p-4 space-y-3">
      <div>
        <p ref={questionRef} className={`text-sm font-medium text-white leading-relaxed ${questionExpanded ? '' : 'line-clamp-3'}`}>
          {item.question}
        </p>
        {questionOverflows && (
          <button
            type="button"
            onClick={() => setQuestionExpanded((prev) => !prev)}
            aria-expanded={questionExpanded}
            className="text-neutral-500 text-xs hover:text-neutral-300 transition-colors mt-1"
          >
            {questionExpanded ? '접기' : '더 보기'}
          </button>
        )}
      </div>
      <div>
        <p ref={adviceRef} className={`text-sm text-neutral-400 leading-relaxed ${adviceExpanded ? '' : 'line-clamp-3'}`}>
          {item.advice}
        </p>
        {adviceOverflows && (
          <button
            type="button"
            onClick={() => setAdviceExpanded((prev) => !prev)}
            aria-expanded={adviceExpanded}
            className="text-neutral-500 text-xs hover:text-neutral-300 transition-colors mt-1"
          >
            {adviceExpanded ? '접기' : '더 보기'}
          </button>
        )}
      </div>
    </div>
  );
}

function GapCard({ item }: { item: GapSuggestion }) {
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const recRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (recRef.current) setOverflows(recRef.current.scrollHeight > recRef.current.clientHeight);
  }, []);

  return (
    <div className="rounded bg-[#1a1a1a] border border-neutral-800/60 p-4 space-y-3">
      <div>
        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">보완이 필요한 항목</p>
        <p className="text-sm font-medium text-neutral-300 leading-relaxed">{item.jobRequirement}</p>
      </div>
      <div>
        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">보완 제안</p>
        <p ref={recRef} className={`text-sm text-neutral-400 leading-relaxed ${expanded ? '' : 'line-clamp-4'}`}>
          {item.recommendation}
        </p>
        {overflows && (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            aria-expanded={expanded}
            className="text-neutral-500 text-xs hover:text-neutral-300 transition-colors mt-1"
          >
            {expanded ? '접기' : '더 보기'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function StepAction({ analysisResult }: StepActionProps) {
  const questions = analysisResult.interviewQuestions.slice(0, 5);
  const gaps = analysisResult.gapSuggestions.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Danger Zone */}
      <div className="rounded-lg bg-red-500/5 border border-red-500/20 p-6 space-y-4">
        <p className="text-sm font-medium text-neutral-400 uppercase tracking-wider">위험 예상 질문</p>
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

      {/* Gap Suggestions */}
      <div className="rounded-lg bg-[#141414] border border-neutral-800 p-6 space-y-4">
        <p className="text-sm font-medium text-neutral-400 uppercase tracking-wider">이력서 보완 제안</p>
        {gaps.length === 0 ? (
          <p className="text-sm text-neutral-500">보완 제안이 없습니다. 이력서가 공고와 잘 맞습니다.</p>
        ) : (
          <div className="space-y-3">
            {gaps.map((item, i) => (
              <GapCard key={i} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
