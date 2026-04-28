import { render, screen } from '@testing-library/react';
import Page from '@/app/page';

describe('RootPage', () => {
  it('캐봄 제목을 렌더한다', () => {
    render(<Page />);
    expect(screen.getByText('캐봄')).toBeInTheDocument();
  });
});
