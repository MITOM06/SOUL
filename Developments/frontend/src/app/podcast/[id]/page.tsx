'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useCart } from '@/contexts/CartContext';

type ProductType = 'ebook' | 'podcast';
interface Product {
  id: number;
  type: ProductType;
  title: string;
  description?: string | null;
  category?: string | null;
  thumbnail_url?: string | null;
  price_cents: number;
  metadata?: any;
}
interface ProductFile {
  id: number;
  file_type: string;
  file_url: string;
  is_preview?: number | boolean;
  meta?: any;
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '');
const ORIGIN   = API_BASE.replace(/\/api$/, '');

const formatVND = (n: number | null | undefined) =>
  Number(n ?? 0).toLocaleString('vi-VN', { maximumFractionDigits: 0 }) + ' đ';

const FALLBACK_IMG = (() => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='660'>
    <rect width='120%' height='120%' rx='8' fill='#f3f4f6'/>
    <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
      font-family='sans-serif' font-size='20' fill='#9ca3af'>Podcast</text>
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

const parseMaybeJSON = (v: any) => {
  if (!v) return null;
  if (typeof v === 'object') return v;
  try { return JSON.parse(String(v)); } catch { return null; }
};

const pickYoutubeId = (u: string) =>
  u.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{11})/)?.[1];

/* ------------------------------- Toast helpers ------------------------------- */
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
        ${open ? 'translate-y-4' : '-translate-y-10 pointer-events-none'}`}
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

/** Ưu tiên: lấy YouTube từ product_files */
function extractYoutubeFromFiles(files: ProductFile[]) {
  for (const f of files) {
    const type = String(f.file_type || '').toLowerCase();
    const meta = parseMaybeJSON(f.meta) || {};
    const url  = String(f.file_url || '');

    const looksLikeYoutube =
      type.includes('youtube') ||
      type.includes('video') ||
      /youtube\.com|youtu\.be/i.test(url) ||
      String(meta?.provider || '').toLowerCase() === 'youtube';

    if (!looksLikeYoutube) continue;

    const vid = meta?.video_id || pickYoutubeId(url) || pickYoutubeId(String(meta?.watch_url || meta?.embed_url || ''));
    if (!vid) continue;

    return {
      embed: meta?.embed_url || `https://www.youtube.com/embed/${vid}`,
      watch: meta?.watch_url || `https://www.youtube.com/watch?v=${vid}`,
      thumb: meta?.thumbnail_url || `https://img.youtube.com/vi/${vid}/hqdefault.jpg`,
    };
  }
  return null;
}

/** Fallback: backend lưu thông tin trong products.metadata */
function extractYoutubeFromProductMeta(p: Product) {
  const m = parseMaybeJSON(p.metadata) || {};
  const y = m?.youtube || m?.yt || m;
  let vid =
    y?.video_id ||
    (y?.watch_url && pickYoutubeId(String(y.watch_url))) ||
    (y?.embed_url && pickYoutubeId(String(y.embed_url)));

  if (!vid && p.thumbnail_url) {
    const m2 = String(p.thumbnail_url).match(/img\.youtube\.com\/vi\/([A-Za-z0-9_-]{11})\//);
    vid = m2?.[1];
  }

  if (!vid) return null;
  return {
    embed: y?.embed_url || `https://www.youtube.com/embed/${vid}`,
    watch: y?.watch_url || `https://www.youtube.com/watch?v=${vid}`,
    thumb: y?.thumbnail_url || `https://img.youtube.com/vi/${vid}/hqdefault.jpg`,
  };
}

/** Player YouTube audio-only (ẩn video, điều khiển bằng postMessage) */
function YoutubeAudio({ embedUrl, cover, title }: { embedUrl: string; cover?: string; title?: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [playing, setPlaying] = useState(false);

  const post = (func: 'playVideo' | 'pauseVideo') => {
    const w = iframeRef.current?.contentWindow;
    if (!w) return;
    w.postMessage(JSON.stringify({ event: 'command', func, args: [] }), '*');
  };

  const toggle = () => {
    const next = !playing;
    setPlaying(next);
    post(next ? 'playVideo' : 'pauseVideo');
  };

  return (
    <div className="border rounded-xl p-4 flex items-center gap-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={toAbs(cover) || FALLBACK_IMG}
        alt={title || 'podcast'}
        className="w-16 h-16 object-cover rounded-md"
        onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG; }}
      />
      <button
        onClick={toggle}
        className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
        aria-label={playing ? 'Pause' : 'Play podcast'}
      >
        {playing ? 'Pause' : 'Play podcast'}
      </button>
      <span className="text-sm text-gray-500">{title || 'YouTube'}</span>

      <iframe
        ref={iframeRef}
        src={`${embedUrl}?enablejsapi=1&playsinline=1&controls=0&modestbranding=1&rel=0`}
        title="yt-audio"
        className="w-0 h-0 border-0"
        allow="autoplay"
      />
    </div>
  );
}

