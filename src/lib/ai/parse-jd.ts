import Anthropic from '@anthropic-ai/sdk';
import type { JobRequirements } from '@/types/resume';

function parseJdResponse(text: string): JobRequirements {
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
    typeof (parsed as Record<string, unknown>)['title'] !== 'string' ||
    !Array.isArray((parsed as Record<string, unknown>)['requiredSkills']) ||
    !Array.isArray((parsed as Record<string, unknown>)['preferredSkills']) ||
    !Array.isArray((parsed as Record<string, unknown>)['responsibilities'])
  ) {
    throw new Error('AI 응답에 필수 필드가 없습니다.');
  }

  const data = parsed as Record<string, unknown>;

  return {
    title: data['title'] as string,
    company: typeof data['company'] === 'string' ? data['company'] : undefined,
    requiredSkills: data['requiredSkills'] as string[],
    preferredSkills: data['preferredSkills'] as string[],
    responsibilities: data['responsibilities'] as string[],
    rawText: typeof data['rawText'] === 'string' ? data['rawText'] : '',
  };
}

export async function parseJdFromText(jobDescriptionText: string): Promise<JobRequirements> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY가 설정되지 않았습니다.');
  }

  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    temperature: 0,
    system: '반드시 JSON 형식으로만 응답하라. 마크다운 코드블록, 설명 텍스트 포함 금지.',
    messages: [
      {
        role: 'user',
        content: `아래 채용공고 텍스트를 분석하여 다음 JSON 구조로 반환하라.

반환 JSON 구조:
{
  "title": "직무명",
  "company": "회사명 (없으면 생략)",
  "requiredSkills": ["필수 스킬1", "필수 스킬2"],
  "preferredSkills": ["우대 스킬1", "우대 스킬2"],
  "responsibilities": ["주요 업무1", "주요 업무2"],
  "rawText": "원본 텍스트 전체"
}

rawText는 아래 채용공고 원본 텍스트를 그대로 포함시켜라.

채용공고 텍스트:
${jobDescriptionText}`,
      },
    ],
  });

  const firstBlock = response.content[0];
  const text = firstBlock?.type === 'text' ? firstBlock.text : '';

  return parseJdResponse(text);
}

export async function parseJdFromImage(
  imageBuffer: Buffer,
  mediaType: 'image/png' | 'image/jpeg'
): Promise<JobRequirements> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY가 설정되지 않았습니다.');
  }

  const client = new Anthropic({ apiKey });
  const base64 = imageBuffer.toString('base64');

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    temperature: 0,
    system: '반드시 JSON 형식으로만 응답하라. 마크다운 코드블록, 설명 텍스트 포함 금지.',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64 },
          },
          {
            type: 'text',
            text: `위 채용공고 이미지를 분석하여 다음 JSON 구조로 반환하라.

반환 JSON 구조:
{
  "title": "직무명",
  "company": "회사명 (없으면 생략)",
  "requiredSkills": ["필수 스킬1", "필수 스킬2"],
  "preferredSkills": ["우대 스킬1", "우대 스킬2"],
  "responsibilities": ["주요 업무1", "주요 업무2"],
  "rawText": "이미지에서 추출한 전체 텍스트"
}

rawText는 이미지에서 인식한 텍스트 전체를 그대로 포함시켜라.`,
          },
        ],
      },
    ],
  });

  const firstBlock = response.content[0];
  const text = firstBlock?.type === 'text' ? firstBlock.text : '';

  return parseJdResponse(text);
}
