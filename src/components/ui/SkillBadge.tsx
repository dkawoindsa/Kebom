'use client';

import type { SkillStatus } from '@/types/analysis';

interface SkillBadgeProps {
  skill: string;
  status: SkillStatus;
  onDelete?: () => void;
}

const statusStyles: Record<SkillStatus, string> = {
  match: 'border-green-500/40 bg-green-500/15 text-green-400',
  partial: 'border-amber-400/40 bg-amber-400/15 text-amber-400',
  missing: 'border-red-500/40 bg-red-500/15 text-red-400',
};

const statusLabel: Record<SkillStatus, string> = {
  match: '매칭됨',
  partial: '일부 일치',
  missing: '부족',
};

export default function SkillBadge({ skill, status, onDelete }: SkillBadgeProps) {
  const displaySkill = skill.length > 20 ? skill.slice(0, 20) : skill;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded border text-xs px-2 py-1 ${statusStyles[status]}`}
      aria-label={`${skill}: ${statusLabel[status]}`}
    >
      <span
        className={skill.length > 20 ? 'overflow-hidden text-ellipsis whitespace-nowrap max-w-[160px]' : undefined}
      >
        {displaySkill}
      </span>
      {onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label={`스킬 ${skill} 삭제`}
          className="w-4 h-4 flex items-center justify-center text-neutral-500 hover:text-white focus:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 rounded"
        >
          ×
        </button>
      )}
    </span>
  );
}
