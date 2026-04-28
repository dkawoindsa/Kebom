import type { ResumeData, JobRequirements } from './resume';
import type { AnalysisResult } from './analysis';

export type WizardStep = 'upload' | 'read' | 'analyze' | 'action';
export type LoadingPhase = 'idle' | 'parsing' | 'analyzing';

export interface WizardError {
  step: WizardStep;
  message: string;
}

export interface AppState {
  step: WizardStep;
  loading: LoadingPhase;
  error: WizardError | null;
  resumeData: ResumeData | null;
  jobRequirements: JobRequirements | null;
  analysisResult: AnalysisResult | null;
}

export type WizardAction =
  | { type: 'PARSE_START' }
  | { type: 'PARSE_SUCCESS'; payload: { resumeData: ResumeData; jobRequirements: JobRequirements } }
  | { type: 'PARSE_ERROR'; payload: string }
  | { type: 'CONFIRM_READ'; payload: ResumeData }
  | { type: 'ANALYZE_START' }
  | { type: 'ANALYZE_SUCCESS'; payload: AnalysisResult }
  | { type: 'ANALYZE_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET' };
