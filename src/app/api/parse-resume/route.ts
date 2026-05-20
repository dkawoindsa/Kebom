export const runtime = 'nodejs';
export const maxDuration = 10;

import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromPdf } from '@/lib/pdf';
import { parseResume } from '@/lib/ai/parse-resume';
import { parseJdFromText, parseJdFromImage } from '@/lib/ai/parse-jd';
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

  const jobDescription = formData.get('jobDescription');
  const jobImageFile = formData.get('jobImage');

  const hasText = typeof jobDescription === 'string' && jobDescription.trim() !== '';
  const hasImage = jobImageFile instanceof File;

  if (hasText && (jobDescription as string).length > 10000) {
    return NextResponse.json({ error: '채용공고는 10,000자를 초과할 수 없습니다.' }, { status: 400 });
  }

  if (!hasText && !hasImage) {
    return NextResponse.json({ error: '채용 공고를 입력해주세요.' }, { status: 400 });
  }

  if (!hasText && hasImage) {
    if (!['image/png', 'image/jpeg'].includes(jobImageFile.type)) {
      return NextResponse.json(
        { error: '채용 공고 이미지는 PNG 또는 JPEG 파일만 업로드할 수 있습니다.' },
        { status: 400 }
      );
    }
    if (jobImageFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: '채용 공고 이미지 파일 크기는 4MB를 초과할 수 없습니다.' },
        { status: 400 }
      );
    }
  }

  try {
    const resumeBuffer = Buffer.from(await resumeFile.arrayBuffer());
    const pdfText = await extractTextFromPdf(resumeBuffer);

    const [resumeData, jobRequirements] = await Promise.all([
      parseResume(pdfText),
      hasText
        ? parseJdFromText(jobDescription as string)
        : parseJdFromImage(
            Buffer.from(await (jobImageFile as File).arrayBuffer()),
            (jobImageFile as File).type as 'image/png' | 'image/jpeg'
          ),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { rawText: _resumeRaw, ...resumeDataWithoutRaw } = resumeData;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { rawText: _jdRaw, ...jobRequirementsWithoutRaw } = jobRequirements;

    const response: ParseResumeResponse = {
      resumeData: resumeDataWithoutRaw,
      jobRequirements: jobRequirementsWithoutRaw,
    };

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
