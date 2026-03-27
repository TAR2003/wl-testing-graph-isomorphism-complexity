import { useEffect, useRef, useState } from "react";
import { Pause, RotateCcw, SkipBack, SkipForward } from "lucide-react";

interface StepControlsProps {
  step: number;
  stabilized: boolean;
  onReset: () => void;
  onBack: () => void;
  onNext: () => void;
  canStepBackward: boolean;
  canStepForward: boolean;
}

export default function StepControls({
  step,
  stabilized,
  onReset,
  onBack,
  onNext,
  canStepBackward,
  canStepForward,
}: StepControlsProps): JSX.Element {
  const [autoRunning, setAutoRunning] = useState<boolean>(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!autoRunning) {
      return;
    }

    timerRef.current = setInterval(() => {
      onNext();
    }, 1200);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      timerRef.current = null;
    };
  }, [autoRunning, onNext]);

  useEffect(() => {
    if ((stabilized || !canStepForward) && autoRunning) {
      setAutoRunning(false);
    }
  }, [autoRunning, canStepForward, stabilized]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const buttonBase = "inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="glass sticky bottom-0 z-20 mt-4 rounded-2xl p-3">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={buttonBase} onClick={onReset}>
          <RotateCcw className="h-4 w-4" />
          Reset
        </button>

        <button
          type="button"
          className={buttonBase}
          onClick={onBack}
          disabled={!canStepBackward}
        >
          <SkipBack className="h-4 w-4" />
          Back
        </button>

        <button
          type="button"
          className="glow-emerald inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-2.5 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          onClick={onNext}
          disabled={!canStepForward}
        >
          <SkipForward className="h-4 w-4" />
          Next Refinement Step
        </button>

        <button
          type="button"
          className={buttonBase}
          onClick={() => setAutoRunning((running) => !running)}
          disabled={!canStepForward && !autoRunning}
        >
          {autoRunning ? <Pause className="h-4 w-4" /> : <SkipForward className="h-4 w-4" />}
          {autoRunning ? "Pause" : "Auto"}
        </button>

        <span className="ml-auto font-mono text-xs text-slate-300">Step {step}</span>
      </div>
    </div>
  );
}
