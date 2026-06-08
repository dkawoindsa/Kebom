/**
 * @jest-environment node
 */
jest.mock('@/lib/ai/gemini');

import { POST } from '@/app/api/analyze/extras/route';
import { geminiChat } from '@/lib/ai/gemini';

const mockGeminiChat = geminiChat as jest.Mock;

const MOCK_EXTRAS_JSON = JSON.stringify({
  interviewQuestions: [
    { question: '도커 경험이 없는데 어떻게 배울 계획인가요?', advice: '구체적인 학습 계획을 말씀해 보세요.' },
  ],
  gapSuggestions: [
    { jobRequirement: '도커 컨테이너 운영', recommendation: '관련 경험을 이력서에 추가해 보세요.' },
  ],
});

const MOCK_RESUME_DATA = {
  name: '홍길동',
  contactEmail: 'hong@example.com',
  summary: '백엔드 개발자',
  skills: ['TypeScript', 'Node.js'],
  experience: [{ company: '테스트 회사', role: '개발자', period: '2020-2023', description: '개발' }],
  projects: [],
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
  return new Request('http://localhost/api/analyze/extras', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/analyze/extras', () => {
  beforeEach(() => {
    mockGeminiChat.mockResolvedValue(MOCK_EXTRAS_JSON);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('유효한 요청 → 200 + interviewQuestions + gapSuggestions', async () => {
    const res = await POST(
      makeRequest({ resumeData: MOCK_RESUME_DATA, jobRequirements: MOCK_JOB_REQUIREMENTS })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.interviewQuestions)).toBe(true);
    expect(Array.isArray(body.gapSuggestions)).toBe(true);
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

  it('API 키 미설정 → 500', async () => {
    mockGeminiChat.mockRejectedValue(new Error('GOOGLE_AI_API_KEY가 설정되지 않았습니다.'));

    const res = await POST(
      makeRequest({ resumeData: MOCK_RESUME_DATA, jobRequirements: MOCK_JOB_REQUIREMENTS })
    );

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it('Gemini API 실패 → 500', async () => {
    mockGeminiChat.mockRejectedValue(new Error('서버 오류'));

    const res = await POST(
      makeRequest({ resumeData: MOCK_RESUME_DATA, jobRequirements: MOCK_JOB_REQUIREMENTS })
    );

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });
});
