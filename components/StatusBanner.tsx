import { CheckCircle2, Hourglass, XCircle } from "lucide-react";

import { WLState } from "@/lib/types";

interface StatusBannerProps {
  verdict: WLState["isomorphismVerdict"];
  step: number;
  stabilized: boolean;
}

export default function StatusBanner({ verdict, step, stabilized }: StatusBannerProps): JSX.Element {
  if (verdict === "NOT_ISOMORPHIC") {
    return (
      <div className="glass glow-rose animate-pulse-fast rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
        <div className="flex items-start gap-3">
          <XCircle className="mt-0.5 h-5 w-5 text-rose-300" />
          <div>
            <p className="font-semibold tracking-wide text-rose-200">DEFINITIVELY NOT ISOMORPHIC</p>
            <p className="text-sm text-rose-100/90">
              Color histogram mismatch detected at step {step}. WL provides a definitive certificate of
              non-isomorphism.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (verdict === "PROBABLY_ISOMORPHIC") {
    return (
      <div className="glass glow-emerald rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 animate-pulse text-emerald-300" />
          <div>
            <p className="font-semibold tracking-wide text-emerald-200">PROBABLY ISOMORPHIC</p>
            <p className="text-sm text-emerald-100/90">
              WL test stabilized with matching color histograms. Note: WL cannot guarantee isomorphism -
              this is a necessary but not sufficient condition.
            </p>
            <p className="mt-1 text-xs text-emerald-200/80">Stabilized: {stabilized ? "Yes" : "No"}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
      <div className="flex items-start gap-3">
        <Hourglass className="mt-0.5 h-5 w-5 animate-spin-slow text-amber-300" />
        <div>
          <p className="font-semibold tracking-wide text-amber-200">REFINEMENT IN PROGRESS - Step {step}</p>
          <p className="text-sm text-amber-100/90">Continue stepping to refine color partitions.</p>
        </div>
      </div>
    </div>
  );
}
