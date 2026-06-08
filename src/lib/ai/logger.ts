export interface AiCallLog {
  caller: string;
  model: string;
  request?: Record<string, number | string>;
  result?: Record<string, number | string>;
  durationMs: number;
  status: 'success' | 'error';
  errorMessage?: string;
}

export function logAiCall(log: AiCallLog): void {
  if (process.env.NODE_ENV === 'test') return;

  const entry = JSON.stringify({ ...log, timestamp: new Date().toISOString() });

  if (process.env.NODE_ENV === 'development') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require('fs') as typeof import('fs');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const path = require('path') as typeof import('path');
      const logFile = path.join(process.cwd(), 'logs', 'ai-usage.jsonl');
      const dir = path.dirname(logFile);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.appendFileSync(logFile, entry + '\n', 'utf8');
    } catch {
      // 파일 쓰기 실패 시 무시 (로그 실패가 앱 동작에 영향 주면 안 됨)
    }
  }

  console.log('[AI]', entry);
}
