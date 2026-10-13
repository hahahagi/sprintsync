import { SAMPLES, Sample } from "@/lib/samples";

interface SampleSelectorProps {
  onSelect: (sample: Sample) => void;
  disabled: boolean;
  activeId?: string | null;
}

export function SampleSelector({ onSelect, disabled, activeId }: SampleSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {SAMPLES.map((s) => {
        const isSelected = activeId === s.id;
        const cleanLabel = s.label
          .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
          .trim();

        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect(s)}
            disabled={disabled}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition-all ${
              isSelected
                ? "border-[#0b57d0] bg-[#d3e3fd]/60 text-[#041e49] shadow-xs"
                : "border-[#c4c6d0] bg-white text-slate-700 hover:bg-[#f0f4f9]"
            }`}
          >
            {isSelected && (
              <span className="material-symbols-outlined text-[#0b57d0] !text-[18px]">
                check
              </span>
            )}
            <span>{cleanLabel}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                isSelected
                  ? "bg-[#0b57d0] text-white"
                  : "bg-[#f0f4f9] text-slate-600"
              }`}
            >
              {s.badge}
            </span>
          </button>
        );
      })}
    </div>
  );
}