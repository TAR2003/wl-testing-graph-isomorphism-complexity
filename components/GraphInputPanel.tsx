interface GraphInputPanelProps {
  label: "Graph A" | "Graph B";
  value: string;
  onChange: (next: string) => void;
  nodeCount: number;
  edgeCount: number;
  error: string | null;
}

export default function GraphInputPanel({
  label,
  value,
  onChange,
  nodeCount,
  edgeCount,
  error,
}: GraphInputPanelProps): JSX.Element {
  return (
    <section className="glass rounded-2xl p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">{label}</h3>
        <span className="font-mono text-xs text-slate-400">
          {nodeCount} nodes, {edgeCount} edges
        </span>
      </div>
      <textarea
        className="h-40 min-h-40 w-full resize-y rounded-xl border border-white/10 bg-slate-900/80 p-3 font-mono text-sm text-slate-100 outline-none transition focus:border-emerald-400/70"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={"6\n1 2\n2 3\n3 4\n4 5\n5 6\n6 1"}
        spellCheck={false}
      />
      {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
    </section>
  );
}
