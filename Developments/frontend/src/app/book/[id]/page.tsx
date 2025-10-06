'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import BookCard from '@/components/BookCard';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { normalizeRole } from '@/lib/role';
import { cn } from '@/lib/utils';
import { toAbsoluteImgUrl as toAbs } from '@/lib/img';

/* ========== Types ========== */
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
  file_type: string;
  file_url: string;
  is_preview?: number | boolean;
}

/* ========== Consts ========== */
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '');
const ORIGIN = API_BASE.replace(/\/api$/, '');
const canOpenDirect = (u: string) => /^https?:\/\//i.test(u) || u.startsWith('/');

const FALLBACK_IMG = (() => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='560'>
    <rect width='100%' height='100%' fill='#f3f4f6'/>
    <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
      font-family='sans-serif' font-size='20' fill='#9ca3af'>No cover</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
})();
// Use shared toAbs util from lib/img
const formatUSD = (cents?: number | null) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(((cents ?? 0) as number) / 100);

/* ========== Helpers (NEW): wrap description by words ========== */
function wrapByWords(text: string, wordsPerLine = 12) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  for (let i = 0; i < words.length; i += wordsPerLine) {
    lines.push(words.slice(i, i + wordsPerLine).join(' '));
  }
  return lines.join('\n');
}

