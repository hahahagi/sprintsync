"use client";

import { useEffect, useState } from "react";

const STEPS = [
  "Parsing meeting transcript...",
  "Identifying speakers and action items...",
  "Estimating story points...",
  "Mapping dependencies...",
  "Generating backlog tickets...",
];

export function AnalyzingState() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t = setInterval(
      () => setStep((s) => Math.min(s + 1, STEPS.length - 1)),
      900
    );
    return () => clearInterval(t);
  }, []);

  const progressPercent = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="space-y-6">
      {/* M3 Linear Progress Bar */}
      <div className="w-full bg-[#e0e3e7] h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-[#0b57d0] h-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <ul className="space-y-3">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={`flex items-center gap-3 text-xs font-semibold transition-opacity duration-300 ${
              i <= step ? "opacity-100 text-[#1f1f1f]" : "opacity-40 text-slate-500"
            }`}
          >
            {i < step ? (
              <span className="material-symbols-outlined text-emerald-600 !text-[20px]">
                check_circle
              </span>
            ) : i === step ? (
              <span className="material-symbols-outlined animate-spin text-[#0b57d0] !text-[20px]">
                progress_activity
              </span>
            ) : (
              <span className="material-symbols-outlined text-slate-400 !text-[20px]">
                radio_button_unchecked
              </span>
            )}
            <span>{label}</span>
          </li>
        ))}
      </ul>

      {/* Skeletons M3 */}
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((c) => (
          <div key={c} className="space-y-3">
            {[0, 1].map((k) => (
              <div
                key={k}
                className="rounded-2xl border border-[#e0e3e7] bg-white p-4 space-y-3 animate-pulse shadow-xs"
              >
                <div className="h-4 w-3/4 rounded-full bg-[#f0f4f9]" />
                <div className="h-3 w-1/2 rounded-full bg-[#f0f4f9]" />
                <div className="h-3 w-full rounded-full bg-[#f0f4f9]" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}