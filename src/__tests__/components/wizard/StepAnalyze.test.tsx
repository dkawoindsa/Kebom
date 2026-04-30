import { render, screen } from '@testing-library/react';
import StepAnalyze from '@/components/wizard/StepAnalyze';
import type { AnalysisResult } from '@/types/analysis';

const mockAnalysisResult: AnalysisResult = {
  score: 75,
  skillMatches: [{ skill: 'TypeScript', status: 'match', evidence: '경력에 명시됨' }],
  interviewQuestions: [{ question: '경험은?', advice: '구체적 사례 제시' }],
  magicFixes: [{ original: '원본', revised: '수정본', reason: '키워드 추가' }],
};

describe('StepAnalyze', () => {
  it('score 숫자를 표시한다', () => {
    render(<StepAnalyze analysisResult={mockAnalysisResult} />);
    expect(screen.getByRole('img', { name: /매칭 점수 75/ })).toBeInTheDocument();
  });

  it('skillMatches 스킬명을 표시한다', () => {
    render(<StepAnalyze analysisResult={mockAnalysisResult} />);
    expect(screen.getAllByText('TypeScript').length).toBeGreaterThan(0);
  });

  it('빈 skillMatches이면 빈 상태 메시지를 표시한다', () => {
    const empty: AnalysisResult = { ...mockAnalysisResult, skillMatches: [] };
    render(<StepAnalyze analysisResult={empty} />);
    expect(screen.getByText(/매칭 결과가 없습니다/)).toBeInTheDocument();
  });

  it('missing → partial → match 순서로 정렬된다', () => {
    const mixed: AnalysisResult = {
      ...mockAnalysisResult,
      skillMatches: [
        { skill: 'React', status: 'match', evidence: '있음' },
        { skill: 'Docker', status: 'missing' },
        { skill: 'Node.js', status: 'partial', suggestion: '보완 필요' },
      ],
    };
    render(<StepAnalyze analysisResult={mixed} />);
    const body = document.body.textContent ?? '';
    expect(body.indexOf('Docker')).toBeLessThan(body.indexOf('Node.js'));
    expect(body.indexOf('Node.js')).toBeLessThan(body.indexOf('React'));
  });
});
