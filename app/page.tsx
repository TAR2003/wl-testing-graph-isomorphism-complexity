"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Github, PlayCircle } from "lucide-react";

import GraphCanvas from "@/components/GraphCanvas";
import GraphInputPanel from "@/components/GraphInputPanel";
import PresetButtons from "@/components/PresetButtons";
import RefinementTable from "@/components/RefinementTable";
import StatusBanner from "@/components/StatusBanner";
import StepControls from "@/components/StepControls";
import { DEFAULT_PRESET } from "@/lib/presets";
import { getPaletteColor } from "@/lib/palette";
import { WLStepRecord } from "@/lib/types";
import { useWLEngine } from "@/lib/wl";

const STEP_LABELS: Record<number, string> = {
  0: "Init",
  1: "Degree",
};

const getStepLabel = (step: number): string => {
  return STEP_LABELS[step] ?? "Refine";
};

const useElementWidth = (ref: React.RefObject<HTMLElement>): number => {
  const [width, setWidth] = useState<number>(0);

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }
      setWidth(Math.floor(entry.contentRect.width));
    });

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [ref]);

  return width;
};

const StepHistoryRow = ({
  record,
  isCurrent,
}: {
  record: WLStepRecord;
  isCurrent: boolean;
}): JSX.Element => {
  const colorIds = Array.from(
    new Set<number>([
      ...Object.keys(record.colorCountA).map((key) => Number(key)),
      ...Object.keys(record.colorCountB).map((key) => Number(key)),
    ]),
  ).sort((a, b) => a - b);

  const maxCount = Math.max(
    ...[0, ...Object.values(record.colorCountA), ...Object.values(record.colorCountB)],
  );

  return (
    <div
      className={`rounded-xl border px-3 py-2 ${
        record.verdict === "NOT_ISOMORPHIC"
          ? "border-rose-400/50 bg-rose-500/10"
          : isCurrent
            ? "border-emerald-400/40 bg-emerald-500/10"
            : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <div className="flex items-center justify-between gap-2 text-xs md:text-sm">
        <span className="font-mono text-slate-200">Step {record.step}</span>
        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-slate-300">
          {getStepLabel(record.step)}
        </span>
        <span className="font-mono text-[11px] text-slate-300">{record.verdict}</span>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {colorIds.map((colorId) => {
          const count = (record.colorCountA[colorId] ?? 0) + (record.colorCountB[colorId] ?? 0);
          const width = maxCount === 0 ? 10 : Math.max(10, Math.round((count / (maxCount * 2)) * 56));
          return (
            <span
              key={`${record.step}-${colorId}`}
              className="inline-block h-2.5 rounded-full"
              style={{
                width,
                backgroundColor: getPaletteColor(colorId),
              }}
              title={`Color ${colorId} -> A:${record.colorCountA[colorId] ?? 0}, B:${record.colorCountB[colorId] ?? 0}`}
            />
          );
        })}
      </div>
    </div>
  );
};

export default function HomePage(): JSX.Element {
  const {
    rawA,
    rawB,
    wlState,
    parseError,
    setRawA,
    setRawB,
    parseGraphs,
    stepForward,
    stepBackward,
    resetToStep0,
    loadPreset,
    canStepForward,
    canStepBackward,
  } = useWLEngine();

  const [activePresetId, setActivePresetId] = useState<string>(DEFAULT_PRESET.id);

  useEffect(() => {
    loadPreset(DEFAULT_PRESET);
  }, [loadPreset]);

  const graphContainerRef = useRef<HTMLDivElement>(null);
  const graphRowWidth = useElementWidth(graphContainerRef as React.RefObject<HTMLElement>);

  const graphWidth = useMemo(() => {
    if (graphRowWidth === 0) {
      return 320;
    }
    if (graphRowWidth < 768) {
      return graphRowWidth;
    }
    return Math.max(300, Math.floor((graphRowWidth - 16) / 2));
  }, [graphRowWidth]);

  const handlePresetSelect = useCallback(
    (preset: typeof DEFAULT_PRESET): void => {
      setActivePresetId(preset.id);
      loadPreset(preset);
    },
    [loadPreset],
  );

  const sideError = parseError;

  return (
    <main className="relative z-10 min-h-screen p-4 md:p-6">
      <header className="glass mb-4 rounded-2xl p-4 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/90">Graph Theory Lab</p>
            <h1 className="mt-1 text-2xl font-bold leading-tight md:text-4xl">
              Weisfeiler-Lehman (1-WL) Isomorphism Visualizer
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-300 md:text-base">
              Interactive refinement dashboard for comparing graph color partitions under the 1-WL
              algorithm. Built for research demos, classroom lectures, and rapid intuition-building.
            </p>
          </div>

          <a
            className="inline-flex items-center gap-2 self-start rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-sm hover:bg-white/[0.1]"
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
          >
            <Github className="h-4 w-4" />
            Source Repository
          </a>
        </div>
      </header>

      <div className="flex flex-col gap-4 md:flex-row">
        <aside className="w-full shrink-0 space-y-4 md:w-[320px]">
          <PresetButtons onSelect={handlePresetSelect} activePresetId={activePresetId} />

          <GraphInputPanel
            label="Graph A"
            value={rawA}
            onChange={(value) => {
              setRawA(value);
              setActivePresetId("empty");
            }}
            nodeCount={wlState.graphA.nodes.length}
            edgeCount={wlState.graphA.links.length}
            error={sideError}
          />

          <GraphInputPanel
            label="Graph B"
            value={rawB}
            onChange={(value) => {
              setRawB(value);
              setActivePresetId("empty");
            }}
            nodeCount={wlState.graphB.nodes.length}
            edgeCount={wlState.graphB.links.length}
            error={sideError}
          />

          <button
            type="button"
            onClick={parseGraphs}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-4 py-2 font-semibold text-emerald-200 transition hover:bg-emerald-500/25"
          >
            <PlayCircle className="h-4 w-4" />
            Parse Graph Inputs
          </button>

          <div className="glass rounded-2xl p-3 text-xs text-slate-300">
            <p className="font-mono">Current step: {wlState.step}</p>
            <p className="font-mono">Stabilized: {wlState.stabilized ? "true" : "false"}</p>
            <p className="font-mono">Verdict: {wlState.isomorphismVerdict}</p>
          </div>
        </aside>

        <section className="min-w-0 flex-1 space-y-4">
          <div ref={graphContainerRef} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <GraphCanvas
              graphData={wlState.graphA}
              title="Graph A"
              width={graphWidth}
              height={380}
              step={wlState.step}
            />
            <GraphCanvas
              graphData={wlState.graphB}
              title="Graph B"
              width={graphWidth}
              height={380}
              step={wlState.step}
            />
          </div>

          <StatusBanner
            verdict={wlState.isomorphismVerdict}
            step={wlState.step}
            stabilized={wlState.stabilized}
          />

          <RefinementTable colorCountA={wlState.colorCountA} colorCountB={wlState.colorCountB} />

          <div className="glass rounded-2xl p-4">
            <h3 className="mb-3 text-lg font-semibold">Step History Log</h3>
            <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
              {wlState.stepHistory.map((record) => (
                <StepHistoryRow
                  key={`history-${record.step}`}
                  record={record}
                  isCurrent={record.step === wlState.step}
                />
              ))}
            </div>
          </div>

          <StepControls
            step={wlState.step}
            stabilized={wlState.stabilized}
            onReset={resetToStep0}
            onBack={stepBackward}
            onNext={stepForward}
            canStepBackward={canStepBackward}
            canStepForward={canStepForward}
          />
        </section>
      </div>
    </main>
  );
}
