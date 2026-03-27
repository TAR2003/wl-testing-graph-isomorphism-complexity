export interface GraphNode {
  id: string;
  label: string;
  colorId: number;
  x?: number;
  y?: number;
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface WLStepRecord {
  step: number;
  colorCountA: Record<number, number>;
  colorCountB: Record<number, number>;
  verdict: WLState["isomorphismVerdict"];
}

export interface WLState {
  graphA: GraphData;
  graphB: GraphData;
  step: number;
  stabilized: boolean;
  isomorphismVerdict: "UNKNOWN" | "PROBABLY_ISOMORPHIC" | "NOT_ISOMORPHIC";
  colorCountA: Record<number, number>;
  colorCountB: Record<number, number>;
  stepHistory: WLStepRecord[];
}

export interface GraphPreset {
  id: string;
  label: string;
  description: string;
  icon: string;
  rawA: string;
  rawB: string;
}
