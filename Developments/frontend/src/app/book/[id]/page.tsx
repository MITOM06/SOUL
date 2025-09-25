'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import BookCard from '@/components/BookCard';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { normalizeRole } from '@/lib/role';
import { cn } from '@/lib/utils';

/* ======== Types ======== */
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

const formatUSD = (cents: number | null | undefined) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format((Number(cents ?? 0) || 0) / 100);

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

/* ------------------------------- Toast helpers -------------------------------- */
function useToast(autoHideMs = 2500) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const timer = useRef<number | null>(null);

  const show = (text: string) => {
    setMsg(text);
    setOpen(true);
    if (timer.current) window.clearTimeout(timer.current);
    // @ts-ignore
    timer.current = window.setTimeout(() => setOpen(false), autoHideMs);
  };
  const hide = () => {
    setOpen(false);
    if (timer.current) { window.clearTimeout(timer.current); timer.current = null; }
  };
  return { open, msg, show, hide };
}

function Toast({ open, msg, onClose }: { open: boolean; msg: string; onClose: () => void }) {
  return (
    <div
      className={`fixed z-[1000] left-1/2 -translate-x-1/2 top-0 w-full max-w-md px-3 transition-transform duration-300 ease-out
        ${open ? 'translate-y-4' : '-translate-y-10 pointer-events-none'}`
      }
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 rounded-xl bg-emerald-600 text-white px-4 py-2 shadow-xl ring-1 ring-emerald-700/40">
        <span className="text-lg">🛒</span>
        <span className="text-sm font-medium">{msg}</span>
        <button
          onClick={onClose}
          className="ml-auto text-white/80 hover:text-white text-sm"
          aria-label="Đóng thông báo"
        >
          ✕
        </button>
      </div>
    </div>
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
      if (r.status === 401 || r.status === 403) { setProgress(null); return; }
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

/* ================================== Page ================================== */
export default function BookDetail() {
  const params = useParams();
  const { add } = useCart();
  const toast = useToast();
  const { user } = useAuth();
  const role = normalizeRole(user);
  const isLoggedIn = Boolean(user);
  const isAdmin = role === 'admin';
  const isCustomer = isLoggedIn && !isAdmin;

  const id = useMemo(() => {
    const raw = (params as any)?.id;
    const s = Array.isArray(raw) ? raw[0] : raw;
    const n = Number(s);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [params]);

  const [data, setData] = useState<{ product: Product; files: ProductFile[]; access?: { can_view?: boolean } } | null>(null);
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
        let payload = j?.data || null;

        if (isLoggedIn) {
          try {
            const ar = await api.get(`/v1/catalog/products/${id}`, { signal: ac.signal as any });
            if (ar.data?.data) payload = ar.data.data;
          } catch (e: any) {
            if (e?.code === 'ERR_CANCELED' || e?.name === 'CanceledError') return;
          }
        }

        setData(payload);

        if (isLoggedIn) {
          await load();
        }

        if (isLoggedIn && !isAdmin) {
          try {
            const rf = await api.get('/v1/favourites', { signal: ac.signal as any });
            const d = rf.data?.data || rf.data || {};
            const ids: number[] = d.product_ids || [];
            setFavOn(ids.includes(id!));
            setCanFav(true);
          } catch (e: any) {
            if (e?.response?.status === 401) { setCanFav(false); setFavOn(false); }
          }
        } else {
          setFavOn(false);
          setCanFav(false);
        }

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
  }, [id, isLoggedIn, isAdmin]);

  if (!id) return <div className="p-6 text-red-600">Invalid URL (missing id).</div>;
  if (err) return <div className="p-6 text-red-600">Error: {err}</div>;
  if (!data) return <div className="p-6">Loading…</div>;

  const p = data.product;
  const files = data.files || [];
  const canView = Boolean((data as any)?.access?.can_view);
  const preview = files.find(f => !!f.is_preview && canOpenDirect(f.file_url)) || null;
  const fullPdf = files.find(f => f.file_type === 'pdf' && !f.is_preview) || null;
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
    // Mở trang preview nội bộ để giới hạn theo chính sách (10 trang đầu)
    if (!preview) { alert('No preview available.'); return; }
    window.open(`/reader/ebook/${p.id}`, '_blank');
  };
  const onReadFull = () => {
    const owned = canView || (priceCents === 0 && isCustomer);
    if (!fullPdf || !owned) return;
    (async () => {
      try {
        const res = await api.get(`/v1/catalog/products/${p.id}/files/${fullPdf.id}/download`, { responseType: 'blob' });
        const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/pdf' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      } catch (e) {
        alert('Unable to open full content. Please ensure you are logged in and have purchased.');
      }
    })();
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
    if (!isLoggedIn) { alert('Please sign in to purchase.'); return; }
    if (isAdmin) { alert('Admin accounts cannot purchase.'); return; }
    try {
      await add(p.id, 1);
      toast.show('Added to cart');
    } catch {
      toast.show('Failed to add to cart. Please try again.');
    }
  };

  const toggleFav = async () => {
    if (!isLoggedIn) { alert('Please sign in to use Favorites.'); return; }
    if (isAdmin) { alert('Admin accounts cannot use Favorites.'); return; }
    if (!canFav) { alert('Favorites not available right now.'); return; }
    const next = !favOn;
    setFavOn(next); // optimistic
    try {
      if (next) await api.post('/v1/favourites', { product_id: p.id });
      else      await api.delete(`/v1/favourites/${p.id}`);
    } catch (e: any) {
      setFavOn(!next); // revert
      if (e?.response?.status === 401) {
        alert('Session expired. Please sign in again.');
      } else {
        alert('Failed to update Favorites.');
      }
    }
  };

  const owned = canView || (priceCents === 0 && isCustomer);

  return (
    <>
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

        {/* Main two columns */}
        <section className="relative w-screen left-[50%] right-[50%] -ml-[50vw] -mr-[50vw]">
          <div className="grid md:grid-cols-[380px_1fr] gap-8 md:gap-12 p-6 md:p-12 min-h-[70vh]">
            {/* Left: Cover + price badge */}
            <div className="relative mx-auto md:mx-0 w-[300px] md:w-[360px]">
              <article className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/10 bg-white transition hover:-translate-y-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverSrc}
                  alt={p.title}
                  className="w-full h-[480px] object-cover"
                  onError={(e)=>{(e.currentTarget as HTMLImageElement).src = FALLBACK_IMG;}}
                />
              </article>
              <div className="absolute top-3 right-3">
                <div className="px-3 py-1 rounded-full text-sm font-bold text-white shadow bg-[color:var(--brand-500)]">
                  {priceCents > 0 ? formatUSD(priceCents) : 'Free'}
                </div>
              </div>
            </div>

            {/* Right: detail (Description/Attachments/Progress at left, CTAs/Price at right) */}
            <div className="text-zinc-900 bg-white/80 backdrop-blur rounded-2xl p-6 ring-1 ring-black/5 shadow-sm">
              {/* Title + rating */}
              <h1 className="text-3xl md:text-5xl font-extrabold leading-tight">{p.title}</h1>
              <div className="mt-2 flex items-center gap-2 text-sm text-zinc-600">
                <span className="font-semibold">{rating.toFixed(1)}</span>
                <span className="text-yellow-300">
                  {'★★★★★'.slice(0, Math.max(0, Math.min(5, Math.round(rating))))}
                  {'☆☆☆☆☆'.slice(Math.max(0, Math.min(5, Math.round(rating))))}
                </span>
                <span>· {reviews} reviews</span>
              </div>

              {/* Meta */}
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

              {/* Options */}
              <div className="mt-6 space-y-3 border-t border-zinc-2 00 pt-6">
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

              {/* Rail: hành động mua + nội dung chi tiết */}
              <aside className="mt-6 w-full lg:max-w-sm xl:max-w-md space-y-4 lg:ml-auto">
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={onRead}
                    disabled={!preview}
                    className="inline-flex items-center gap-2 bg-[color:var(--brand-500)] hover:bg-[color:var(--brand-600)] disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl shadow transition"
                  >
                    Read Preview
                  </button>
                  {owned && (
                    <button
                      onClick={onReadFull}
                      disabled={!fullPdf}
                      title={!fullPdf ? 'No full PDF available yet' : ''}
                      className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:hover:bg-emerald-600/90 disabled:cursor-not-allowed disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl shadow transition"
                    >
                      Read Full
                    </button>
                  )}
                  <button
                    onClick={toggleFav}
                    aria-pressed={favOn}
                    aria-disabled={!isCustomer}
                    className={cn(
                      'h-10 px-4 inline-flex items-center gap-2 rounded-full border transition',
                      favOn ? 'bg-rose-50 text-rose-600 border-rose-200' : 'border-zinc-300 text-zinc-700 hover:bg-zinc-50',
                      !isCustomer && 'opacity-70'
                    )}
                  >
                    <span className="text-lg">{favOn ? '♥' : '♡'}</span>
                    <span className="text-sm hidden sm:inline">{favOn ? 'Unfavorite' : 'Favorite'}</span>
                  </button>
                  <button onClick={onShare} className="h-10 w-10 grid place-items-center rounded-full border border-zinc-300 hover:bg-zinc-50" aria-label="Share">
                    <span className="text-lg">⇪</span>
                  </button>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-lg">
                  <div className="relative">
                    <div className="absolute -top-3 left-0 text-xs font-bold text-white px-2 py-0.5 rounded-full bg-[color:var(--brand-500)]">One-off</div>
                  </div>
                  {canView ? (
                    <>
                      <div className="flex items-end gap-3 mt-1">
                        <div className="text-3xl font-extrabold text-emerald-700">Owned</div>
                      </div>
                      <div className="mt-2 text-emerald-600 text-sm font-semibold">You already own this ebook</div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-end gap-3 mt-1">
                        {compareAt > 0 && <div className="text-zinc-500 line-through text-lg">{formatUSD(compareAt)}</div>}
                        <div className="text-3xl font-extrabold text-zinc-900">{priceCents > 0 ? formatUSD(priceCents) : 'Free'}</div>
                      </div>
                      <div className="mt-2 text-emerald-600 text-sm font-semibold">Own this ebook forever</div>
                    </>
                  )}

                  {canView ? (
                    <button
                      onClick={onReadFull}
                      disabled={!fullPdf}
                      className="mt-4 w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:hover:bg-emerald-600/90 disabled:cursor-not-allowed disabled:opacity-50 text-white font-semibold py-2.5"
                    >
                      Read Full
                    </button>
                  ) : (
                    <button
                      onClick={onBuy}
                      className="mt-4 w-full rounded-xl bg-[color:var(--brand-500)] hover:bg-[color:var(--brand-600)] text-white font-semibold py-2.5"
                    >
                      Buy now
                    </button>
                  )}
                </div>

                <section className="relative rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                  {!owned && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-white/80 text-center text-sm text-zinc-600 px-6">
                      <p>Purchase to view full description, download attachments and track reading progress.</p>
                    </div>
                  )}
                  <div className={cn('space-y-5', !owned && 'pointer-events-none select-none opacity-60')}>
                    {p.description && (
                      <div>
                        <h2 className="text-lg font-semibold mb-2">Description</h2>
                        <p className="text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed">{p.description}</p>
                      </div>
                    )}
                    {files.length > 0 && (
                      <div>
                        <h2 className="text-lg font-semibold mb-2">Attachments</h2>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          {files.map(f => (
                            <li key={f.id}>
                              {owned ? (
                                <a
                                  href={downloadUrl(p.id, f.id)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[color:var(--brand-600)] hover:underline"
                                >
                                  Download {f.file_type.toUpperCase()}
                                </a>
                              ) : (
                                <span className="text-zinc-500">Tệp {f.file_type.toUpperCase()}</span>
                              )}
                              {f.is_preview ? (
                                <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600">preview</span>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div>
                      <h2 className="text-lg font-semibold mb-2">Reading Progress</h2>
                      <div className="text-sm text-gray-600">Current page: {progress?.current_page ?? 0}</div>
                      <div className="mt-3 flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          value={page}
                          onChange={(e)=>setPage(Number(e.target.value))}
                          disabled={!owned || !isCustomer}
                          className="border rounded px-2 py-1 w-24 disabled:bg-zinc-100 disabled:cursor-not-allowed"
                        />
                        <button
                          onClick={()=>save({ current_page: page })}
                          disabled={!owned || !isCustomer}
                          className="px-3 py-1 rounded bg-green-600 text-white disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          Save progress
                        </button>
                      </div>
                    </div>
                    <div className="flex items-end gap-3 mt-1">
                      {compareAt > 0 && <div className="text-zinc-500 line-through text-lg">{formatUSD(compareAt)}</div>}
                      <div className="text-3xl font-extrabold text-zinc-900">{priceCents > 0 ? formatUSD(priceCents) : 'Free'}</div>
                    </div>
                    <div className="mt-2 text-emerald-600 text-sm font-semibold">Own this ebook forever</div>

                    {owned ? (
                      <button
                        onClick={onReadFull}
                        disabled={!fullPdf}
                        className="mt-4 w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:hover:bg-emerald-600/90 disabled:cursor-not-allowed disabled:opacity-50 text-white font-semibold py-2.5"
                      >
                        Read Full
                      </button>
                    ) : (
                      priceCents === 0 ? (
                        <button
                          onClick={() => { window.location.href = `/auth/login?next=${encodeURIComponent(window.location.pathname)}`; }}
                          className="mt-4 w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5"
                        >
                          Sign in to read
                        </button>
                      ) : (
                        <button
                          onClick={onBuy}
                          className="mt-4 w-full rounded-xl bg-[color:var(--brand-500)] hover:bg-[color:var(--brand-600)] text-white font-semibold py-2.5"
                        >
                          Buy now
                        </button>
                      )
                    )}
                  </div>
                </section>
              </aside>
            </div>
          </div>
        </section>

        {/* Related books */}
        {related.length > 0 && <RelatedRow items={related} />}
      </div>

      {/* Toast */}
      <Toast open={toast.open} msg={toast.msg} onClose={toast.hide} />
    </>
  );
}
