import { geminiChat as groqChat } from './gemini';
import type { ResumeData, JobRequirements } from '@/types/resume';
import type { AnalysisResult, SkillStatus } from '@/types/analysis';

const VALID_STATUSES = new Set<string>(['match', 'partial', 'missing']);

function isJsonLike(s: string): boolean {
  const t = s.trim();
  return t.startsWith('{') || t.startsWith('[') || t.startsWith('"skills"') || t.startsWith('"skill"');
}

// ASCII + 한글 음절(AC00-D7A3) + 한글 자모(1100-11FF, 3130-318F) 외 모든 문자 제거
function cleanText(text: string): string {
  return text
    .replace(/[^\x00-\x7F가-힣ᄀ-ᇿ㄰-㆏]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function analyzeResumeVsJd(
  resume: Omit<ResumeData, 'rawText'>,
  jd: Omit<JobRequirements, 'rawText'>,
): Promise<AnalysisResult> {
  const MAX_SKILLS = 10;
  const required = jd.requiredSkills.slice(0, MAX_SKILLS);
  const preferred = jd.preferredSkills.slice(0, MAX_SKILLS - required.length);
  const allSkills = [...required, ...preferred];

  const text = await groqChat(`언어 규칙(최우선, 절대 준수):
- scoreReason, evidence, suggestion, question, advice, jobRequirement, recommendation: 반드시 순수한 한국어로만 작성하라.
  허용 문자: 한글(가-힣), 숫자(0-9), 문장부호(.,!?;:()"' 등). 영어 단어·한자·일본어·러시아어·기타 외국어 절대 금지.
  나쁜 예(절대 금지): "経験" "智能" "開発" "изуч" "相關" "Conduct" "경험(経験)"
  좋은 예: "경험" "지능" "개발" "학습하고" "관련" "진행하고"
- suggestion, advice, recommendation, scoreReason: 반드시 존댓말(해요체)로 작성하라. 반말·명령형(~해라, ~하라, ~해봐) 절대 금지.
- skill(스킬명): JD에서 받은 영어 기술명을 그대로 유지하라. 번역하지 마라.

당신은 10년 이상의 기술 채용 경험을 가진 시니어 HR 전문가입니다. 이력서와 채용공고를 전문가적 시각으로 분석하여 지원자의 합격 가능성과 개선 포인트를 정확하게 평가합니다.

아래 이력서와 채용공고를 비교 분석하여 다음 JSON 구조로 반환하라.

반환 JSON 구조:
{
  "score": 0-100 정수 (이력서와 공고의 전체 매칭 점수),
  "scoreReason": "해당 점수인 이유 (2-3문장, 핵심 강점과 부족한 점 포함)",
  "skillMatches": [
    {
      "skill": "스킬명",
      "status": "match" | "partial" | "missing",
      "evidence": "이력서에서 발견된 근거 (match/partial인 경우, 1-2문장)",
      "suggestion": "개선 제안 (partial/missing인 경우, 1-2문장)"
    }
  ],
  "interviewQuestions": [
    {
      "question": "면접관이 물어볼 약점 질문",
      "advice": "대응 방향 (2-4문장)"
    }
  ],
  "gapSuggestions": [
    {
      "jobRequirement": "채용공고 요구사항 (간결한 명사구, 예: '타입스크립트 개발 경험')",
      "recommendation": "해당 요구사항이 이력서에 없거나 부족한 이유를 언급하고 구체적 보완 방향을 2-3문장으로 작성"
    }
  ]
}

규칙:
- skillMatches: 아래 스킬 목록의 각 항목을 이력서와 비교 평가하라. 목록 이외의 스킬은 추가하지 마라. 총 ${allSkills.length}개:
  ${allSkills.map((s, i) => `${i + 1}. ${s}`).join('\n  ')}
  정렬 순서: missing → partial → match
- skillMatches[].suggestion: 항목마다 아래 표현 중 서로 다른 것을 골라 사용하라. 같은 표현 반복 금지.
  사용 가능한 표현 (10가지 이상, 골고루 활용):
  1. "~을 이력서에 추가해 보세요."
  2. "~을 보완하면 경쟁력이 높아집니다."
  3. "~을 통해 역량을 어필할 수 있습니다."
  4. "~에 대한 학습 이력을 포함하면 좋습니다."
  5. "~관련 프로젝트나 자격증을 추가하면 효과적입니다."
  6. "~을 이력서에 명시적으로 드러내세요."
  7. "~역량을 수치나 성과와 함께 서술하면 강점이 됩니다."
  8. "~을 키워드로 포함시키면 서류 통과에 유리합니다."
  9. "~경험을 구체적인 사례와 함께 기술하면 도움이 됩니다."
  10. "~을 강조하면 면접에서 좋은 인상을 줄 수 있습니다."
  11. "~관련 경험이 있다면 이력서에 적극 반영하세요."
  12. "~을 다룬 경험을 간략하게라도 언급하면 유리합니다."
- skillMatches[].evidence: match/partial 항목에서 이력서의 어느 부분에서 확인했는지 구체적으로 서술하라.
- interviewQuestions: 최대 5개. 이력서의 약점을 파고드는 면접관 관점의 질문. 질문은 순수 한국어로, 영어 단어 혼용 금지.
- gapSuggestions: 최대 5개. 채용공고 requiredSkills·preferredSkills·responsibilities 중 이력서에서 전혀 확인되지 않는 항목만 대상으로 한다.
  - skillMatches에서 status가 "match"인 항목은 gapSuggestions에 포함하지 않는다.
  - jobRequirement: 채용공고 요구사항을 간결한 명사구로 작성
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

  const rawInterviewQuestions = Array.isArray(data['interviewQuestions'])
    ? (data['interviewQuestions'] as unknown[])
        .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
        .map((item) => ({
          question: typeof item['question'] === 'string' ? cleanText(item['question']) : '',
          advice: typeof item['advice'] === 'string' ? cleanText(item['advice']) : '',
        }))
        .filter((item) => item.question.length > 0)
    : [];

  const rawGapSuggestions = Array.isArray(data['gapSuggestions'])
    ? (data['gapSuggestions'] as unknown[])
        .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
        .map((item) => ({
          jobRequirement: typeof item['jobRequirement'] === 'string' ? cleanText(item['jobRequirement']) : '',
          recommendation: typeof item['recommendation'] === 'string' ? cleanText(item['recommendation']) : '',
        }))
        .filter((item) => item.jobRequirement.length > 0)
    : [];

  return {
    score,
    scoreReason: typeof data['scoreReason'] === 'string' ? cleanText(data['scoreReason']) : '',
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
                  ? cleanText(item['evidence'])
                  : undefined,
              suggestion:
                typeof item['suggestion'] === 'string' && !isJsonLike(item['suggestion'])
                  ? cleanText(item['suggestion'])
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
    interviewQuestions: rawInterviewQuestions as AnalysisResult['interviewQuestions'],
    gapSuggestions: rawGapSuggestions as AnalysisResult['gapSuggestions'],
  };
}
