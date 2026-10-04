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
