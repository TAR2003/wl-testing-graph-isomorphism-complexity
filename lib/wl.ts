import { useCallback, useMemo, useState } from "react";

import {
  GraphData,
  GraphLink,
  GraphLinkEndpoint,
  GraphNode,
  GraphPreset,
  WLState,
  WLStepRecord,
} from "@/lib/types";

interface WLStepSnapshot {
  step: number;
  graphA: GraphData;
  graphB: GraphData;
  stabilized: boolean;
  isomorphismVerdict: WLState["isomorphismVerdict"];
  colorCountA: Record<number, number>;
  colorCountB: Record<number, number>;
  stepHistory: WLStepRecord[];
  globalColorMapEntries: Array<[string, number]>;
  nextColorId: number;
}

const cloneGraphData = (graph: GraphData): GraphData => {
  const normalizeEndpoint = (endpoint: GraphLinkEndpoint): string | null => {
    if (typeof endpoint === "string") {
      return endpoint;
    }

    if (endpoint && typeof endpoint.id === "string") {
      return endpoint.id;
    }

    return null;
  };

  const links = graph.links.reduce<GraphLink[]>((acc, link) => {
    const source = normalizeEndpoint(link.source);
    const target = normalizeEndpoint(link.target);
    if (!source || !target) {
      return acc;
    }

    acc.push({ source, target });
    return acc;
  }, []);

  return {
    nodes: graph.nodes.map((node) => ({ ...node })),
    links,
  };
};

const initialGraphData: GraphData = { nodes: [], links: [] };

const initialWLState: WLState = {
  graphA: initialGraphData,
  graphB: initialGraphData,
  step: 0,
  stabilized: false,
  isomorphismVerdict: "UNKNOWN",
  colorCountA: {},
  colorCountB: {},
  stepHistory: [],
};

const normalizeEdgeKey = (prefix: "A" | "B", u: number, v: number): string => {
  const left = Math.min(u, v);
  const right = Math.max(u, v);
  return `${prefix}-${left}|${prefix}-${right}`;
};

export const parseGraph = (raw: string, prefix: "A" | "B"): GraphData => {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    throw new Error(`Graph ${prefix}: input is empty. First line must be vertex count N.`);
  }

  const nodeCount = Number(lines[0]);
  if (!Number.isInteger(nodeCount) || nodeCount <= 0) {
    throw new Error(`Graph ${prefix}: first line must be a positive integer N.`);
  }

  const nodes: GraphNode[] = Array.from({ length: nodeCount }, (_, index) => {
    const label = String(index + 1);
    return {
      id: `${prefix}-${label}`,
      label,
      colorId: 0,
    };
  });

  const links: GraphLink[] = [];
  const seen = new Set<string>();

  for (let i = 1; i < lines.length; i += 1) {
    const parts = lines[i].split(/\s+/).filter(Boolean);
    if (parts.length !== 2) {
      throw new Error(`Graph ${prefix}: malformed edge on line ${i + 1}. Expected format "u v".`);
    }

    const u = Number(parts[0]);
    const v = Number(parts[1]);
    if (!Number.isInteger(u) || !Number.isInteger(v)) {
      throw new Error(`Graph ${prefix}: edge line ${i + 1} must contain two integers.`);
    }

    if (u < 1 || u > nodeCount || v < 1 || v > nodeCount) {
      throw new Error(
        `Graph ${prefix}: edge line ${i + 1} has out-of-range vertex id. Valid range is 1..${nodeCount}.`,
      );
    }

    const edgeKey = normalizeEdgeKey(prefix, u, v);
    if (seen.has(edgeKey)) {
      continue;
    }
    seen.add(edgeKey);

    links.push({
      source: `${prefix}-${u}`,
      target: `${prefix}-${v}`,
    });
  }

  return { nodes, links };
};

