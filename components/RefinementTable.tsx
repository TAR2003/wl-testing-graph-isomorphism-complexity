import { getPaletteColor } from "@/lib/palette";

interface RefinementTableProps {
  colorCountA: Record<number, number>;
  colorCountB: Record<number, number>;
}

const toNumberKeys = (record: Record<number, number>): number[] => {
  return Object.keys(record).map((key) => Number(key));
};

export default function RefinementTable({ colorCountA, colorCountB }: RefinementTableProps): JSX.Element {
  const allColorIds = Array.from(new Set<number>([...toNumberKeys(colorCountA), ...toNumberKeys(colorCountB)])).sort(
    (a, b) => a - b,
  );

  const totalA = Object.values(colorCountA).reduce((sum, count) => sum + count, 0);
  const totalB = Object.values(colorCountB).reduce((sum, count) => sum + count, 0);

  return (
    <div className="glass animate-fade-in rounded-2xl p-4">
      <h3 className="mb-3 text-lg font-semibold">Refinement Histogram Comparison</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-slate-300">
              <th className="px-3 py-2">Color</th>
              <th className="px-3 py-2">Color ID</th>
              <th className="px-3 py-2">Graph A</th>
              <th className="px-3 py-2">Graph B</th>
              <th className="px-3 py-2">Match</th>
            </tr>
          </thead>
          <tbody>
            {allColorIds.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-4 text-center text-slate-400">
                  Parse graphs to populate color counts.
                </td>
              </tr>
            ) : (
              allColorIds.map((colorId, index) => {
                const countA = colorCountA[colorId] ?? 0;
                const countB = colorCountB[colorId] ?? 0;
                const isMatch = countA === countB;

                return (
                  <tr
                    key={colorId}
                    className={index % 2 === 0 ? "bg-white/[0.03]" : "bg-white/[0.01]"}
                  >
                    <td className="px-3 py-2">
                      <span
                        className="inline-block h-3 w-3 rounded-full border border-white/60"
                        style={{ backgroundColor: getPaletteColor(colorId) }}
                      />
                    </td>
                    <td className="px-3 py-2 font-mono text-slate-100">{colorId}</td>
                    <td className="px-3 py-2 font-mono text-slate-100">{countA}</td>
                    <td className="px-3 py-2 font-mono text-slate-100">{countB}</td>
                    <td className="px-3 py-2">{isMatch ? "OK" : "X"}</td>
                  </tr>
                );
              })
            )}
          </tbody>
          <tfoot>
            <tr className="border-t border-white/10 text-slate-300">
              <td className="px-3 py-2" colSpan={2}>
                Total Nodes
              </td>
              <td className="px-3 py-2 font-mono">{totalA}</td>
              <td className="px-3 py-2 font-mono">{totalB}</td>
              <td className="px-3 py-2">{totalA === totalB ? "OK" : "X"}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
