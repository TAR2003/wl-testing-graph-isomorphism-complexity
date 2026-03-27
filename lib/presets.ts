import { GraphPreset } from "@/lib/types";

export const PRESETS: GraphPreset[] = [
  {
    id: "iso-pair",
    label: "Isomorphic Pair",
    description:
      "Two structurally identical graphs with different node orderings. WL will converge to identical color distributions.",
    icon: "\ud83d\udd01",
    rawA: `6
1 2
2 3
3 4
4 5
5 6
6 1`,
    rawB: `6
2 3
6 1
4 5
1 2
5 6
3 4`,
  },
  {
    id: "non-iso-degree",
    label: "Degree-Trap",
    description:
      "Same degree sequence but non-isomorphic structure. WL detects this in step 2.",
    icon: "\ud83e\uddea",
    rawA: `6
1 2
2 3
3 1
3 4
4 2
5 6`,
    rawB: `6
1 2
2 3
3 4
4 5
5 6
6 1`,
  },
  {
    id: "cfi-trap",
    label: "CFI Trap A",
    description:
      "Non-isomorphic regular graphs that 1-WL often cannot separate. Useful to explain why color refinement has known limits.",
    icon: "\ud83e\udda0",
    rawA: `10
1 2
2 3
3 4
4 5
5 1
6 7
7 8
8 9
9 10
10 6
1 6
2 7
3 8
4 9
5 10`,
    rawB: `10
1 2
2 3
3 4
4 5
5 1
1 6
2 7
3 8
4 9
5 10
6 8
8 10
10 7
7 9
9 6`,
  },
  {
    id: "cfi-trap-b",
    label: "CFI Trap B (2xTriangle vs C6)",
    description:
      "Graph A is two disjoint triangles while Graph B is one 6-cycle. Every node has degree 2, so 1-WL returns matching color counts even though they are not isomorphic.",
    icon: "\ud83d\udca3",
    rawA: `6
1 2
2 3
3 1
4 5
5 6
6 4`,
    rawB: `6
1 2
2 3
3 4
4 5
5 6
6 1`,
  },
  {
    id: "house-live-demo",
    label: "House Live Demo",
    description:
      "Isomorphic house graphs with very different drawings and labels. Great for live demos: usually stabilizes in about 3 steps.",
    icon: "\ud83c\udfe0",
    rawA: `5
1 2
2 3
3 4
4 1
1 5
2 5`,
    rawB: `5
1 3
3 5
5 2
2 1
1 4
3 4`,
  },
  {
    id: "path-vs-cycle",
    label: "Path vs Cycle",
    description:
      "P6 path vs C6 cycle \u2014 WL immediately detects the difference via endpoint degrees.",
    icon: "\u2696\ufe0f",
    rawA: `6
1 2
2 3
3 4
4 5
5 6`,
    rawB: `6
1 2
2 3
3 4
4 5
5 6
6 1`,
  },
  {
    id: "empty",
    label: "Custom",
    description: "Start from scratch. Enter your own graphs.",
    icon: "\u270d\ufe0f",
    rawA: `4
1 2
2 3
3 4
4 1`,
    rawB: `4
1 3
3 2
2 4
4 1`,
  },
];

export const DEFAULT_PRESET = PRESETS[0];
