// Continues page. Shows books and podcasts the user has started but not finished.
// "Remove" deletes progress in DB with robust fallbacks and clears local caches.
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import UserPanelLayout from '@/components/UserPanelLayout';
import BookCard from '@/components/BookCard';
import PodcastCard from '@/components/PodcastCard';
// No demo fallbacks here; only real user progress should show
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

/* ---------- Types ---------- */
interface ContinueItem {
  product_id: number;
  type?: string;              // 'ebook' | 'podcast' | ...
  current_page?: number;
  current_chapter?: number;
  current_time_seconds?: number;
  duration_seconds?: number;
}
interface BookLike {
  id: number;
  title: string;
  cover?: string | null;
  category?: string | null;
  __progress?: { current_page?: number; current_chapter?: number };
}
interface PodcastLike {
  id: number;
  title: string;
  cover?: string | null;
  description?: string | null;
  __progress?: { current_time_seconds?: number; duration_seconds?: number };
}

/* ---------- Helpers ---------- */
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '');
const ORIGIN = API_BASE.replace(/\/api$/, '');

const toAbs = (u?: string | null) => {
  if (!u) return '';
  const s = u.trim();
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  if (s.startsWith('/')) return `${ORIGIN}${s}`;
  return s;
};
const FALLBACK_IMG = (() => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='560'>
    <rect width='100%' height='100%' fill='#f3f4f6'/>
    <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
      font-family='sans-serif' font-size='20' fill='#9ca3af'>No cover</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
})();
const FALLBACK_PODCAST = (() => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='340'>
    <rect width='100%' height='100%' fill='#eef2ff'/>
    <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
      font-family='sans-serif' font-size='20' fill='#6366f1'>Podcast</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
})();
const secToClock = (s?: number) => {
  const t = Math.max(0, Math.floor(Number(s || 0)));
  const m = Math.floor(t / 60);
  const ss = t % 60;
  return `${m}:${String(ss).padStart(2, '0')}`;
};

/* ---------- Local fallback readers ---------- */
function readLocalBookContinues(): ContinueItem[] {
  try {
    const out: ContinueItem[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i) || '';
      if (!key.startsWith('continue:')) continue;
      const id = Number(key.split(':')[1] || 0);
      const page = Number(localStorage.getItem(key) || 0);
      if (Number.isFinite(id) && id > 0 && page > 0) {
        out.push({ product_id: id, type: 'ebook', current_page: page, current_chapter: 1 });
      }
    }
    return out;
  } catch { return []; }
}
function readLocalPodcastContinues(): ContinueItem[] {
  try {
    const out: ContinueItem[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i) || '';
      if (key.startsWith('continue_podcast_')) {
        const id = Number(key.replace('continue_podcast_', ''));
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        try {
          const j = JSON.parse(raw);
          const s = Number(j?.s || 0);
          const d = Number(j?.d || 0);
          if (s > 0 || d > 0) out.push({ product_id: id, type: 'podcast', current_time_seconds: s, duration_seconds: d });
        } catch {}
      }
      if (key.startsWith('continue:podcast:')) {
        const id = Number(key.split(':')[2] || 0);
        const sec = Number(localStorage.getItem(key) || 0);
        if (sec > 0) out.push({ product_id: id, type: 'podcast', current_time_seconds: sec, duration_seconds: 0 });
      }
    }
    return out;
  } catch { return []; }
}
function removeLocalProgress(productId: number, type: 'ebook' | 'podcast') {
  try {
    if (type === 'ebook') {
      localStorage.removeItem(`continue:${productId}`);
    } else {
      localStorage.removeItem(`continue_podcast_${productId}`);
      localStorage.removeItem(`continue:podcast:${productId}`);
    }
  } catch {}
}

