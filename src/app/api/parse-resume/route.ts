export const runtime = 'nodejs';
export const maxDuration = 10;

import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromPdf } from '@/lib/pdf';
import { parseResume } from '@/lib/ai/parse-resume';
import type { ParseResumeResponse } from '@/types/api';

const MAX_FILE_SIZE = 4 * 1024 * 1024;

export async function POST(req: NextRequest): Promise<NextResponse> {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: '요청을 읽을 수 없습니다.' }, { status: 400 });
  }

  const resumeFile = formData.get('resume');
  if (!(resumeFile instanceof File)) {
    return NextResponse.json({ error: '이력서 PDF 파일을 업로드해주세요.' }, { status: 400 });
  }

  if (resumeFile.type !== 'application/pdf') {
    return NextResponse.json({ error: '이력서는 PDF 파일만 업로드할 수 있습니다.' }, { status: 400 });
  }

  if (resumeFile.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: '이력서 파일 크기는 4MB를 초과할 수 없습니다.' }, { status: 400 });
  }

  try {
    const resumeBuffer = Buffer.from(await resumeFile.arrayBuffer());
    const pdfText = await extractTextFromPdf(resumeBuffer);
    const resumeData = await parseResume(pdfText);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { rawText: _resumeRaw, ...resumeDataWithoutRaw } = resumeData;

    const response: ParseResumeResponse = { resumeData: resumeDataWithoutRaw };
    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    console.error('[parse-resume] error', err instanceof Error ? err.message : err);
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    const knownMessages = [
      '이력서를 읽을 수 없습니다. 텍스트 기반 PDF를 사용해주세요.',
      '비밀번호로 보호된 PDF는 읽을 수 없습니다. 보호를 해제 후 업로드해주세요.',
      'PDF 파일이 손상되어 읽을 수 없습니다. 다른 파일을 사용해주세요.',
    ];
    if (knownMessages.includes(message)) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    if (message.includes('GOOGLE_AI_API_KEY가 설정되지 않았습니다')) {
      return NextResponse.json(
        { error: 'AI 서비스를 사용할 수 없습니다. 잠시 후 다시 시도해주세요.' },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'AI가 이력서를 분석하는 데 실패했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    );
  }
}
