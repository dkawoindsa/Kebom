import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SkillBadge from '@/components/ui/SkillBadge';

describe('SkillBadge', () => {
  it("status='match' → green 색상 클래스 포함", () => {
    render(<SkillBadge skill="React" status="match" />);
    expect(screen.getByLabelText('React: match')).toHaveClass('text-green-400');
  });

  it("status='partial' → amber 색상 클래스 포함", () => {
    render(<SkillBadge skill="TypeScript" status="partial" />);
    expect(screen.getByLabelText('TypeScript: partial')).toHaveClass('text-amber-400');
  });

  it("status='missing' → red 색상 클래스 포함", () => {
    render(<SkillBadge skill="Java" status="missing" />);
    expect(screen.getByLabelText('Java: missing')).toHaveClass('text-red-400');
  });

  it('스킬명 텍스트 렌더링 확인', () => {
    render(<SkillBadge skill="Python" status="match" />);
    expect(screen.getByText('Python')).toBeInTheDocument();
  });

  it('onDelete 없으면 × 버튼 없음', () => {
    render(<SkillBadge skill="Python" status="match" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('onDelete 있으면 × 버튼 표시', () => {
    render(<SkillBadge skill="Python" status="match" onDelete={jest.fn()} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('× 버튼 클릭 시 onDelete 호출', async () => {
    const onDelete = jest.fn();
    render(<SkillBadge skill="Python" status="match" onDelete={onDelete} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('aria-label 속성 확인 ("{skill}: {status}")', () => {
    render(<SkillBadge skill="React" status="match" />);
    expect(screen.getByLabelText('React: match')).toBeInTheDocument();
  });
});
