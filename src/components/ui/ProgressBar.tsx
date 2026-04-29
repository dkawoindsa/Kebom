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
    <div className="flex items-center gap-2 text-sm">
      <span className={labelClass(readActive, readDone)}>1 Read</span>
      <span className="text-neutral-700">→</span>
      <span className={labelClass(analyzeActive, analyzeDone)}>2 Analyze</span>
      <span className="text-neutral-700">→</span>
      <span className={labelClass(actionActive, false)}>3 Action</span>
    </div>
  );
}
