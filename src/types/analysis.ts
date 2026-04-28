export type SkillStatus = 'match' | 'partial' | 'missing';

export interface SkillMatch {
  skill: string;
  status: SkillStatus;
  evidence?: string;
  suggestion?: string;
}

export interface DangerQuestion {
  question: string;
  advice: string;
}

export interface MagicFix {
  original: string;
  revised: string;
  reason: string;
}

export interface AnalysisResult {
  score: number;
  skillMatches: SkillMatch[];
  interviewQuestions: DangerQuestion[];
  magicFixes: MagicFix[];
}
