# 🚀 SprintSync: Execution Plan — MVP Zero-Budget

> **Goal:** Ubah meeting transcript → Kanban board berisi tiket sprint, dalam 1-2 hari kerja.  
> **Stack:** Next.js 14 (App Router) · TypeScript · Tailwind · shadcn/ui · Zod · Groq + Gemini AI  
> **Cost:** $0 (semua free tier, no credit card)

---

## 📁 Target File Structure

```
sprintsync/
├── app/
│   ├── layout.tsx              # Root layout + font + metadata
│   ├── page.tsx                # Main page (orchestrator)
│   ├── globals.css             # Tailwind base + custom vars
│   ├── favicon.ico
│   └── api/
│       └── analyze/
│           └── route.ts        # API route: Groq → Gemini → Mock
├── components/
│   ├── Header.tsx              # Logo + tagline + demo mode badge
│   ├── SampleSelector.tsx      # Preset transcript buttons
│   ├── TranscriptPanel.tsx     # Left panel: transcript display/input
│   ├── AnalyzingState.tsx      # Stepper + skeleton loading
│   ├── KanbanBoard.tsx         # 3-column board (todo/in_progress/backlog)
│   ├── TicketCard.tsx          # Individual ticket card
│   ├── MetricsBar.tsx          # "5 tickets · 21 SP · ~25 min saved · ⚡1.8s"
│   ├── SourceBadge.tsx         # "Powered by Groq / Gemini / Demo"
│   └── ErrorState.tsx          # Error display + Retry button
├── lib/
│   ├── schema.ts               # Zod schemas (Ticket, Analysis)
│   ├── prompt.ts               # System prompt untuk AI
│   ├── samples.ts              # 3 preset transcripts
│   ├── mocks.ts                # Hardcoded mock data (fallback terakhir)
│   └── rate-limit.ts           # Simple in-memory rate limiter
├── .env.local                  # API keys (NEVER commit)
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.mjs
└── README.md
```

---

## 🔀 Commit Strategy

Setiap commit = satu unit kerja yang bisa di-revert tanpa merusak yang lain.

| # | Commit Message | Isi |
|---|----------------|-----|
| 1 | `init: scaffold next.js + tailwind + shadcn + deps` | Project setup, install dependencies |
| 2 | `feat(lib): add zod schema, samples, mocks, prompt` | Semua file di `lib/` |
| 3 | `feat(ui): static layout + kanban board from mocks` | Header, SampleSelector, KanbanBoard, TicketCard — render dari mock |
| 4 | `feat(ui): analyzing state + loading stepper` | AnalyzingState component |
| 5 | `feat(api): analyze route with groq + gemini fallback` | API route + rate limiter |
| 6 | `feat(app): connect frontend to api + demo mode` | page.tsx orchestration, fetch logic, keyboard shortcut |
| 7 | `feat(ui): metrics bar + source badge + error state` | Polish components |
| 8 | `feat(ui): animations + responsive + final polish` | Framer Motion stagger, mobile layout, favicon, meta |
| 9 | `docs: add README with setup instructions` | README.md |
| 10 | `chore: pre-deploy checks` | Final cleanup |

---

## ⚙️ Phase 1: Project Scaffold (~30 menit)

### 1.1 Create Project

```bash
npx create-next-app@latest sprintsync --typescript --tailwind --app --eslint --src-dir=false --import-alias="@/*"
cd sprintsync
```

### 1.2 Install Dependencies

```bash
npm i zod lucide-react framer-motion
npx shadcn@latest init
```

Saat `shadcn init`, pilih:
- Style: **New York**
- Base color: **Slate**
- CSS variables: **yes**

Lalu tambah komponen:

```bash
npx shadcn@latest add card badge button skeleton
```

### 1.3 Setup Environment

Buat `.env.local`:

```env
# Groq — https://console.groq.com/
GROQ_API_KEY=gsk_xxx
GROQ_MODEL=llama-3.3-70b-versatile

# Gemini — https://aistudio.google.com/
GEMINI_API_KEY=AIza_xxx
GEMINI_MODEL=gemini-2.5-flash
```