/* ========== Toast ========== */
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
    if (timer.current) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  };
  return { open, msg, show, hide };
}
function Toast({ open, msg, onClose }: { open: boolean; msg: string; onClose: () => void }) {
  return (
    <div
      className={`fixed z-[1000] left-1/2 -translate-x-1/2 top-0 w-full max-w-md px-3 transition-transform duration-300 ease-out ${
        open ? 'translate-y-4' : '-translate-y-10 pointer-events-none'
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 rounded-xl bg-emerald-600 text-white px-4 py-2 shadow-xl ring-1 ring-emerald-700/40">
        <span className="text-lg hidden" aria-hidden="true">🛟</span>
        <span className="text-sm font-medium">{msg}</span>
        <button onClick={onClose} className="ml-auto text-white/80 hover:text-white text-sm" aria-label="close">✕</button>
      </div>
    </div>
  );
}

/* ========== Continues API ========== */
function useContinue(productId: number | null) {
  const [progress, setProgress] = useState<any>(null);

  const load = async () => {
    if (!productId) return;
    try {
      const r = await api.get(`/v1/continues/${productId}`);
      setProgress(r.data?.data || null);
    } catch {
      setProgress(null);
    }
  };

  const save = async (p: any) => {
    if (!productId) return;
    const payload = {
      current_chapter: Number((progress && progress.current_chapter) ?? 1),
      ...p,
    };
    const r = await api.post(`/v1/continues/${productId}`, payload);
    setProgress((prev: any) => ({ ...(prev || {}), ...payload, ...r.data?.data }));
    return r;
  };

  return { progress, load, save, setProgress };
}

/* ========== Local fallback for progress ========== */
const getLocalContinue = (pid: number | null | undefined) => {
  if (!pid) return 0;
  try {
    return Number(localStorage.getItem(`continue:${pid}`) || 0) || 0;
  } catch {
    return 0;
  }
};
const setLocalContinue = (pid: number | null | undefined, page: number) => {
  if (!pid) return;
  try {
    localStorage.setItem(`continue:${pid}`, String(Math.max(1, Number(page || 1))));
  } catch {}
};

/* ========== Related row ========== */
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

/* ===================================================================== */
export default function BookDetail() {
  const params = useParams();
  const { add } = useCart();
  const { user } = useAuth();
  const toast = useToast();

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
  const searchParams = useSearchParams();

  const [data, setData] = useState<{ product: Product; files: ProductFile[]; access?: { can_view?: boolean } } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const { progress, load, save } = useContinue(id);

  const [page, setPage] = useState<number>(0);

  // Reader overlay
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [pdfTitle, setPdfTitle] = useState<string>('');
  const [readingPage, setReadingPage] = useState<number>(1);
  const [isReading, setIsReading] = useState<boolean>(false);
  const [lastSavedPage, setLastSavedPage] = useState<number>(0);
  const [savingPage, setSavingPage] = useState(false);

  // Favorites
  const [favOn, setFavOn] = useState<boolean>(false);
  const [canFav, setCanFav] = useState<boolean>(true);

  // Related
  const [related, setRelated] = useState<any[]>([]);

  useEffect(() => {
    if (!pdfUrl) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
      try {
        if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      } catch {}
    };
  }, [pdfUrl]);

  const saveKeepalive = (pageVal: number) => {
    if (!id) return;
    try {
      const payload = {
        current_chapter: Number(progress?.current_chapter ?? 1),
        current_page: Math.max(1, Number(pageVal || 1)),
      };
      // @ts-ignore
      fetch(`${API_BASE}/v1/continues/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    } catch {}
  };
  const isDirty = isReading && Number(readingPage) !== Number(lastSavedPage);

  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && isLoggedIn) {
        saveKeepalive(readingPage);
        e.preventDefault();
        e.returnValue = '';
      }
    };
    const onPageHide = () => {
      if (isDirty && isLoggedIn) saveKeepalive(readingPage);
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden' && isDirty && isLoggedIn) saveKeepalive(readingPage);
    };
    window.addEventListener('beforeunload', beforeUnload);
    window.addEventListener('pagehide', onPageHide);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      window.removeEventListener('pagehide', onPageHide);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [isDirty, isLoggedIn, readingPage]);

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
          } catch {}
        }
        setData(payload);

        if (isLoggedIn) await load();
      } catch (e: any) {
        if (e?.name !== 'AbortError') setErr(e?.message || 'Failed to load data');
      }
    })();
    return () => ac.abort();
  }, [id, isLoggedIn]);

  useEffect(() => {
    const cur = Math.max(0, Number(progress?.current_page || 0));
    setPage(cur);
    try {
      if (cur > 0) setLocalContinue(id, cur);
      else if (id) localStorage.removeItem(`continue:${id}`);
    } catch {}
    if (isReading && cur > 0) setLastSavedPage(cur);
  }, [progress?.current_page, isReading, id]);

  useEffect(() => {
    const cur = Number(progress?.current_page || 0);
    if (isReading && cur > 0) {
      setReadingPage(cur);
      setLastSavedPage(cur);
    }
  }, [progress?.current_page, isReading]);

  useEffect(() => {
    if (isReading) setPage(readingPage);
  }, [readingPage, isReading]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) return;
      if (!isLoggedIn || isAdmin) {
        if (!cancelled) {
          setFavOn(false);
        }
        setCanFav(false);
        return;
      }
      try {
        const rf = await api.get('/v1/favourites');
        if (cancelled) return;
        const d = rf.data?.data || rf.data || {};
        const ids: number[] = d.product_ids || [];
        setFavOn(ids.includes(id));
        setCanFav(true);
      } catch {
        if (!cancelled) {
          setFavOn(false);
          setCanFav(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isLoggedIn, isAdmin]);

  useEffect(() => {
    (async () => {
      try {
        const cat = (data?.product?.category || '').trim();
        const qs = cat ? `type=ebook&per_page=12&category=${encodeURIComponent(cat)}` : `type=ebook&per_page=12`;
        const rr = await fetch(`${API_BASE}/v1/catalog/products?${qs}`);
        if (rr.ok) {
          const j2 = await rr.json();
          const items: any[] = j2?.data?.items || [];
          const mapped = items
            .filter((it) => Number(it?.id) !== id)
            .map((it) => ({ id: it.id, title: it.title, cover: toAbs(it.thumbnail_url) || FALLBACK_IMG }));
          setRelated(mapped.slice(0, 8));
        }
      } catch {}
    })();
  }, [id, data?.product?.category]);

  const applyAndSavePage = async (next: number) => {
    const nextPage = Math.max(1, Number(next || 1));
    setReadingPage(nextPage);
    setSavingPage(true);
    try {
      await save({ current_page: nextPage });
      setLastSavedPage(nextPage);
      setPage(nextPage);
      setLocalContinue(id, nextPage);
      toast.show('Saved your progress');
    } catch (e: any) {
      alert(e?.message || 'Fail to save your progress');
    } finally {
      setSavingPage(false);
    }
  };

  const promptSaveThenClose = async () => {
    if (!pdfUrl) return;
    if (Number(readingPage) !== Number(lastSavedPage)) {
      try {
        await applyAndSavePage(readingPage);
      } catch {
        if (isLoggedIn) saveKeepalive(readingPage);
        else setLocalContinue(id, readingPage);
      }
    }
    setPdfUrl('');
    setIsReading(false);
  };

  const openPdfInline = async (productId: number, fileId: number, title: string) => {
    try {
      const res = await api.get(`/v1/catalog/products/${productId}/files/${fileId}/download`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/pdf' });
      const url = URL.createObjectURL(blob);
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      setPdfUrl(url);
      setPdfTitle(title);

      const local = getLocalContinue(productId);
      const start = Math.max(1, Number(progress?.current_page ?? local ?? 1));

      setReadingPage(start);
      setLastSavedPage(start);
      setIsReading(true);
    } catch {
      alert('Unable to load PDF. Please ensure you are logged in and have purchased.');
    }
  };

  const { product: productOrNull, files: filesOrEmpty } = data || ({} as any);
  const p: Product | undefined = productOrNull;
  const files: ProductFile[] = filesOrEmpty || [];
  const canView = Boolean((data as any)?.access?.can_view);
  const priceCents = Number(p?.price_cents ?? 0);
  const owned = canView || (priceCents === 0 && isCustomer);
  const isPdf = (f: ProductFile) => {
    const t = String(f.file_type || '').toLowerCase();
    const url = String(f.file_url || '');
    return t === 'pdf' || /\.pdf(\?|$)/i.test(url);
  };
  const preview = files.find((f) => !!f.is_preview && isPdf(f) && canOpenDirect(f.file_url)) || null;
  const fullPdf = files.find((f) => isPdf(f) && !f.is_preview) || null;
  const coverSrc = toAbs(p?.thumbnail_url) || FALLBACK_IMG;

  const meta =
    typeof p?.metadata === 'string'
      ? (() => {
          try {
            return JSON.parse(p!.metadata as any);
          } catch {
            return {};
          }
        })()
      : p?.metadata || {};
  const comingSoon = (() => {
    const tags: any = (meta?.tags ?? meta?.tag) as any;
    const arr = Array.isArray(tags) ? tags : (tags ? [tags] : []);
    const hasTag = arr.map((t:any)=>String(t).toLowerCase()).includes('coming_soon');
    const status = String(meta?.status || '').toLowerCase();
    const cat = String(p?.category || '').toLowerCase();
    const qsComing = String(searchParams.get('coming') || '').toLowerCase();
    const forceTrue  = qsComing === '1' || qsComing === 'true' || qsComing === 'yes';
    const forceFalse = qsComing === '0' || qsComing === 'false' || qsComing === 'no';
    if (forceTrue) return true;
    if (forceFalse) return false;
    return hasTag || status.includes('coming') || cat.includes('coming');
  })();
  const author = meta?.author || meta?.writer || meta?.creator || '-';
  const publisher = meta?.publisher || '-';
  const released = meta?.release_date || meta?.published_at || meta?.created_at || '-';
  const rating = Number(meta?.rating ?? 5);
  const reviews = Number(meta?.reviews ?? 1);

  const onRead = () => {
    const previewFile = files.find((f) => !!f.is_preview && f.file_type === 'pdf');
    if (previewFile) {
      openPdfInline(p!.id, previewFile.id, `${p!.title} — Preview`);
      return;
    }
    if (owned && fullPdf) {
      if (!isLoggedIn) {
        const next = encodeURIComponent(window.location.pathname);
        window.location.href = `/auth/login?next=${next}`;
        return;
      }
      openPdfInline(p!.id, fullPdf.id, p!.title);
      return;
    }
    alert('No preview available.');
  };
  const onReadFull = () => {
    if (!owned) return;
    if (!isLoggedIn) {
      const next = encodeURIComponent(window.location.pathname);
      window.location.href = `/auth/login?next=${next}`;
      return;
    }
    if (!fullPdf) {
      alert('This ebook has no full PDF uploaded yet. Please contact support.');
      return;
    }
    openPdfInline(p!.id, fullPdf.id, p!.title);
  };

  const { show } = toast;
  const onBuy = async () => {
    if (!p) return;
    if (!isLoggedIn) {
      alert('Please sign in to purchase.');
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/auth/login?next=${next}`;
      return;
    }
    if (isAdmin) return alert('Admin accounts cannot purchase.');
    try {
      const r = await add(p.id, 1);
      if ((r as any)?.alreadyInCart) show('This product is already in your cart');
      else show('Added to cart');
    } catch {
      show('Failed to add to cart. Please try again.');
    }
  };
  const onShare = async () => {
    if (!p) return;
    try {
      const shareData = { title: p.title, text: p.description || p.title, url: window.location.href };
      // @ts-ignore
      if (navigator.share) await navigator.share(shareData);
      else await navigator.clipboard.writeText(window.location.href);
    } catch {}
  };
  const toggleFav = async () => {
    if (!p) return;
    if (!isLoggedIn) {
      alert('Please sign in to use Favorites.');
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/auth/login?next=${next}`;
      return;
    }
    if (isAdmin) return alert('Admin accounts cannot use Favorites.');
    if (!canFav) {
      alert('Favorites not available right now.');
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/auth/login?next=${next}`;
      return;
    }
    const next = !favOn;
    setFavOn(next);
    try {
      if (next) await api.post('/v1/favourites', { product_id: p.id });
      else await api.delete(`/v1/favourites/${p.id}`);
    } catch {
      setFavOn(!next);
      alert('Failed to update Favorites.');
    }
  };

  if (!id) return <div className="p-6 text-red-600">Invalid URL (missing id).</div>;
  if (err) return <div className="p-6 text-red-600">Error: {err}</div>;
  if (!p) return <div className="p-6">Loading…</div>;

  /* ========== NEW: wrapped description computed here ========== */
  const descWrapped = p.description ? wrapByWords(p.description, 12) : '';

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

        {/* Main */}
        <section className="relative w-screen left-[50%] right-[50%] -ml-[50vw] -mr-[50vw]">
          <div className="grid md:grid-cols-[380px_1fr] gap-8 md:gap-12 p-6 md:p-12 min-h-[70vh]">
            {/* Left */}
            <div className="relative mx-auto md:mx-0 w-[300px] md:w-[360px]">
              <article className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/10 bg-white transition hover:-translate-y-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverSrc}
                  alt={p.title}
                  className="w-full h-[480px] object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG;
                  }}
                />
              </article>
              {!comingSoon && (
                <div className="absolute top-3 right-3">
                  <div className="px-3 py-1 rounded-full text-sm font-bold text-white shadow bg-[color:var(--brand-500)]">
                    {priceCents > 0 ? formatUSD(priceCents) : 'Free'}
                  </div>
                </div>
              )}
            </div>

            {/* Right */}
            <div className="text-zinc-900 bg-white/80 backdrop-blur rounded-2xl p-6 ring-1 ring-black/5 shadow-sm">
              {/* ========== NEW LAYOUT: grid to push rail to the very top ========== */}
              <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-8">
                {/* Content (left sub-column) */}
                <div>
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
                  <div className="mt-6 grid grid-cols-2 xl:grid-cols-4 gap-y-4 text-sm text-zinc-800">
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

                  {/* Description + Progress */}
                  <div className="mt-6 space-y-6">
                    {p.description && (
                      <div>
                        <h2 className="text-lg font-semibold mb-2">Description</h2>
                        {/* 12-words-per-line effect */}
                        <p className="text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed">{descWrapped}</p>
                      </div>
                    )}

                    {(!comingSoon) && (canView || (priceCents === 0 && isCustomer)) && (
                      <div>
                        <h2 className="text-lg font-semibold mb-2">Reading Progress</h2>
                        <div className="text-sm text-gray-600">Current page: {page ?? 0}</div>
                        <div className="mt-3 flex items-center gap-2 flex-wrap">
                          <input
                            type="number"
                            min={0}
                            value={page}
                            onChange={(e) => setPage(Number(e.target.value))}
                            disabled={!(canView || (priceCents === 0 && isCustomer)) || !isCustomer}
                            className="border rounded px-2 py-1 w-24 disabled:bg-zinc-100 disabled:cursor-not-allowed"
                          />
                          <button
                            onClick={() => applyAndSavePage(page)}
                            disabled={!(canView || (priceCents === 0 && isCustomer)) || !isCustomer || savingPage}
                            className="px-3 py-1 rounded bg-green-600 text-white disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {savingPage ? 'Saving…' : 'Save progress'}
                          </button>
                          <button
                            onClick={() => {
                              const previewFile = files.find((f) => !!f.is_preview && f.file_type === 'pdf');
                              const allowedFull = (canView || (priceCents === 0 && isCustomer));
                              const target = (allowedFull ? fullPdf : null) || previewFile;
                              if (!target) return alert('No PDF available.');
                              if (target === fullPdf) {
                                if (!isLoggedIn) {
                                  const next = encodeURIComponent(window.location.pathname);
                                  window.location.href = `/auth/login?next=${next}`;
                                  return;
                                }
                                openPdfInline(p.id, fullPdf!.id, p.title);
                              } else {
                                openPdfInline(p.id, previewFile!.id, `${p.title} — Preview`);
                              }
                            }}
                            disabled={!preview && !(canView || (priceCents === 0 && isCustomer))}
                            className="px-3 py-1 rounded bg-zinc-800 text-white disabled:opacity-50"
                          >
                            Continue reading
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rail (right sub-column) — moved to TOP and aligned */}
                <aside className="mt-6 lg:mt-0 self-start lg:sticky lg:top-6 w-full space-y-4 lg:ml-auto">
                  <div className="flex items-center gap-3 flex-wrap">
                    {!comingSoon && (
                      <button
                        onClick={onRead}
                        disabled={!preview && !owned}
                        className="inline-flex items-center gap-2 bg-[color:var(--brand-500)] hover:bg-[color:var(--brand-600)] disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl shadow transition"
                      >
                        Read Preview
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
                    <button
                      onClick={onShare}
                      className="h-10 w-10 grid place-items-center rounded-full border border-zinc-300 hover:bg-zinc-50"
                      aria-label="Share"
                    >
                      <span className="text-lg">⇪</span>
                    </button>
                  </div>

                  {!comingSoon && (
                    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-lg">
                      <div className="relative">
                        <div className="absolute -top-3 left-0 text-xs font-bold text-white px-2 py-0.5 rounded-full bg-[color:var(--brand-500)]">
                          One-off
                        </div>
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
                            {Number(meta?.compare_at_cents ?? 0) > 0 && (
                              <div className="text-zinc-500 line-through text-lg">
                                {formatUSD(Number(meta?.compare_at_cents ?? 0))}
                              </div>
                            )}
                            <div className="text-3xl font-extrabold text-zinc-900">
                              {priceCents > 0 ? formatUSD(priceCents) : 'Free'}
                            </div>
                          </div>
                          <div className="mt-2 text-emerald-600 text-sm font-semibold">Own this ebook forever</div>
                        </>
                      )}

                      {canView || priceCents === 0 ? (
                        <button
                          onClick={onReadFull}
                          disabled={false}
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
                  )}
                </aside>
              </div>
              {/* ========== END NEW LAYOUT ========== */}
            </div>
          </div>
        </section>

        {/* Related */}
        {related.length > 0 && <RelatedRow items={related} />}
      </div>

      {/* Fullscreen Reader */}
      {pdfUrl && (
        <div
          className="fixed inset-0 z-[1000] bg-black/90"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) promptSaveThenClose();
          }}
        >
          <div className="h-12 px-4 flex items-center justify-between text-white">
            <div className="truncate pr-3">
              {p.title} — {pdfTitle}
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm opacity-90">Page</label>
              <div className="flex items-center gap-1">
                <button
                  className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20"
                  onClick={() => setReadingPage((v) => Math.max(1, Number(v || 1) - 1))}
                >
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  value={readingPage || 1}
                  onChange={(e) => setReadingPage(Math.max(1, Number(e.target.value || 1)))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') applyAndSavePage(readingPage);
                  }}
                  className="w-20 rounded px-2 py-0.5 text-black"
                />
                <button
                  className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20"
                  onClick={() => setReadingPage((v) => Math.max(1, Number(v || 1) + 1))}
                >
                  +
                </button>
              </div>
              <button
                onClick={() => applyAndSavePage(readingPage)}
                disabled={savingPage}
                className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60"
              >
                {savingPage ? 'Saving your progress' : 'Save your progress'}
              </button>
              <button onClick={promptSaveThenClose} className="px-3 py-1 rounded bg-white/10 hover:bg-white/20">
                Close
              </button>
            </div>
          </div>
          <iframe
            src={pdfUrl + '#view=FitH&page=' + Math.max(1, Number(readingPage || 1))}
            title={pdfTitle}
            className="w-full h-[calc(100vh-48px)] bg-white"
          />
        </div>
      )}

      {/* Toast */}
      <Toast open={toast.open} msg={toast.msg} onClose={toast.hide} />
    </>
  );
}
