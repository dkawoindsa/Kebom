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

export interface GapSuggestion {
  jobRequirement: string;
  recommendation: string;
}

export interface AnalysisResult {
  score: number;
  scoreReason: string;
  experienceSummary: string;
  skillMatches: SkillMatch[];
  interviewQuestions: DangerQuestion[];
  gapSuggestions: GapSuggestion[];
}
