import { render, screen } from '@testing-library/react';
import StepAction from '@/components/wizard/StepAction';
import type { AnalysisResult } from '@/types/analysis';

const mockAnalysisResult: AnalysisResult = {
  score: 75,
  skillMatches: [{ skill: 'TypeScript', status: 'match', evidence: '경력에 명시됨' }],
  interviewQuestions: [{ question: '경험은?', advice: '구체적 사례 제시' }],
  gapSuggestions: [{
    jobRequirement: 'TypeScript 개발 경험',
    recommendation: '채용공고에서 요구하는 TypeScript 개발 경험이 이력서에서 확인되지 않습니다. 관련 프로젝트를 추가하면 경쟁력이 높아질 것입니다.',
  }],
};

describe('StepAction', () => {
  it('interviewQuestions를 렌더링한다', () => {
    render(<StepAction analysisResult={mockAnalysisResult} />);
    expect(screen.getByText('경험은?')).toBeInTheDocument();
    expect(screen.getByText('구체적 사례 제시')).toBeInTheDocument();
  });

  it('gapSuggestions를 렌더링한다', () => {
    render(<StepAction analysisResult={mockAnalysisResult} />);
    expect(screen.getByText('TypeScript 개발 경험')).toBeInTheDocument();
    expect(screen.getByText(/채용공고에서 요구하는 TypeScript/)).toBeInTheDocument();
  });

  it('빈 interviewQuestions이면 빈 상태 메시지를 표시한다', () => {
    const empty: AnalysisResult = { ...mockAnalysisResult, interviewQuestions: [] };
    render(<StepAction analysisResult={empty} />);
    expect(screen.getByText(/면접 위험 질문이 도출되지/)).toBeInTheDocument();
  });

  it('빈 gapSuggestions이면 빈 상태 메시지를 표시한다', () => {
    const empty: AnalysisResult = { ...mockAnalysisResult, gapSuggestions: [] };
    render(<StepAction analysisResult={empty} />);
    expect(screen.getByText(/보완 제안이 없습니다/)).toBeInTheDocument();
  });
});
