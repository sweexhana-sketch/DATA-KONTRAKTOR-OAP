const store = new Map();
export function rateLimit({ windowMs = 60000, max = 10 } = {}) {
  return { check(key) {
    const now = Date.now(), start = now - windowMs;
    let hits = (store.get(key) || []).filter((t) => t > start);
    if (hits.length >= max) return { ok: false, remaining: 0, resetMs: hits[0] + windowMs - now };
    hits.push(now); store.set(key, hits);
    if (store.size > 10000) for (const [k, v] of store) if (v.every((t) => t <= start)) store.delete(k);
    return { ok: true, remaining: max - hits.length, resetMs: 0 };
  }};
}
export function getClientIp(request) {
  return request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
}
