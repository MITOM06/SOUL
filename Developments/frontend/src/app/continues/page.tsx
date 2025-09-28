// Continues page.  Shows books and podcasts that the user has started but not finished.
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import UserPanelLayout from '@/components/UserPanelLayout';
import BookCard from '@/components/BookCard';
import PodcastCard from '@/components/PodcastCard';
import { demoBooks } from '@/data/demoBooks';
import { demoPodcasts } from '@/data/demoPodcasts';
import api from '@/lib/api';

/* ---------- Types ---------- */
interface ContinueItem {
  product_id: number;
  type?: string;            // 'ebook' | 'podcast' | ...
  current_page?: number;
  current_chapter?: number;
}
interface BookLike {
  id: number;
  title: string;
  cover?: string | null;
  category?: string | null;
  // kèm theo progress để hiển thị phụ nếu muốn
  __progress?: { current_page?: number; current_chapter?: number };
}
interface PodcastLike {
  id: number;
  title: string;
  image?: string | null;
  description?: string | null;
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

// Lấy continues từ localStorage (fallback khi không có API list)
function readLocalContinues(): ContinueItem[] {
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
  } catch {
    return [];
  }
}

export default function ContinuesPage() {
  const [books, setBooks] = useState<BookLike[]>([]);
  const [podcasts, setPodcasts] = useState<PodcastLike[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchFromServerList(): Promise<ContinueItem[]> {
      try {
        const resp = await api.get('/v1/continues'); // nếu có endpoint list
        const arr = resp?.data?.data || resp?.data || [];
        if (Array.isArray(arr)) return arr as ContinueItem[];
      } catch {
        // ignore
      }
      return [];
    }

    async function fetchProductMeta(pid: number) {
      // ưu tiên endpoint có auth; fallback public
      try {
        const r1 = await api.get(`/v1/catalog/products/${pid}`);
        return r1?.data?.data || r1?.data;
      } catch {
        try {
          const r2 = await fetch(`${API_BASE}/v1/catalog/products/${pid}`);
          if (r2.ok) {
            const j = await r2.json();
            return j?.data || j;
          }
        } catch {
          // ignore
        }
      }
      return null;
    }

    async function run() {
      setLoading(true);

      // 1) Lấy danh sách tiếp tục từ server; nếu rỗng => dùng localStorage
      const serverContinues = await fetchFromServerList();
      const localContinues = readLocalContinues();

      // Merge theo product_id (server ưu tiên)
      const map = new Map<number, ContinueItem>();
      for (const c of localContinues) map.set(c.product_id, c);
      for (const c of serverContinues) map.set(c.product_id, c);

      const all = Array.from(map.values());
      const bookIds = all
        .filter((c) => (c.type || 'ebook').toLowerCase() === 'ebook')
        .map((c) => c.product_id);

      // 2) Lấy meta từng product
      const metas = await Promise.all(
        bookIds.map(async (pid) => {
          const meta = await fetchProductMeta(pid);
          return { pid, meta };
        })
      );

      if (cancelled) return;

      // 3) Map sang dữ liệu BookCard
      const bookList: BookLike[] = metas
        .filter((m) => !!m.meta)
        .map(({ pid, meta }) => {
          // cấu trúc product của backend hiện tại
          const product = meta?.product || meta; // phòng khi API bọc trong {product, files}
          const files = meta?.files || [];
          const cover = toAbs(product?.thumbnail_url) || FALLBACK_IMG;

          const prog = map.get(pid);
          return {
            id: product?.id ?? pid,
            title: product?.title ?? 'Untitled',
            cover,
            category: product?.category || null,
            __progress: { current_page: prog?.current_page, current_chapter: prog?.current_chapter },
          } as BookLike;
        });

      setBooks(bookList);

      // 4) Podcasts: nếu API chưa hỗ trợ, dùng demo
      setPodcasts(demoPodcasts.slice(0, 6) as any);

      setLoading(false);
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const bookItems = useMemo(() => {
    if (books.length) return books;
    return demoBooks.slice(3, 6).map((b) => ({
      id: (b as any).id,
      title: (b as any).title,
      cover: (b as any).cover,
    })) as BookLike[];
  }, [books]);

  const podcastItems = podcasts.length ? podcasts : (demoPodcasts.slice(3, 6) as any as PodcastLike[]);

  return (
    <UserPanelLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Continues</h1>

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
                <div key={b.id} className="relative">
                  <BookCard book={{ id: b.id, title: b.title, cover: b.cover } as any} />
                  {/* hiển thị progress nhẹ (tùy chọn) */}
                  {b.__progress?.current_page ? (
                    <div className="absolute left-2 bottom-2 rounded-md bg-black/60 text-white text-xs px-2 py-0.5">
                      Page {b.__progress.current_page}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-semibold">In-progress Podcasts</h2>
          {podcastItems.length === 0 ? (
            <div className="text-sm text-zinc-600">No podcasts in progress.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {podcastItems.map((p) => (
                <PodcastCard key={p.id} podcast={p as any} />
              ))}
            </div>
          )}
        </div>
      </div>
    </UserPanelLayout>
  );
}
