/**
 * csrf.js
 * CSRF protection menggunakan "Custom Header Check" pattern.
 *
 * Browser tidak secara otomatis menyertakan custom headers pada
 * cross-origin form submission, sehingga memeriksa keberadaan
 * header X-Requested-With: XMLHttpRequest adalah cara efektif
 * mencegah CSRF tanpa perlu token session tambahan.
 *
 * Penggunaan di API route:
 *   import { verifyCsrf } from '@/app/api/utils/csrf';
 *   const csrfError = verifyCsrf(request, c);
 *   if (csrfError) return csrfError;
 *
 * Penggunaan di frontend fetch():
 *   fetch('/api/...', {
 *     method: 'POST',
 *     headers: {
 *       'Content-Type': 'application/json',
 *       'X-Requested-With': 'XMLHttpRequest',
 *     },
 *     body: JSON.stringify(data),
 *   });
 */

/**
 * Verifikasi CSRF header pada request.
 * Mendukung Next.js Web Request dan Hono context (parameter c).
 * @param {Request} request
 * @param {object} [c] - Hono context (opsional)
 * @returns {Response|null}  null = OK, Response = error yang harus dikembalikan
 */
export function verifyCsrf(request, c) {
  let xrw = null;

  // Coba ambil header dari Hono context terlebih dahulu
  if (c && typeof c.req?.header === 'function') {
    xrw = c.req.header('x-requested-with');
  }

  // Fallback ke standard Web Request headers
  if (!xrw && request && typeof request.headers?.get === 'function') {
    xrw = request.headers.get('x-requested-with');
  }

  if (xrw !== 'XMLHttpRequest') {
    return Response.json(
      { error: 'Permintaan tidak valid (CSRF check gagal)' },
      { status: 403 }
    );
  }
  return null;
}

