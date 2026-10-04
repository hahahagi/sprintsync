import { SAMPLES, Sample } from "@/lib/samples";

interface SampleSelectorProps {
  onSelect: (sample: Sample) => void;
  disabled: boolean;
}

export function SampleSelector({ onSelect, disabled }: SampleSelectorProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {SAMPLES.map((s) => (
        <button
          key={s.id}
          onClick={() => onSelect(s)}
          disabled={disabled}
          className="group relative rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition-all hover:border-blue-300 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="text-sm font-medium">{s.label}</span>
          <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
            {s.badge}
          </span>
        </button>
      ))}
    </div>
  );
}
