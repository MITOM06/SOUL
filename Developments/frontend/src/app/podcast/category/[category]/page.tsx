'use client'

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { normalizeRole } from '@/lib/role';

type Item = { id: number; title: string; thumbnail_url?: string | null; price_cents: number };

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '');
const ORIGIN   = API_BASE.replace(/\/api$/, '');

const toAbs = (u?: string|null) => {
  if (!u) return '';
  const s = u.trim();
  if (/^file:\/\//i.test(s) || /^[A-Za-z]:\\/.test(s)) return '';
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  if (s.startsWith('/')) return `${ORIGIN}${s}`;
  return s;
};

const FALLBACK = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='225'>
     <rect width='100%' height='100%' fill='#f3f4f6'/>
     <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
       font-family='sans-serif' font-size='18' fill='#9ca3af'>Podcast</text>
   </svg>`
)}
`;

/* ===================== Favourite helpers (axios + Bearer) ===================== */
function useFavourites() {
  const [favIds, setFavIds] = useState<Set<number>>(new Set());
  const [canFav, setCanFav] = useState(true);
  const [loading, setLoading] = useState(false);

  const load = async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const res = await api.get('/v1/favourites', { signal: signal as any });
      const data = res.data?.data || res.data || {};
      const ids: number[] = data.product_ids || [];
      setFavIds(new Set(ids));
      setCanFav(true);
    } catch (e: any) {
      if (e?.response?.status === 401) {
        setCanFav(false);
        setFavIds(new Set());
      }
    } finally {
      setLoading(false);
    }
  };

  const toggle = async (productId: number) => {
    if (!canFav) { alert('Please sign in to use Favorites'); return; }
    const willAdd = !favIds.has(productId);
    const optimistic = new Set(favIds);
    if (willAdd) optimistic.add(productId); else optimistic.delete(productId);
    setFavIds(optimistic);

    try {
      if (willAdd) await api.post('/v1/favourites', { product_id: productId });
      else         await api.delete(`/v1/favourites/${productId}`);
    } catch (e: any) {
      // revert
      const reverted = new Set(optimistic);
      if (willAdd) reverted.delete(productId); else reverted.add(productId);
      setFavIds(reverted);
      if (e?.response?.status === 401) {
        setCanFav(false);
        alert('Session expired. Please sign in again.');
      } else {
        alert('Failed to update Favorites.');
      }
    }
  };

  return { favIds, canFav, loading, load, toggle };
}

/* ===================== Favourite Button (overlay) ===================== */
function FavBtn({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggle(); }}
      aria-pressed={on}
      aria-label={on ? 'Unfavorite' : 'Favorite'}
      className={`absolute top-2 right-2 z-20 h-8 px-3 rounded-full border backdrop-blur bg-white/80 hover:bg-white transition text-xs 
      ${on ? 'border-rose-200 text-rose-600 bg-rose-50' : 'border-zinc-200 text-zinc-700'}`}
      title={on ? 'Unfavorite' : 'Favorite'}
    >
      <span className="text-sm align-middle">{on ? '♥' : '♡'}</span>
      <span className="ml-1 hidden sm:inline">{on ? 'Unfavourite' : 'Favourite'}</span>
    </button>
  );
}

