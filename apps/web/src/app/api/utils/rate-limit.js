/**
 * rate-limit.js
 * In-memory sliding window rate limiter untuk Next.js API routes.
 *
 * Penggunaan:
 *   const rl = rateLimit({ windowMs: 60_000, max: 5 });
 *   const ip  = request.headers.get('x-forwarded-for') ?? 'unknown';
 *   const { ok, remaining } = rl.check(ip);
 *   if (!ok) return Response.json({ error: 'Terlalu banyak permintaan' }, { status: 429 });
 */

const store = new Map(); // key -> [timestamp, ...]

/**
 * @param {{ windowMs?: number, max?: number }} options
 */
export function rateLimit({ windowMs = 60_000, max = 10 } = {}) {
  return {
    check(key) {
      const now = Date.now();
      const windowStart = now - windowMs;

      let hits = store.get(key) ?? [];
      hits = hits.filter((t) => t > windowStart);

      if (hits.length >= max) {
        const resetMs = hits[0] + windowMs - now;
        store.set(key, hits);
        return { ok: false, remaining: 0, resetMs };
      }

      hits.push(now);
      store.set(key, hits);

      if (store.size > 10_000) {
        for (const [k, v] of store) {
          if (v.every((t) => t <= windowStart)) store.delete(k);
        }
      }

      return { ok: true, remaining: max - hits.length, resetMs: 0 };
    },
  };
}

/**
 * Ambil IP client dari request headers (Vercel / Next.js).
 * @param {Request} request
 * @returns {string}
 */
export function getClientIp(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}
