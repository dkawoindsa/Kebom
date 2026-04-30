import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileDropzone from '@/components/ui/FileDropzone';

describe('FileDropzone', () => {
  const onFileSelect = jest.fn();

  beforeEach(() => {
    onFileSelect.mockClear();
  });

  it('기본 렌더: 안내 문구 표시 확인', () => {
    render(<FileDropzone onFileSelect={onFileSelect} accept="application/pdf" maxSizeMB={5} />);
    expect(screen.getByText(/드래그하거나 클릭/)).toBeInTheDocument();
  });

  it('파일 선택 후 파일명 표시 확인', () => {
    const file = new File(['content'], 'resume.pdf', { type: 'application/pdf' });
    render(
      <FileDropzone
        onFileSelect={onFileSelect}
        accept="application/pdf"
        maxSizeMB={5}
        selectedFile={file}
      />
    );
    expect(screen.getByText('resume.pdf')).toBeInTheDocument();
  });

  it('PDF 파일 선택 → onFileSelect 호출', async () => {
    render(<FileDropzone onFileSelect={onFileSelect} accept="application/pdf" maxSizeMB={5} />);
    const input = screen.getByTestId('file-input');
    const file = new File(['content'], 'resume.pdf', { type: 'application/pdf' });
    await userEvent.upload(input, file);
    expect(onFileSelect).toHaveBeenCalledWith(file);
  });

  it('잘못된 MIME 타입 파일 → 에러 표시, onFileSelect 미호출', () => {
    render(<FileDropzone onFileSelect={onFileSelect} accept="application/pdf" maxSizeMB={5} />);
    const input = screen.getByTestId('file-input');
    const file = new File(['content'], 'image.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });
    expect(screen.getByText(/PDF 파일만/)).toBeInTheDocument();
    expect(onFileSelect).not.toHaveBeenCalled();
  });

  it('5MB 초과 파일 → 에러 표시', async () => {
    render(<FileDropzone onFileSelect={onFileSelect} accept="application/pdf" maxSizeMB={5} />);
    const input = screen.getByTestId('file-input');
    const file = new File(['x'], 'large.pdf', { type: 'application/pdf' });
    Object.defineProperty(file, 'size', { value: 6 * 1024 * 1024, configurable: true });
    await userEvent.upload(input, file);
    expect(screen.getByText(/5MB 이하/)).toBeInTheDocument();
    expect(onFileSelect).not.toHaveBeenCalled();
  });

  it('role="button" 존재 확인', () => {
    render(<FileDropzone onFileSelect={onFileSelect} accept="application/pdf" maxSizeMB={5} />);
    expect(screen.getByRole('button', { name: /이력서 PDF 업로드/ })).toBeInTheDocument();
  });

  it('드래그 오버 시 스타일 변경 확인', () => {
    render(<FileDropzone onFileSelect={onFileSelect} accept="application/pdf" maxSizeMB={5} />);
    const dropzone = screen.getByRole('button', { name: /이력서 PDF 업로드/ });
    fireEvent.dragOver(dropzone);
    expect(dropzone).toHaveClass('border-neutral-500');
  });
});
