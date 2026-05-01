/**
 * @jest-environment node
 */
jest.mock('@google/generative-ai');

import { POST } from '@/app/api/analyze/route';
import { GoogleGenerativeAI } from '@google/generative-ai';

const MOCK_ANALYSIS_JSON = JSON.stringify({
  score: 80,
  skillMatches: [{ skill: 'TypeScript', status: 'match', evidence: '이력서에서 발견' }],
  interviewQuestions: [{ question: 'TypeScript 경험은?', advice: '구체적으로 답하세요.' }],
  magicFixes: [{ original: '기존 문장', revised: '개선된 문장', reason: '키워드 추가' }],
});

const MOCK_RESUME_DATA = {
  name: '홍길동',
  contactEmail: 'hong@example.com',
  summary: '백엔드 개발자',
  skills: ['TypeScript', 'Node.js'],
  experience: [{ company: '테스트 회사', role: '개발자', period: '2020-2023', description: '개발' }],
  education: [{ institution: '테스트 대학', degree: '컴퓨터공학', period: '2016-2020' }],
};

const MOCK_JOB_REQUIREMENTS = {
  title: '백엔드 개발자',
  company: '테스트 회사',
  requiredSkills: ['TypeScript', 'Node.js'],
  preferredSkills: ['Docker'],
  responsibilities: ['API 개발'],
};

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/analyze', () => {
  const originalApiKey = process.env.GOOGLE_AI_API_KEY;
  let mockGenerateContent: jest.Mock;

  beforeEach(() => {
    mockGenerateContent = jest.fn();
    (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
      getGenerativeModel: () => ({ generateContent: mockGenerateContent }),
    }));
    mockGenerateContent.mockResolvedValue({
      response: { text: () => MOCK_ANALYSIS_JSON },
    });
    process.env.GOOGLE_AI_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    process.env.GOOGLE_AI_API_KEY = originalApiKey;
    jest.clearAllMocks();
  });

  it('유효한 resumeData + jobRequirements → 200 + AnalyzeResponse', async () => {
    const res = await POST(
      makeRequest({ resumeData: MOCK_RESUME_DATA, jobRequirements: MOCK_JOB_REQUIREMENTS })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.result).toBeDefined();
    expect(typeof body.result.score).toBe('number');
    expect(Array.isArray(body.result.skillMatches)).toBe(true);
    expect(Array.isArray(body.result.interviewQuestions)).toBe(true);
    expect(Array.isArray(body.result.magicFixes)).toBe(true);
  });

  it('resumeData 없음 → 400', async () => {
    const res = await POST(makeRequest({ jobRequirements: MOCK_JOB_REQUIREMENTS }));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it('jobRequirements 없음 → 400', async () => {
    const res = await POST(makeRequest({ resumeData: MOCK_RESUME_DATA }));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it('Gemini SDK 실패 → 500', async () => {
    mockGenerateContent.mockReset();
    mockGenerateContent.mockRejectedValue(new Error('API 오류'));

    const res = await POST(
      makeRequest({ resumeData: MOCK_RESUME_DATA, jobRequirements: MOCK_JOB_REQUIREMENTS })
    );

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it('GOOGLE_AI_API_KEY 미설정 → 500', async () => {
    delete process.env.GOOGLE_AI_API_KEY;

    const res = await POST(
      makeRequest({ resumeData: MOCK_RESUME_DATA, jobRequirements: MOCK_JOB_REQUIREMENTS })
    );

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });
});