> [!CAUTION]
> Pastikan `.env.local` sudah ada di `.gitignore` (default dari create-next-app).  
> Cek nama model terbaru di dashboard masing-masing sebelum deploy.

### 1.4 First Commit

```bash
git add .
git commit -m "init: scaffold next.js + tailwind + shadcn + deps"
```

---

## 📦 Phase 2: Library Files (~1-2 jam)

### 2.1 `lib/schema.ts`

```typescript
import { z } from "zod";

export const TicketSchema = z.object({
  id: z.string(),
  issue_title: z.string(),
  assignee: z.string(),
  priority: z.enum(["Critical", "High", "Medium", "Low"]),
  story_points: z.number().int().min(1).max(13),
  acceptance_criteria: z.array(z.string()).min(1).max(5),
  dependency: z.object({
    has_dependency: z.boolean(),
    blocked_by: z.array(z.string()),
    note: z.string(),
  }),
  column: z.enum(["todo", "in_progress", "backlog"]),
});

export const AnalysisSchema = z.object({
  meeting_summary: z.string(),
  tickets: z.array(TicketSchema).min(1).max(8),
});

export type Ticket = z.infer<typeof TicketSchema>;
export type Analysis = z.infer<typeof AnalysisSchema>;
```

### 2.2 `lib/prompt.ts`

```typescript
export const SYSTEM_PROMPT = `You are SprintSync, an expert Agile Technical Project Manager.
Your job: convert a raw technical meeting transcript into actionable backlog tickets.

RULES:
1. Output ONLY a single valid JSON object. No markdown, no code fences, no commentary.
2. Extract 3 to 6 tickets. Only include work items actually discussed or clearly implied.
3. "assignee": use the person's name as spoken in the transcript. If unclear, use "Unassigned". Never invent names.
4. "priority": Critical = production down / revenue or data loss; High = user-facing degradation; Medium = important but not urgent; Low = nice-to-have.
5. "story_points": use only Fibonacci values (1, 2, 3, 5, 8, 13), based on complexity and uncertainty.
6. "acceptance_criteria": 2 to 4 testable, measurable statements (e.g. "p95 latency < 300ms").
7. "dependency": set has_dependency=true if a ticket cannot start before another; list the blocking ticket ids in "blocked_by" and explain in "note". Otherwise has_dependency=false, blocked_by=[], note="".
8. "id": sequential, format "SS-101", "SS-102", ...
9. "column": Critical -> "in_progress"; High -> "todo"; Medium/Low -> "backlog".
10. Write all text in English, concise and professional.

JSON SCHEMA (follow exactly):
{
  "meeting_summary": "string, max 2 sentences",
  "tickets": [
    {
      "id": "SS-101",
      "issue_title": "string, imperative verb, max 10 words",
      "assignee": "string",
      "priority": "Critical | High | Medium | Low",
      "story_points": 1 | 2 | 3 | 5 | 8 | 13,
      "acceptance_criteria": ["string", "string"],
      "dependency": {
        "has_dependency": true,
        "blocked_by": ["SS-101"],
        "note": "string"
      },
      "column": "todo | in_progress | backlog"
    }
  ]
}`;
```

### 2.3 `lib/samples.ts`

```typescript
export interface Sample {
  id: string;
  label: string;
  badge: string;
  transcript: string;
}

export const SAMPLES: Sample[] = [
  {
    id: "payment-outage",
    label: "🔥 Payment Gateway Outage",
    badge: "Critical Incident",
    transcript: `[Incident Sync - 09:15]
