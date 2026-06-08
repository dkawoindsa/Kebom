import fs from 'fs';
import path from 'path';

export interface AiCallLog {
  caller: string;
  model: string;
  request?: Record<string, number | string>;
  result?: Record<string, number | string>;
  durationMs: number;
  status: 'success' | 'error';
  errorMessage?: string;
}

const LOG_FILE = path.join(process.cwd(), 'logs', 'ai-usage.jsonl');

export function logAiCall(log: AiCallLog): void {
  if (process.env.NODE_ENV === 'test') return;

  const entry = JSON.stringify({ ...log, timestamp: new Date().toISOString() });

  if (process.env.NODE_ENV === 'development') {
    try {
      const dir = path.dirname(LOG_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.appendFileSync(LOG_FILE, entry + '\n', 'utf8');
    } catch {
      // 파일 쓰기 실패 시 무시 (로그 실패가 앱 동작에 영향 주면 안 됨)
    }
  }

  console.log('[AI]', entry);
}
