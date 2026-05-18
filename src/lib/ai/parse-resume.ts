import { groqChat } from "./groq";
import type { ResumeData, ExperienceItem, EducationItem } from "@/types/resume";

const KNOWN_SKILLS: string[] = [
  // Frontend
  "HTML5",
  "HTML",
  "CSS3",
  "CSS",
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Vue",
  "Vue.js",
  "Angular",
  "Svelte",
  "jQuery",
  "SASS",
  "SCSS",
  "Tailwind CSS",
  "Bootstrap",
  // Backend
  "Node.js",
  "Express",
  "NestJS",
  "Spring",
  "Spring Boot",
  "Django",
  "Flask",
  "FastAPI",
  "Laravel",
  "PHP",
  // Mobile
  "React Native",
  "Flutter",
  "Swift",
  "Kotlin",
  "Android",
  "iOS",
  // Languages
  "Python",
  "Java",
  "Go",
  "Rust",
  "C++",
  "C#",
  "Ruby",
  "Scala",
  // Database
  "MySQL",
  "PostgreSQL",
  "MongoDB",
  "Redis",
  "Supabase",
  "SQLite",
  "Oracle",
  "MariaDB",
  "Elasticsearch",
  "Firebase",
  // Cloud / DevOps
  "AWS",
  "GCP",
  "Azure",
  "Docker",
  "Kubernetes",
  "Terraform",
  "Nginx",
  "Linux",
  // Tools
  "Git",
  "GitHub",
  "GitLab",
  "Jira",
  "Notion",
  "Slack",
  "Figma",
  "Postman",
  "GraphQL",
  "REST API",
  "WebSocket",
];

const TOP_KEY_MAP: Record<string, string> = {
  이름: "name",
  성명: "name",
  이메일: "contactEmail",
  연락처: "contactPhone",
  전화번호: "contactPhone",
  전화: "contactPhone",
  요약: "summary",
  자기소개: "summary",
  "직무 요약": "summary",
  직무요약: "summary",
  기술: "skills",
  "기술 스택": "skills",
  스킬: "skills",
  기술스택: "skills",
  경력: "experience",
  커리어: "experience",
  "직장 경력": "experience",
  "업무 경력": "experience",
  직장경력: "experience",
  학력: "education",
  교육: "education",
  "교육 배경": "education",
  교육배경: "education",
  "원본 텍스트": "rawText",
  원본텍스트: "rawText",
};

const EXP_KEY_MAP: Record<string, string> = {
  회사명: "company",
  회사: "company",
  직책: "role",
  역할: "role",
  기간: "period",
  "업무 설명": "description",
  "담당 업무": "description",
  설명: "description",
  업무설명: "description",
};

const EDU_KEY_MAP: Record<string, string> = {
  학교명: "institution",
  학교: "institution",
  학위: "degree",
  전공: "degree",
  기간: "period",
};

const SUMMARY_HEADERS = [
  "자기소개",
  "자소서",
  "자기 PR",
  "자기PR",
  "본인 소개",
  "본인소개",
  "소개",
  "개요",
  "요약",
  "직무 요약",
  "직무요약",
  "직무 소개",
  "직무소개",
  "프로필",
  "인사말",
  "강점",
  "핵심역량",
  "핵심 역량",
  "어필 포인트",
  "어필포인트",
  "나를 소개합니다",
  "포부",
  "지원 동기",
  "지원동기",
  "About Me",
  "About",
  "Summary",
  "Profile",
  "Introduction",
  "Objective",
  "Career Objective",
  "Professional Summary",
  "Bio",
  "Personal Statement",
];

const EXPERIENCE_HEADERS = [
  "경력 사항",
  "경력사항",
  "직장 경력",
  "직장경력",
  "업무 경력",
  "업무경력",
  "업무 경험",
  "업무경험",
  "근무 경력",
  "근무경력",
  "경력",
  "커리어",
  "인턴십",
  "인턴 경험",
  "인턴경험",
  "수상 경력",
  "수상경력",
  "수상 내역",
  "수상내역",
  "대외 활동",
  "대외활동",
  "Work Experience",
  "Professional Experience",
  "Experience",
  "Employment",
  "Career",
  "Internship",
  "Work History",
];