Rina (Backend Lead): Payment success rate dropped from 99% to 61% in the last 20 minutes. Stripe webhooks are timing out.
Dimas (DevOps): I see connection pool exhaustion on the payment-service. Pods are restarting every few minutes.
Rina: We need a hotfix today. Dimas, can you increase the pool size and add a circuit breaker? That's maybe half a day.
Dimas: Yes, but the circuit breaker needs the retry queue first, otherwise we lose failed transactions.
Rina: Right. Bayu, can you build a retry queue with exponential backoff? It's complex, probably two days.
Bayu (Backend): On it. I also noticed we have no idempotency keys, so retries could double-charge users.
Rina: That's critical, must ship together with the queue.
Sari (Support): Will do. Also we need alerting on webhook failure rate, we found out from customers, not from monitoring.
Dimas: I'll add Grafana alerts after the hotfix, low effort.`,
  },
  {
    id: "mobile-latency",
    label: "📱 Mobile App Latency Spike",
    badge: "Performance",
    transcript: `[Sprint Review - Performance Topic]
Andi (Mobile Lead): App launch time on Android went from 2s to 6.5s since release 4.2. Play Store ratings are dropping.
Lisa (Mobile Dev): Profiling shows the home screen fires 14 API calls sequentially on startup.
Andi: Lisa, can you refactor to parallel calls and lazy-load below-the-fold widgets? Probably 3 days.
Fajar (Backend): The /home/feed endpoint takes 2.8 seconds because of an N+1 query. I can fix it with a join and Redis caching, about 2 days.
Andi: Good. Lisa's work should be validated against Fajar's fixed endpoint, otherwise we'll mis-measure.
Maya (QA): I'll need a performance regression test with a target of under 2.5s cold start on a mid-range device.
Andi: Also, image sizes are huge. Someone should add WebP and a CDN. Lisa, after the refactor.
Fajar: Nice to have. Let's backlog it.`,
  },
  {
    id: "db-migration",
    label: "🗄️ Database Migration Planning",
    badge: "Architecture",
    transcript: `[Architecture Review]
Tomi (Tech Lead): We're migrating the orders table from MySQL to PostgreSQL. 80 million rows, zero downtime required.
Nadia (Data Engineer): I propose dual-write plus a backfill job. First we need a schema mapping and type conversion review, roughly 2 days.
Tomi: Then the dual-write layer, Eko, that's yours. Around 5 days with feature flags.
Eko (Backend): Agreed. Backfill can't start until dual-write is live, otherwise we miss new rows.
Nadia: I'll write the backfill plus a data consistency checker. 3 days.
Tomi: Cutover plan and rollback runbook are mandatory before production. Wulan, can you own that?
Wulan (SRE): Yes. I'd also like a load test on the new Postgres cluster first. Medium priority.`,
  },
];
```

### 2.4 `lib/mocks.ts`

> [!TIP]
> Setelah AI integration jalan (Phase 4), jalankan setiap preset 3-5x, pilih output terbaik, lalu replace mock data ini. Fallback jadi sebagus output AI asli.

```typescript
import { Analysis } from "./schema";

