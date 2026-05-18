/**
 * @jest-environment node
 */
jest.mock('@/lib/ai/groq');
jest.mock('pdf-parse');

import { POST } from '@/app/api/parse-resume/route';
import { NextRequest } from 'next/server';
import { groqChat, groqChatWithImage } from '@/lib/ai/groq';
import pdfParse from 'pdf-parse';

const mockGroqChat = groqChat as jest.Mock;
const mockGroqChatWithImage = groqChatWithImage as jest.Mock;
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

const MOCK_JD_JSON = JSON.stringify({
  title: '백엔드 개발자',
  company: '테스트 회사',
  requiredSkills: ['TypeScript', 'Node.js'],
  preferredSkills: ['Docker'],
  responsibilities: ['API 개발'],
  rawText: 'JD 원본 텍스트',
});

function makeRequest(formData: FormData): NextRequest {
  return new NextRequest('http://localhost/api/parse-resume', { method: 'POST', body: formData });
}

function makePdfFile(sizeBytes = 100): File {
  return new File([new Uint8Array(sizeBytes)], 'resume.pdf', { type: 'application/pdf' });
}

function makeImageFile(type = 'image/png', sizeBytes = 100): File {
  const ext = type === 'image/jpeg' ? 'jpg' : 'png';
  return new File([new Uint8Array(sizeBytes)], `jd.${ext}`, { type });
}

describe('POST /api/parse-resume', () => {
  const originalGroqApiKey = process.env.GROQ_API_KEY;

  beforeEach(() => {
    mockGroqChat
      .mockResolvedValueOnce(MOCK_RESUME_JSON)
      .mockResolvedValueOnce(MOCK_JD_JSON);
    mockGroqChatWithImage.mockResolvedValue(MOCK_JD_JSON);
    mockPdfParse.mockResolvedValue({
      text: '이력서 텍스트',
      numpages: 1,
      numrender: 1,
      info: {},
      metadata: {},
      version: '1.10.100',
    });
    process.env.GROQ_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    process.env.GROQ_API_KEY = originalGroqApiKey;
    jest.clearAllMocks();
  });

  it('유효한 PDF + JD 텍스트 → 200 + ParseResumeResponse', async () => {
    const formData = new FormData();
    formData.append('resume', makePdfFile(), 'resume.pdf');
    formData.append('jobDescription', '백엔드 개발자 채용');

    const res = await POST(makeRequest(formData));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.resumeData).toBeDefined();
    expect(body.jobRequirements).toBeDefined();
    expect(body.resumeData.rawText).toBeUndefined();
    expect(body.jobRequirements.rawText).toBeUndefined();
  });

  it('유효한 PDF + JD 이미지 → 200 + ParseResumeResponse', async () => {
    const formData = new FormData();
    formData.append('resume', makePdfFile(), 'resume.pdf');
    formData.append('jobImage', makeImageFile('image/png'), 'jd.png');

    const res = await POST(makeRequest(formData));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.resumeData).toBeDefined();
    expect(body.jobRequirements).toBeDefined();
  });

  it('이력서 파일 없음 → 400', async () => {
    const formData = new FormData();
    formData.append('jobDescription', '채용공고');

    const res = await POST(makeRequest(formData));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it('PDF 아닌 파일 → 400', async () => {
    const formData = new FormData();
    formData.append('resume', new File(['content'], 'resume.txt', { type: 'text/plain' }), 'resume.txt');
    formData.append('jobDescription', '채용공고');

    const res = await POST(makeRequest(formData));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it('PDF 5MB 초과 → 400', async () => {
    const formData = new FormData();
    formData.append('resume', makePdfFile(6 * 1024 * 1024), 'resume.pdf');
    formData.append('jobDescription', '채용공고');

    const res = await POST(makeRequest(formData));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it('JD 없음 → 400', async () => {
    const formData = new FormData();
    formData.append('resume', makePdfFile(), 'resume.pdf');

    const res = await POST(makeRequest(formData));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it('지원하지 않는 이미지 형식 → 400', async () => {
    const formData = new FormData();
    formData.append('resume', makePdfFile(), 'resume.pdf');
    formData.append('jobImage', makeImageFile('image/gif'), 'jd.gif');

    const res = await POST(makeRequest(formData));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it('JD 텍스트+이미지 동시 제출 → 텍스트 우선 처리 (200)', async () => {
    const formData = new FormData();
    formData.append('resume', makePdfFile(), 'resume.pdf');
    formData.append('jobDescription', '백엔드 개발자 채용');
    formData.append('jobImage', makeImageFile('image/png'), 'jd.png');

    const res = await POST(makeRequest(formData));

    expect(res.status).toBe(200);
    expect(mockGroqChatWithImage).not.toHaveBeenCalled();
  });

  it('Groq API 실패 → 500', async () => {
    mockGroqChat.mockReset();
    mockGroqChat.mockRejectedValue(new Error('API 오류'));

    const formData = new FormData();
    formData.append('resume', makePdfFile(), 'resume.pdf');
    formData.append('jobDescription', '채용공고');

    const res = await POST(makeRequest(formData));

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it('GROQ_API_KEY 미설정 → 500', async () => {
    mockGroqChat.mockReset();
    mockGroqChat.mockRejectedValue(new Error('GROQ_API_KEY가 설정되지 않았습니다.'));

    const formData = new FormData();
    formData.append('resume', makePdfFile(), 'resume.pdf');
    formData.append('jobDescription', '채용공고');

    const res = await POST(makeRequest(formData));

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });
});
