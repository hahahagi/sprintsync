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