const PROJECT_HEADERS = [
  "프로젝트 경험",
  "프로젝트경험",
  "프로젝트 경력",
  "프로젝트경력",
  "주요 프로젝트",
  "주요프로젝트",
  "개인 프로젝트",
  "개인프로젝트",
  "사이드 프로젝트",
  "사이드프로젝트",
  "팀 프로젝트",
  "팀프로젝트",
  "토이 프로젝트",
  "토이프로젝트",
  "오픈소스",
  "오픈 소스",
  "포트폴리오",
  "프로젝트",
  "Project Experience",
  "Projects",
  "Project",
  "Portfolio",
  "Open Source",
];

const ALL_KNOWN_HEADERS = [
  ...SUMMARY_HEADERS,
  ...EXPERIENCE_HEADERS,
  ...PROJECT_HEADERS,
  "학력",
  "교육",
  "교육 배경",
  "교육배경",
  "기술",
  "기술 스택",
  "기술스택",
  "스킬",
  "자격증",
  "수상",
  "수상 내역",
  "수상내역",
  "활동",
  "대외 활동",
  "대외활동",
  "Education",
  "Skills",
  "Tech Stack",
  "Certifications",
  "Awards",
  "Activities",
];

const HEADER_PREFIX_RE = /^[\s　]*[■▶◆●▪▷▸◼◾#＃[\(〔【]?\s*/;

const COMPANY_TOKEN_RE =
  /\(주\)|㈜|주식회사|유한회사|재단법인|사단법인|\bInc\.?|\bCorp\.?|\bCo\.?,?\s*Ltd\.?|\bLLC\b|\bLtd\.?/i;

const PROJECT_TITLE_RE =
  /^[-\s]*(?:프로젝트\s*제목|Project\s*(?:Title|Name))\s*[:：]\s*(.+)/i;

const ROLE_TOKEN_RE =
  /(개발자|엔지니어|디자이너|매니저|리드|대표|연구원|컨설턴트|아키텍트|프론트엔드|백엔드|풀스택|기획자|데이터|분석가|PM|PO|CTO|CEO|CIO|DBA|QA|SRE|인턴|Developer|Engineer|Designer|Manager|Lead|Director|Architect|Frontend|Backend|Fullstack|DevOps|Intern|Consultant|Analyst)/i;

const DATE_RANGE_RE = new RegExp(
  [
    String.raw`\d{4}[./\-]\d{1,2}\s*[~\-–]\s*\d{4}[./\-]\d{1,2}`,
    String.raw`\d{4}[./\-]\d{1,2}\s*[~\-–]\s*(?:현재|재직중|재직 중|진행중|진행 중|Present|Now)`,
    String.raw`\d{4}\s*[~\-–]\s*\d{4}`,
    String.raw`\d{4}\s*[~\-–]\s*(?:현재|재직중|Present)`,
    String.raw`\d{4}년\s*\d{1,2}월\s*[~\-–]\s*\d{4}년\s*\d{1,2}월`,
    String.raw`\d{4}년\s*\d{1,2}월\s*[~\-–]\s*(?:현재|재직중|진행중)`,
    String.raw`(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s*\d{4}\s*[-–~]\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s*\d{4}`,
    String.raw`(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s*\d{4}\s*[-–~]\s*(?:Present|Now)`,
  ].join("|"),
  "i",
);

const BULLET_RE = /^[\s　]*[-*•▪·・◦‣]\s*/;

function normalizeKeys(
  obj: Record<string, unknown>,
  map: Record<string, string>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    result[map[k] ?? k] = v;
  }
  return result;
}

function toStringArray(v: unknown): string[] {
  if (Array.isArray(v))
    return v.filter((x): x is string => typeof x === "string");
  return [];
}