export default function PodcastDetailPage() {
  const params = useParams();
  const { add } = useCart();
  const toast = useToast();

  const id = useMemo(() => {
    const raw = (params as any)?.id;
    const s = Array.isArray(raw) ? raw[0] : raw;
    const n = Number(s);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [params]);

  const [data, setData] = useState<{ product: Product; files: ProductFile[] } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [favOn, setFavOn] = useState(false);
  const [canFav, setCanFav] = useState(true);
  const [related, setRelated] = useState<Array<{ id: number; title: string; thumb: string }>>([]);

  useEffect(() => {
    if (!id) return;
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true); setErr(null);

        // Lấy dữ liệu podcast
        const r = await fetch(`${API_BASE}/v1/catalog/products/${id}`, { signal: ac.signal });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j = await r.json();
        setData(j?.data || null);

        // Favourites
        try {
          const rf = await api.get('/v1/favourites', { signal: ac.signal as any });
          const d  = rf.data?.data || rf.data || {};
          const ids: number[] = d.product_ids || [];
          setFavOn(ids.includes(id!));
          setCanFav(true);
        } catch (e: any) {
          if (e?.response?.status === 401) { setCanFav(false); setFavOn(false); }
        }

        // Related podcasts
        try {
          const cat = (j?.data?.product?.category || '').trim();
          const qs = cat ? `type=podcast&per_page=12&category=${encodeURIComponent(cat)}` : `type=podcast&per_page=12`;
          const rr = await fetch(`${API_BASE}/v1/catalog/products?${qs}`, { signal: ac.signal });
          if (rr.ok) {
            const j2 = await rr.json();
            const items: any[] = j2?.data?.items || [];
            const mapped = items
              .filter((it) => Number(it?.id) !== id)
              .map((it) => ({ id: it.id, title: it.title, thumb: toAbs(it.thumbnail_url) || FALLBACK_IMG }));
            setRelated(mapped.slice(0, 6));
          }
        } catch {}
      } catch (e: any) {
        if (e?.name !== 'AbortError') setErr(e?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [id]);

  if (!id)     return <div className="p-6 text-red-600">Invalid URL.</div>;
  if (loading) return <div className="p-6">Loading…</div>;
  if (err)     return <div className="p-6 text-red-600">Error: {err}</div>;
  if (!data)   return <div className="p-6">No data.</div>;

  const p = data.product;
  const files = data.files || [];

  const canView = Boolean((data as any)?.access?.can_view);
  const ytPreviewFile = files.find(f => String(f.file_type).toLowerCase()==='youtube' && (f.is_preview===1 || f.is_preview===true));
  const ytFullFile    = files.find(f => String(f.file_type).toLowerCase()==='youtube' && !(f.is_preview===1 || f.is_preview===true));
  const pickYt = (f?: any) => f ? {
    embed: (parseMaybeJSON(f.meta)?.embed_url) || f.file_url,
    watch: (parseMaybeJSON(f.meta)?.watch_url) || f.file_url,
    thumb: (parseMaybeJSON(f.meta)?.thumbnail_url) || p.thumbnail_url || FALLBACK_IMG,
  } : null;
  const yt  = canView ? (pickYt(ytFullFile) || pickYt(ytPreviewFile) || extractYoutubeFromFiles(files) || extractYoutubeFromProductMeta(p))
                      : (pickYt(ytPreviewFile) || null);
  const aud = files.find(f => (f.file_type === 'audio' || /\.mp3(\?|$)/i.test(f.file_url)) && (canView || f.is_preview));
  const cover = toAbs(p.thumbnail_url) || yt?.thumb || FALLBACK_IMG;
  const priceCents = Number(p.price_cents || 0);

  // Add to cart + toast (xanh, drop từ trên)
  const onBuy = async () => {
    try {
      await add(p.id, 1);
      toast.show('Đã thêm sản phẩm vào giỏ hàng');
    } catch {
      toast.show('Không thể thêm vào giỏ. Vui lòng thử lại.');
    }
  };

  // Toggle favourite
  const toggleFav = async () => {
    if (!canFav) { alert('Please sign in to use Favorites'); return; }
    const next = !favOn;
    setFavOn(next); // optimistic
    try {
      if (next) await api.post('/v1/favourites', { product_id: p.id });
      else      await api.delete(`/v1/favourites/${p.id}`);
    } catch (e: any) {
      setFavOn(!next); // revert
      if (e?.response?.status === 401) {
        setCanFav(false);
        alert('Session expired. Please sign in again.');
      } else {
        alert('Failed to update Favorites.');
      }
    }
  };

  return (
    <>
      <div className="relative">
        {/* Background blur */}
        <div className="absolute inset-0 -z-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cover} alt="" className="w-full h-full object-cover opacity-10" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/30 to-white/50" />
        </div>

        {/* Breadcrumb */}
        <div className="container mx-auto px-6 md:px-12 pt-6 text-sm text-zinc-800">
          <Link href="/podcast" className="hover:underline">Podcasts</Link>
          <span className="px-2">›</span>
          <span className="opacity-90 line-clamp-1 align-middle">{p.title}</span>
        </div>

        {/* Two columns: left info, right player */}
        <section className="relative w-screen left-[50%] right-[50%] -ml-[50vw] -mr-[50vw]">
          <div className="grid md:grid-cols-[1fr_1.2fr] gap-6 md:gap-10 p-6 md:p-12">
            {/* Left: info */}
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 text-xs font-bold tracking-wide bg-black/5 backdrop-blur px-3 py-1 rounded-full border border-black/5">
                <span className="inline-block h-2 w-2 rounded-full bg-indigo-500" />
                {p.category || 'Podcast'}
              </div>
              <h1 className="mt-2 text-3xl md:text-4xl font-extrabold leading-tight text-zinc-900 drop-shadow-sm">{p.title}</h1>
              {p.description && (
                <p className="mt-2 text-zinc-700 whitespace-pre-wrap">{String(p.description).slice(0, 300)}{String(p.description).length>300?'…':''}</p>
              )}

              {/* CTAs */}
              <div className="mt-5 flex items-center gap-3">
                <button onClick={onBuy} className="inline-flex items-center gap-2 bg-[color:var(--brand-500)] hover:bg-[color:var(--brand-600)] text-white font-semibold px-5 py-2.5 rounded-xl shadow transition">
                  Buy {priceCents>0 ? `(${formatVND(priceCents)})` : '(Free)'}
                </button>
                <button onClick={toggleFav} className={`h-10 px-4 inline-flex items-center gap-2 rounded-full border transition ${favOn ? 'bg-rose-50 text-rose-600 border-rose-200' : 'border-zinc-300 text-zinc-700 hover:bg-zinc-50'}`} aria-pressed={favOn}>
                  <span className="text-lg">{favOn ? '♥' : '♡'}</span>
                  <span className="text-sm hidden sm:inline">{favOn ? 'Unfavorite' : 'Favorite'}</span>
                </button>
              </div>

              {/* Price card */}
              <div className="mt-6 max-w-sm">
                <div className="relative rounded-2xl border border-zinc-200 bg-white p-4 shadow-lg">
                  <div className="absolute -top-3 left-4 text-xs font-bold text-white px-2 py-0.5 rounded-full bg-[color:var(--brand-500)]">One-off</div>
                  <div className="text-3xl font-extrabold text-zinc-900">{priceCents>0?formatVND(priceCents):'Free'}</div>
                  <div className="mt-2 text-sm text-zinc-600">Own this podcast forever</div>
                  <button onClick={onBuy} className="mt-4 w-full rounded-xl bg-[color:var(--brand-500)] hover:bg-[color:var(--brand-600)] text-white font-semibold py-2.5">Buy now</button>
                </div>
              </div>
            </div>

            {/* Right: player */}
            <div>
              {(() => {
                const yt = canView
                  ? ( (ytFullFile && pickYt(ytFullFile)) || (ytPreviewFile && pickYt(ytPreviewFile)) || extractYoutubeFromFiles(files) || extractYoutubeFromProductMeta(p) )
                  : (ytPreviewFile && pickYt(ytPreviewFile)) || null;
                const audLocal = files.find(f => (f.file_type === 'audio' || /\.mp3(\?|$)/i.test(f.file_url)) && (canView || f.is_preview));

                if (yt) {
                  return (
                    <div className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/10 bg-black">
                      <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                        <iframe
                          src={`${yt.embed}?rel=0&modestbranding=1`}
                          title={p.title}
                          className="absolute inset-0 w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  );
                }
                if (audLocal) {
                  return (
                    <div className="rounded-2xl overflow-hidden shadow-lg ring-1 ring-black/10 bg-white p-4">
                      <audio controls className="w-full">
                        <source src={toAbs(audLocal.file_url)} />
                      </audio>
                    </div>
                  );
                }
                return (
                  <div className="rounded-2xl border p-6 text-zinc-600 bg-white">
                    {canView ? 'No media available.' : 'Please purchase to watch the full podcast. A demo may be unavailable.'}
                  </div>
                );
              })()}
            </div>
          </div>
        </section>

        {/* Full Description */}
        {p.description && (
          <section className="px-6 md:px-12 max-w-4xl mx-auto mt-6">
            <h2 className="text-xl font-semibold mb-2">Description</h2>
            <p className="text-zinc-700 whitespace-pre-wrap">{p.description}</p>
          </section>
        )}

        {/* You may also like */}
        {related.length>0 && (
          <section className="px-6 md:px-12 mt-10 mb-16">
            <h2 className="text-xl font-semibold mb-3">You may also like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {related.map(r => (
                <Link key={r.id} href={`/podcast/${r.id}`} className="group rounded-xl border overflow-hidden bg-white shadow-sm hover:shadow-md transition">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.thumb} alt={r.title} className="w-full aspect-video object-cover group-hover:scale-[1.02] transition-transform duration-300" />
                  <div className="p-3">
                    <div className="font-medium line-clamp-2 group-hover:text-blue-600 transition-colors">{r.title}</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Toast (xanh, drop từ trên xuống) */}
      <Toast open={toast.open} msg={toast.msg} onClose={toast.hide} />
    </>
  );
}
