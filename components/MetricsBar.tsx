import { Ticket } from "@/lib/schema";
import { Zap, Ticket as TicketIcon, Timer, Hash } from "lucide-react";

interface MetricsBarProps {
  tickets: Ticket[];
  source: string;
  durationMs?: number;
}

export function MetricsBar({ tickets, source, durationMs }: MetricsBarProps) {
  const totalSP = tickets.reduce((sum, t) => sum + t.story_points, 0);
  const estimatedMinutesSaved = tickets.length * 5; // ~5 min per ticket manually

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border bg-slate-50 px-4 py-3 text-sm">
      <div className="flex items-center gap-1.5 text-slate-600">
        <TicketIcon className="h-4 w-4" />
        <span className="font-semibold">{tickets.length}</span> tickets
      </div>
      <div className="flex items-center gap-1.5 text-slate-600">
        <Hash className="h-4 w-4" />
        <span className="font-semibold">{totalSP}</span> SP total
      </div>
      <div className="flex items-center gap-1.5 text-slate-600">
        <Timer className="h-4 w-4" />
        ~<span className="font-semibold">{estimatedMinutesSaved}</span> min saved
      </div>
      {durationMs && (
        <div className="flex items-center gap-1.5 text-blue-600">
          <Zap className="h-4 w-4" />
          <span className="font-semibold">
            {(durationMs / 1000).toFixed(1)}s
          </span>
        </div>
      )}
      <div className="ml-auto">
        <SourceBadge source={source} />
      </div>
    </div>
  );
}

function SourceBadge({ source }: { source: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    groq: { bg: "bg-green-50", text: "text-green-700", label: "⚡ Powered by Groq" },
    gemini: { bg: "bg-blue-50", text: "text-blue-700", label: "✨ Powered by Gemini" },
    mock: { bg: "bg-amber-50", text: "text-amber-700", label: "📦 Demo Data" },
  };
  const c = config[source] ?? config.mock;
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}
