import type { AppState, WizardAction } from '@/types/wizard';

export const initialState: AppState = {
  step: 'upload',
  loading: 'idle',
  error: null,
  resumeData: null,
  jobRequirements: null,
  analysisResult: null,
};

export function wizardReducer(state: AppState, action: WizardAction): AppState {
  switch (action.type) {
    case 'PARSE_START':
      if (state.loading !== 'idle') return state;
      return { ...state, loading: 'parsing', error: null };

    case 'PARSE_SUCCESS':
      if (state.loading !== 'parsing') return state;
      return {
        ...state,
        loading: 'idle',
        step: 'read',
        resumeData: action.payload.resumeData,
        jobRequirements: action.payload.jobRequirements,
      };

    case 'PARSE_ERROR':
      if (state.loading !== 'parsing') return state;
      return {
        ...state,
        loading: 'idle',
        error: { step: 'upload', message: action.payload },
      };

    case 'CONFIRM_READ':
      if (state.loading !== 'idle') return state;
      return { ...state, loading: 'analyzing', resumeData: action.payload };

    case 'ANALYZE_START':
      return state;

    case 'ANALYZE_SUCCESS':
      if (state.loading !== 'analyzing') return state;
      return {
        ...state,
        loading: 'idle',
        step: 'action',
        analysisResult: action.payload,
      };

    case 'ANALYZE_ERROR':
      if (state.loading !== 'analyzing') return state;
      return {
        ...state,
        loading: 'idle',
        error: { step: 'read', message: action.payload },
      };

    case 'CLEAR_ERROR':
      return { ...state, loading: 'idle', error: null };

    case 'RESET':
      return { ...initialState };

    default:
      return state;
  }
}
