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
