import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditableField from '@/components/ui/EditableField';

describe('EditableField', () => {
  it('초기 렌더: value 텍스트 표시, input 없음', () => {
    render(<EditableField value="홍길동" onChange={jest.fn()} label="이름" />);
    expect(screen.getByText('홍길동')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('클릭 시 편집 모드 진입 (input 나타남)', async () => {
    render(<EditableField value="홍길동" onChange={jest.fn()} label="이름" />);
    await userEvent.click(screen.getByRole('button', { name: '이름' }));
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('Enter 키로 편집 모드 진입', () => {
    render(<EditableField value="홍길동" onChange={jest.fn()} label="이름" />);
    const viewEl = screen.getByRole('button', { name: '이름' });
    fireEvent.keyDown(viewEl, { key: 'Enter' });
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('값 변경 후 Enter → onChange 호출, 편집 모드 종료', async () => {
    const onChange = jest.fn();
    render(<EditableField value="홍길동" onChange={onChange} label="이름" />);
    await userEvent.click(screen.getByRole('button', { name: '이름' }));
    const input = screen.getByRole('textbox');
    await userEvent.clear(input);
    await userEvent.type(input, '이순신{Enter}');
    expect(onChange).toHaveBeenCalledWith('이순신');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('Escape → 원래 값 복원, 편집 모드 종료', async () => {
    render(<EditableField value="홍길동" onChange={jest.fn()} label="이름" />);
    await userEvent.click(screen.getByRole('button', { name: '이름' }));
    const input = screen.getByRole('textbox');
    await userEvent.clear(input);
    await userEvent.type(input, '이순신');
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByText('홍길동')).toBeInTheDocument();
  });

  it('multiline=true → textarea 렌더 (input 아님)', async () => {
    render(<EditableField value="소개글" onChange={jest.fn()} label="자기소개" multiline />);
    await userEvent.click(screen.getByRole('button', { name: '자기소개' }));
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-multiline', 'true');
  });

  it('label prop이 aria-label로 설정됨', () => {
    render(<EditableField value="홍길동" onChange={jest.fn()} label="이름" />);
    expect(screen.getByLabelText('이름')).toBeInTheDocument();
  });
});