function toExperienceArray(v: unknown): ExperienceItem[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null,
    )
    .map((item) => {
      const n = normalizeKeys(item, EXP_KEY_MAP);
      return {
        company: typeof n["company"] === "string" ? n["company"] : "",
        role: typeof n["role"] === "string" ? n["role"] : "",
        period: typeof n["period"] === "string" ? n["period"] : "",
        description:
          typeof n["description"] === "string" ? n["description"] : "",
      };
    });
}

function toEducationArray(v: unknown): EducationItem[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null,
    )
    .map((item) => {
      const n = normalizeKeys(item, EDU_KEY_MAP);
      return {
        institution:
          typeof n["institution"] === "string" ? n["institution"] : "",
        degree: typeof n["degree"] === "string" ? n["degree"] : "",
        period: typeof n["period"] === "string" ? n["period"] : "",
      };
    });
}

function extractNameFallback(text: string): string {
  const lines = text
    .split(/\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  for (const line of lines) {
    if (/^[가-힣]{2,5}$/.test(line)) return line;
  }
  return "";
}

function extractEmailFallback(text: string): string {
  const m = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  return m ? m[0] : "";
}

function extractPhoneFallback(text: string): string | undefined {
  const m = text.match(/01[0-9][.\-\s]?\d{3,4}[.\-\s]?\d{4}/);
  return m ? m[0].replace(/[\s.]/g, "-") : undefined;
}

function extractEducationFallback(text: string): EducationItem[] {
  const EDU_HEADERS = ["학력", "교육", "교육 배경", "교육배경", "Education"];
  const lines = text.split(/\n/);
  const section = sliceSection(lines, EDU_HEADERS);

  const results: EducationItem[] = [];
  let buf: string[] = [];

  const flush = () => {
    if (buf.length === 0) return;
    const joined = buf.join(" ");
    const schoolMatch = joined.match(
      /([\w가-힣]+(?:대학교|전문대학교|고등학교|대학원)[\w가-힣\s]*)/,
    );
    if (schoolMatch) {
      const institution = (schoolMatch[1] ?? "").trim();
      let degree = "";
      for (const ln of buf) {
        const m = ln.match(
          /([가-힣]+(?:공학|학과|전공|계열|학부|대학원)[\w가-힣\s]*)/,
        );
        if (m) { degree = (m[1] ?? "").trim(); break; }
      }
      const periodMatch = joined.match(DATE_RANGE_RE);
      results.push({ institution, degree, period: periodMatch ? periodMatch[0].trim() : "" });
    }
    buf = [];
  };

  for (const line of section) {
    if (!line.trim()) {
      if (buf.some((l) => l.trim())) flush();
    } else {
      buf.push(line);
    }
  }
  flush();

  return results;
}

function stripHeaderPrefix(line: string): string {
  return line
    .replace(HEADER_PREFIX_RE, "")
    .replace(/[\s:：]+$/, "")
    .trim();
}

function isHeaderLine(
  line: string,
  headers: string[],
): { matched: boolean; rest: string } {
  const trimmed = line.trim();
  if (trimmed.length === 0 || trimmed.length > 30)
    return { matched: false, rest: "" };
  const stripped = stripHeaderPrefix(trimmed);
  for (const h of headers) {
    const re = new RegExp(
      `^${h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:[\\s:：](.*))?$`,
      "i",
    );
    const m = stripped.match(re);
    if (m) return { matched: true, rest: (m[1] ?? "").trim() };
  }
  return { matched: false, rest: "" };
}

function isAnyKnownHeader(line: string): boolean {
  return isHeaderLine(line, ALL_KNOWN_HEADERS).matched;
}

function extractSummaryFallback(text: string): string {
  const lines = text.split(/\n/);
  const collected: string[] = [];
  let inSection = false;
  let blankRun = 0;

  for (const raw of lines) {
    const line = raw.trim();
    const headerCheck = isHeaderLine(line, SUMMARY_HEADERS);

    if (headerCheck.matched) {
      inSection = true;
      blankRun = 0;
      if (headerCheck.rest) collected.push(headerCheck.rest);
      continue;
    }

    if (!inSection) continue;

    if (!line) {
      blankRun += 1;
      if (blankRun >= 2 && collected.length > 0) break;
      continue;
    }
    blankRun = 0;

    if (isAnyKnownHeader(line)) break;

    collected.push(line);
    if (collected.join(" ").length > 600) break;
  }

  return collected.join(" ").replace(/\s+/g, " ").trim();
}

function sliceSection(lines: string[], headers: string[]): string[] {
  const result: string[] = [];
  let inSection = false;
  let blankRun = 0;

  for (const raw of lines) {
    const line = raw.trim();
    const headerCheck = isHeaderLine(line, headers);

    if (headerCheck.matched) {
      inSection = true;
      blankRun = 0;
      if (headerCheck.rest) result.push(headerCheck.rest);
      continue;
    }

    if (!inSection) continue;

    if (!line) {
      blankRun += 1;
      if (blankRun >= 3) {
        inSection = false;
        blankRun = 0;
      } else {
        result.push("");
      }
      continue;
    }
    blankRun = 0;

    if (isAnyKnownHeader(line)) {
      inSection = false;
      continue;
    }

    result.push(line);
  }

  return result;
}

function isEntryStart(line: string, prevBlank: boolean): boolean {
  if (!line.trim()) return false;
  if (!prevBlank) return false;
  if (DATE_RANGE_RE.test(line)) return true;
  if (COMPANY_TOKEN_RE.test(line)) return true;
  if (PROJECT_TITLE_RE.test(line)) return true;
  return false;
}

function extractCompanyFromLine(line: string): string {
  const m = line.match(
    /[가-힣A-Za-z0-9]+(?:\s*[가-힣A-Za-z0-9&]+)*\s*(?:\(주\)|㈜|주식회사|유한회사|Inc\.?|Corp\.?|Co\.?,?\s*Ltd\.?|LLC|Ltd\.?)/i,
  );
  if (m) return m[0].trim();
  const reverse = line.match(
    /(?:\(주\)|㈜|주식회사|유한회사)\s*[가-힣A-Za-z0-9]+(?:\s*[가-힣A-Za-z0-9&]+)*/,
  );
  if (reverse) return reverse[0].trim();
  return line
    .trim()
    .split(/[\s\t]+/)
    .slice(0, 4)
    .join(" ");
}

function buildEntry(entryLines: string[]): ExperienceItem | null {
  const joined = entryLines.join("\n");
  if (!joined.trim()) return null;

  const periodMatch = joined.match(DATE_RANGE_RE);
  const period = periodMatch ? periodMatch[0].replace(/\s+/g, " ").trim() : "";

  let company = "";
  let companyLineIdx = -1;
  for (let i = 0; i < entryLines.length; i++) {
    const ln = entryLines[i] ?? "";
    const projTitle = ln.match(PROJECT_TITLE_RE);
    if (projTitle) {
      company = (projTitle[1] ?? "").trim();
      companyLineIdx = i;
      break;
    }
    if (COMPANY_TOKEN_RE.test(ln)) {
      company = extractCompanyFromLine(ln);
      companyLineIdx = i;
      break;
    }
  }
  if (!company && entryLines.length > 0) {
    const firstNonDate = entryLines.find(
      (l) => l.trim() && !DATE_RANGE_RE.test(l),
    );
    if (firstNonDate) {
      company = firstNonDate.replace(PROJECT_LABEL_RE, "").trim().slice(0, 40);
    }
  }

  let role = "";
  let roleLineIdx = -1;
  for (let i = 0; i < entryLines.length; i++) {
    const ln = entryLines[i] ?? "";
    const m = ln.match(ROLE_TOKEN_RE);
    if (m && i !== companyLineIdx) {
      const ctxMatch = ln.match(
        /[가-힣A-Za-z]{0,10}(?:개발자|엔지니어|디자이너|매니저|리드|대표|연구원|컨설턴트|아키텍트|프론트엔드|백엔드|풀스택|기획자|Developer|Engineer|Designer|Manager|Lead|Director|Architect|Frontend|Backend|Fullstack|Intern|Consultant)/i,
      );
      role = (ctxMatch ? ctxMatch[0] : m[0]).trim();
      roleLineIdx = i;
      break;
    }
  }

  const descParts: string[] = [];
  for (let i = 0; i < entryLines.length; i++) {
    if (i === companyLineIdx || i === roleLineIdx) continue;
    const ln = (entryLines[i] ?? "").trim();
    if (!ln) continue;
    if (
      DATE_RANGE_RE.test(ln) &&
      ln.replace(DATE_RANGE_RE, "").trim().length === 0
    )
      continue;
    const stripped = ln.replace(BULLET_RE, "").trim();
    if (stripped) descParts.push(stripped);
    if (descParts.join(" ").length > 500) break;
  }
  const description = descParts
    .join(" ")
    .replace(/\s+/g, " ")
    .slice(0, 500)
    .trim();

  if (!company && !period) return null;

  return { company, role, period, description };
}

function extractExperienceFromSection(
  sectionLines: string[],
): ExperienceItem[] {
  const entries: ExperienceItem[] = [];
  let buf: string[] = [];
  let prevBlank = true;

  const flush = () => {
    if (buf.length > 0) {
      const entry = buildEntry(buf);
      if (entry) entries.push(entry);
      buf = [];
    }
  };

  for (const raw of sectionLines) {
    const line = raw;
    const blank = line.trim() === "";

    if (blank) {
      prevBlank = true;
      buf.push(line);
      continue;
    }

    if (isEntryStart(line, prevBlank) && buf.some((l) => l.trim())) {
      flush();
    }

    buf.push(line);
    prevBlank = false;
  }
  flush();

  return entries;
}

function extractExperienceFallback(text: string): ExperienceItem[] {
  const lines = text.split(/\n/);
  const expSection = sliceSection(lines, EXPERIENCE_HEADERS);
  return extractExperienceFromSection(expSection);
}

function splitProjectEntriesAtDates(lines: string[]): string[][] {
  const dateLineIdxs = lines.reduce<number[]>((acc, l, i) => {
    if (DATE_RANGE_RE.test(l)) acc.push(i);
    return acc;
  }, []);

  if (dateLineIdxs.length <= 1) return [lines];

  const entryStarts: number[] = [0];
  for (let d = 1; d < dateLineIdxs.length; d++) {
    const dateIdx = dateLineIdxs[d]!;
    let lastBlank = -1;
    for (let i = dateIdx - 1; i >= (entryStarts[entryStarts.length - 1] ?? 0); i--) {
      if (!(lines[i] ?? "").trim()) {
        lastBlank = i;
        break;
      }
    }
    entryStarts.push(lastBlank >= 0 ? lastBlank + 1 : dateIdx);
  }

  return entryStarts.map((start, e) =>
    lines.slice(start, e + 1 < entryStarts.length ? entryStarts[e + 1] : lines.length),
  );
}

function extractProjectsFromSection(sectionLines: string[]): ExperienceItem[] {
  const chunks = splitProjectEntriesAtDates(sectionLines);
  if (chunks.length > 1) {
    return chunks.map(buildEntry).filter((e): e is ExperienceItem => e !== null);
  }
  return extractExperienceFromSection(sectionLines);
}

function extractProjectsFallback(text: string): ExperienceItem[] {
  const lines = text.split(/\n/);
  const projSection = sliceSection(lines, PROJECT_HEADERS);
  return extractProjectsFromSection(projSection);
}

const PROJECT_LABEL_RE = /^[-\s]*(?:프로젝트\s*제목|제목)\s*[:：]\s*/i;

function extractProjectSummaryFallback(text: string): string {
  const projEntries = extractProjectsFallback(text);
  if (projEntries.length === 0) return "";

  const sentences = projEntries
    .filter((e) => e.company)
    .map((e) => {
      const cleanCompany = e.company.replace(PROJECT_LABEL_RE, "").trim();
      const roleStr = e.role ? `${e.role}로 ` : "";
      return `${cleanCompany} 프로젝트에서 ${roleStr}개발에 참여하였습니다.`;
    });
  return sentences.join(" ");
}

export function extractSkillsFromText(text: string): string[] {
  return KNOWN_SKILLS.filter((skill) => {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(
      `(?<![a-zA-Z0-9가-힣])${escaped}(?![a-zA-Z0-9가-힣])`,
      "i",
    ).test(text);
  });
}

export async function parseResume(pdfText: string): Promise<ResumeData> {
  const text =
    await groqChat(`중요 언어 규칙:
- summary, description, role, company, institution, degree: 반드시 한국어로만 작성하라. 영어 단어 금지.
- skills: 기술 스택은 영어 표준명 유지 (예: HTML5, JavaScript, React, MySQL).
- 한자(漢字), 일본어, 아랍어 등 한국어·영어 외 모든 문자는 어떤 필드에도 절대 사용하지 마라.

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
- experience: "직장 경력" 섹션만 포함. 실제 회사 재직·인턴십·아르바이트·대회 수상 등의 이력만 포함하라. "프로젝트 경험" 섹션은 절대 포함 금지. 없으면 [].
- summary: 자기소개·직무요약 섹션이 있으면 그 내용 사용. 없으면 "프로젝트 경험" 섹션을 기반으로 프로젝트별 한 문장씩 요약하여 작성하라. 예: "프로젝트에서 프론트엔드 개발자로 뉴스 스크랩 및 마이페이지 기능을 담당하였습니다. Wibby 프로젝트에서는 모임 관리 기능을 개발하였습니다." 절대 빈 문자열 금지.
- education: 학력이 없으면 반드시 빈 배열 [] 로 반환. 생략 금지.
- 위 8개 필드 외에 다른 필드를 추가하지 마라.
- rawText는 아래 이력서 원본 텍스트를 그대로 포함시켜라.

이력서 텍스트:
${pdfText}`);

  let data: Record<string, unknown> = {};
  try {
    const cleaned = text
      .replace(/^```(?:json)?\n?/, "")
      .replace(/\n?```$/, "")
      .trim();
    const raw = JSON.parse(cleaned);
    if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
      data = normalizeKeys(raw as Record<string, unknown>, TOP_KEY_MAP);
    }
  } catch {
    // AI 응답 파싱 실패 시 폴백으로 진행
  }

  const aiName = typeof data["name"] === "string" ? data["name"].trim() : "";
  const aiEmail =
    typeof data["contactEmail"] === "string" ? data["contactEmail"] : "";
  const aiPhone =
    typeof data["contactPhone"] === "string" ? data["contactPhone"] : undefined;
  const aiEducation = toEducationArray(data["education"]);
  const aiExperience = toExperienceArray(data["experience"]);

  const aiSkills = toStringArray(data["skills"]);
  const dictSkills = extractSkillsFromText(pdfText);
  const seen = new Set(aiSkills.map((s) => s.toLowerCase()));
  const mergedSkills = [...aiSkills];
  for (const s of dictSkills) {
    if (!seen.has(s.toLowerCase())) {
      seen.add(s.toLowerCase());
      mergedSkills.push(s);
    }
  }

  const aiSummary =
    typeof data["summary"] === "string" ? data["summary"].trim() : "";

  return {
    name: aiName || extractNameFallback(pdfText),
    contactEmail: aiEmail || extractEmailFallback(pdfText),
    contactPhone: aiPhone || extractPhoneFallback(pdfText),
    summary:
      aiSummary ||
      extractSummaryFallback(pdfText) ||
      extractProjectSummaryFallback(pdfText),
    skills: mergedSkills,
    experience:
      aiExperience.length > 0
        ? aiExperience
        : extractExperienceFallback(pdfText),
    projects: extractProjectsFallback(pdfText),
    education:
      aiEducation.length > 0 ? aiEducation : extractEducationFallback(pdfText),
    rawText: pdfText,
  };
}

export const __test__ = {
  extractSummaryFallback,
  extractExperienceFallback,
  extractProjectsFallback,
  extractProjectSummaryFallback,
  extractEducationFallback,
  isHeaderLine,
  sliceSection,
};
