/**
 * @jest-environment node
 */
jest.mock('@/lib/ai/groq');

import { POST } from '@/app/api/analyze/route';
import { groqChat } from '@/lib/ai/groq';

const mockGroqChat = groqChat as jest.Mock;

const MOCK_ANALYSIS_JSON = JSON.stringify({
  score: 80,
  scoreReason: '좋은 매칭입니다.',
  skillMatches: [
    { skill: 'TypeScript', status: 'match', evidence: '이력서에서 발견' },
    { skill: 'Node.js', status: 'partial', suggestion: '심화 경험 추가 필요' },
    { skill: 'Docker', status: 'missing', suggestion: 'Docker 학습 권장' },
  ],
  interviewQuestions: [{ question: 'TypeScript 경험은?', advice: '구체적으로 답하세요.' }],
  gapSuggestions: [{ jobRequirement: 'Docker 컨테이너 운영', recommendation: '관련 경험을 추가하면 경쟁력이 높아질 것입니다.' }],
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
  beforeEach(() => {
    mockGroqChat.mockResolvedValue(MOCK_ANALYSIS_JSON);
  });

  afterEach(() => {
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
    expect(Array.isArray(body.result.gapSuggestions)).toBe(true);
  });

  it('skillMatches에 JD 스킬이 모두 포함된다', async () => {
    const res = await POST(
      makeRequest({ resumeData: MOCK_RESUME_DATA, jobRequirements: MOCK_JOB_REQUIREMENTS })
    );

    const body = await res.json();
    const skills = (body.result.skillMatches as { skill: string }[]).map((m) => m.skill.toLowerCase());
    expect(skills).toContain('typescript');
    expect(skills).toContain('node.js');
    expect(skills).toContain('docker');
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

  it('Groq API 키 미설정 → 500', async () => {
    mockGroqChat.mockRejectedValue(new Error('GROQ_API_KEY가 설정되지 않았습니다.'));

    const res = await POST(
      makeRequest({ resumeData: MOCK_RESUME_DATA, jobRequirements: MOCK_JOB_REQUIREMENTS })
    );

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it('Groq API 실패 → 500', async () => {
    mockGroqChat.mockRejectedValue(new Error('서버 오류'));

    const res = await POST(
      makeRequest({ resumeData: MOCK_RESUME_DATA, jobRequirements: MOCK_JOB_REQUIREMENTS })
    );

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });
});
