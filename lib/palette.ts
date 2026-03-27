export const PALETTE: string[] = [
  "#94a3b8",
  "#2563eb",
  "#f97316",
  "#a855f7",
  "#ef4444",
  "#14b8a6",
  "#eab308",
  "#ec4899",
  "#22c55e",
  "#06b6d4",
  "#f43f5e",
  "#84cc16",
  "#f59e0b",
  "#8b5cf6",
  "#0ea5e9",
  "#e11d48",
  "#65a30d",
  "#facc15",
  "#fb7185",
  "#2dd4bf",
  "#c084fc",
  "#fb923c",
  "#38bdf8",
  "#d946ef",
];

export const getPaletteColor = (colorId: number): string => {
  return PALETTE[Math.abs(colorId) % PALETTE.length];
};