export const MOCKS: Record<string, Analysis> = {
  "payment-outage": {
    meeting_summary:
      "Payment success rate dropped to 61% due to Stripe webhook timeouts and connection pool exhaustion. Team is implementing hotfixes including connection pool tuning, retry queue, and alerting.",
    tickets: [
      {
        id: "SS-101",
        issue_title: "Increase connection pool size and add circuit breaker",
        assignee: "Dimas",
        priority: "Critical",
        story_points: 3,
        acceptance_criteria: [
          "Connection pool sized to handle 2x peak traffic",
          "Circuit breaker trips after 5 consecutive failures",
          "Pod restart frequency drops to zero under normal load",
        ],
        dependency: {
          has_dependency: true,
          blocked_by: ["SS-102"],
          note: "Circuit breaker requires retry queue to avoid losing failed transactions",
        },
        column: "in_progress",
      },
      {
        id: "SS-102",
        issue_title: "Build retry queue with exponential backoff",
        assignee: "Bayu",
        priority: "Critical",
        story_points: 8,
        acceptance_criteria: [
          "Failed webhook events are queued and retried up to 5 times",
          "Backoff intervals: 1s, 2s, 4s, 8s, 16s",
          "Idempotency keys prevent duplicate charges on retry",
        ],
        dependency: {
          has_dependency: false,
          blocked_by: [],
          note: "",
        },
        column: "in_progress",
      },
      {
        id: "SS-103",
        issue_title: "Implement idempotency keys for payment retries",
        assignee: "Bayu",
        priority: "Critical",
        story_points: 5,
        acceptance_criteria: [
          "Every payment request includes a unique idempotency key",
          "Duplicate retries return cached response, no double charge",
        ],
        dependency: {
          has_dependency: true,
          blocked_by: ["SS-102"],
          note: "Must ship together with retry queue",
        },
        column: "in_progress",
      },
      {
        id: "SS-104",
        issue_title: "Prepare customer notice and update status page",
        assignee: "Sari",
        priority: "High",
        story_points: 2,
        acceptance_criteria: [
          "Status page updated within 30 minutes of incident",
          "Customer email sent with incident summary and ETA",
        ],
        dependency: {
          has_dependency: false,
          blocked_by: [],
          note: "",
        },
        column: "todo",
      },
      {
        id: "SS-105",
        issue_title: "Add Grafana alerts for webhook failure rate",
        assignee: "Dimas",
        priority: "Medium",
        story_points: 2,
        acceptance_criteria: [
          "Alert fires when webhook failure rate exceeds 5% over 5 minutes",
          "Notification sent to #incident Slack channel",
        ],
        dependency: {
          has_dependency: true,
          blocked_by: ["SS-101"],
          note: "Should be done after hotfix is stable",
        },
        column: "backlog",
      },
    ],
  },

  "mobile-latency": {
    meeting_summary:
      "Android app launch time regressed from 2s to 6.5s since release 4.2 due to sequential API calls and a slow backend endpoint. Team plans parallel fetch refactor, backend optimization, and performance testing.",
    tickets: [
      {
        id: "SS-101",
        issue_title: "Refactor home screen to parallel API calls",
        assignee: "Lisa",
        priority: "High",
        story_points: 5,
        acceptance_criteria: [
          "Home screen fires all API calls concurrently using Promise.all",
          "Below-the-fold widgets are lazy-loaded on scroll",
          "Cold start time under 2.5s on mid-range Android device",
        ],
        dependency: {
          has_dependency: true,
          blocked_by: ["SS-102"],
          note: "Performance must be validated against the optimized backend endpoint",
        },
        column: "todo",
      },
      {
        id: "SS-102",
        issue_title: "Fix N+1 query and add Redis caching on /home/feed",
        assignee: "Fajar",
        priority: "High",
        story_points: 5,
        acceptance_criteria: [
          "/home/feed response time under 300ms at p95",
          "N+1 query replaced with a single JOIN query",
          "Redis cache hit rate above 80% for repeat requests",
        ],
        dependency: {
          has_dependency: false,
          blocked_by: [],
          note: "",
        },
        column: "todo",
      },
      {
        id: "SS-103",
        issue_title: "Create performance regression test suite",
        assignee: "Maya",
        priority: "High",
        story_points: 3,
        acceptance_criteria: [
          "Automated test measures cold start on mid-range device profile",
          "Test fails if cold start exceeds 2.5s threshold",
          "Runs in CI on every release candidate build",
        ],
        dependency: {
          has_dependency: true,
          blocked_by: ["SS-101", "SS-102"],
          note: "Needs both frontend refactor and backend fix to establish accurate baseline",
        },
        column: "todo",
      },
      {
        id: "SS-104",
        issue_title: "Convert images to WebP and serve via CDN",
        assignee: "Lisa",
        priority: "Low",
        story_points: 3,
        acceptance_criteria: [
          "All product images served in WebP format",
          "Images served from CDN with cache headers",
          "Average image payload reduced by at least 40%",
        ],
        dependency: {
          has_dependency: true,
          blocked_by: ["SS-101"],
          note: "Should be done after the main refactor",
        },
        column: "backlog",
      },
    ],
  },

  "db-migration": {
    meeting_summary:
      "Team is planning zero-downtime migration of the 80M-row orders table from MySQL to PostgreSQL using a dual-write strategy with backfill and data consistency validation.",
    tickets: [
      {
        id: "SS-101",
        issue_title: "Create schema mapping and type conversion review",
        assignee: "Nadia",
        priority: "High",
        story_points: 3,
        acceptance_criteria: [
          "All MySQL column types mapped to PostgreSQL equivalents",
          "Edge cases documented (e.g. ENUM, DATETIME vs TIMESTAMPTZ)",
          "Review approved by Tech Lead",
        ],
        dependency: {
          has_dependency: false,
          blocked_by: [],
          note: "",
        },
        column: "todo",
      },
      {
        id: "SS-102",
        issue_title: "Implement dual-write layer with feature flags",
        assignee: "Eko",
        priority: "High",
        story_points: 8,
        acceptance_criteria: [
          "All writes go to both MySQL and PostgreSQL when flag is enabled",
          "Feature flag allows instant rollback to MySQL-only",
          "Write latency increase is under 50ms at p99",
        ],
        dependency: {
          has_dependency: true,
          blocked_by: ["SS-101"],
          note: "Schema mapping must be finalized before implementing dual-write",
        },
        column: "todo",
      },
      {
        id: "SS-103",
        issue_title: "Build backfill job and data consistency checker",
        assignee: "Nadia",
        priority: "High",
        story_points: 5,
        acceptance_criteria: [
          "Backfill processes 80M rows with resumable checkpoints",
          "Consistency checker reports row-level mismatches",
          "Zero data loss verified across 100% of rows",
        ],
        dependency: {
          has_dependency: true,
          blocked_by: ["SS-102"],
          note: "Backfill cannot start until dual-write is live to avoid missing new rows",
        },
        column: "todo",
      },
      {
        id: "SS-104",
        issue_title: "Write cutover plan and rollback runbook",
        assignee: "Wulan",
        priority: "High",
        story_points: 3,
        acceptance_criteria: [
          "Step-by-step cutover procedure documented",
          "Rollback can be executed in under 5 minutes",
          "Runbook reviewed and signed off by Tech Lead and SRE",
        ],
        dependency: {
          has_dependency: true,
          blocked_by: ["SS-103"],
          note: "Cutover plan depends on validated backfill completion",
        },
        column: "todo",
      },
      {
        id: "SS-105",
        issue_title: "Run load test on PostgreSQL cluster",
        assignee: "Wulan",
        priority: "Medium",
        story_points: 3,
        acceptance_criteria: [
          "Load test simulates 2x peak production traffic",
          "PostgreSQL query latency stays under 100ms at p95",
          "No connection pool exhaustion under sustained load",
        ],
        dependency: {
          has_dependency: true,
          blocked_by: ["SS-102"],
          note: "Needs dual-write active to test realistic write patterns",
        },
        column: "backlog",
      },
    ],
  },
};
```

### 2.5 `lib/rate-limit.ts`

```typescript
const hits = new Map<string, number[]>();

