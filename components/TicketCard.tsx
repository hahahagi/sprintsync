"use client";

import { Ticket } from "@/lib/schema";

const PRIORITY_STYLE = {
  Critical: "bg-rose-50 text-rose-700 border-rose-200",
  High: "bg-amber-50 text-amber-800 border-amber-200",
  Medium: "bg-blue-50 text-blue-700 border-blue-200",
  Low: "bg-slate-100 text-slate-700 border-slate-200",
} as const;

export function TicketCard({ t }: { t: Ticket }) {
  return (
    <div className="rounded-2xl border border-[#e0e3e7] bg-white p-4 shadow-xs transition-all hover:border-[#c4c6d0] hover:shadow-md">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-mono font-medium text-slate-400">
          {t.id}
        </span>
        <span
          className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${PRIORITY_STYLE[t.priority]}`}
        >
          {t.priority}
        </span>
      </div>

      <h3 className="mt-2 text-sm font-semibold leading-snug text-[#1f1f1f]">
        {t.issue_title}
      </h3>

      <div className="mt-2.5 flex items-center gap-3 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1">
          <span className="material-symbols-outlined !text-[16px] text-slate-400">person</span>
          <span>{t.assignee}</span>
        </span>
        <span className="rounded-full bg-[#d3e3fd]/60 px-2.5 py-0.5 font-bold text-[#0b57d0] text-[11px]">
          {t.story_points} SP
        </span>
      </div>

      <ul className="mt-3 list-disc space-y-1.5 pl-4 text-xs text-slate-600 leading-relaxed">
        {t.acceptance_criteria.map((ac) => (
          <li key={ac}>{ac}</li>
        ))}
      </ul>

      {t.dependency.has_dependency && (
        <div className="mt-3.5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/90 p-2.5 text-xs text-amber-900">
          <span className="material-symbols-outlined !text-[16px] text-amber-700 shrink-0 mt-0.5">
            link_off
          </span>
          <span className="leading-snug">
            <strong>Blocked by {t.dependency.blocked_by.join(", ")}:</strong> {t.dependency.note}
          </span>
        </div>
      )}
    </div>
  );
}