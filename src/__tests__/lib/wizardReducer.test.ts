import { wizardReducer, initialState } from '@/lib/wizardReducer';
import type { AppState } from '@/types/wizard';
import type { ResumeData, JobRequirements } from '@/types/resume';
import type { AnalysisResult } from '@/types/analysis';

const mockResumeData: ResumeData = {
  name: '홍길동',
  contactEmail: 'hong@example.com',
  summary: '5년 경력 백엔드 개발자',
  skills: ['TypeScript', 'Node.js'],
  experience: [],
  education: [],
  rawText: '원본 텍스트',
};

const mockJobRequirements: JobRequirements = {
  title: '백엔드 개발자',
  requiredSkills: ['TypeScript', 'Node.js'],
  preferredSkills: ['Docker'],
  responsibilities: ['API 개발'],
  rawText: 'JD 원본 텍스트',
};

const mockAnalysisResult: AnalysisResult = {
  score: 80,
  skillMatches: [{ skill: 'TypeScript', status: 'match' }],
  interviewQuestions: [{ question: '왜 지원했나요?', advice: '솔직하게 답하세요.' }],
  magicFixes: [],
};

const parsingState: AppState = { ...initialState, loading: 'parsing' };
const analyzingState: AppState = { ...initialState, loading: 'analyzing' };

describe('wizardReducer', () => {
  describe('PARSE_START', () => {
    it('idle 상태에서 loading을 parsing으로 변경하고 error를 null로 설정', () => {
      const stateWithError: AppState = { ...initialState, error: { step: 'upload', message: '이전 오류' } };
      const result = wizardReducer(stateWithError, { type: 'PARSE_START' });
      expect(result.loading).toBe('parsing');
      expect(result.error).toBeNull();
    });

    it('idle이 아닌 상태에서 PARSE_START는 무시된다 (불법 전이)', () => {
      const result = wizardReducer(parsingState, { type: 'PARSE_START' });
      expect(result).toBe(parsingState);
    });
  });

  describe('PARSE_SUCCESS', () => {
    it('step을 read로, loading을 idle로 변경하고 데이터를 저장한다', () => {
      const result = wizardReducer(parsingState, {
        type: 'PARSE_SUCCESS',
        payload: { resumeData: mockResumeData, jobRequirements: mockJobRequirements },
      });
      expect(result.step).toBe('read');
      expect(result.loading).toBe('idle');
      expect(result.resumeData).toEqual(mockResumeData);
      expect(result.jobRequirements).toEqual(mockJobRequirements);
    });

    it('parsing이 아닌 상태에서 PARSE_SUCCESS는 무시된다', () => {
      const result = wizardReducer(initialState, {
        type: 'PARSE_SUCCESS',
        payload: { resumeData: mockResumeData, jobRequirements: mockJobRequirements },
      });
      expect(result).toBe(initialState);
    });
  });

  describe('PARSE_ERROR', () => {
    it('error를 저장하고 loading을 idle로, step을 upload로 유지한다', () => {
      const result = wizardReducer(parsingState, { type: 'PARSE_ERROR', payload: '파싱 실패' });
      expect(result.loading).toBe('idle');
      expect(result.step).toBe('upload');
      expect(result.error).toEqual({ step: 'upload', message: '파싱 실패' });
    });

    it('parsing이 아닌 상태에서 PARSE_ERROR는 무시된다', () => {
      const result = wizardReducer(initialState, { type: 'PARSE_ERROR', payload: '오류' });
      expect(result).toBe(initialState);
    });
  });

  describe('CONFIRM_READ', () => {
    it('loading을 analyzing으로 변경하고 resumeData를 payload로 갱신한다', () => {
      const readState: AppState = {
        ...initialState,
        step: 'read',
        loading: 'idle',
        resumeData: { ...mockResumeData, name: '기존 이름' },
      };
      const updatedResume: ResumeData = { ...mockResumeData, name: '수정된 이름' };
      const result = wizardReducer(readState, { type: 'CONFIRM_READ', payload: updatedResume });
      expect(result.loading).toBe('analyzing');
      expect(result.resumeData).toEqual(updatedResume);
    });

    it('idle이 아닌 상태에서 CONFIRM_READ는 무시된다', () => {
      const result = wizardReducer(parsingState, { type: 'CONFIRM_READ', payload: mockResumeData });
      expect(result).toBe(parsingState);
    });
  });

  describe('ANALYZE_START', () => {
    it('상태를 그대로 반환한다 (no-op)', () => {
      const result = wizardReducer(analyzingState, { type: 'ANALYZE_START' });
      expect(result).toBe(analyzingState);
    });
  });

  describe('ANALYZE_SUCCESS', () => {
    it('step을 action으로, loading을 idle로 변경하고 analysisResult를 저장한다', () => {
      const result = wizardReducer(analyzingState, {
        type: 'ANALYZE_SUCCESS',
        payload: mockAnalysisResult,
      });
      expect(result.step).toBe('action');
      expect(result.loading).toBe('idle');
      expect(result.analysisResult).toEqual(mockAnalysisResult);
    });

    it('analyzing이 아닌 상태에서 ANALYZE_SUCCESS는 무시된다', () => {
      const result = wizardReducer(initialState, {
        type: 'ANALYZE_SUCCESS',
        payload: mockAnalysisResult,
      });
      expect(result).toBe(initialState);
    });
  });

  describe('ANALYZE_ERROR', () => {
    it('error를 저장하고 loading을 idle로, step을 read로 유지한다', () => {
      const readAnalyzingState: AppState = { ...initialState, step: 'read', loading: 'analyzing' };
      const result = wizardReducer(readAnalyzingState, { type: 'ANALYZE_ERROR', payload: '분석 실패' });
      expect(result.loading).toBe('idle');
      expect(result.step).toBe('read');
      expect(result.error).toEqual({ step: 'read', message: '분석 실패' });
    });

    it('analyzing이 아닌 상태에서 ANALYZE_ERROR는 무시된다', () => {
      const result = wizardReducer(initialState, { type: 'ANALYZE_ERROR', payload: '오류' });
      expect(result).toBe(initialState);
    });
  });

  describe('CLEAR_ERROR', () => {
    it('error를 null로, loading을 idle로 설정하고 step은 유지한다', () => {
      const errorState: AppState = {
        ...initialState,
        step: 'read',
        loading: 'analyzing',
        error: { step: 'read', message: '오류' },
      };
      const result = wizardReducer(errorState, { type: 'CLEAR_ERROR' });
      expect(result.error).toBeNull();
      expect(result.loading).toBe('idle');
      expect(result.step).toBe('read');
    });
  });

  describe('RESET', () => {
    it('전체 상태를 initialState로 초기화한다', () => {
      const dirtyState: AppState = {
        step: 'action',
        loading: 'analyzing',
        error: { step: 'read', message: '오류' },
        resumeData: mockResumeData,
        jobRequirements: mockJobRequirements,
        analysisResult: mockAnalysisResult,
      };
      const result = wizardReducer(dirtyState, { type: 'RESET' });
      expect(result).toEqual(initialState);
    });
  });
});
