import { ollamaChat, ollamaChatWithImage } from './ollama';
import type { JobRequirements } from '@/types/resume';

const JD_KEY_MAP: Record<string, string> = {
  '직무명': 'title', '제목': 'title', '포지션': 'title',
  'job_title': 'title', 'position': 'title',
  '회사명': 'company', '회사': 'company', 'company_name': 'company',
  '필수 스킬': 'requiredSkills', '필수스킬': 'requiredSkills',
  '필수 기술': 'requiredSkills', '필수기술': 'requiredSkills',
  'required_skills': 'requiredSkills',
  '우대 스킬': 'preferredSkills', '우대스킬': 'preferredSkills',
  '우대 기술': 'preferredSkills', '우대기술': 'preferredSkills',
  'preferred_skills': 'preferredSkills',
  '주요 업무': 'responsibilities', '주요업무': 'responsibilities',
  '담당 업무': 'responsibilities', '담당업무': 'responsibilities',
  '업무 내용': 'responsibilities', '업무내용': 'responsibilities',
  '원본 텍스트': 'rawText', '원본텍스트': 'rawText', 'raw_text': 'rawText',
};

function normalizeKeys(obj: Record<string, unknown>, map: Record<string, string>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    result[map[k] ?? k] = v;
  }
  return result;
}

function toStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === 'string');
  return [];
}

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

function parseJdResponse(text: string, originalInput: string): JobRequirements {
  let data: Record<string, unknown> = {};
  try {
    const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    const raw = JSON.parse(cleaned);
    if (typeof raw === 'object' && raw !== null && !Array.isArray(raw)) {
      data = normalizeKeys(raw as Record<string, unknown>, JD_KEY_MAP);
    }
  } catch {
    // AI 응답 파싱 실패 시 빈 data로 fallback
  }

  return {
    title: typeof data['title'] === 'string' && data['title'].trim().length > 0
      ? data['title'].trim()
      : '',
    company: typeof data['company'] === 'string' ? data['company'] : undefined,
    requiredSkills: toStringArray(data['requiredSkills']),
    preferredSkills: toStringArray(data['preferredSkills']),
    responsibilities: toStringArray(data['responsibilities']),
    rawText: typeof data['rawText'] === 'string' && data['rawText'].trim().length > 0
      ? data['rawText']
      : originalInput,
  };
}

export async function parseJdFromText(jobDescriptionText: string): Promise<JobRequirements> {
  const text = await ollamaChat(`중요: 모든 텍스트 값은 반드시 한국어로 작성하라. 중국어·일본어 사용 절대 금지.

당신은 채용 전문가로서 채용공고에서 핵심 요구사항을 정확하게 파악하는 것이 전문입니다.

아래 채용공고 텍스트를 분석하여 다음 JSON 구조로 반환하라.
${JD_PROMPT_SUFFIX}

채용공고 텍스트:
${jobDescriptionText}`);

  return parseJdResponse(text, jobDescriptionText);
}

export async function parseJdFromImage(
  imageBuffer: Buffer,
  mediaType: 'image/png' | 'image/jpeg'
): Promise<JobRequirements> {
  void mediaType;
  const base64 = imageBuffer.toString('base64');

  const text = await ollamaChatWithImage(
    `중요: 모든 텍스트 값은 반드시 한국어로 작성하라. 중국어·일본어 사용 절대 금지.

위 채용공고 이미지를 분석하여 다음 JSON 구조로 반환하라.
${JD_PROMPT_SUFFIX.replace('아래 채용공고 원본 텍스트', '이미지에서 추출한 텍스트')}`,
    base64,
  );

  return parseJdResponse(text, text);
}
