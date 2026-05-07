'use client';

import { useState, useRef, useEffect } from 'react';
import SkillBadge from '@/components/ui/SkillBadge';
import type { AnalysisResult, SkillMatch } from '@/types/analysis';

interface StepAnalyzeProps {
  analysisResult: AnalysisResult;
}

function getScoreColor(score: number): { text: string; border: string } {
  if (score <= 39) return { text: 'text-red-500', border: 'border-red-500/40' };
  if (score <= 69) return { text: 'text-amber-400', border: 'border-amber-400/40' };
  return { text: 'text-green-500', border: 'border-green-500/40' };
}

const STATUS_ORDER = { missing: 0, partial: 1, match: 2 } as const;

function sortSkillMatches(matches: SkillMatch[]): SkillMatch[] {
  return [...matches].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
}

function SkillRow({ match }: { match: SkillMatch }) {
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);
  const rawText = match.status === 'match' ? match.evidence : (match.suggestion ?? match.evidence);
  const fallback =
    match.status === 'missing'
      ? '해당 스킬이나 경험이 이력서에서 확인되지 않습니다.'
      : match.status === 'partial'
      ? '이력서에서 일부 경험은 있으나 심화 경험이 더 필요합니다.'
      : undefined;
  const text = rawText ?? fallback;
  const hasText = !!text;

  useEffect(() => {
    const el = textRef.current;
    if (el) setOverflows(el.scrollHeight > el.clientHeight);
  }, []);

  return (
    <div className="flex items-start gap-3 py-2 border-b border-neutral-800/60 last:border-0">
      <SkillBadge skill={match.skill} status={match.status} />
      {hasText && (
        <div className="flex-1 min-w-0">
          <p ref={textRef} className={`text-xs text-neutral-500 leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
            {text}
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
      )}
    </div>
  );
}

export default function StepAnalyze({ analysisResult }: StepAnalyzeProps) {
  const { score, scoreReason, skillMatches } = analysisResult;
  const scoreColor = getScoreColor(score);
  const sorted = sortSkillMatches(skillMatches);
  const matchCount = skillMatches.filter((m) => m.status === 'match').length;
  const partialCount = skillMatches.filter((m) => m.status === 'partial').length;
  const missingCount = skillMatches.filter((m) => m.status === 'missing').length;

  return (
    <div className="space-y-6">
      {/* Score */}
      <div className="rounded-lg bg-[#141414] border border-neutral-800 p-6 space-y-4">
        <p className="text-sm font-medium text-neutral-400 uppercase tracking-wider">매칭 점수</p>
        <div className="flex items-center gap-3">
          <div
            aria-label={`매칭 점수 ${score}점 / 100점`}
            role="img"
            className={`border ${scoreColor.border} ${scoreColor.text} rounded-full w-16 h-16 flex items-center justify-center text-2xl font-semibold shrink-0`}
          >
            {score}
          </div>
          <span className="text-xs text-neutral-500">/ 100점</span>
        </div>
        {scoreReason && (
          <p className="text-sm text-neutral-400 leading-relaxed">{scoreReason}</p>
        )}
      </div>

      {/* Heatmap */}
      <div className="rounded-lg bg-[#141414] border border-neutral-800 p-6 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-neutral-400 uppercase tracking-wider">스킬 매칭</p>
          {sorted.length > 0 && (
            <div className="flex gap-3 text-xs">
              <span className="text-green-400">{matchCount} 매칭</span>
              <span className="text-amber-400">{partialCount} 일부 일치</span>
              <span className="text-red-400">{missingCount} 부족</span>
            </div>
          )}
        </div>
        {sorted.length === 0 ? (
          <p className="text-sm text-neutral-500">분석된 스킬 매칭 결과가 없습니다.</p>
        ) : (
          <div>
            {sorted.map((match, i) => (
              <SkillRow key={i} match={match} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