export const buildAdjacency = (graph: GraphData): Map<string, string[]> => {
  const getEndpointId = (endpoint: GraphLinkEndpoint): string | null => {
    if (typeof endpoint === "string") {
      return endpoint;
    }
    if (endpoint && typeof endpoint.id === "string") {
      return endpoint.id;
    }
    return null;
  };

  const adjacencySets = new Map<string, Set<string>>();

  graph.nodes.forEach((node) => {
    adjacencySets.set(node.id, new Set<string>());
  });

  graph.links.forEach((link) => {
    const sourceId = getEndpointId(link.source);
    const targetId = getEndpointId(link.target);
    if (!sourceId || !targetId) {
      return;
    }

    const sourceSet = adjacencySets.get(sourceId);
    const targetSet = adjacencySets.get(targetId);
    if (!sourceSet || !targetSet) {
      return;
    }

    sourceSet.add(targetId);
    targetSet.add(sourceId);
  });

  const adjacency = new Map<string, string[]>();
  adjacencySets.forEach((neighbors, nodeId) => {
    adjacency.set(nodeId, Array.from(neighbors));
  });

  return adjacency;
};

export const initializeStep = (
  graphA: GraphData,
  graphB: GraphData,
): { gA: GraphData; gB: GraphData } => {
  const adjA = buildAdjacency(graphA);
  const adjB = buildAdjacency(graphB);

  const allDegrees: number[] = [];

  graphA.nodes.forEach((node) => {
    allDegrees.push(adjA.get(node.id)?.length ?? 0);
  });
  graphB.nodes.forEach((node) => {
    allDegrees.push(adjB.get(node.id)?.length ?? 0);
  });

  const uniqueDegrees = Array.from(new Set(allDegrees)).sort((a, b) => a - b);
  const degreeToColor = new Map<number, number>();
  uniqueDegrees.forEach((degree, index) => {
    degreeToColor.set(degree, index + 1);
  });

  const gA = cloneGraphData(graphA);
  const gB = cloneGraphData(graphB);

  gA.nodes.forEach((node) => {
    const degree = adjA.get(node.id)?.length ?? 0;
    node.colorId = degreeToColor.get(degree) ?? 0;
  });

  gB.nodes.forEach((node) => {
    const degree = adjB.get(node.id)?.length ?? 0;
    node.colorId = degreeToColor.get(degree) ?? 0;
  });

  return { gA, gB };
};

export const refineStep = (
  graphA: GraphData,
  graphB: GraphData,
  adjA: Map<string, string[]>,
  adjB: Map<string, string[]>,
  globalColorMap: Map<string, number>,
  nextColorId: { value: number },
): {
  gA: GraphData;
  gB: GraphData;
  stabilized: boolean;
  newColorMap: Map<string, number>;
  nextColorId: { value: number };
} => {
  const newColorMap = new Map(globalColorMap);
  const assignedColors = new Map<string, number>();

  const colorByNodeA = new Map<string, number>(graphA.nodes.map((node) => [node.id, node.colorId]));
  const colorByNodeB = new Map<string, number>(graphB.nodes.map((node) => [node.id, node.colorId]));

  const assignColorsForGraph = (
    graph: GraphData,
    adjacency: Map<string, string[]>,
    nodeColorMap: Map<string, number>,
  ): void => {
    graph.nodes.forEach((node) => {
      const neighborColors = (adjacency.get(node.id) ?? [])
        .map((neighborId) => nodeColorMap.get(neighborId) ?? 0)
        .sort((a, b) => a - b);

      const signature = `${node.colorId}|${neighborColors.join(",")}`;
      const existing = newColorMap.get(signature);

      if (typeof existing === "number") {
        assignedColors.set(node.id, existing);
        return;
      }

      const assigned = nextColorId.value;
      nextColorId.value += 1;
      newColorMap.set(signature, assigned);
      assignedColors.set(node.id, assigned);
    });
  };

  assignColorsForGraph(graphA, adjA, colorByNodeA);
  assignColorsForGraph(graphB, adjB, colorByNodeB);

  const gA = cloneGraphData(graphA);
  const gB = cloneGraphData(graphB);

  let stabilized = true;

  gA.nodes.forEach((node) => {
    const assigned = assignedColors.get(node.id) ?? node.colorId;
    if (assigned !== node.colorId) {
      stabilized = false;
    }
    node.colorId = assigned;
  });

  gB.nodes.forEach((node) => {
    const assigned = assignedColors.get(node.id) ?? node.colorId;
    if (assigned !== node.colorId) {
      stabilized = false;
    }
    node.colorId = assigned;
  });

  return { gA, gB, stabilized, newColorMap, nextColorId };
};

