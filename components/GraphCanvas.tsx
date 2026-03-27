"use client";

import dynamic from "next/dynamic";
import React, { useEffect, useMemo, useRef } from "react";

import { getPaletteColor } from "@/lib/palette";
import { GraphData, GraphLink, GraphNode } from "@/lib/types";

interface GraphCanvasProps {
  graphData: GraphData;
  title: string;
  width: number;
  height: number;
  step: number;
}

interface ForceGraph2DHandle {
  d3ReheatSimulation: () => void;
  d3Force: (name: string, force: null) => void;
}

interface ForceGraph2DProps {
  graphData: GraphData;
  width: number;
  height: number;
  backgroundColor: string;
  linkColor: string;
  linkWidth: number;
  enableNodeDrag: boolean;
  cooldownTicks: number;
  dagMode: null;
  nodeCanvasObject: (node: GraphNode, context: CanvasRenderingContext2D) => void;
  onEngineStop?: () => void;
}

type ForceGraph2DComponent = React.ForwardRefExoticComponent<
  ForceGraph2DProps & React.RefAttributes<ForceGraph2DHandle>
>;

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
}) as unknown as ForceGraph2DComponent;

export default function GraphCanvas({
  graphData,
  title,
  width,
  height,
  step,
}: GraphCanvasProps): JSX.Element {
  const graphRef = useRef<ForceGraph2DHandle | null>(null);

  const activeColors = useMemo(() => {
    const counts: Record<number, number> = {};
    graphData.nodes.forEach((node) => {
      counts[node.colorId] = (counts[node.colorId] ?? 0) + 1;
    });

    return Object.keys(counts)
      .map((key) => Number(key))
      .sort((a, b) => a - b)
      .map((colorId) => ({ colorId, count: counts[colorId] }));
  }, [graphData.nodes]);

  useEffect(() => {
    graphRef.current?.d3ReheatSimulation();
  }, [graphData]);

  return (
    <section className="glass rounded-2xl p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold uppercase tracking-wider text-slate-200">{title}</p>
        <p className="font-mono text-xs text-slate-400">Step {step}</p>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-white/10">
        {graphData.nodes.length === 0 ? (
          <div
            className="flex items-center justify-center bg-slate-950/50 text-sm text-slate-400"
            style={{ width, height }}
          >
            Parse input to render the graph.
          </div>
        ) : (
          <ForceGraph2D
            ref={graphRef}
            graphData={graphData}
            width={Math.max(280, width)}
            height={height}
            backgroundColor="transparent"
            linkColor="rgba(148,163,184,0.4)"
            linkWidth={1.5}
            enableNodeDrag
            cooldownTicks={100}
            dagMode={null}
            onEngineStop={() => {
              graphRef.current?.d3Force("charge", null);
            }}
            nodeCanvasObject={(node, context) => {
              const radius = 14;
              const fill = getPaletteColor(node.colorId);

              context.beginPath();
              context.arc(node.x ?? 0, node.y ?? 0, radius, 0, 2 * Math.PI);
              context.fillStyle = fill;
              context.shadowBlur = 8;
              context.shadowColor = fill;
              context.fill();
              context.shadowBlur = 0;
              context.lineWidth = 1.5;
              context.strokeStyle = "#ffffff";
              context.stroke();

              context.font = "bold 11px JetBrains Mono, monospace";
              context.fillStyle = "#ffffff";
              context.textAlign = "center";
              context.textBaseline = "middle";
              context.fillText(node.label, node.x ?? 0, node.y ?? 0);
            }}
          />
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {activeColors.length === 0 ? (
          <span className="text-xs text-slate-500">No active colors yet.</span>
        ) : (
          activeColors.map(({ colorId, count }) => (
            <span
              key={colorId}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/60 px-3 py-1 text-xs font-mono"
            >
              <span
                className="h-2.5 w-2.5 rounded-full border border-white/70"
                style={{ backgroundColor: getPaletteColor(colorId) }}
              />
              c{colorId} x {count}
            </span>
          ))
        )}
      </div>
    </section>
  );
}
