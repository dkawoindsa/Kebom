/**
 * @jest-environment node
 */
jest.mock('@/lib/ai/gemini');
jest.mock('pdf-parse');

import { POST } from '@/app/api/parse-resume/route';
import { NextRequest } from 'next/server';
import { geminiChat } from '@/lib/ai/gemini';
import pdfParse from 'pdf-parse';

const mockGeminiChat = geminiChat as jest.Mock;
const mockPdfParse = pdfParse as jest.MockedFunction<typeof pdfParse>;

const MOCK_RESUME_JSON = JSON.stringify({
  name: '홍길동',
  contactEmail: 'hong@example.com',
  contactPhone: '010-1234-5678',
  summary: '백엔드 개발자',
  skills: ['TypeScript', 'Node.js'],
  experience: [{ company: '테스트 회사', role: '개발자', period: '2020-2023', description: '개발' }],
  education: [{ institution: '테스트 대학', degree: '컴퓨터공학', period: '2016-2020' }],
  rawText: '이력서 원본 텍스트',
});

function makeRequest(formData: FormData): NextRequest {
  return new NextRequest('http://localhost/api/parse-resume', { method: 'POST', body: formData });
}

function makePdfFile(sizeBytes = 100): File {
  return new File([new Uint8Array(sizeBytes)], 'resume.pdf', { type: 'application/pdf' });
}

describe('POST /api/parse-resume', () => {
  const originalApiKey = process.env.GOOGLE_AI_API_KEY;

  beforeEach(() => {
    mockGeminiChat.mockResolvedValue(MOCK_RESUME_JSON);
    mockPdfParse.mockResolvedValue({
      text: '이력서 텍스트',
      numpages: 1,
      numrender: 1,
      info: {},
      metadata: {},
      version: '1.10.100',
    });
    process.env.GOOGLE_AI_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    process.env.GOOGLE_AI_API_KEY = originalApiKey;
    jest.clearAllMocks();
  });

  it('유효한 PDF → 200 + resumeData (jobRequirements 없음)', async () => {
    const formData = new FormData();
    formData.append('resume', makePdfFile(), 'resume.pdf');

    const res = await POST(makeRequest(formData));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.resumeData).toBeDefined();
    expect(body.resumeData.rawText).toBeUndefined();
    expect(body.jobRequirements).toBeUndefined();
  });

  it('이력서 파일 없음 → 400', async () => {
    const formData = new FormData();

    const res = await POST(makeRequest(formData));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it('PDF 아닌 파일 → 400', async () => {
    const formData = new FormData();
    formData.append('resume', new File(['content'], 'resume.txt', { type: 'text/plain' }), 'resume.txt');

    const res = await POST(makeRequest(formData));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it('PDF 4MB 초과 → 400', async () => {
    const formData = new FormData();
    formData.append('resume', makePdfFile(5 * 1024 * 1024), 'resume.pdf');

    const res = await POST(makeRequest(formData));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it('Gemini API 실패 → 500', async () => {
    mockGeminiChat.mockReset();
    mockGeminiChat.mockRejectedValue(new Error('API 오류'));

    const formData = new FormData();
    formData.append('resume', makePdfFile(), 'resume.pdf');

    const res = await POST(makeRequest(formData));

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it('GOOGLE_AI_API_KEY 미설정 → 500', async () => {
    mockGeminiChat.mockReset();
    mockGeminiChat.mockRejectedValue(new Error('GOOGLE_AI_API_KEY가 설정되지 않았습니다.'));

    const formData = new FormData();
    formData.append('resume', makePdfFile(), 'resume.pdf');

    const res = await POST(makeRequest(formData));

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });
});
