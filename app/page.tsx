"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { SampleSelector } from "@/components/SampleSelector";
import { TranscriptPanel } from "@/components/TranscriptPanel";
import { AnalyzingState } from "@/components/AnalyzingState";
import { KanbanBoard } from "@/components/KanbanBoard";
import { MetricsBar } from "@/components/MetricsBar";
import { ErrorState } from "@/components/ErrorState";
import { MOCKS } from "@/lib/mocks";
import type { Analysis } from "@/lib/schema";
import type { Sample } from "@/lib/samples";

type AppState = "idle" | "analyzing" | "done" | "error";

export default function Home() {
  const [state, setState] = useState<AppState>("idle");
  const [transcript, setTranscript] = useState("");
  const [activeSampleId, setActiveSampleId] = useState<string | null>(null);
  const [result, setResult] = useState<Analysis | null>(null);
  const [source, setSource] = useState("");
  const [durationMs, setDurationMs] = useState<number | undefined>();
  const [error, setError] = useState("");
  const [demoMode, setDemoMode] = useState(false);
  const [meetingSummary, setMeetingSummary] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.ctrlKey &&
        e.shiftKey &&
        e.key.toLowerCase() === "d" &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        setDemoMode((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const analyze = useCallback(
    async (text: string, sampleId: string | null) => {
      setState("analyzing");
      setError("");
      setResult(null);
      const start = Date.now();

      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript: text, sampleId, demoMode }),
          signal: AbortSignal.timeout(20000),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Request failed (${res.status})`);
        }

        const data = await res.json();
        setResult(data.data);
        setSource(data.source);
        setMeetingSummary(data.data.meeting_summary);
        setDurationMs(Date.now() - start);
        setState("done");
      } catch (err) {
        if (sampleId && MOCKS[sampleId]) {
          await new Promise((r) => setTimeout(r, 2500));
          setResult(MOCKS[sampleId]);
          setSource("mock");
          setMeetingSummary(MOCKS[sampleId].meeting_summary);
          setDurationMs(Date.now() - start);
          setState("done");
        } else {
          setError(err instanceof Error ? err.message : "Something went wrong");
          setState("error");
        }
      }
    },
    [demoMode],
  );

  const handleSelectSample = (sample: Sample) => {
    setTranscript(sample.transcript);
    setActiveSampleId(sample.id);
    analyze(sample.transcript, sample.id);
  };

  const handleAnalyzeCustom = () => {
    if (transcript.length < 50) return;
    setActiveSampleId(null);
    analyze(transcript, null);
  };

  const handleRetry = () => {
    if (transcript) {
      analyze(transcript, activeSampleId);
    }
  };

  const handleReset = () => {
    setState("idle");
    setTranscript("");
    setActiveSampleId(null);
    setResult(null);
    setSource("");
    setDurationMs(undefined);
    setError("");
    setMeetingSummary("");
    setCopied(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafd] text-[#1f1f1f]">
      <Header demoMode={demoMode} />

      <main className="flex-1 mx-auto w-full max-w-7xl px-6 py-8 space-y-8">
        {state === "idle" && (
          <div className="text-center space-y-3 py-6">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-[#1f1f1f]">
              Transform meetings into
              <span className="text-[#0b57d0]"> sprint tickets</span>
            </h1>
            <p className="text-slate-600 max-w-xl mx-auto text-sm leading-relaxed">
              Paste a meeting transcript or select a sample below. SprintSync extracts actionable tickets with priorities, story points, and dependencies.
            </p>
          </div>
        )}

        {(state === "idle" || state === "done") && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2.5">
              Sample Transcripts
            </h2>
            <SampleSelector onSelect={handleSelectSample} disabled={false} activeId={activeSampleId} />
          </section>
        )}

        {state === "idle" && (
          <section className="space-y-4">
            <TranscriptPanel
              transcript={transcript}
              onChange={setTranscript}
              disabled={false}
            />
            {transcript.length >= 50 && (
              <button
                type="button"
                onClick={handleAnalyzeCustom}
                className="inline-flex items-center gap-2 rounded-full bg-[#0b57d0] px-6 py-3 text-xs font-semibold text-white shadow-xs transition-all hover:bg-[#1557bf] active:scale-[0.98]"
              >
                <span className="material-symbols-outlined !text-[18px]">auto_fix_high</span>
                <span>Analyze Transcript</span>
              </button>
            )}
          </section>
        )}

        {state === "analyzing" && <AnalyzingState />}

        {state === "error" && (
          <ErrorState message={error} onRetry={handleRetry} />
        )}

        {state === "done" && result && (
          <section className="space-y-6">
            {meetingSummary && (
              <div className="rounded-2xl border border-[#e0e3e7] bg-white p-5 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0b57d0]">
                  <span className="material-symbols-outlined !text-[18px]">summarize</span>
                  <span>Meeting Summary</span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-700">
                  {meetingSummary}
                </p>
              </div>
            )}

            <MetricsBar
              tickets={result.tickets}
              source={source}
              durationMs={durationMs}
            />

            <KanbanBoard tickets={result.tickets} />

            {/* Tombol Aksi M3 dengan padding lega */}
            <div className="flex flex-wrap items-center gap-3 pt-3">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-2 rounded-full border border-[#c4c6d0] bg-white px-6 py-2.5 text-xs font-semibold text-slate-700 shadow-xs transition-all hover:bg-[#f0f4f9] active:scale-[0.98]"
              >
                <span className="material-symbols-outlined !text-[18px]">arrow_back</span>
                <span>New Analysis</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const md = result.tickets
                    .map(
                      (t) =>
                        `### ${t.id}: ${t.issue_title}\n- **Assignee:** ${t.assignee}\n- **Priority:** ${t.priority}\n- **SP:** ${t.story_points}\n- **AC:**\n${t.acceptance_criteria.map((ac) => `  - ${ac}`).join("\n")}${t.dependency.has_dependency ? `\n- **Blocked by:** ${t.dependency.blocked_by.join(", ")}: ${t.dependency.note}` : ""}`,
                    )
                    .join("\n\n");
                  navigator.clipboard.writeText(md);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="inline-flex items-center gap-2 rounded-full border border-[#d3e3fd] bg-[#d3e3fd]/60 px-6 py-2.5 text-xs font-semibold text-[#0b57d0] shadow-xs transition-all hover:bg-[#d3e3fd] active:scale-[0.98]"
              >
                <span className="material-symbols-outlined !text-[18px]">
                  {copied ? "check" : "content_copy"}
                </span>
                <span>{copied ? "Copied to Clipboard!" : "Copy as Markdown"}</span>
              </button>
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-[#e0e3e7] py-4 text-center text-xs text-slate-500">
        SprintSync - AI-powered meeting-to-sprint converter
      </footer>
    </div>
  );
}