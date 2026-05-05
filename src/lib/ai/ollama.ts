const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
export const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'qwen2.5:7b';
export const OLLAMA_VISION_MODEL = process.env.OLLAMA_VISION_MODEL ?? '';

const SYSTEM_PROMPT = '반드시 JSON 형식으로만 응답하라. 마크다운 코드블록, 설명 텍스트 포함 금지.';

export async function ollamaChat(userPrompt: string, model = OLLAMA_MODEL): Promise<string> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      stream: false,
      format: 'json',
    }),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => '');
    throw new Error(`Ollama 요청 실패 (${response.status}): ${err}`);
  }

  const data = (await response.json()) as { message: { content: string } };
  return data.message.content;
}

export async function ollamaChatWithImage(
  userPrompt: string,
  imageBase64: string,
): Promise<string> {
  const model = OLLAMA_VISION_MODEL;
  if (!model) {
    throw new Error(
      '이미지 분석을 위한 비전 모델이 설정되지 않았습니다. OLLAMA_VISION_MODEL 환경변수를 설정하고 llava:7b 등의 모델을 pull 하세요.',
    );
  }

  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt, images: [imageBase64] },
      ],
      stream: false,
      format: 'json',
    }),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => '');
    throw new Error(`Ollama 요청 실패 (${response.status}): ${err}`);
  }

  const data = (await response.json()) as { message: { content: string } };
  return data.message.content;
}