const WINDOW_MS = 60_000; // 1 menit
const MAX_REQUESTS = 10;

export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (timestamps.length >= MAX_REQUESTS) return true;
  timestamps.push(now);
  hits.set(ip, timestamps);
  return false;
}
```

### Commit

```bash
git add lib/
git commit -m "feat(lib): add zod schema, samples, mocks, prompt, rate-limit"
```

---

## 🎨 Phase 3: Static UI + Kanban Board (~2-3 jam)

### 3.1 `app/globals.css`

Sesuaikan dengan output shadcn init. Tambahkan di bagian bawah:

```css
/* Di bawah config shadcn yang sudah ada */

@layer utilities {
  .kanban-column {
    @apply flex flex-col gap-3 rounded-xl bg-slate-50 p-4 min-h-[400px];
  }
}
```

### 3.2 `app/layout.tsx`

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SprintSync — AI Meeting-to-Sprint Converter",
  description:
    "Transform chaotic meeting transcripts into organized sprint tickets in seconds.",
  openGraph: {
    title: "SprintSync",
    description: "AI Meeting-to-Sprint Converter",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white text-slate-900 antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

### 3.3 `components/Header.tsx`

```tsx
import { Zap } from "lucide-react";

interface HeaderProps {
  demoMode: boolean;
}

