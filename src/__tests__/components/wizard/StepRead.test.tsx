import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StepRead from '@/components/wizard/StepRead';
import type { WizardError } from '@/types/wizard';

const mockResumeData = {
  name: '홍길동',
  contactEmail: 'hong@test.com',
  contactPhone: '010-0000-0000',
  summary: '백엔드 개발자',
  skills: ['TypeScript', 'Node.js'],
  experience: [{ company: '테스트', role: '개발자', period: '2022-2024', description: '개발' }],
  education: [{ institution: '대학교', degree: '컴공', period: '2018-2022' }],
  rawText: '원문 텍스트',
};

const mockJobReq = {
  title: '백엔드 개발자',
  company: '회사',
  requiredSkills: ['TypeScript'],
  preferredSkills: ['React'],
  responsibilities: ['개발'],
  rawText: '공고 원문',
};

const mockOnConfirm = jest.fn();

describe('StepRead', () => {
  beforeEach(() => {
    mockOnConfirm.mockClear();
  });

  it('resumeData 이름을 표시한다', () => {
    render(
      <StepRead
        resumeData={mockResumeData}
        jobRequirements={mockJobReq}
        onConfirm={mockOnConfirm}
        loading="idle"
        error={null}
      />
    );
    expect(screen.getByText('홍길동')).toBeInTheDocument();
  });

  it('"확인 후 분析" 버튼 클릭 시 onConfirm이 호출된다', async () => {
    render(
      <StepRead
        resumeData={mockResumeData}
        jobRequirements={mockJobReq}
        onConfirm={mockOnConfirm}
        loading="idle"
        error={null}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: /확인 후/ }));
    expect(mockOnConfirm).toHaveBeenCalledWith(expect.objectContaining({ name: '홍길동' }));
  });

  it('loading=analyzing 일 때 버튼이 비활성화된다', () => {
    render(
      <StepRead
        resumeData={mockResumeData}
        jobRequirements={mockJobReq}
        onConfirm={mockOnConfirm}
        loading="analyzing"
        error={null}
      />
    );
    expect(screen.getByRole('button', { name: /중\.\.\./ })).toBeDisabled();
  });

  it('error prop이 있을 때 에러 배너를 표시한다', () => {
    const error: WizardError = { step: 'read', message: '분析 오류' };
    render(
      <StepRead
        resumeData={mockResumeData}
        jobRequirements={mockJobReq}
        onConfirm={mockOnConfirm}
        loading="idle"
        error={error}
      />
    );
    expect(screen.getByRole('alert')).toHaveTextContent('분析 오류');
  });

  it('requiredSkills 빈 배열이면 amber 경고를 표시한다', () => {
    const emptyJobReq = { ...mockJobReq, requiredSkills: [] };
    render(
      <StepRead
        resumeData={mockResumeData}
        jobRequirements={emptyJobReq}
        onConfirm={mockOnConfirm}
        loading="idle"
        error={null}
      />
    );
    expect(
      screen.getByText(/채용공고에서 요구 스킬을 찾을 수 없습니다/)
    ).toBeInTheDocument();
  });
});
