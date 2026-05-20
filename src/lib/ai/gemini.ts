import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';
const GEMINI_VISION_MODEL = process.env.GEMINI_VISION_MODEL ?? 'gemini-2.5-flash';

const SYSTEM_INSTRUCTION =
  '반드시 JSON 형식으로만 응답하라. 마크다운 코드블록, 설명 텍스트 포함 금지. ' +
  '서술형 텍스트 값은 한글(가-힣)과 ASCII 문자(영문·숫자·문장부호)만 사용하라. ' +
  '기술 스택·프로그래밍 언어·프레임워크·도구명은 영어 표준명을 유지하라(예: React, Python, MySQL). ' +
  '한자(経験·智能·開発·相關 등), 일본어 가나, 러시아어 키릴 문자(изуч 등), 아랍어, 베트남어 등 한글·영문 외 모든 유니코드 문자는 절대 사용 금지. ';

function getClient(): GoogleGenerativeAI {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_AI_API_KEY가 설정되지 않았습니다.');
  return new GoogleGenerativeAI(apiKey);
}

export async function geminiChat(userPrompt: string, model = GEMINI_MODEL): Promise<string> {
  const client = getClient();
  const genModel = client.getGenerativeModel({
    model,
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: { responseMimeType: 'application/json' },
  });
  const result = await genModel.generateContent(userPrompt);
  return result.response.text();
}

export async function geminiChatWithImage(
  userPrompt: string,
  imageBase64: string,
  mediaType: string,
  model = GEMINI_VISION_MODEL,
): Promise<string> {
  const client = getClient();
  const genModel = client.getGenerativeModel({
    model,
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: { responseMimeType: 'application/json' },
  });
  const result = await genModel.generateContent([
    { inlineData: { data: imageBase64, mimeType: mediaType } },
    userPrompt,
  ]);
  return result.response.text();
}
