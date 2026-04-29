'use client';

import type { SkillStatus } from '@/types/analysis';

interface SkillBadgeProps {
  skill: string;
  status: SkillStatus;
  onDelete?: () => void;
}

const statusStyles: Record<SkillStatus, string> = {
  match: 'border-green-500/30 bg-green-500/10 text-green-400',
  partial: 'border-amber-400/30 bg-amber-400/10 text-amber-400',
  missing: 'border-red-500/30 bg-red-500/10 text-red-400',
};

export default function SkillBadge({ skill, status, onDelete }: SkillBadgeProps) {
  const displaySkill = skill.length > 20 ? skill.slice(0, 20) : skill;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded border text-xs px-2 py-1 ${statusStyles[status]}`}
      aria-label={`${skill}: ${status}`}
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
          className="w-4 h-4 flex items-center justify-center text-neutral-500 hover:text-white"
        >
          ×
        </button>
      )}
    </span>
  );
}
