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

  // Ctrl+Shift+D to toggle demo mode
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
        // Client-side fallback: if request fails entirely, use mocks
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
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header demoMode={demoMode} />

      <main className="flex-1 mx-auto w-full max-w-7xl px-6 py-8 space-y-8">
        {/* Hero */}
        {state === "idle" && (
          <div className="text-center space-y-2 py-4">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Transform meetings into
              <span className="text-blue-600"> sprint tickets</span>
            </h1>
            <p className="text-slate-500 max-w-xl mx-auto">
              Paste a meeting transcript or select a sample below. SprintSync
              uses AI to extract actionable tickets with priorities, story
              points, and dependencies.
            </p>
          </div>
        )}

        {/* Sample selector */}
        {(state === "idle" || state === "done") && (
          <section>
            <h2 className="text-sm font-medium text-slate-500 mb-3">
              Try a sample transcript
            </h2>
            <SampleSelector onSelect={handleSelectSample} disabled={false} />
          </section>
        )}

        {/* Split view: transcript + results */}
        {state === "idle" && (
          <section className="space-y-4">
            <TranscriptPanel
              transcript={transcript}
              onChange={setTranscript}
              disabled={false}
            />
            {transcript.length >= 50 && (
              <button
                onClick={handleAnalyzeCustom}
                className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                Analyze Transcript
              </button>
            )}
          </section>
        )}

        {/* Analyzing */}
        {state === "analyzing" && <AnalyzingState />}

        {/* Error */}
        {state === "error" && (
          <ErrorState message={error} onRetry={handleRetry} />
        )}

        {/* Results */}
        {state === "done" && result && (
          <section className="space-y-6">
            {/* Summary */}
            {meetingSummary && (
              <div className="rounded-xl border bg-blue-50 p-4">
                <p className="text-sm font-medium text-blue-800">
                  📝 Meeting Summary
                </p>
                <p className="mt-1 text-sm text-blue-700">{meetingSummary}</p>
              </div>
            )}

            {/* Metrics */}
            <MetricsBar
              tickets={result.tickets}
              source={source}
              durationMs={durationMs}
            />

            {/* Kanban */}
            <KanbanBoard tickets={result.tickets} />

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                ← New Analysis
              </button>
              <button
                onClick={() => {
                  const md = result.tickets
                    .map(
                      (t) =>
                        `### ${t.id}: ${t.issue_title}\n- **Assignee:** ${t.assignee}\n- **Priority:** ${t.priority}\n- **SP:** ${t.story_points}\n- **AC:**\n${t.acceptance_criteria.map((ac) => `  - ${ac}`).join("\n")}${t.dependency.has_dependency ? `\n- **Blocked by:** ${t.dependency.blocked_by.join(", ")} — ${t.dependency.note}` : ""}`,
                    )
                    .join("\n\n");
                  navigator.clipboard.writeText(md);
                }}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                📋 Copy as Markdown
              </button>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t py-4 text-center text-xs text-slate-400">
        SprintSync — AI-powered meeting-to-sprint converter
      </footer>
    </div>
  );
}
