import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StepUpload from '@/components/wizard/StepUpload';
import type { WizardError } from '@/types/wizard';

const mockOnSubmit = jest.fn();

describe('StepUpload', () => {
  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('이력서 없이 제출 버튼이 비활성화된다', () => {
    render(<StepUpload onSubmit={mockOnSubmit} loading="idle" error={null} />);
    expect(screen.getByRole('button', { name: /시작/ })).toBeDisabled();
  });

  it('JD 없이 파일만 선택해도 제출 버튼이 비활성화된다', async () => {
    const { container } = render(<StepUpload onSubmit={mockOnSubmit} loading="idle" error={null} />);
    const pdfInput = container.querySelector('input[accept="application/pdf"]') as HTMLInputElement;
    const file = new File(['content'], 'resume.pdf', { type: 'application/pdf' });
    await userEvent.upload(pdfInput, file);
    expect(screen.getByRole('button', { name: /시작/ })).toBeDisabled();
  });

  it('PDF 파일 선택 후 파일명이 표시된다', async () => {
    const { container } = render(<StepUpload onSubmit={mockOnSubmit} loading="idle" error={null} />);
    const pdfInput = container.querySelector('input[accept="application/pdf"]') as HTMLInputElement;
    const file = new File(['content'], 'resume.pdf', { type: 'application/pdf' });
    await userEvent.upload(pdfInput, file);
    expect(screen.getByText('resume.pdf')).toBeInTheDocument();
  });

  it('loading=parsing 일 때 제출 버튼이 비활성화된다', () => {
    render(<StepUpload onSubmit={mockOnSubmit} loading="parsing" error={null} />);
    expect(screen.getByRole('button', { name: /중\.\.\./ })).toBeDisabled();
  });

  it('error prop이 있을 때 에러 배너를 표시한다', () => {
    const error: WizardError = { step: 'upload', message: '오류 메시지' };
    render(<StepUpload onSubmit={mockOnSubmit} loading="idle" error={error} />);
    expect(screen.getByRole('alert')).toHaveTextContent('오류 메시지');
  });
});