export function Header({ demoMode }: HeaderProps) {
  return (
    <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-blue-600" />
          <span className="text-xl font-bold tracking-tight">SprintSync</span>
          <span className="text-sm text-slate-400 hidden sm:inline">
            AI Meeting → Sprint Converter
          </span>
        </div>
        {demoMode && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
            Demo Mode
          </span>
        )}
      </div>
    </header>
  );
}
```

### 3.4 `components/SampleSelector.tsx`

```tsx
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
```

### 3.5 `components/TranscriptPanel.tsx`

```tsx
interface TranscriptPanelProps {
  transcript: string;
  onChange: (value: string) => void;
  disabled: boolean;
  maxLength?: number;
}

export function TranscriptPanel({
  transcript,
  onChange,
  disabled,
  maxLength = 6000,
}: TranscriptPanelProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">
          Meeting Transcript
        </label>
        <span className="text-xs text-slate-400">
          {transcript.length}/{maxLength}
        </span>
      </div>
      <textarea
        value={transcript}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        disabled={disabled}
        placeholder="Paste your meeting transcript here, or select a sample above…"
        className="h-64 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700 placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
      />
    </div>
  );
}
```

### 3.6 `components/TicketCard.tsx`

```tsx
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
```

### 3.7 `components/KanbanBoard.tsx`

```tsx
import { Ticket } from "@/lib/schema";
import { TicketCard } from "./TicketCard";

const COLUMNS: { key: Ticket["column"]; label: string; accent: string }[] = [
  { key: "in_progress", label: "🔄 In Progress", accent: "border-t-blue-500" },
  { key: "todo", label: "📋 To Do", accent: "border-t-orange-500" },
  { key: "backlog", label: "📦 Backlog", accent: "border-t-slate-400" },
];

interface KanbanBoardProps {
  tickets: Ticket[];
}

export function KanbanBoard({ tickets }: KanbanBoardProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {COLUMNS.map((col) => {
        const colTickets = tickets.filter((t) => t.column === col.key);
        return (
          <div
            key={col.key}
            className={`kanban-column border-t-4 ${col.accent}`}
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-slate-700">
                {col.label}
              </h2>
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
                {colTickets.length}
              </span>
            </div>
            {colTickets.map((t) => (
              <TicketCard key={t.id} t={t} />
            ))}
            {colTickets.length === 0 && (
              <p className="text-xs text-slate-400 italic py-8 text-center">
                No tickets
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

### 3.8 `components/AnalyzingState.tsx`

```tsx
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
```

### 3.9 `components/MetricsBar.tsx`

```tsx
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
```

### 3.10 `components/ErrorState.tsx`

```tsx
import { AlertTriangle, RotateCcw } from "lucide-react";

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-red-200 bg-red-50 p-8 text-center">
      <AlertTriangle className="h-8 w-8 text-red-500" />
      <div>
        <p className="font-medium text-red-700">Analysis Failed</p>
        <p className="mt-1 text-sm text-red-600">{message}</p>
      </div>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
      >
        <RotateCcw className="h-4 w-4" />
        Try Again
      </button>
    </div>
  );
}
```

### Commit

```bash
git add components/ app/layout.tsx app/globals.css
git commit -m "feat(ui): static layout + kanban board + all components"
```

---

## 🔌 Phase 4: API Route + AI Integration (~2-3 jam)

### 4.1 `app/api/analyze/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { SYSTEM_PROMPT } from "@/lib/prompt";
import { AnalysisSchema } from "@/lib/schema";
import { MOCKS } from "@/lib/mocks";
import { isRateLimited } from "@/lib/rate-limit";

export const maxDuration = 30;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function parseAndValidate(raw: string) {
  const clean = raw.replace(/```json|```/g, "").trim();
  return AnalysisSchema.parse(JSON.parse(clean));
}

function createAbortSignal(ms: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

async function callGroq(transcript: string) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `TRANSCRIPT:\n${transcript}` },
      ],
    }),
    signal: createAbortSignal(12000),
  });

  if (!res.ok) throw new Error(`Groq ${res.status}`);
  const data = await res.json();
  return parseAndValidate(data.choices[0].message.content);
}

async function callGemini(transcript: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [
          { role: "user", parts: [{ text: `TRANSCRIPT:\n${transcript}` }] },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
      signal: createAbortSignal(12000),
    }
  );

  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json();
  return parseAndValidate(data.candidates[0].content.parts[0].text);
}