/* ---------- Page ---------- */
export default function ContinuesPage() {
  const { user } = useAuth();
  const [books, setBooks] = useState<BookLike[]>([]);
  const [podcasts, setPodcasts] = useState<PodcastLike[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchFromServerList(): Promise<ContinueItem[]> {
      // Nếu backend không có list, yên lặng trả rỗng
      try {
        const resp = await api.get('/v1/continues');
        const arr = resp?.data?.data || resp?.data || [];
        if (Array.isArray(arr)) return arr as ContinueItem[];
      } catch {}
      return [];
    }

    async function fetchProductMeta(pid: number) {
      try {
        const r1 = await api.get(`/v1/catalog/products/${pid}`);
        return r1?.data?.data || r1?.data;
      } catch {
        try {
          const r2 = await fetch(`${API_BASE}/v1/catalog/products/${pid}`);
          if (r2.ok) return (await r2.json())?.data || null;
        } catch {}
      }
      return null;
    }

    async function run() {
      setLoading(true);

      const serverContinues = await fetchFromServerList();
      // IMPORTANT: When a user is logged in, ignore local fallback progresses to prevent
      // showing stale items from a different account on the same browser.
      const useLocalFallback = !user; // only when not logged in
      const localBooks = useLocalFallback ? readLocalBookContinues() : [];
      const localPods  = useLocalFallback ? readLocalPodcastContinues() : [];

      const map = new Map<number, ContinueItem>();
      for (const c of [...localBooks, ...localPods]) map.set(c.product_id, c);
      for (const c of serverContinues) map.set(c.product_id, c);

      const all = Array.from(map.values());
      // Classify each continue item ONCE with clear precedence:
      // 1) If has time > 0 -> podcast
      // 2) Else if has page > 0 -> ebook
      // 3) Else use provided type
      const types = new Map<number, 'ebook' | 'podcast'>();
      for (const c of all) {
        const t = String(c.type || '').toLowerCase();
        if ((c.current_time_seconds || 0) > 0) {
          types.set(c.product_id, 'podcast');
        } else if ((c.current_page || 0) > 0) {
          types.set(c.product_id, 'ebook');
        } else if (t === 'podcast' || t === 'ebook') {
          types.set(c.product_id, t as any);
        }
      }
      const bookIds = Array.from(types.entries()).filter(([,k]) => k==='ebook').map(([id]) => id);
      const podIds  = Array.from(types.entries()).filter(([,k]) => k==='podcast').map(([id]) => id);

      const bookMetas = await Promise.all(bookIds.map(async pid => ({ pid, meta: await fetchProductMeta(pid) })));
      if (cancelled) return;

      setBooks(bookMetas.filter(m => m.meta).map(({ pid, meta }) => {
        const product = meta?.product || meta;
        const cover = toAbs(product?.thumbnail_url) || FALLBACK_IMG;
        const prog = map.get(pid);
        return {
          id: product?.id ?? pid,
          title: product?.title ?? 'Untitled',
          cover,
          category: product?.category || null,
          __progress: { current_page: prog?.current_page, current_chapter: prog?.current_chapter },
        } as BookLike;
      }));

      const podMetas = await Promise.all(podIds.map(async pid => ({ pid, meta: await fetchProductMeta(pid) })));
      if (cancelled) return;

      const pods = podMetas.filter(m => m.meta).map(({ pid, meta }) => {
        const product = meta?.product || meta;
        const cover = toAbs(product?.thumbnail_url) || FALLBACK_PODCAST;
        const prog = map.get(pid);
        return {
          id: product?.id ?? pid,
          title: product?.title ?? 'Untitled',
          cover,
          description: product?.description || null,
          __progress: { current_time_seconds: prog?.current_time_seconds, duration_seconds: prog?.duration_seconds },
        } as PodcastLike;
      });

      setPodcasts(pods);
      setLoading(false);
    }

    run();
    return () => { cancelled = true; };
  }, []);

  const bookItems = useMemo(() => books, [books]);

  const podcastItems = useMemo(() => podcasts, [podcasts]);

  // ---- HARD DELETE with aggressive fallbacks (handles podcast) ----
  const removeProgress = async (productId: number, type: 'ebook' | 'podcast') => {
    if (!productId) return;
    if (!window.confirm('Remove progress permanently for this item? This cannot be undone.')) return;

    setRemoving(productId);
    const prevBooks = books, prevPods = podcasts;

    // optimistic UI
    if (type === 'ebook') setBooks(prev => prev.filter(b => b.id !== productId));
    else setPodcasts(prev => prev.filter(p => p.id !== productId));

    // clear local cache now
    removeLocalProgress(productId, type);

    // payloads thử theo nhiều “dialect” của backend
    const payloads: any[] = [
      // Podcast chuẩn
      { current_time_seconds: 0, duration_seconds: 0 },
      // Book dialect (nhiều API dùng chung)
      { current_page: 0, current_chapter: 1 },
      // Hợp nhất 4 trường (đảm bảo reset)
      { current_time_seconds: 0, duration_seconds: 0, current_page: 0, current_chapter: 1 },
      // Một số backend có cờ reset
      { reset: true },
    ];

    const tryFetch = async (method: 'POST'|'PUT'|'PATCH', body: any) => {
      const r = await fetch(`${API_BASE}/v1/continues/${productId}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      return r.ok;
    };

    try {
      // 1) DELETE nếu backend hỗ trợ
      await api.delete(`/v1/continues/${productId}`);
      setRemoving(null);
      return;
    } catch {}

    // 2) Fallback POST/PUT/PATCH với nhiều payload
    for (const body of payloads) {
      try { if (await tryFetch('POST', body)) { setRemoving(null); return; } } catch {}
    }
    for (const body of payloads) {
      try { if (await tryFetch('PUT', body))  { setRemoving(null); return; } } catch {}
    }
    for (const body of payloads) {
      try { if (await tryFetch('PATCH', body)) { setRemoving(null); return; } } catch {}
    }

    // Revert nếu tất cả fail
    setBooks(prevBooks);
    setPodcasts(prevPods);
    setRemoving(null);
    alert('Failed to remove progress.');
  };

  return (
    <UserPanelLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Continues</h1>

        {/* Books */}
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-semibold">In-progress Books</h2>
            {loading && <span className="text-sm text-zinc-500">Loading…</span>}
          </div>

          {bookItems.length === 0 ? (
            <div className="text-sm text-zinc-600">No books in progress.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {bookItems.map((b) => (
                <div key={b.id} className="relative group">
                  <BookCard book={{ id: b.id, title: b.title, cover: b.cover } as any} />
                  {b.__progress?.current_page ? (
                    <div className="absolute left-2 bottom-2 rounded-md bg-black/65 text-white text-xs px-2 py-0.5">
                      Page {b.__progress.current_page}
                    </div>
                  ) : null}
                  <button
                    disabled={removing === b.id}
                    onClick={() => removeProgress(b.id, 'ebook')}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity
                               text-xs px-2 py-1 rounded bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
                  >
                    {removing === b.id ? 'Removing…' : 'Remove'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Podcasts */}
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-semibold">In-progress Podcasts</h2>
            {loading && <span className="text-sm text-zinc-500">Loading…</span>}
          </div>

          {podcastItems.length === 0 ? (
            <div className="text-sm text-zinc-600">No podcasts in progress.</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {podcastItems.map((p) => {
                const cur = (p as any).__progress?.current_time_seconds as number | undefined;
                const dur = (p as any).__progress?.duration_seconds as number | undefined;
                return (
                  <div key={p.id} className="relative group">
                    <PodcastCard podcast={{ id: p.id, title: p.title, cover: p.cover, description: p.description } as any} variant="wide" />
                    {(cur || 0) > 0 || (dur || 0) > 0 ? (
                      <div className="absolute left-2 bottom-2 rounded-md bg-black/65 text-white text-xs px-2 py-0.5">
                        {secToClock(cur)}{(dur || 0) > 0 ? ` / ${secToClock(dur)}` : ''}
                      </div>
                    ) : null}
                    <button
                      disabled={removing === p.id}
                      onClick={() => removeProgress(p.id, 'podcast')}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity
                                 text-xs px-2 py-1 rounded bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
                    >
                      {removing === p.id ? 'Removing…' : 'Remove'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </UserPanelLayout>
  );
}
