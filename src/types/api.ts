import type { ResumeData, JobRequirements } from './resume';
import type { AnalysisResult, DangerQuestion, GapSuggestion } from './analysis';

export interface ParseResumeResponse {
  resumeData: Omit<ResumeData, 'rawText'>;
}

export interface ParseJdResponse {
  jobRequirements: Omit<JobRequirements, 'rawText'>;
}

export interface AnalyzeExtrasResponse {
  interviewQuestions: DangerQuestion[];
  gapSuggestions: GapSuggestion[];
}

export interface AnalyzeRequest {
  resumeData: Omit<ResumeData, 'rawText'>;
  jobRequirements: Omit<JobRequirements, 'rawText'>;
}

export interface AnalyzeResponse {
  result: AnalysisResult;
}

export interface ApiErrorResponse {
  error: string;
}
