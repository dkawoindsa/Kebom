import { ollamaChat } from './ollama';
import type { ResumeData, ExperienceItem, EducationItem } from '@/types/resume';

const KNOWN_SKILLS: string[] = [
  // Frontend
  'HTML5', 'HTML', 'CSS3', 'CSS', 'JavaScript', 'TypeScript',
  'React', 'Next.js', 'Vue', 'Vue.js', 'Angular', 'Svelte',
  'jQuery', 'SASS', 'SCSS', 'Tailwind CSS', 'Bootstrap',
  // Backend
  'Node.js', 'Express', 'NestJS', 'Spring', 'Spring Boot',
  'Django', 'Flask', 'FastAPI', 'Laravel', 'PHP',
  // Mobile
  'React Native', 'Flutter', 'Swift', 'Kotlin', 'Android', 'iOS',
  // Languages
  'Python', 'Java', 'Go', 'Rust', 'C++', 'C#', 'Ruby', 'Scala',
  // Database
  'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Supabase',
  'SQLite', 'Oracle', 'MariaDB', 'Elasticsearch', 'Firebase',
  // Cloud / DevOps
  'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'Terraform', 'Nginx', 'Linux',
  // Tools
  'Git', 'GitHub', 'GitLab', 'Jira', 'Notion', 'Slack', 'Figma',
  'Postman', 'GraphQL', 'REST API', 'WebSocket',
];

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

function extractSummaryFallback(text: string): string {
  const lines = text.split(/\n/);
  const headingPattern = /^[\s　]*(?:자기소개|직무\s*요약|직무요약|소개|개요|summary|profile)[\s:：]*/i;

  let inSection = false;
  const collected: string[] = [];

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      if (inSection && collected.length > 0) break;
      continue;
    }
    if (headingPattern.test(line)) {
      inSection = true;
      const rest = line.replace(headingPattern, '').trim();
      if (rest) collected.push(rest);
      continue;
    }
    if (inSection) {
      const looksLikeHeading = /^[가-힣A-Za-z]{2,12}[\s:：]?\s*$/.test(line) && line.length <= 15;
      if (looksLikeHeading && collected.length > 0) break;
      collected.push(line);
      if (collected.join(' ').length > 300) break;
    }
  }

  return collected.join(' ').trim();
}

function extractSkillsFromText(text: string): string[] {
  return KNOWN_SKILLS.filter((skill) => {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(?<![a-zA-Z0-9가-힣])${escaped}(?![a-zA-Z0-9가-힣])`, 'i').test(text);
  });
}

export async function parseResume(pdfText: string): Promise<ResumeData> {
  const text = await ollamaChat(`중요: 모든 텍스트 값(summary, description 등)은 반드시 한국어로 작성하라. 중국어·일본어 사용 절대 금지.

당신은 채용 전문가로서 이력서 데이터를 정확하게 추출하는 것이 전문입니다. 주어진 이력서 텍스트에서 구조화된 정보를 빠짐없이 추출하세요.

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
- skills: 아래 우선순위 순서대로 스킬을 추출하라.
  1. "기술 스택" / "기술" / "스킬" / "Skills" 섹션의 테이블 Skill 열 값.
  2. 같은 섹션 내 불릿 리스트(-, *, •, ▪ 로 시작하는 줄)의 각 항목.
  3. 같은 섹션 내 콤마(,), 슬래시(/), 파이프(|)로 구분된 스킬 텍스트.
  각 추출값을 개별 문자열로 분리하라. 경험 설명 텍스트, 회사명, 프로젝트명, 업무 내용 문장 절대 포함 금지. 동일 스킬 중복 제거. 스킬이 없으면 []. 예시: ["HTML5", "CSS", "JavaScript", "TypeScript", "React", "Next.js", "Vue", "MySQL", "Supabase", "Git", "GitHub", "Jira", "Notion", "Slack", "Figma"]
- experience: "직장 경력"과 "프로젝트 경험" 섹션 모두 포함. 프로젝트인 경우 company = 프로젝트명, role = 담당 파트/포지션, period = 프로젝트 기간, description = 담당 구현 기능·수행 내용·성과를 하나의 문자열로 합산. 없으면 [].
- summary: 자기소개·직무요약 섹션이 있으면 그 내용 사용. 없으면 이력서 전체를 바탕으로 2-3문장의 직무 요약을 직접 작성. 절대 빈 문자열 금지.
- education: 학력이 없으면 반드시 빈 배열 [] 로 반환. 생략 금지.
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

  // AI 추출 스킬 + 사전 기반 스캔 결과 병합 (중복 제거, 대소문자 무시)
  const aiSkills = toStringArray(data['skills']);
  const dictSkills = extractSkillsFromText(pdfText);
  const seen = new Set(aiSkills.map((s) => s.toLowerCase()));
  const mergedSkills = [...aiSkills];
  for (const s of dictSkills) {
    if (!seen.has(s.toLowerCase())) {
      seen.add(s.toLowerCase());
      mergedSkills.push(s);
    }
  }

  return {
    name: aiName || extractNameFallback(pdfText),
    contactEmail: aiEmail || extractEmailFallback(pdfText),
    contactPhone: aiPhone || extractPhoneFallback(pdfText),
    summary: (typeof data['summary'] === 'string' && data['summary'].trim().length > 0)
      ? data['summary']
      : extractSummaryFallback(pdfText),
    skills: mergedSkills,
    experience: toExperienceArray(data['experience']),
    education: aiEducation.length > 0 ? aiEducation : extractEducationFallback(pdfText),
    rawText: pdfText,
  };
}
