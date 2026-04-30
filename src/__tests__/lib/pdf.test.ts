jest.mock('pdf-parse');

import pdfParse from 'pdf-parse';
import { extractTextFromPdf } from '@/lib/pdf';

const mockPdfParse = pdfParse as jest.MockedFunction<typeof pdfParse>;

describe('extractTextFromPdf', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Buffer에서 텍스트를 추출한다', async () => {
    mockPdfParse.mockResolvedValue({ text: '이력서 텍스트 내용', numpages: 1, numrender: 1, info: {}, metadata: {}, version: '1.10.100' });
    const result = await extractTextFromPdf(Buffer.from('pdf-bytes'));
    expect(result).toBe('이력서 텍스트 내용');
    expect(mockPdfParse).toHaveBeenCalledWith(Buffer.from('pdf-bytes'));
  });

  it('빈 텍스트 반환 시 에러를 throw한다', async () => {
    mockPdfParse.mockResolvedValue({ text: '   ', numpages: 1, numrender: 1, info: {}, metadata: {}, version: '1.10.100' });
    await expect(extractTextFromPdf(Buffer.from(''))).rejects.toThrow(
      '이력서를 읽을 수 없습니다. 텍스트 기반 PDF를 사용해주세요.'
    );
  });

  it('pdf-parse 실패 시 에러를 throw한다', async () => {
    mockPdfParse.mockRejectedValue(new Error('pdf 파싱 중 오류'));
    await expect(extractTextFromPdf(Buffer.from(''))).rejects.toThrow('pdf 파싱 중 오류');
  });
});
