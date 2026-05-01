export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { analyzeResumeVsJd } from '@/lib/ai/analyze';
import type { AnalyzeRequest, AnalyzeResponse } from '@/types/api';

export async function POST(request: Request): Promise<NextResponse> {
  if (!process.env.GOOGLE_AI_API_KEY) {
    return NextResponse.json({ error: 'API 키가 설정되지 않았습니다.' }, { status: 500 });
  }

  let body: AnalyzeRequest;
  try {
    body = (await request.json()) as AnalyzeRequest;
  } catch {
    return NextResponse.json({ error: '요청 형식이 올바르지 않습니다.' }, { status: 400 });
  }

  if (!body.resumeData) {
    return NextResponse.json({ error: '이력서 데이터가 없습니다.' }, { status: 400 });
  }

  if (!body.jobRequirements) {
    return NextResponse.json({ error: '채용 공고 데이터가 없습니다.' }, { status: 400 });
  }

  try {
    const result = await analyzeResumeVsJd(body.resumeData, body.jobRequirements);
    const response: AnalyzeResponse = { result };
    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    if (message.includes('429') || message.toLowerCase().includes('quota') || message.toLowerCase().includes('rate limit')) {
      return NextResponse.json(
        { error: 'API 사용량 한도를 초과했습니다. Google AI Studio에서 결제 설정을 확인하거나 잠시 후 다시 시도해주세요.' },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'AI 분석에 실패했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    );
  }
}
