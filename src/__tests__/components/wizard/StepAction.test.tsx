import { render, screen } from '@testing-library/react';
import StepAction from '@/components/wizard/StepAction';
import type { AnalysisResult } from '@/types/analysis';

const mockAnalysisResult: AnalysisResult = {
  score: 75,
  skillMatches: [{ skill: 'TypeScript', status: 'match', evidence: '경력에 명시됨' }],
  interviewQuestions: [{ question: '경험은?', advice: '구체적 사례 제시' }],
  magicFixes: [{ original: '원본', revised: '수정본', reason: '키워드 추가' }],
};

describe('StepAction', () => {
  it('interviewQuestions를 렌더링한다', () => {
    render(<StepAction analysisResult={mockAnalysisResult} />);
    expect(screen.getByText('경험은?')).toBeInTheDocument();
    expect(screen.getByText('구체적 사례 제시')).toBeInTheDocument();
  });

  it('magicFixes를 렌더링한다', () => {
    render(<StepAction analysisResult={mockAnalysisResult} />);
    expect(screen.getByText('원본')).toBeInTheDocument();
    expect(screen.getByText('수정본')).toBeInTheDocument();
  });

  it('빈 interviewQuestions이면 빈 상태 메시지를 표시한다', () => {
    const empty: AnalysisResult = { ...mockAnalysisResult, interviewQuestions: [] };
    render(<StepAction analysisResult={empty} />);
    expect(screen.getByText(/면접 위험 질문이 도출되지/)).toBeInTheDocument();
  });

  it('빈 magicFixes이면 빈 상태 메시지를 표시한다', () => {
    const empty: AnalysisResult = { ...mockAnalysisResult, magicFixes: [] };
    render(<StepAction analysisResult={empty} />);
    expect(screen.getByText(/수정 제안이 없습니다/)).toBeInTheDocument();
  });
});
