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
 *   const csrfError = verifyCsrf(request);
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

export function verifyCsrf(request) {
  const xrw = request.headers.get('x-requested-with');
  if (xrw !== 'XMLHttpRequest') {
    return Response.json(
      { error: 'Permintaan tidak valid (CSRF check gagal)' },
      { status: 403 }
    );
  }
  return null;
}
