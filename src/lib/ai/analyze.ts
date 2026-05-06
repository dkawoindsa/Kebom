import { ollamaChat } from './ollama';
import type { ResumeData, JobRequirements } from '@/types/resume';
import type { AnalysisResult } from '@/types/analysis';

export async function analyzeResumeVsJd(
  resume: Omit<ResumeData, 'rawText'>,
  jd: Omit<JobRequirements, 'rawText'>,
): Promise<AnalysisResult> {
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
  "magicFixes": [
    {
      "original": "이력서에서 그대로 발췌한 실제 문장 (verbatim, 한 글자도 바꾸지 않음)",
      "revised": "original 문장을 채용공고 키워드·요구사항을 반영하여 실제 이력서에 바로 쓸 수 있도록 개선한 완성된 문장 (조언·가이드·설명 형식 금지)",
      "reason": "수정 이유 (간결하게 한 문장)"
    }
  ]
}

규칙:
- skillMatches: 채용공고의 모든 requiredSkills와 preferredSkills를 포함하라. 정렬 순서: missing → partial → match
- interviewQuestions: 최대 5개. 이력서의 약점을 파고드는 면접관 관점의 질문
- magicFixes: 최대 5개. 아래 조건을 모두 충족하는 문장만 대상으로 한다.
  대상 섹션 (이 섹션의 문장만 original로 사용):
    - 자기소개 / 직무요약 서술 문장
    - 프로젝트 경험 설명 (experience[].description 내 서술 문장)
    - 보유 역량 서술 (역량·강점 서술 문장)
    - 지원동기 / 커리어 플랜 서술 문장
  제외 대상 (절대 original로 사용 금지):
    - 학교명, 학과명 (예: "명지전문대학교 컴퓨터공학 학과" — 사실 정보, 수정 불가)
    - 이름, 연락처, 이메일 등 개인정보
    - 근무 기간·프로젝트 기간 등 날짜/기간 텍스트
    - 기술 스택 열거 항목 (스킬 목록)
  original은 반드시 주어·서술어가 있는 완전한 서술 문장이어야 한다. 이력서에 verbatim 존재하는 문장만 사용. revised는 이력서에 바로 붙여넣을 수 있는 완성된 문장으로 작성.

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
    !Array.isArray((parsed as Record<string, unknown>)['magicFixes'])
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
  const experienceSummary = summaryParts.join(' ').trim();

  return {
    score,
    scoreReason: typeof data['scoreReason'] === 'string' ? data['scoreReason'] : '',
    experienceSummary,
    skillMatches: data['skillMatches'] as AnalysisResult['skillMatches'],
    interviewQuestions: data['interviewQuestions'] as AnalysisResult['interviewQuestions'],
    magicFixes: data['magicFixes'] as AnalysisResult['magicFixes'],
  };
}
