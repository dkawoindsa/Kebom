import "groq-sdk/shims/node";
import Groq from "groq-sdk";

const GROQ_MODEL = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";
const GROQ_VISION_MODEL =
  process.env.GROQ_VISION_MODEL ?? "meta-llama/llama-4-scout-17b-16e-instruct";

const SYSTEM_PROMPT =
  "반드시 JSON 형식으로만 응답하라. 마크다운 코드블록, 설명 텍스트 포함 금지. " +
  "서술형 텍스트 값은 한글(가-힣)과 ASCII 문자(영문·숫자·문장부호)만 사용하라. " +
  "기술 스택·프로그래밍 언어·프레임워크·도구명은 영어 표준명을 유지하라(예: React, Python, MySQL). " +
  "한자(経験·智能·開発·相關 등), 일본어 가나, 러시아어 키릴 문자(изуч 등), 아랍어, 베트남어 등 한글·영문 외 모든 유니코드 문자는 절대 사용 금지. ";

function getClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY가 설정되지 않았습니다.");
  return new Groq({ apiKey });
}

export async function groqChat(
  userPrompt: string,
  model = GROQ_MODEL,
): Promise<string> {
  const client = getClient();
  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
  });
  return response.choices[0]?.message?.content ?? "";
}

export async function groqChatWithImage(
  userPrompt: string,
  imageBase64: string,
  mediaType: string,
): Promise<string> {
  const client = getClient();
  const response = await client.chat.completions.create({
    model: GROQ_VISION_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: userPrompt },
          {
            type: "image_url",
            image_url: { url: `data:${mediaType};base64,${imageBase64}` },
          },
        ],
      },
    ],
    response_format: { type: "json_object" },
  });
  return response.choices[0]?.message?.content ?? "";
}
