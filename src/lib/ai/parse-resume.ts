import { ollamaChat } from './ollama';
import type { ResumeData, ExperienceItem, EducationItem } from '@/types/resume';

const TOP_KEY_MAP: Record<string, string> = {
  '이름': 'name', '성명': 'name',
  '이메일': 'contactEmail',
  '연락처': 'contactPhone', '전화번호': 'contactPhone', '전화': 'contactPhone',
  '요약': 'summary', '자기소개': 'summary', '직무 요약': 'summary', '직무요약': 'summary',
  '기술': 'skills', '기술 스택': 'skills', '스킬': 'skills', '기술스택': 'skills',
  '경력': 'experience', '커리어': 'experience', '직장 경력': 'experience', '업무 경력': 'experience', '직장경력': 'experience',
  '학력': 'education', '교육': 'education', '교육 배경': 'education', '교육배경': 'education',
  '원본 텍스트': 'rawText', '원본텍스트': 'rawText',
};

const EXP_KEY_MAP: Record<string, string> = {
  '회사명': 'company', '회사': 'company',
  '직책': 'role', '역할': 'role',
  '기간': 'period',
  '업무 설명': 'description', '담당 업무': 'description', '설명': 'description', '업무설명': 'description',
};

const EDU_KEY_MAP: Record<string, string> = {
  '학교명': 'institution', '학교': 'institution',
  '학위': 'degree', '전공': 'degree',
  '기간': 'period',
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

function toExperienceArray(v: unknown): ExperienceItem[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => {
      const n = normalizeKeys(item, EXP_KEY_MAP);
      return {
        company: typeof n['company'] === 'string' ? n['company'] : '',
        role: typeof n['role'] === 'string' ? n['role'] : '',
        period: typeof n['period'] === 'string' ? n['period'] : '',
        description: typeof n['description'] === 'string' ? n['description'] : '',
      };
    });
}

function toEducationArray(v: unknown): EducationItem[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => {
      const n = normalizeKeys(item, EDU_KEY_MAP);
      return {
        institution: typeof n['institution'] === 'string' ? n['institution'] : '',
        degree: typeof n['degree'] === 'string' ? n['degree'] : '',
        period: typeof n['period'] === 'string' ? n['period'] : '',
      };
    });
}

function extractNameFallback(text: string): string {
  const lines = text.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);
  for (const line of lines) {
    if (/^[가-힣]{2,5}$/.test(line)) return line;
  }
  return '';
}

function extractEmailFallback(text: string): string {
  const m = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  return m ? m[0] : '';
}

function extractPhoneFallback(text: string): string | undefined {
  const m = text.match(/01[0-9][.\-\s]?\d{3,4}[.\-\s]?\d{4}/);
  return m ? m[0].replace(/[\s.]/g, '-') : undefined;
}

function extractEducationFallback(text: string): EducationItem[] {
  const results: EducationItem[] = [];
  // "YYYY.MM ~ YYYY.MM  학교명  학과/전공" 패턴을 찾음
  const lines = text.split(/\n/);
  for (const line of lines) {
    const schoolMatch = line.match(/([\w가-힣]+(?:대학교|전문대학교|고등학교|대학원)[\w가-힣\s]*)/);
    if (!schoolMatch) continue;
    const institution = (schoolMatch[1] ?? '').trim();
    const degreeMatch = line.match(/([가-힣]+(?:공학|학과|전공|계열|학부|대학원)[\w가-힣\s]*)/);
    const degree = degreeMatch ? (degreeMatch[1] ?? '').trim() : '';
    const periodMatch = line.match(/(\d{4}[.\-]\d{2}\s*[~\-–]\s*\d{4}[.\-]\d{2}|\d{4}[.\-]\d{2}\s*[~\-–]\s*(?:현재|재학중))/);
    const period = periodMatch ? (periodMatch[1] ?? '').trim() : '';
    results.push({ institution, degree, period });
  }
  return results;
}

export async function parseResume(pdfText: string): Promise<ResumeData> {
  const text = await ollamaChat(`당신은 채용 전문가로서 이력서 데이터를 정확하게 추출하는 것이 전문입니다. 주어진 이력서 텍스트에서 구조화된 정보를 빠짐없이 추출하세요.

아래 이력서 텍스트를 분석하여 다음 JSON 구조로 반환하라.

반환 JSON 구조:
{
  "name": "이름",
  "contactEmail": "이메일",
  "contactPhone": "전화번호 (없으면 null)",
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

규칙:
- 필드 이름은 반드시 위의 영어 키를 사용하라. 한국어 필드명 사용 금지.
- experience: 직장 경력이 없으면 반드시 빈 배열 [] 로 반환. 생략 금지.
- education: 학력이 없으면 반드시 빈 배열 [] 로 반환. 생략 금지.
- skills: 스킬이 없으면 반드시 빈 배열 [] 로 반환. 생략 금지.
- 위 8개 필드 외에 다른 필드를 추가하지 마라.
- rawText는 아래 이력서 원본 텍스트를 그대로 포함시켜라.

이력서 텍스트:
${pdfText}`);

  let data: Record<string, unknown> = {};
  try {
    const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    const raw = JSON.parse(cleaned);
    if (typeof raw === 'object' && raw !== null && !Array.isArray(raw)) {
      data = normalizeKeys(raw as Record<string, unknown>, TOP_KEY_MAP);
    }
  } catch {
    // AI 응답 파싱 실패 시 폴백으로 진행
  }

  const aiName = typeof data['name'] === 'string' ? data['name'].trim() : '';
  const aiEmail = typeof data['contactEmail'] === 'string' ? data['contactEmail'] : '';
  const aiPhone = typeof data['contactPhone'] === 'string' ? data['contactPhone'] : undefined;
  const aiEducation = toEducationArray(data['education']);

  return {
    name: aiName || extractNameFallback(pdfText),
    contactEmail: aiEmail || extractEmailFallback(pdfText),
    contactPhone: aiPhone || extractPhoneFallback(pdfText),
    summary: typeof data['summary'] === 'string' ? data['summary'] : '',
    skills: toStringArray(data['skills']),
    experience: toExperienceArray(data['experience']),
    education: aiEducation.length > 0 ? aiEducation : extractEducationFallback(pdfText),
    rawText: pdfText,
  };
}