export const computeColorCounts = (graph: GraphData): Record<number, number> => {
  const counts: Record<number, number> = {};

  graph.nodes.forEach((node) => {
    counts[node.colorId] = (counts[node.colorId] ?? 0) + 1;
  });

  return counts;
};

export const computeVerdict = (
  countA: Record<number, number>,
  countB: Record<number, number>,
  stabilized: boolean,
): WLState["isomorphismVerdict"] => {
  const allColorIds = new Set<number>([
    ...Object.keys(countA).map((key) => Number(key)),
    ...Object.keys(countB).map((key) => Number(key)),
  ]);

  for (const colorId of allColorIds) {
    if ((countA[colorId] ?? 0) !== (countB[colorId] ?? 0)) {
      return "NOT_ISOMORPHIC";
    }
  }

  if (stabilized) {
    return "PROBABLY_ISOMORPHIC";
  }

  return "UNKNOWN";
};

const createSnapshot = (
  wlState: WLState,
  colorMap: Map<string, number>,
  nextColorId: number,
): WLStepSnapshot => {
  return {
    step: wlState.step,
    graphA: cloneGraphData(wlState.graphA),
    graphB: cloneGraphData(wlState.graphB),
    stabilized: wlState.stabilized,
    isomorphismVerdict: wlState.isomorphismVerdict,
    colorCountA: { ...wlState.colorCountA },
    colorCountB: { ...wlState.colorCountB },
    stepHistory: wlState.stepHistory.map((record) => ({
      step: record.step,
      verdict: record.verdict,
      colorCountA: { ...record.colorCountA },
      colorCountB: { ...record.colorCountB },
    })),
    globalColorMapEntries: Array.from(colorMap.entries()),
    nextColorId,
  };
};

export interface WLEngine {
  rawA: string;
  rawB: string;
  wlState: WLState;
  parseError: string | null;
  setRawA: (value: string) => void;
  setRawB: (value: string) => void;
  parseGraphs: () => void;
  stepForward: () => void;
  stepBackward: () => void;
  resetToStep0: () => void;
  loadPreset: (preset: GraphPreset) => void;
  setNodePosition: (graph: "A" | "B", nodeId: string, x: number, y: number) => void;
  canStepForward: boolean;
  canStepBackward: boolean;
}

