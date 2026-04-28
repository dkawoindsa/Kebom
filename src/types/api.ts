import type { ResumeData, JobRequirements } from './resume';
import type { AnalysisResult } from './analysis';

export interface ParseResumeResponse {
  resumeData: Omit<ResumeData, 'rawText'>;
  jobRequirements: Omit<JobRequirements, 'rawText'>;
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
