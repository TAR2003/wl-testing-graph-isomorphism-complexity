import { PRESETS } from "@/lib/presets";
import { GraphPreset } from "@/lib/types";

interface PresetButtonsProps {
  onSelect: (preset: GraphPreset) => void;
  activePresetId: string;
}

export default function PresetButtons({ onSelect, activePresetId }: PresetButtonsProps): JSX.Element {
  return (
    <section className="glass rounded-2xl p-4">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-200">Presets</h3>
      <div className="flex flex-col gap-2">
        {PRESETS.map((preset) => {
          const active = preset.id === activePresetId;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelect(preset)}
              className={`rounded-xl border p-3 text-left transition ${
                active
                  ? "border-emerald-400/70 bg-emerald-400/10"
                  : "border-white/10 bg-white/[0.03] hover:bg-white/10"
              }`}
            >
              <p className="font-semibold text-slate-100">
                <span className="mr-2">{preset.icon}</span>
                {preset.label}
              </p>
              <p className="mt-1 text-xs text-slate-400">{preset.description}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
