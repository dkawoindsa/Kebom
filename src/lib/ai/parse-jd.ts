import { ollamaChat, ollamaChatWithImage } from './ollama';
import type { JobRequirements } from '@/types/resume';

const JD_PROMPT_SUFFIX = `
반환 JSON 구조:
{
  "title": "직무명",
  "company": "회사명 (없으면 null)",
  "requiredSkills": ["필수 스킬1", "필수 스킬2"],
  "preferredSkills": ["우대 스킬1", "우대 스킬2"],
  "responsibilities": ["주요 업무1", "주요 업무2"],
  "rawText": "원본 텍스트 전체"
}

rawText는 아래 채용공고 원본 텍스트를 그대로 포함시켜라.`;

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
  const text = await ollamaChat(`당신은 채용 전문가로서 채용공고에서 핵심 요구사항을 정확하게 파악하는 것이 전문입니다.

아래 채용공고 텍스트를 분석하여 다음 JSON 구조로 반환하라.
${JD_PROMPT_SUFFIX}

채용공고 텍스트:
${jobDescriptionText}`);

  return parseJdResponse(text);
}

export async function parseJdFromImage(
  imageBuffer: Buffer,
  mediaType: 'image/png' | 'image/jpeg'
): Promise<JobRequirements> {
  void mediaType;
  const base64 = imageBuffer.toString('base64');

  const text = await ollamaChatWithImage(
    `위 채용공고 이미지를 분석하여 다음 JSON 구조로 반환하라.
${JD_PROMPT_SUFFIX.replace('아래 채용공고 원본 텍스트', '이미지에서 추출한 텍스트')}`,
    base64,
  );

  return parseJdResponse(text);
}
