import { Ticket } from "@/lib/schema";

interface MetricsBarProps {
  tickets: Ticket[];
  source: string;
  durationMs?: number;
}

export function MetricsBar({ tickets, source, durationMs }: MetricsBarProps) {
  const totalSP = tickets.reduce((sum, t) => sum + t.story_points, 0);
  const estimatedMinutesSaved = tickets.length * 5;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#c4c6d0]/60 bg-[#f0f4f9] px-5 py-3.5 shadow-xs">
      <div className="flex flex-wrap items-center gap-6 text-xs text-slate-700">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#0b57d0] shadow-xs">
            <span className="material-symbols-outlined !text-[18px]">view_kanban</span>
          </span>
          <span>
            <strong className="font-bold text-[#1f1f1f]">{tickets.length}</strong> tickets
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#0b57d0] shadow-xs">
            <span className="material-symbols-outlined !text-[18px]">award_star</span>
          </span>
          <span>
            <strong className="font-bold text-[#1f1f1f]">{totalSP}</strong> story points
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-600 shadow-xs">
            <span className="material-symbols-outlined !text-[18px]">schedule</span>
          </span>
          <span>
            ~<strong className="font-bold text-[#1f1f1f]">{estimatedMinutesSaved}</strong> min saved
          </span>
        </div>

        {durationMs && (
          <div className="flex items-center gap-1.5 font-semibold text-[#0b57d0]">
            <span className="material-symbols-outlined !text-[18px]">bolt</span>
            <span>{(durationMs / 1000).toFixed(1)}s</span>
          </div>
        )}
      </div>

      <SourceBadge source={source} />
    </div>
  );
}

function SourceBadge({ source }: { source: string }) {
  const config: Record<string, { label: string; icon: string; bg: string; text: string; border: string }> = {
    groq: {
      label: "Powered by Groq",
      icon: "bolt",
      bg: "bg-emerald-50",
      text: "text-emerald-800",
      border: "border-emerald-200",
    },
    gemini: {
      label: "Powered by Gemini",
      icon: "auto_awesome",
      bg: "bg-blue-50",
      text: "text-blue-800",
      border: "border-blue-200",
    },
    mock: {
      label: "Demo Dataset",
      icon: "dataset",
      bg: "bg-amber-50",
      text: "text-amber-800",
      border: "border-amber-200",
    },
  };
  const c = config[source] ?? config.mock;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${c.bg} ${c.text} ${c.border}`}
    >
      <span className="material-symbols-outlined !text-[16px]">{c.icon}</span>
      <span>{c.label}</span>
    </span>
  );
}