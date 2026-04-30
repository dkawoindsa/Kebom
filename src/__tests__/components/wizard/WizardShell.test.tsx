import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WizardShell from '@/components/wizard/WizardShell';

const mockParseResponse = {
  resumeData: {
    name: '홍길동',
    contactEmail: 'hong@test.com',
    contactPhone: '010-0000-0000',
    summary: '백엔드 개발자',
    skills: ['TypeScript', 'Node.js'],
    experience: [{ company: '테스트', role: '개발자', period: '2022-2024', description: '개발' }],
    education: [{ institution: '대학교', degree: '컴공', period: '2018-2022' }],
  },
  jobRequirements: {
    title: '백엔드 개발자',
    company: '회사',
    requiredSkills: ['TypeScript'],
    preferredSkills: ['React'],
    responsibilities: ['개발'],
  },
};

describe('WizardShell', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockParseResponse),
    }) as jest.Mock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('upload 단계를 초기 렌더링한다', () => {
    render(<WizardShell />);
    expect(screen.getByRole('button', { name: /시작/ })).toBeInTheDocument();
  });

  it('파싱 성공 후 StepRead로 전환된다', async () => {
    const { container } = render(<WizardShell />);

    const pdfInput = container.querySelector('input[accept="application/pdf"]') as HTMLInputElement;
    const file = new File(['content'], 'resume.pdf', { type: 'application/pdf' });
    await userEvent.upload(pdfInput, file);

    const textarea = screen.getByPlaceholderText('채용공고 내용을 붙여넣으세요');
    await userEvent.type(textarea, '백엔드 개발자');

    await userEvent.click(screen.getByRole('button', { name: /시작/ }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /확인 후/ })).toBeInTheDocument();
    });
  });
});
