/**
 * sanitize.js
 * Fungsi sanitasi input untuk mencegah XSS.
 * Strip HTML tags dan karakter berbahaya dari teks bebas.
 */

export function sanitizeText(value, { maxLength = 500 } = {}) {
  if (typeof value !== 'string') return '';
  return value
    .trim()
    .slice(0, maxLength)
    .replace(/<[^>]*>/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

export function sanitizeEmail(value) {
  if (typeof value !== 'string') return '';
  const clean = value.toLowerCase().trim().slice(0, 254);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return '';
  return clean;
}

export function sanitizePhone(value) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/[^0-9+\-\s()]/g, '').slice(0, 20);
}

export function sanitizeNik(value) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\D/g, '').slice(0, 16);
}

export function sanitizeUrl(value) {
  if (typeof value !== 'string') return '';
  try {
    const url = new URL(value.trim());
    if (!['http:', 'https:'].includes(url.protocol)) return '';
    return url.toString();
  } catch {
    return '';
  }
}