export const useWLEngine = (): WLEngine => {
  const [rawA, setRawA] = useState<string>("");
  const [rawB, setRawB] = useState<string>("");
  const [wlState, setWlState] = useState<WLState>(initialWLState);
  const [adjA, setAdjA] = useState<Map<string, string[]>>(new Map());
  const [adjB, setAdjB] = useState<Map<string, string[]>>(new Map());
  const [globalColorMap, setGlobalColorMap] = useState<Map<string, number>>(new Map());
  const [nextColorId, setNextColorId] = useState<number>(1);
  const [parseError, setParseError] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState<WLStepSnapshot[]>([]);

  const parseGraphs = useCallback((): void => {
    try {
      const parsedA = parseGraph(rawA, "A");
      const parsedB = parseGraph(rawB, "B");

      const nextAdjA = buildAdjacency(parsedA);
      const nextAdjB = buildAdjacency(parsedB);

      const colorCountA = computeColorCounts(parsedA);
      const colorCountB = computeColorCounts(parsedB);

      const baseState: WLState = {
        graphA: parsedA,
        graphB: parsedB,
        step: 0,
        stabilized: false,
        isomorphismVerdict: "UNKNOWN",
        colorCountA,
        colorCountB,
        stepHistory: [
          {
            step: 0,
            colorCountA,
            colorCountB,
            verdict: "UNKNOWN",
          },
        ],
      };

      const emptyColorMap = new Map<string, number>();
      const startNextColorId = 1;
      const firstSnapshot = createSnapshot(baseState, emptyColorMap, startNextColorId);

      setAdjA(nextAdjA);
      setAdjB(nextAdjB);
      setGlobalColorMap(emptyColorMap);
      setNextColorId(startNextColorId);
      setWlState(baseState);
      setSnapshots([firstSnapshot]);
      setParseError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown parse error.";
      setParseError(message);
    }
  }, [rawA, rawB]);

  const stepForward = useCallback((): void => {
    if (parseError || wlState.graphA.nodes.length === 0 || wlState.graphB.nodes.length === 0) {
      return;
    }

    if (wlState.stabilized) {
      return;
    }

    if (wlState.step === 0) {
      const initialized = initializeStep(wlState.graphA, wlState.graphB);
      const colorCountA = computeColorCounts(initialized.gA);
      const colorCountB = computeColorCounts(initialized.gB);
      const verdict = computeVerdict(colorCountA, colorCountB, false);

      const nextState: WLState = {
        graphA: initialized.gA,
        graphB: initialized.gB,
        step: 1,
        stabilized: false,
        isomorphismVerdict: verdict,
        colorCountA,
        colorCountB,
        stepHistory: [
          ...wlState.stepHistory,
          {
            step: 1,
            colorCountA,
            colorCountB,
            verdict,
          },
        ],
      };

      setWlState(nextState);
      setSnapshots((previous) => [...previous, createSnapshot(nextState, globalColorMap, nextColorId)]);
      return;
    }

    const colorCursor = { value: nextColorId };
    const result = refineStep(
      wlState.graphA,
      wlState.graphB,
      adjA,
      adjB,
      globalColorMap,
      colorCursor,
    );

    const colorCountA = computeColorCounts(result.gA);
    const colorCountB = computeColorCounts(result.gB);
    const verdict = computeVerdict(colorCountA, colorCountB, result.stabilized);

    const nextState: WLState = {
      graphA: result.gA,
      graphB: result.gB,
      step: wlState.step + 1,
      stabilized: result.stabilized,
      isomorphismVerdict: verdict,
      colorCountA,
      colorCountB,
      stepHistory: [
        ...wlState.stepHistory,
        {
          step: wlState.step + 1,
          colorCountA,
          colorCountB,
          verdict,
        },
      ],
    };

    setGlobalColorMap(result.newColorMap);
    setNextColorId(result.nextColorId.value);
    setWlState(nextState);
    setSnapshots((previous) => [
      ...previous,
      createSnapshot(nextState, result.newColorMap, result.nextColorId.value),
    ]);
  }, [adjA, adjB, globalColorMap, nextColorId, parseError, wlState]);

  const stepBackward = useCallback((): void => {
    if (wlState.step === 0 || snapshots.length === 0) {
      return;
    }

    const targetStep = wlState.step - 1;
    const snapshot = snapshots[targetStep];
    if (!snapshot) {
      return;
    }

    setWlState({
      graphA: cloneGraphData(snapshot.graphA),
      graphB: cloneGraphData(snapshot.graphB),
      step: snapshot.step,
      stabilized: snapshot.stabilized,
      isomorphismVerdict: snapshot.isomorphismVerdict,
      colorCountA: { ...snapshot.colorCountA },
      colorCountB: { ...snapshot.colorCountB },
      stepHistory: snapshot.stepHistory.map((record) => ({
        step: record.step,
        verdict: record.verdict,
        colorCountA: { ...record.colorCountA },
        colorCountB: { ...record.colorCountB },
      })),
    });

    setGlobalColorMap(new Map(snapshot.globalColorMapEntries));
    setNextColorId(snapshot.nextColorId);
    setSnapshots((previous) => previous.slice(0, targetStep + 1));
  }, [snapshots, wlState.step]);

  const resetToStep0 = useCallback((): void => {
    parseGraphs();
  }, [parseGraphs]);

  const loadPreset = useCallback((preset: GraphPreset): void => {
    setRawA(preset.rawA);
    setRawB(preset.rawB);

    try {
      const parsedA = parseGraph(preset.rawA, "A");
      const parsedB = parseGraph(preset.rawB, "B");

      const nextAdjA = buildAdjacency(parsedA);
      const nextAdjB = buildAdjacency(parsedB);
      const colorCountA = computeColorCounts(parsedA);
      const colorCountB = computeColorCounts(parsedB);

      const baseState: WLState = {
        graphA: parsedA,
        graphB: parsedB,
        step: 0,
        stabilized: false,
        isomorphismVerdict: "UNKNOWN",
        colorCountA,
        colorCountB,
        stepHistory: [
          {
            step: 0,
            colorCountA,
            colorCountB,
            verdict: "UNKNOWN",
          },
        ],
      };

      const emptyColorMap = new Map<string, number>();
      const startNextColorId = 1;

      setAdjA(nextAdjA);
      setAdjB(nextAdjB);
      setGlobalColorMap(emptyColorMap);
      setNextColorId(startNextColorId);
      setWlState(baseState);
      setSnapshots([createSnapshot(baseState, emptyColorMap, startNextColorId)]);
      setParseError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load preset.";
      setParseError(message);
    }
  }, []);

  const setNodePosition = useCallback(
    (graph: "A" | "B", nodeId: string, x: number, y: number): void => {
      setWlState((previous) => {
        const nextGraphA = cloneGraphData(previous.graphA);
        const nextGraphB = cloneGraphData(previous.graphB);
        const targetGraph = graph === "A" ? nextGraphA : nextGraphB;
        const targetNode = targetGraph.nodes.find((node) => node.id === nodeId);

        if (!targetNode) {
          return previous;
        }

        targetNode.x = x;
        targetNode.y = y;
        targetNode.fx = x;
        targetNode.fy = y;

        return {
          ...previous,
          graphA: nextGraphA,
          graphB: nextGraphB,
        };
      });

      setSnapshots((previous) => {
        if (previous.length === 0) {
          return previous;
        }

        const nextSnapshots = [...previous];
        const last = nextSnapshots[nextSnapshots.length - 1];
        if (!last) {
          return previous;
        }

        const targetGraph = graph === "A" ? cloneGraphData(last.graphA) : cloneGraphData(last.graphB);
        const targetNode = targetGraph.nodes.find((node) => node.id === nodeId);
        if (!targetNode) {
          return previous;
        }

        targetNode.x = x;
        targetNode.y = y;
        targetNode.fx = x;
        targetNode.fy = y;

        nextSnapshots[nextSnapshots.length - 1] = {
          ...last,
          graphA: graph === "A" ? targetGraph : last.graphA,
          graphB: graph === "B" ? targetGraph : last.graphB,
        };

        return nextSnapshots;
      });
    },
    [],
  );

  const canStepForward = useMemo(() => {
    if (parseError) {
      return false;
    }
    if (wlState.stabilized) {
      return false;
    }
    return wlState.graphA.nodes.length > 0 && wlState.graphB.nodes.length > 0;
  }, [parseError, wlState.graphA.nodes.length, wlState.graphB.nodes.length, wlState.stabilized]);

  const canStepBackward = useMemo(() => wlState.step > 0, [wlState.step]);

  return {
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
    setNodePosition,
    canStepForward,
    canStepBackward,
  };
};
