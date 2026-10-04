"use client";

import { Ticket } from "@/lib/schema";
import { Link2 } from "lucide-react";

const PRIORITY_STYLE = {
  Critical: "bg-red-500/15 text-red-600 border-red-500/30",
  High: "bg-orange-500/15 text-orange-600 border-orange-500/30",
  Medium: "bg-yellow-500/15 text-yellow-700 border-yellow-500/30",
  Low: "bg-slate-500/15 text-slate-600 border-slate-500/30",
} as const;

export function TicketCard({ t }: { t: Ticket }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-mono text-slate-400">{t.id}</span>
        <span
          className={`rounded-full border px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLE[t.priority]}`}
        >
          {t.priority}
        </span>
      </div>

      <h3 className="mt-2 font-semibold leading-snug text-sm">
        {t.issue_title}
      </h3>

      <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
        <span>👤 {t.assignee}</span>
        <span className="rounded bg-blue-50 px-1.5 py-0.5 font-semibold text-blue-600">
          {t.story_points} SP
        </span>
      </div>

      <ul className="mt-3 list-disc space-y-1 pl-4 text-xs text-slate-600">
        {t.acceptance_criteria.map((ac) => (
          <li key={ac}>{ac}</li>
        ))}
      </ul>

      {t.dependency.has_dependency && (
        <div className="mt-3 flex items-start gap-1.5 rounded-lg bg-amber-50 p-2 text-xs text-amber-700">
          <Link2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Blocked by {t.dependency.blocked_by.join(", ")}:{" "}
            {t.dependency.note}
          </span>
        </div>
      )}
    </div>
  );
}
