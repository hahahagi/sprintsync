"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";

const STEPS = [
  "Parsing meeting transcript…",
  "Identifying speakers & action items…",
  "Estimating story points…",
  "Mapping dependencies…",
  "Generating backlog tickets…",
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

  return (
    <div className="space-y-6">
      <ul className="space-y-2">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={`flex items-center gap-2 text-sm transition-opacity duration-300 ${
              i <= step ? "opacity-100" : "opacity-30"
            }`}
          >
            {i < step ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : i === step ? (
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            ) : (
              <span className="h-4 w-4" />
            )}
            {label}
          </li>
        ))}
      </ul>

      {/* Skeleton cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((c) => (
          <div key={c} className="space-y-3">
            {[0, 1].map((k) => (
              <div
                key={k}
                className="animate-pulse rounded-xl border bg-white/5 p-4 space-y-3"
              >
                <div className="h-4 w-3/4 rounded bg-slate-300/30" />
                <div className="h-3 w-1/2 rounded bg-slate-300/30" />
                <div className="h-3 w-full rounded bg-slate-300/30" />
                <div className="h-3 w-5/6 rounded bg-slate-300/30" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
