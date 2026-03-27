export const PALETTE: string[] = [
  "#64748b",
  "#22d3ee",
  "#34d399",
  "#f59e0b",
  "#f43f5e",
  "#38bdf8",
  "#a3e635",
  "#eab308",
  "#fb7185",
  "#2dd4bf",
  "#f97316",
  "#c084fc",
  "#84cc16",
  "#06b6d4",
  "#f472b6",
  "#4ade80",
  "#facc15",
  "#60a5fa",
  "#fb923c",
  "#14b8a6",
  "#e879f9",
  "#fda4af",
  "#93c5fd",
  "#bef264",
];

export const getPaletteColor = (colorId: number): string => {
  return PALETTE[Math.abs(colorId) % PALETTE.length];
};
