'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type ProductType = 'ebook' | 'podcast';
interface Product {
  id: number;
  type: ProductType;
  title: string;
  thumbnail_url?: string | null;
  category?: string | null;
  price_cents: number;
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '');
const ORIGIN   = API_BASE.replace(/\/api$/, '');
const authFetch: typeof fetch = (input, init) => fetch(input, { credentials: 'include', ...(init ?? {}) });

const formatVND = (n: number) => n.toLocaleString('vi-VN', { maximumFractionDigits: 0 }) + ' đ';
const FALLBACK_IMG = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='560'>
     <rect width='100%' height='100%' fill='#f3f4f6'/>
     <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
       font-family='sans-serif' font-size='20' fill='#9ca3af'>Podcast</text>
   </svg>`
)}`;

const toAbs = (u?: string|null) => {
  if (!u) return '';
  const s = u.trim();
  if (/^file:\/\//i.test(s) || /^[A-Za-z]:\\/.test(s)) return '';
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  if (s.startsWith('/')) return `${ORIGIN}${s}`;
  return s;
};

export default function PodcastsListPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [favIds, setFavIds] = useState<Set<number>>(new Set());
  const [canFav, setCanFav] = useState(true);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string|null>(null);

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true); setErr(null);
        const [resPods, resFav] = await Promise.all([
          fetch(`${API_BASE}/v1/catalog/products?type=podcast&per_page=50`, { signal: ac.signal }),
          authFetch(`${API_BASE}/v1/favourites`, { signal: ac.signal }),
        ]);
        if (!resPods.ok) throw new Error(`HTTP ${resPods.status}`);
        const j = await resPods.json();
        setItems(j?.data?.items || []);
        if (resFav.status === 401) { setCanFav(false); setFavIds(new Set()); }
        else if (resFav.ok) {
          const jf = await resFav.json();
          setFavIds(new Set<number>(jf?.data?.product_ids || []));
          setCanFav(true);
        } else setCanFav(false);
      } catch (e: any) {
        if (e?.name !== 'AbortError') setErr(e?.message || 'Failed to load list');
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, []);

  const toggleFav = async (productId: number) => {
    if (!canFav) return alert('Please sign in to use Favorites.');
    const on = !favIds.has(productId);

    // optimistic
    setFavIds(prev => { const s = new Set(prev); on ? s.add(productId) : s.delete(productId); return s; });

    const url  = on ? `${API_BASE}/v1/favourites` : `${API_BASE}/v1/favourites/${productId}`;
    const init: RequestInit = on
      ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product_id: productId }) }
      : { method: 'DELETE' };
    const res = await authFetch(url, init);

    if (!res.ok) {
      // revert
      setFavIds(prev => { const s = new Set(prev); on ? s.delete(productId) : s.add(productId); return s; });
      if (res.status === 401) { setCanFav(false); alert('Session expired. Please sign in.'); }
      else alert('Failed to update Favorites.');
    }
  };

  if (loading) return <div className="p-6">Loading podcasts…</div>;
  if (err) return <div className="p-6 text-red-600">Error: {err}</div>;
  if (!items.length) return <div className="p-6">No podcasts yet.</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Podcasts</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map(p => {
          const isFav = favIds.has(p.id);
          const img = toAbs(p.thumbnail_url) || FALLBACK_IMG;
          return (
            <Link key={p.id} href={`/podcast/${p.id}`} className="relative block border rounded-xl p-3 hover:shadow">
              <img
                src={img}
                alt={p.title}
                className="w-full h-40 object-cover rounded-md"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG; }}
              />

              {/* Nút trái tim */}
              <button
                aria-label={isFav ? 'Remove from Favorites' : 'Add to Favorites'}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFav(p.id); }}
                className={`absolute top-2 right-2 px-2 py-1 rounded-full shadow text-sm
                  ${isFav ? 'bg-red-600 text-white' : 'bg-white text-red-600 border'}`}
                title={isFav ? 'Remove from Favorites' : 'Add to Favorites'}
              >
                {isFav ? '♥' : '♡'}
              </button>

              <div className="mt-2 font-medium line-clamp-2">{p.title}</div>
              <div className="text-sm text-gray-500">{p.category || '—'}</div>
              <div className="text-sm">{p.price_cents > 0 ? formatVND(p.price_cents) : 'Free'}</div>
            </Link>
          );
        })}
      </div>

      {!canFav && <div className="mt-4 text-sm text-gray-600">* Please sign in to use Favorites.</div>}
    </div>
  );
}
