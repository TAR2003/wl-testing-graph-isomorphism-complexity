# WL Graph Isomorphism Test - Interactive Dashboard

## Overview
The Weisfeiler-Lehman (1-WL) color refinement test is one of the most influential practical heuristics for graph isomorphism. Starting from a coarse coloring, it repeatedly refines node colors by aggregating neighborhood color signatures. If two graphs produce different color histograms at any step, they are provably non-isomorphic.

The method is historically important in graph isomorphism research, graph kernels, and modern Graph Neural Networks (GNNs). In particular, message-passing GNN expressiveness is tightly connected to 1-WL distinguishability (Xu et al., 2019). The key limitation is that 1-WL is not complete: there exist non-isomorphic graphs with identical refinement trajectories.

## Quick Start
```bash
git clone <your-repo-url>
cd wl-graph-isomorphism
npm install
npm run dev
# Open http://localhost:3000
```

## How to Use
1. Select a preset from the left panel or paste your own pair of graphs.
2. Use the input format shown below to define vertices and edges.
3. Click `Parse Graph Inputs` to load both graphs.
4. Click `Next Refinement Step` to run one WL iteration at a time.
5. Use `Back` to inspect snapshots or `Auto` to run every 1.2 seconds.
6. Read the table:
   - `Match` indicates whether per-color node counts are equal.
   - A mismatch gives a definitive `NOT_ISOMORPHIC` certificate.
7. Interpret verdicts:
   - `NOT_ISOMORPHIC` means proven non-isomorphic.
   - `PROBABLY_ISOMORPHIC` means WL could not separate the pair after stabilization; this is necessary but not sufficient for true isomorphism.

## Input Format
Each graph is entered as plain text:

- Line 1: integer `N` (number of vertices, 1-indexed)
- Lines 2+: edges as `u v`

Example:
```text
6
1 2
2 3
3 4
4 5
5 6
6 1
```

Notes and edge cases:
- Blank lines and extra whitespace are ignored.
- Duplicate edges are ignored.
- Out-of-range vertices trigger a descriptive parse error.
- Node IDs in visualization are internally prefixed (`A-1`, `B-1`) to avoid collisions.

## Understanding the Algorithm
- Step 0: Initialization
  - All nodes start with color `0` (neutral slate).
- Step 1: Degree-based coloring
  - Degrees are computed across both graphs jointly.
  - Global degree classes map to color IDs `1..k`.
- Step 2+: Neighborhood signature refinement
  - For each node, signature is `currentColor|sortedNeighborColors`.
  - A global shared signature map assigns color IDs consistently across both graphs.
- Stabilization criterion
  - If a refinement step causes no color changes, WL has stabilized.

## Presets Explained
### Isomorphic Pair
Two equivalent `C6` cycle encodings with shuffled edge ordering. The trajectory should remain aligned and stabilize with matching histograms.

### Degree-Trap
A pair that is useful for demonstrating how local degree and neighborhood statistics influence early WL separation.

### CFI Trap
A regular non-isomorphic hard pair that remains indistinguishable to 1-WL, illustrating the classical limitation of color refinement style methods.

### Path vs Cycle
`P6` versus `C6`. Endpoints in the path force immediate degree-based divergence, so non-isomorphism is detected at Step 1.

### Custom
A scratch preset for rapid experimentation with your own graph inputs.

## Theoretical Notes
- 1-WL vs 2-WL vs k-WL
  - Increasing `k` increases distinguishing power but also computational cost.
  - Higher-order WL variants are strictly more expressive in general.
- CFI-style limitations
  - Cai-Furer-Immerman constructions provide families where low-dimensional WL fails.
  - This is a canonical reason WL is not a complete GI algorithm.
- Connection to GNNs
  - Message-passing GNNs are upper-bounded by 1-WL expressiveness in many settings.
  - Reference: Xu et al., 2019, "How Powerful are Graph Neural Networks?"

## Tech Stack & Architecture
- Next.js 14 App Router + TypeScript
- Tailwind CSS 3.4 for theme and layout
- `react-force-graph-2d` loaded via `next/dynamic` with `ssr: false`
- Pure WL logic in `lib/wl.ts`
- Fully typed shared interfaces in `lib/types.ts`
- Snapshot-based state rollback for deterministic backward stepping

## Known Limitations
- 1-WL is not complete for graph isomorphism (hard pairs can stabilize with matching histograms).
- Very large graphs (>50 nodes) may become visually dense and harder to interpret interactively.
- Force layout is optimized for clarity, not exact combinatorial embedding fidelity.