export async function POST(req: NextRequest) {
  // Rate limit
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 }
    );
  }

  const { transcript, sampleId, demoMode } = await req.json();

  // Demo mode: mock + fake delay
  if (demoMode && sampleId && MOCKS[sampleId]) {
    await sleep(3000);
    return NextResponse.json({ source: "mock", data: MOCKS[sampleId] });
  }

  if (!transcript || transcript.length < 50) {
    return NextResponse.json(
      { error: "Transcript too short (min 50 characters)" },
      { status: 400 }
    );
  }

  // Layer 1: Groq → Layer 2: Gemini → Layer 3: Mock
  const providers: [string, () => Promise<unknown>][] = [
    ["groq", () => callGroq(transcript)],
    ["gemini", () => callGemini(transcript)],
  ];

  for (const [name, fn] of providers) {
    try {
      return NextResponse.json({ source: name, data: await fn() });
    } catch (e) {
      console.error(`[${name}] failed:`, e);
    }
  }

  // Layer 3: mock fallback for known samples
  if (sampleId && MOCKS[sampleId]) {
    await sleep(2000);
    return NextResponse.json({ source: "mock", data: MOCKS[sampleId] });
  }

  return NextResponse.json(
    { error: "All AI providers unavailable. Please try again later." },
    { status: 503 }
  );
}
```

### 4.2 Test with curl

```bash
# Test mock mode
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"transcript":"test","sampleId":"payment-outage","demoMode":true}'

# Test real AI (needs valid API keys in .env.local)
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"transcript":"[Meeting] Alice: We need to fix the login bug. Bob: I can do it in 2 days. Alice: Also the dashboard is slow. Carol: The DB query needs an index, 1 day. Bob: And we should add rate limiting to the API."}'
```

### Commit

```bash
git add app/api/
git commit -m "feat(api): analyze route with groq + gemini + mock fallback"
```

---

## 🔗 Phase 5: Wire It All Together (~2-3 jam)

### 5.1 `app/page.tsx`

```tsx
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
          setError(
            err instanceof Error ? err.message : "Something went wrong"
          );
          setState("error");
        }
      }
    },
    [demoMode]
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
            <SampleSelector
              onSelect={handleSelectSample}
              disabled={state === "analyzing"}
            />
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
                        `### ${t.id}: ${t.issue_title}\n- **Assignee:** ${t.assignee}\n- **Priority:** ${t.priority}\n- **SP:** ${t.story_points}\n- **AC:**\n${t.acceptance_criteria.map((ac) => `  - ${ac}`).join("\n")}${t.dependency.has_dependency ? `\n- **Blocked by:** ${t.dependency.blocked_by.join(", ")} — ${t.dependency.note}` : ""}`
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
```

### Commit

```bash
git add app/page.tsx
git commit -m "feat(app): connect frontend to api + demo mode + client fallback"
```

---

## ✨ Phase 6: Animations + Final Polish (~1-2 jam)

### 6.1 Framer Motion Stagger pada `KanbanBoard.tsx`

Tambahkan di `KanbanBoard.tsx`, wrap setiap `TicketCard` dengan motion:

```tsx
"use client";

import { motion } from "framer-motion";
import { Ticket } from "@/lib/schema";
import { TicketCard } from "./TicketCard";

// ... COLUMNS array tetap sama ...

