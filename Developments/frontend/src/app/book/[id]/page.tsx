'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import BookCard from '@/components/BookCard';
import { useCart } from '@/contexts/CartContext';

interface Product {
  id: number;
  title: string;
  description?: string | null;
  category?: string | null;
  thumbnail_url?: string | null;
  metadata?: any;
  price_cents?: number | null;
}
interface ProductFile {
  id: number;
  file_type: string;   // 'image' | 'pdf' | 'txt' | ...
  file_url: string;    // /storage/... or http(s)://...
  is_preview?: number | boolean;
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '');
const ORIGIN = API_BASE.replace(/\/api$/, '');

const FALLBACK_IMG = (() => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='560'>
    <rect width='100%' height='100%' fill='#f3f4f6'/>
    <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
      font-family='sans-serif' font-size='20' fill='#9ca3af'>No cover</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
})();

const toAbs = (u?: string | null) => {
  if (!u) return '';
  const s = u.trim();
  if (/^file:\/\//i.test(s) || /^[A-Za-z]:\\/.test(s)) return '';
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  if (s.startsWith('/')) return `${ORIGIN}${s}`;
  return s;
};

const canOpenDirect = (u: string) => /^https?:\/\//i.test(u) || u.startsWith('/');
const downloadUrl = (productId: number, fileId: number) =>
  `${API_BASE}/v1/catalog/products/${productId}/files/${fileId}/download`;

const formatVND = (n: number | null | undefined) =>
  Number(n ?? 0).toLocaleString('vi-VN', { maximumFractionDigits: 0 }) + ' ₫';

/* -------------------------------- Related row -------------------------------- */
function RelatedRow({ items }: { items: Array<{ id: number; title: string; cover?: string | null }> }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const scrollBy = (delta: number) => scrollerRef.current?.scrollBy({ left: delta, behavior: 'smooth' });

  if (!items?.length) return null;

  return (
    <section className="mt-4 mb-20">
      <h2 className="text-xl font-semibold mb-3 px-6 md:px-12">You may also like</h2>
      <div className="relative w-screen left-[50%] right-[50%] -ml-[50vw] -mr-[50vw]">
        <div
          ref={scrollerRef}
          className="flex gap-4 overflow-x-auto scroll-smooth pb-3 [scrollbar-width:thin] px-6 md:px-12 snap-x snap-mandatory"
        >
          {items.map((b, i) => (
            <div
              key={`${b.id}-${i}`}
              className="snap-start shrink-0 basis-[calc((100vw-8rem)/2)] sm:basis-[calc((100vw-10rem)/3)] md:basis-[calc((100vw-14rem)/5)]"
            >
              <BookCard book={b as any} />
            </div>
          ))}
        </div>
        <button
          aria-label="Scroll left"
          onClick={() => scrollBy(-600)}
          className="hidden md:grid place-items-center absolute left-2 md:left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 shadow hover:bg-white"
        >
          ‹
        </button>
        <button
          aria-label="Scroll right"
          onClick={() => scrollBy(600)}
          className="hidden md:grid place-items-center absolute right-2 md:right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 shadow hover:bg-white"
        >
          ›
        </button>
      </div>
    </section>
  );
}

/** Reading progress via lightweight endpoints */
function useContinue(productId: number | null) {
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/v1/continues/${productId}`, { credentials: 'include' });
      if (r.status === 401) { setProgress(null); return; }
      const j = await r.json();
      setProgress(j?.data || null);
    } finally {
      setLoading(false);
    }
  };

  const save = async (p: any) => {
    if (!productId) return;
    const res = await fetch(`${API_BASE}/v1/continues/${productId}`, {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p)
    });
    if (!res.ok) {
      const msg = await res.text().catch(() => '');
      throw new Error(`Save failed: ${res.status} ${msg}`);
    }
    await load();
  };
  return { progress, loading, load, save };
}

export default function BookDetail() {
  const params = useParams();
  const { add } = useCart();
  const authFetch: typeof fetch = (input, init) => fetch(input, { credentials: 'include', ...(init ?? {}) });

  const id = useMemo(() => {
    const raw = (params as any)?.id;
    const s = Array.isArray(raw) ? raw[0] : raw;
    const n = Number(s);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [params]);

  const [data, setData] = useState<{ product: Product; files: ProductFile[] } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const { progress, load, save } = useContinue(id);
  const [page, setPage] = useState<number>(0);
  const [favOn, setFavOn] = useState(false);
  const [canFav, setCanFav] = useState(true);
  const [related, setRelated] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    const ac = new AbortController();
    (async () => {
      try {
        setErr(null);
        const r = await fetch(`${API_BASE}/v1/catalog/products/${id}`, { signal: ac.signal });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j = await r.json();
        setData(j?.data || null);
        await load();
        // Load favourite status for this product
        try {
          const rf = await authFetch(`${API_BASE}/v1/favourites`, { signal: ac.signal });
          if (rf.status === 401) { setCanFav(false); setFavOn(false); }
          else if (rf.ok) {
            const jf = await rf.json();
            const ids: number[] = jf?.data?.product_ids || [];
            setFavOn(ids.includes(id));
            setCanFav(true);
          }
        } catch { /* ignore */ }

        // Load related items (same category → latest ebooks)
        try {
          const cat = (j?.data?.product?.category || '').trim();
          const qs = cat ? `type=ebook&per_page=12&category=${encodeURIComponent(cat)}` : `type=ebook&per_page=12`;
          const rr = await fetch(`${API_BASE}/v1/catalog/products?${qs}`, { signal: ac.signal });
          if (rr.ok) {
            const j2 = await rr.json();
            const items: any[] = j2?.data?.items || [];
            const mapped = items
              .filter((it) => Number(it?.id) !== id)
              .map((it) => ({ id: it.id, title: it.title, cover: toAbs(it.thumbnail_url) || FALLBACK_IMG }));
            setRelated(mapped.slice(0, 8));
          }
        } catch {}
      } catch (e: any) {
        if (e?.name !== 'AbortError') setErr(e?.message || 'Failed to load data');
      }
    })();
    return () => ac.abort();
  }, [id]);

  if (!id) return <div className="p-6 text-red-600">Invalid URL (missing id).</div>;
  if (err) return <div className="p-6 text-red-600">Error: {err}</div>;
  if (!data) return <div className="p-6">Loading…</div>;

  const p = data.product;
  const files = data.files || [];
  const preview = files.find(f => !!f.is_preview && canOpenDirect(f.file_url)) ||
    files.find(f => f.file_type === 'pdf' && canOpenDirect(f.file_url)) || null;
  const coverSrc = toAbs(p.thumbnail_url) || FALLBACK_IMG;

  const meta = (() => {
    const m = typeof p.metadata === 'string' ? (() => { try { return JSON.parse(p.metadata); } catch { return {}; } })() : (p.metadata || {});
    return m || {};
  })();
  const author = meta.author || meta.writer || meta.creator || '-';
  const publisher = meta.publisher || '-';
  const released = meta.release_date || meta.published_at || (meta.created_at || '-') ;
  const rating = Number(meta.rating ?? 5);
  const reviews = Number(meta.reviews ?? 1);
  const compareAt = Number(meta.compare_at_cents ?? 0);
  const priceCents = Number(p.price_cents ?? 0);

  const onRead = () => {
    const url = toAbs(preview?.file_url || '') || '';
    if (url) window.open(url, '_blank');
  };
  const onShare = async () => {
    try {
      const shareData = { title: p.title, text: p.description || p.title, url: window.location.href };
      // @ts-ignore
      if (navigator.share) await navigator.share(shareData);
      else await navigator.clipboard.writeText(window.location.href);
    } catch {}
  };
  const onBuy = async () => {
    await add(p.id, 1);
    // Cart badge in header will reflect the change
  };

  const toggleFav = async () => {
    if (!canFav) { alert('Please sign in to use Favorites'); return; }
    const next = !favOn;
    setFavOn(next); // optimistic
    const url = next ? `${API_BASE}/v1/favourites` : `${API_BASE}/v1/favourites/${p.id}`;
    const init: RequestInit = next
      ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product_id: p.id }) }
      : { method: 'DELETE' };
    const res = await authFetch(url, init);
    if (!res.ok) {
      setFavOn(!next); // revert
      if (res.status === 401) { setCanFav(false); alert('Session expired. Please sign in again.'); }
      else alert('Failed to update Favorites.');
    }
  };

  return (
    <div className="relative">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={coverSrc} alt="" className="w-full h-full object-cover opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/30 to-white/50" />
      </div>

      {/* Breadcrumb */}
      <div className="container mx-auto px-6 md:px-12 pt-6 text-sm text-zinc-800">
        <Link href="/" className="hover:underline">Home</Link>
        <span className="px-2">›</span>
        <span className="opacity-90 line-clamp-1 align-middle">{p.title}</span>
      </div>

      <section className="relative w-screen left-[50%] right-[50%] -ml-[50vw] -mr-[50vw]">
        <div className="grid md:grid-cols-[380px_1fr] gap-8 md:gap-12 p-6 md:p-12 min-h-[70vh]">
          {/* Cover + badge */}
          <div className="relative mx-auto md:mx-0 w-[300px] md:w-[360px]">
            <div className="absolute -top-3 -left-3 h-8 w-8 rounded-full bg-white/20 blur" />
            <article className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/10 bg-white transition hover:-translate-y-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverSrc} alt={p.title} className="w-full h-[480px] object-cover" onError={(e)=>{(e.currentTarget as HTMLImageElement).src = FALLBACK_IMG;}} />
            </article>
            {/* price badge */}
            <div className="absolute top-3 right-3">
              <div className="px-3 py-1 rounded-full text-sm font-bold text-white shadow bg-[color:var(--brand-500)]">
                {priceCents > 0 ? formatVND(priceCents) : 'Free'}
              </div>
            </div>
          </div>

          {/* Right: info */}
          <div className="text-zinc-900 bg-white/80 backdrop-blur rounded-2xl p-6 ring-1 ring-black/5 shadow-sm">
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight">{p.title}</h1>
            <div className="mt-2 flex items-center gap-2 text-sm text-zinc-600">
              <span className="font-semibold">{rating.toFixed(1)}</span>
              <span className="text-yellow-300">{'★★★★★'.slice(0, Math.max(0, Math.min(5, Math.round(rating))))}{'☆☆☆☆☆'.slice(Math.max(0, Math.min(5, Math.round(rating))))}</span>
              <span>· {reviews} reviews</span>
            </div>

            {/* Meta grid */}
            <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-y-4 text-sm text-zinc-800">
              <div>
                <div className="text-zinc-500">Author</div>
                <div className="font-medium">{author}</div>
              </div>
              <div>
                <div className="text-zinc-500">Category</div>
                <div className="font-medium">{p.category || '-'}</div>
              </div>
              <div>
                <div className="text-zinc-500">Publisher</div>
                <div className="font-medium">{publisher}</div>
              </div>
              <div>
                <div className="text-zinc-500">Released</div>
                <div className="font-medium">{released}</div>
              </div>
            </div>

            {/* Options (visual only) */}
            <div className="mt-6 space-y-3 border-t border-zinc-200 pt-6">
              <div className="text-zinc-600 text-sm">Choose type</div>
              <div className="flex gap-2 flex-wrap">
                <button className="px-3 py-1.5 rounded-full bg-zinc-900 text-white font-medium text-sm">Ebook</button>
                <button className="px-3 py-1.5 rounded-full bg-zinc-100 text-zinc-400 text-sm" disabled>Audiobook</button>
                <button className="px-3 py-1.5 rounded-full bg-zinc-100 text-zinc-400 text-sm" disabled>Print</button>
              </div>

              <div className="text-zinc-600 text-sm mt-4">Content</div>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 rounded-full bg-zinc-900 text-white font-medium text-sm">Full</button>
                <button className="px-3 py-1.5 rounded-full bg-zinc-100 text-zinc-400 text-sm" disabled>Summary</button>
              </div>
            </div>

            {/* CTAs */}
            <div className="mt-6 flex items-center gap-3">
              <button onClick={onRead} disabled={!preview} className="inline-flex items-center gap-2 bg-[color:var(--brand-500)] hover:bg-[color:var(--brand-600)] disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl shadow transition">
                Read
              </button>
              <button onClick={toggleFav} className={`h-10 px-4 inline-flex items-center gap-2 rounded-full border transition ${favOn ? 'bg-rose-50 text-rose-600 border-rose-200' : 'border-zinc-300 text-zinc-700 hover:bg-zinc-50'}`} aria-pressed={favOn}>
                <span className="text-lg">{favOn ? '♥' : '♡'}</span>
                <span className="text-sm hidden sm:inline">{favOn ? 'Unfavorite' : 'Favorite'}</span>
              </button>
              <button onClick={onShare} className="h-10 w-10 grid place-items-center rounded-full border border-zinc-300 hover:bg-zinc-50" aria-label="Share">
                <span className="text-lg">⇪</span>
              </button>
            </div>

            {/* Price card */}
            <div className="mt-6 max-w-md">
              <div className="relative rounded-2xl border border-zinc-200 bg-white p-4 shadow-lg">
                <div className="absolute -top-3 left-4 text-xs font-bold text-white px-2 py-0.5 rounded-full bg-[color:var(--brand-500)]">One‑off</div>
                <div className="flex items-end gap-3">
                  {compareAt > 0 && (
                    <div className="text-zinc-500 line-through text-lg">{formatVND(compareAt)}</div>
                  )}
                  <div className="text-3xl font-extrabold text-zinc-900">{priceCents > 0 ? formatVND(priceCents) : 'Free'}</div>
                </div>
                <div className="mt-2 text-emerald-600 text-sm font-semibold">Own this ebook forever</div>
                <button onClick={onBuy} className="mt-4 w-full rounded-xl bg-[color:var(--brand-500)] hover:bg-[color:var(--brand-600)] text-white font-semibold py-2.5">Buy now</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Description */}
      {p.description && (
        <section className="px-6 md:px-12 max-w-4xl mx-auto mt-10">
          <h2 className="text-xl font-semibold mb-2">Description</h2>
          <p className="text-zinc-700 whitespace-pre-wrap">{p.description}</p>
        </section>
      )}

      {/* Attachments (optional) */}
      {files.length > 0 && (
        <section className="px-6 md:px-12 max-w-4xl mx-auto mt-8">
          <h2 className="font-semibold mb-2">Attachments</h2>
          <ul className="list-disc pl-6 space-y-1">
            {files.map(f => (
              <li key={f.id}>
                <a href={downloadUrl(p.id, f.id)} target="_blank" rel="noreferrer" className="text-[color:var(--brand-600)] hover:underline">
                  Download: {f.file_type.toUpperCase()}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Reading progress */}
      <section className="px-6 md:px-12 max-w-4xl mx-auto mt-10 mb-16">
        <div className="border-t pt-4">
          <h2 className="font-semibold mb-2">Reading Progress</h2>
          <div className="text-sm text-gray-600 mb-2">Current page: {progress?.current_page ?? 0}</div>
          <div className="flex items-center gap-2">
            <input type="number" min={0} value={page} onChange={(e)=>setPage(Number(e.target.value))} className="border rounded px-2 py-1 w-24" />
            <button onClick={()=>save({ current_page: page })} className="px-3 py-1 rounded bg-green-600 text-white">Save progress</button>
          </div>
        </div>
      </section>

      {/* Related books */}
      {related.length > 0 && <RelatedRow items={related} />}
    </div>
  );
}
