// 서버 전용 — 이 파일은 app/api/ 라우트에서만 import한다
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse') as (buffer: Buffer) => Promise<{ text: string }>;

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const result = await pdfParse(buffer);
  if (result.text.trim() === '') {
    throw new Error('이력서를 읽을 수 없습니다. 텍스트 기반 PDF를 사용해주세요.');
  }
  return result.text;
}