export function KanbanBoard({ tickets }: KanbanBoardProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {COLUMNS.map((col) => {
        const colTickets = tickets.filter((t) => t.column === col.key);
        return (
          <div key={col.key} className={`kanban-column border-t-4 ${col.accent}`}>
            {/* ... header tetap sama ... */}
            {colTickets.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15, duration: 0.4 }}
              >
                <TicketCard t={t} />
              </motion.div>
            ))}
            {/* ... empty state tetap sama ... */}
          </div>
        );
      })}
    </div>
  );
}
```

### 6.2 Responsive: Mobile Kanban

Kanban grid sudah responsive berkat `md:grid-cols-3` — pada mobile menjadi 1 kolom stack.

### 6.3 Favicon

Cari atau buat icon sederhana (emoji ⚡ sebagai SVG), simpan di `app/favicon.ico`.

### Commit

```bash
git add .
git commit -m "feat(ui): framer motion stagger + responsive + favicon"
```

---

## 🚀 Phase 7: Deploy (~30 menit)

### 7.1 Push to GitHub

```bash
git remote add origin https://github.com/<username>/sprintsync.git
git branch -M main
git push -u origin main
```

### 7.2 Deploy ke Vercel

1. [vercel.com](https://vercel.com/) → **Add New Project** → Import repo
2. **Environment Variables** → tambahkan:
   - `GROQ_API_KEY` = `gsk_xxx`
   - `GROQ_MODEL` = (cek model terbaru)
   - `GEMINI_API_KEY` = `AIza_xxx`
   - `GEMINI_MODEL` = (cek model terbaru)
3. **Deploy**
4. Rename project → `sprintsync-demo` → URL jadi `sprintsync-demo.vercel.app`

### 7.3 Post-Deploy Tests

```bash
# Dari device berbeda (HP, laptop teman, incognito)
# Jalankan ketiga preset
# Cek Vercel → Logs untuk errors
```

---

## ✅ Pre-Presentation Checklist

| # | Task | Done |
|---|------|------|
| 1 | Buka link dari HP dan laptop lain, jalankan ketiga preset | ☐ |
| 2 | Cek kuota di dashboard Groq dan Gemini | ☐ |
| 3 | `npm run dev` jalan di laptop sebagai cadangan lokal | ☐ |
| 4 | Rekam layar demo sukses (MP4), taruh di slide terakhir | ☐ |
| 5 | Hotspot HP siap sebagai cadangan jaringan | ☐ |
| 6 | Test `Ctrl+Shift+D` demo mode toggle bekerja | ☐ |
| 7 | Pastikan mock data sudah diupdate dari output AI terbaik | ☐ |
| 8 | Siapkan kalimat untuk pertanyaan tentang fallback | ☐ |

### Kalimat siap pakai jika ditanya:

> *"For reliability, SprintSync has multi-provider failover and a cached demo mode — the same resilience pattern we'd use in production."*

---

## 🛡️ Fail-Safe Chain (Recap)

```
Layer 1: Groq AI (~1-3s)
  ↓ fail/timeout
Layer 2: Gemini AI (~2-5s)
  ↓ fail/timeout
Layer 3: Server-side Mock (2s fake delay)
  ↓ server unreachable
Layer 4: Client-side Mock (2.5s fake delay, no network needed)
  ↓ Vercel down
Layer 5: localhost `npm run dev` + video recording backup
```

---

## 📝 Notes & Improvements Applied

Dibanding rencana awal, artifact ini sudah menerapkan:

1. ✅ **Rate limiter** — mencegah abuse API route
2. ✅ **`Ctrl+Shift+D`** — shortcut aman, tidak konflik dengan textarea
3. ✅ **MetricsBar** — menampilkan ticket count, total SP, time saved, response time
4. ✅ **SourceBadge** — menunjukkan AI provider yang digunakan
5. ✅ **Copy as Markdown** — export ringan tapi berguna
6. ✅ **`AbortController` wrapper** — kompatibilitas runtime lebih baik
7. ✅ **Env validation** — skip provider jika key tidak di-set (bukan crash)
8. ✅ **Client-side fallback** — jika bahkan fetch ke API gagal total
9. ✅ **Character counter** — pada textarea input
10. ✅ **Meta tags + OG** — untuk link sharing
