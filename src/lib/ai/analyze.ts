import { ollamaChat } from './ollama';
import type { ResumeData, JobRequirements } from '@/types/resume';
import type { AnalysisResult, SkillStatus } from '@/types/analysis';

const VALID_STATUSES = new Set<string>(['match', 'partial', 'missing']);

function isJsonLike(s: string): boolean {
  const t = s.trim();
  return t.startsWith('{') || t.startsWith('[') || t.startsWith('"skills"') || t.startsWith('"skill"');
}

export async function analyzeResumeVsJd(
  resume: Omit<ResumeData, 'rawText'>,
  jd: Omit<JobRequirements, 'rawText'>,
): Promise<AnalysisResult> {
  const MAX_SKILLS = 10;
  const required = jd.requiredSkills.slice(0, MAX_SKILLS);
  const preferred = jd.preferredSkills.slice(0, MAX_SKILLS - required.length);
  const allSkills = [...required, ...preferred];

  const text = await ollamaChat(`중요: scoreReason, experienceSummary, advice, reason 등 모든 텍스트 값은 반드시 한국어로 작성하라. 중국어·일본어 사용 절대 금지.

당신은 10년 이상의 기술 채용 경험을 가진 시니어 HR 전문가입니다. 이력서와 채용공고를 전문가적 시각으로 분석하여 지원자의 합격 가능성과 개선 포인트를 정확하게 평가합니다.

아래 이력서와 채용공고를 비교 분석하여 다음 JSON 구조로 반환하라.

반환 JSON 구조:
{
  "score": 0-100 정수 (이력서와 공고의 전체 매칭 점수),
  "scoreReason": "해당 점수인 이유 (한국어 2-3문장, 핵심 강점과 부족한 점 포함)",
  "skillMatches": [
    {
      "skill": "스킬명",
      "status": "match" | "partial" | "missing",
      "evidence": "이력서에서 발견된 근거 텍스트 (match/partial인 경우)",
      "suggestion": "개선 제안 (partial/missing인 경우)"
    }
  ],
  "interviewQuestions": [
    {
      "question": "면접관이 물어볼 약점 질문",
      "advice": "대응 방향 (한국어 2-4문장)"
    }
  ],
  "gapSuggestions": [
    {
      "jobRequirement": "채용공고 요구사항 (간결한 명사구, 예: 'TypeScript 개발 경험')",
      "recommendation": "해당 요구사항이 이력서에 없거나 부족한 이유를 언급하고 구체적 보완 방향을 2-3문장으로 작성"
    }
  ]
}

규칙:
- skillMatches: 아래 스킬 목록의 각 항목을 이력서와 비교 평가하라. 목록 이외의 스킬은 추가하지 마라. 총 ${allSkills.length}개:
  ${allSkills.map((s, i) => `${i + 1}. ${s}`).join('\n  ')}
  정렬 순서: missing → partial → match
- interviewQuestions: 최대 5개. 이력서의 약점을 파고드는 면접관 관점의 질문
- gapSuggestions: 최대 5개. 채용공고 requiredSkills·preferredSkills·responsibilities 중 이력서에서 전혀 확인되지 않는 항목만 대상으로 한다.
  - skillMatches에서 status가 "match"인 항목은 gapSuggestions에 포함하지 않는다.
  - jobRequirement: 채용공고 요구사항을 간결한 명사구로 작성 (예: "TypeScript 개발 경험", "Docker 컨테이너 운영")
  - recommendation: 항목마다 문체를 다양하게 변화시킬 것. 가능한 어미 예시: "~을 추가해 보세요.", "~이 도움이 됩니다.", "~을 통해 역량을 어필할 수 있습니다.", "~을 이력서에 포함하는 것을 권장합니다.", "~을 강조하면 좋습니다." — 모든 항목에 동일한 어미 사용 금지

이력서:
${JSON.stringify(resume)}

채용공고:
${JSON.stringify(jd)}`);

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
    !Array.isArray((parsed as Record<string, unknown>)['skillMatches']) ||
    !Array.isArray((parsed as Record<string, unknown>)['interviewQuestions']) ||
    !Array.isArray((parsed as Record<string, unknown>)['gapSuggestions'])
  ) {
    throw new Error('AI 응답에 필수 필드가 없습니다.');
  }

  const data = parsed as Record<string, unknown>;
  const score = Math.min(100, Math.max(0, Number(data['score'] ?? 0)));

  // 파싱된 resume 데이터로 직접 구성 (AI 재생성 불필요)
  const summaryParts: string[] = [];
  if (resume.summary?.trim()) summaryParts.push(resume.summary.trim());
  const expDescriptions = resume.experience
    .slice(0, 2)
    .map((e) => e.description?.trim())
    .filter((d): d is string => !!d && d.length > 0);
  summaryParts.push(...expDescriptions);
  const projDescriptions = (resume.projects ?? [])
    .slice(0, 3)
    .map((p) => p.description?.trim())
    .filter((d): d is string => !!d && d.length > 0);
  summaryParts.push(...projDescriptions);
  const experienceSummary = summaryParts.join(' ').trim();

  return {
    score,
    scoreReason: typeof data['scoreReason'] === 'string' ? data['scoreReason'] : '',
    experienceSummary,
    skillMatches: (() => {
      const parsed = Array.isArray(data['skillMatches'])
        ? (data['skillMatches'] as unknown[])
            .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
            .map((item) => ({
              skill: typeof item['skill'] === 'string' ? item['skill'].trim() : '',
              status: VALID_STATUSES.has(item['status'] as string)
                ? (item['status'] as SkillStatus)
                : ('missing' as SkillStatus),
              evidence:
                typeof item['evidence'] === 'string' && !isJsonLike(item['evidence'])
                  ? item['evidence']
                  : undefined,
              suggestion:
                typeof item['suggestion'] === 'string' && !isJsonLike(item['suggestion'])
                  ? item['suggestion']
                  : undefined,
            }))
            .filter((item) => item.skill.length > 0)
        : [];
      const covered = new Set(parsed.map((m) => m.skill.toLowerCase().trim()));
      for (const skill of allSkills) {
        if (!covered.has(skill.toLowerCase().trim())) {
          parsed.push({ skill, status: 'missing' as SkillStatus, evidence: undefined, suggestion: undefined });
        }
      }
      return parsed;
    })(),
    interviewQuestions: data['interviewQuestions'] as AnalysisResult['interviewQuestions'],
    gapSuggestions: data['gapSuggestions'] as AnalysisResult['gapSuggestions'],
  };
}
