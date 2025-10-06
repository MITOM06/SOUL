// src/lib/img.ts
// Helper to normalize image URLs consistently across the app.
// - Keeps http(s) URLs as-is
// - Resolves scheme-relative URLs (//...) using the current protocol
// - Prefixes API origin for paths like "/storage/..." or relative paths like "storage/..."
// - Drops unsupported local file URLs (file://, C:\...)

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '');
const ORIGIN   = API_BASE.replace(/\/api$/, '');

export function toAbsoluteImgUrl(u?: string | null): string {
  if (!u) return '';
  const s = String(u).trim();
  if (!s) return '';

  // Exclude local filesystem paths
  if (/^file:\/\//i.test(s) || /^[A-Za-z]:\\/.test(s)) return '';

  // Absolute http(s)
  if (/^https?:\/\//i.test(s)) return s;

  // Scheme-relative
  if (s.startsWith('//')) {
    const proto = (typeof window !== 'undefined' ? window.location.protocol : 'https:');
    return `${proto}${s}`;
  }

  // Leading slash → join with origin
  if (s.startsWith('/')) return `${ORIGIN}${s}`;

  // Relative like "storage/..." or "./storage/..." → normalize and prefix origin
  return `${ORIGIN}/${s.replace(/^\.?\//, '')}`;
}

