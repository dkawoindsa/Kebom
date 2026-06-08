/**
 * @jest-environment node
 */
jest.mock('@/lib/ai/gemini');

import { POST } from '@/app/api/parse-jd/route';
import { NextRequest } from 'next/server';
import { geminiChat, geminiChatWithImage } from '@/lib/ai/gemini';

const mockGeminiChat = geminiChat as jest.Mock;
const mockGeminiChatWithImage = geminiChatWithImage as jest.Mock;

const MOCK_JD_JSON = JSON.stringify({
  title: '백엔드 개발자',
  company: '테스트 회사',
  requiredSkills: ['TypeScript', 'Node.js'],
  preferredSkills: ['Docker'],
  responsibilities: ['API 개발'],
  rawText: 'JD 원본 텍스트',
});

function makeRequest(formData: FormData): NextRequest {
  return new NextRequest('http://localhost/api/parse-jd', { method: 'POST', body: formData });
}

function makeImageFile(type = 'image/png', sizeBytes = 100): File {
  const ext = type === 'image/jpeg' ? 'jpg' : 'png';
  return new File([new Uint8Array(sizeBytes)], `jd.${ext}`, { type });
}

describe('POST /api/parse-jd', () => {
  const originalApiKey = process.env.GOOGLE_AI_API_KEY;

  beforeEach(() => {
    mockGeminiChat.mockResolvedValue(MOCK_JD_JSON);
    mockGeminiChatWithImage.mockResolvedValue(MOCK_JD_JSON);
    process.env.GOOGLE_AI_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    process.env.GOOGLE_AI_API_KEY = originalApiKey;
    jest.clearAllMocks();
  });

  it('JD 텍스트 → 200 + jobRequirements', async () => {
    const formData = new FormData();
    formData.append('jobDescription', '백엔드 개발자 채용공고');

    const res = await POST(makeRequest(formData));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.jobRequirements).toBeDefined();
    expect(body.jobRequirements.rawText).toBeUndefined();
  });

  it('JD 이미지(PNG) → 200 + jobRequirements', async () => {
    const formData = new FormData();
    formData.append('jobImage', makeImageFile('image/png'), 'jd.png');

    const res = await POST(makeRequest(formData));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.jobRequirements).toBeDefined();
    expect(mockGeminiChatWithImage).toHaveBeenCalled();
  });

  it('텍스트+이미지 동시 제출 → 텍스트 우선 처리 (200)', async () => {
    const formData = new FormData();
    formData.append('jobDescription', '백엔드 개발자 채용');
    formData.append('jobImage', makeImageFile('image/png'), 'jd.png');

    const res = await POST(makeRequest(formData));

    expect(res.status).toBe(200);
    expect(mockGeminiChatWithImage).not.toHaveBeenCalled();
  });

  it('JD 없음 → 400', async () => {
    const formData = new FormData();

    const res = await POST(makeRequest(formData));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it('지원하지 않는 이미지 형식 → 400', async () => {
    const formData = new FormData();
    formData.append('jobImage', makeImageFile('image/gif'), 'jd.gif');

    const res = await POST(makeRequest(formData));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it('JD 텍스트 10000자 초과 → 400', async () => {
    const formData = new FormData();
    formData.append('jobDescription', 'a'.repeat(10001));

    const res = await POST(makeRequest(formData));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it('Gemini API 실패 → 500', async () => {
    mockGeminiChat.mockRejectedValue(new Error('API 오류'));

    const formData = new FormData();
    formData.append('jobDescription', '채용공고');

    const res = await POST(makeRequest(formData));

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it('GOOGLE_AI_API_KEY 미설정 → 500', async () => {
    mockGeminiChat.mockRejectedValue(new Error('GOOGLE_AI_API_KEY가 설정되지 않았습니다.'));

    const formData = new FormData();
    formData.append('jobDescription', '채용공고');

    const res = await POST(makeRequest(formData));

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });
});
