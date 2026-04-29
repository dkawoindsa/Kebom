'use client';

import { useState } from 'react';
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
  const text = match.status === 'match' ? match.evidence : (match.suggestion ?? match.evidence);
  const hasText = !!text;

  return (
    <div className="flex items-start gap-3 py-2 border-b border-neutral-800/60 last:border-0">
      <span className="w-32 shrink-0 font-mono text-sm text-neutral-300 truncate">{match.skill}</span>
      <SkillBadge skill={match.skill} status={match.status} />
      {hasText && (
        <div className="flex-1 min-w-0">
          <p className={`text-xs text-neutral-500 leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
            {text}
          </p>
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            aria-expanded={expanded}
            className="text-neutral-500 text-xs hover:text-neutral-300 transition-colors mt-1"
          >
            {expanded ? '접기' : '더 보기'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function StepAnalyze({ analysisResult }: StepAnalyzeProps) {
  const { score, skillMatches } = analysisResult;
  const scoreColor = getScoreColor(score);
  const sorted = sortSkillMatches(skillMatches);

  return (
    <div className="space-y-6">
      {/* Score */}
      <div className="rounded-lg bg-[#141414] border border-neutral-800 p-6 space-y-4">
        <p className="text-sm font-medium text-neutral-400 uppercase tracking-wider">MATCH SCORE</p>
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
      </div>

      {/* Heatmap */}
      <div className="rounded-lg bg-[#141414] border border-neutral-800 p-6 space-y-3">
        <p className="text-sm font-medium text-neutral-400 uppercase tracking-wider">SKILL MATCH</p>
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
