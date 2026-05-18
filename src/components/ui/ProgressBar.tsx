import type { WizardStep, LoadingPhase } from '@/types/wizard';

interface ProgressBarProps {
  step: WizardStep;
  loading: LoadingPhase;
}

export default function ProgressBar({ step, loading }: ProgressBarProps) {
  const readActive = step === 'upload';
  const readDone =
    (step === 'read' || step === 'analyze' || step === 'action') &&
    loading !== 'parsing';

  const analyzeActive = step === 'read' || loading === 'parsing';
  const analyzeDone =
    (step === 'analyze' || step === 'action') && loading !== 'analyzing';

  const actionActive = step === 'analyze' || step === 'action';

  function labelClass(active: boolean, done: boolean): string {
    if (active) return 'text-white font-medium';
    if (done) return 'text-neutral-500';
    return 'text-neutral-700';
  }

  return (
    <nav aria-label="진행 단계">
      <ol className="flex items-center gap-2 text-sm list-none p-0 m-0">
        <li>
          <span
            className={labelClass(readActive, readDone)}
            {...(readActive ? { 'aria-current': 'step' } : {})}
          >
            1 읽기
          </span>
        </li>
        <li aria-hidden="true"><span className="text-neutral-700">→</span></li>
        <li>
          <span
            className={labelClass(analyzeActive, analyzeDone)}
            {...(analyzeActive ? { 'aria-current': 'step' } : {})}
          >
            2 분석
          </span>
        </li>
        <li aria-hidden="true"><span className="text-neutral-700">→</span></li>
        <li>
          <span
            className={labelClass(actionActive, false)}
            {...(actionActive ? { 'aria-current': 'step' } : {})}
          >
            3 결과
          </span>
        </li>
      </ol>
    </nav>
  );
}
