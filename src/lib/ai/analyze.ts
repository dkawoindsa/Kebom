import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ResumeData, JobRequirements } from "@/types/resume";
import type { AnalysisResult } from "@/types/analysis";

export async function analyzeResumeVsJd(
  resume: Omit<ResumeData, "rawText">,
  jd: Omit<JobRequirements, "rawText">,
): Promise<AnalysisResult> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_AI_API_KEY가 설정되지 않았습니다.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-pro",
    systemInstruction:
      "반드시 JSON 형식으로만 응답하라. 마크다운 코드블록, 설명 텍스트 포함 금지.",
  });

  const result =
    await model.generateContent(`아래 이력서와 채용공고를 비교 분석하여 다음 JSON 구조로 반환하라.

반환 JSON 구조:
{
  "score": 0-100 정수 (이력서와 공고의 전체 매칭 점수),
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
      "original": "이력서의 기존 문장/표현",
      "revised": "공고 키워드를 반영한 개선 버전",
      "reason": "수정 이유"
    }
  ]
}

규칙:
- skillMatches: 채용공고의 모든 requiredSkills와 preferredSkills를 포함하라. 정렬 순서: missing → partial → match
- interviewQuestions: 최대 5개. 이력서의 약점을 파고드는 면접관 관점의 질문
- magicFixes: 최대 5개. 공고 키워드를 반영해 이력서 문장을 개선한 버전

이력서:
${JSON.stringify(resume)}

채용공고:
${JSON.stringify(jd)}`);

  const text = result.response.text();

  let parsed: unknown;
  try {
    const cleaned = text
      .replace(/^```(?:json)?\n?/, "")
      .replace(/\n?```$/, "")
      .trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("AI 응답을 파싱할 수 없습니다.");
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !Array.isArray((parsed as Record<string, unknown>)["skillMatches"]) ||
    !Array.isArray((parsed as Record<string, unknown>)["interviewQuestions"]) ||
    !Array.isArray((parsed as Record<string, unknown>)["magicFixes"])
  ) {
    throw new Error("AI 응답에 필수 필드가 없습니다.");
  }

  const data = parsed as Record<string, unknown>;
  const score = Math.min(100, Math.max(0, Number(data["score"] ?? 0)));

  return {
    score,
    skillMatches: data["skillMatches"] as AnalysisResult["skillMatches"],
    interviewQuestions: data[
      "interviewQuestions"
    ] as AnalysisResult["interviewQuestions"],
    magicFixes: data["magicFixes"] as AnalysisResult["magicFixes"],
  };
}
