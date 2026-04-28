import Anthropic from '@anthropic-ai/sdk';
import type { ResumeData } from '@/types/resume';

export async function parseResume(pdfText: string): Promise<ResumeData> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY가 설정되지 않았습니다.');
  }

  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: '반드시 JSON 형식으로만 응답하라. 마크다운 코드블록, 설명 텍스트 포함 금지.',
    messages: [
      {
        role: 'user',
        content: `아래 이력서 텍스트를 분석하여 다음 JSON 구조로 반환하라.

반환 JSON 구조:
{
  "name": "이름",
  "contactEmail": "이메일",
  "contactPhone": "전화번호 (없으면 생략)",
  "summary": "직무 요약 또는 자기소개",
  "skills": ["스킬1", "스킬2"],
  "experience": [
    { "company": "회사명", "role": "직책", "period": "기간", "description": "업무 설명" }
  ],
  "education": [
    { "institution": "학교명", "degree": "학위/전공", "period": "기간" }
  ],
  "rawText": "원본 텍스트 전체"
}

rawText는 아래 이력서 원본 텍스트를 그대로 포함시켜라.

이력서 텍스트:
${pdfText}`,
      },
    ],
  });

  const firstBlock = response.content[0];
  const text = firstBlock?.type === 'text' ? firstBlock.text : '';

  let parsed: unknown;
  try {
    const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('AI 응답을 파싱할 수 없습니다.');
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    typeof (parsed as Record<string, unknown>)['name'] !== 'string' ||
    !Array.isArray((parsed as Record<string, unknown>)['skills']) ||
    !Array.isArray((parsed as Record<string, unknown>)['experience']) ||
    !Array.isArray((parsed as Record<string, unknown>)['education'])
  ) {
    throw new Error('AI 응답에 필수 필드가 없습니다.');
  }

  const data = parsed as Record<string, unknown>;

  return {
    name: data['name'] as string,
    contactEmail: typeof data['contactEmail'] === 'string' ? data['contactEmail'] : '',
    contactPhone: typeof data['contactPhone'] === 'string' ? data['contactPhone'] : undefined,
    summary: typeof data['summary'] === 'string' ? data['summary'] : '',
    skills: data['skills'] as string[],
    experience: data['experience'] as ResumeData['experience'],
    education: data['education'] as ResumeData['education'],
    rawText: typeof data['rawText'] === 'string' ? data['rawText'] : pdfText,
  };
}