export default function PodcastCategoryPage() {
  const { user } = useAuth();
  const role = normalizeRole(user);
  const isAdmin = role === 'admin';
  const params = useParams();
  const sp = useSearchParams();
  const category = decodeURIComponent(String(params?.category || ''));
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string|null>(null);

  const [minUSD, setMinUSD] = useState<string>(sp.get('min') || '');
  const [maxUSD, setMaxUSD] = useState<string>(sp.get('max') || '');
  const [q, setQ] = useState<string>(sp.get('q') || '');

  // favourites hook
  const { favIds, load: loadFavs, toggle: toggleFav } = useFavourites();

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true); setErr(null);
        const params = new URLSearchParams({ type: 'podcast', category, per_page: '99' });
        const min = Number(minUSD);
        const max = Number(maxUSD);
        if (!Number.isNaN(min) && min > 0) params.set('min_price', String(min*100));
        if (!Number.isNaN(max) && max > 0) params.set('max_price', String(max*100));
        if (q.trim()) params.set('search', q.trim());
        if (min && max && max < min) {
          setErr('Max price must be ≥ Min price'); setItems([]); setLoading(false); return;
        }
        const res = await fetch(`${API_BASE}/v1/catalog/products?${params.toString()}`, { signal: ac.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const j = await res.json();
        setItems(j?.data?.items || []);
        // sau khi có list, sync favourites
        await loadFavs(ac.signal);
      } catch (e: any) {
        if (e?.name !== 'AbortError') setErr(e?.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
    // theo yêu cầu, giữ nguyên deps gốc (không đổi logic filters khác)
  }, [category, minUSD, maxUSD]); // eslint-disable-line react-hooks/exhaustive-deps

  const gridItems = useMemo(() => items, [items]);

  return (
    <section className="space-y-4 animate-fade-in">
      <div className="px-4 md:px-8 flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">{category}</h1>
        <Link href="/podcast" className="text-blue-600 hover:underline">All topics</Link>
      </div>
      {/* Search + price filters */}
      <div className="px-4 md:px-8 flex flex-wrap items-center gap-2">
        <div className="relative">
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search podcasts by name..." className="w-64 border rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔎</span>
        </div>
        <input type="number" value={minUSD} onChange={e=>setMinUSD(e.target.value)} placeholder="Min $" className="w-28 border rounded px-2 py-1" />
        <span>–</span>
        <input type="number" value={maxUSD} onChange={e=>setMaxUSD(e.target.value)} placeholder="Max $" className="w-28 border rounded px-2 py-1" />
        <span className="text-xs text-gray-500">(Applies instantly)</span>
      </div>

      {err && <div className="px-4 md:px-8 text-sm text-red-600">{err}</div>}

      {/* Grid: 3 per row full-bleed */}
      {loading ? (
        <div className="relative w-screen left-[50%] right-[50%] -ml-[50vw] -mr-[50vw] px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="rounded-xl border overflow-hidden bg-white">
              <div className="w-full aspect-video bg-zinc-100 animate-pulse" />
              <div className="p-3">
                <div className="h-4 w-3/4 bg-zinc-200 animate-pulse rounded" />
              </div>
            </div>
          ))}
          </div>
        </div>
      ) : (
        <div className="relative w-screen left-[50%] right-[50%] -ml-[50vw] -mr-[50vw] px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {gridItems.map((p) => {
            const cover = toAbs(p.thumbnail_url) || FALLBACK;
            const favOn = favIds.has(p.id);
            return (
              <Link key={p.id} href={`/podcast/${p.id}`} className="group relative rounded-xl border overflow-hidden bg-white shadow-sm hover:shadow-md transition">
                <span className="absolute top-2 right-2 z-20 text-xs font-semibold px-2 py-0.5 rounded-full bg-black/70 text-white">
                  {Number(p?.price_cents || 0) > 0
                    ? new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format((p.price_cents||0)/100)
                    : 'Free'}
                </span>
                {/* Favourite overlay button (hide for admin) */}
                {!isAdmin && (
                  <FavBtn on={favOn} onToggle={() => toggleFav(p.id)} />
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cover} alt={p.title} className="w-full aspect-video object-cover transition-transform duration-300 group-hover:scale-[1.02]" onError={(e)=>{ (e.currentTarget as HTMLImageElement).src = FALLBACK; }} />
                <div className="p-3">
                  <div className="font-medium line-clamp-2 group-hover:text-blue-600 transition-colors">{p.title}</div>
                </div>
              </Link>
            );
          })}
          </div>
        </div>
      )}
    </section>
  );
}
