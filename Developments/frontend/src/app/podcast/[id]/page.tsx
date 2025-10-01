'use client';

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import PodcastCard from '@/components/PodcastCard';
import api from '@/lib/api';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { normalizeRole } from '@/lib/role';
import { cn } from '@/lib/utils';

/* ---------------- Types & helpers ---------------- */
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
const formatUSD = (cents?: number | null) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
    .format(((cents ?? 0) as number) / 100);
const secToClock = (s: number) => {
  const t = Math.max(0, Math.floor(s || 0));
  const m = Math.floor(t / 60);
  const ss = t % 60;
  return `${m}:${String(ss).padStart(2, '0')}`;
};

/* ---------------- Toast ---------------- */
function useToast(autoHideMs = 2200) {
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
  const hide = () => { setOpen(false); if (timer.current) { window.clearTimeout(timer.current); timer.current = null; } };
  return { open, msg, show, hide };
}
function Toast({ open, msg, onClose }: { open: boolean; msg: string; onClose: () => void }) {
  return (
    <div
      className={`fixed z-[1000] left-1/2 -translate-x-1/2 top-0 w-full max-w-md px-3 transition-transform
      duration-300 ease-out ${open ? 'translate-y-4' : '-translate-y-10 pointer-events-none'}`}
      role="status" aria-live="polite">
      <div className="flex items-center gap-2 rounded-xl bg-emerald-600 text-white px-4 py-2 shadow-xl ring-1 ring-emerald-700/40">
        <span className="hidden" aria-hidden="true">🛟</span>
        <span className="text-sm font-medium">{msg}</span>
        <button onClick={onClose} className="ml-auto text-white/80 hover:text-white text-sm" aria-label="close">✕</button>
      </div>
    </div>
  );
}

/* ---------------- Continue hook (server + local fallback) ---------------- */
function useListenContinue(productId: number | null, enabled: boolean) {
  const [seconds, setSeconds]   = useState(0);
  const [duration, setDuration] = useState(0);
  const [loaded, setLoaded]     = useState(false);
  const lastSaved = useRef(0);

  const lsKey = useMemo(() => (productId ? `continue_podcast_${productId}` : ''), [productId]);

  // Load from server first, then fallback local
  useEffect(() => {
    if (!productId || !enabled) { setLoaded(true); return; }
    let cancel = false;
    (async () => {
      try {
        const r = await api.get(`/v1/continues/${productId}`);
        const d = r.data?.data || {};
        const cur =
          Number(d?.current_time_seconds) ||
          Number(d?.progress_seconds)     ||
          Number(d?.current_page)         || 0;
        const dur =
          Number(d?.duration_seconds) ||
          Number(d?.total_seconds)   ||
          Number(d?.total_pages)     || 0;

        if (!cancel) {
          setSeconds(cur || 0);
          if (dur) setDuration(dur);
          lastSaved.current = cur || 0;
          setLoaded(true);
          try { if (lsKey) localStorage.setItem(lsKey, JSON.stringify({ s: cur || 0 })); } catch {}
        }
      } catch {
        let cur = 0;
        try { const raw = lsKey && localStorage.getItem(lsKey); if (raw) cur = Number(JSON.parse(raw)?.s || 0); } catch {}
        if (!cancel) {
          setSeconds(cur || 0);
          lastSaved.current = cur || 0;
          setLoaded(true);
        }
      }
    })();
    return () => { cancel = true; };
  }, [productId, enabled, lsKey]);

  // Save to DB (try multiple payload shapes)
  const save = async (cur: number, dur?: number) => {
    const now   = Math.max(0, Math.floor(cur || 0));
    const total = Math.max(0, Math.floor(dur ?? duration ?? 0));

    // local first
    try { if (lsKey) localStorage.setItem(lsKey, JSON.stringify({ s: now })); } catch {}
    lastSaved.current = now;

    if (!productId || !enabled) return;

    const variants: any[] = [
      { type: 'podcast', current_time_seconds: now, duration_seconds: total || undefined },
      { type: 'podcast', progress_seconds: now,       total_seconds: total || undefined },
    ];

    let ok = false, lastErr: any = null;
    for (const payload of variants) {
      try {
        const res = await api.post(`/v1/continues/${productId}`, payload);
        if (res.status >= 200 && res.status < 300) { ok = true; break; }
      } catch (e) { lastErr = e; }
    }

    if (!ok) {
      try {
        await fetch(`${API_BASE}/v1/continues/${productId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(variants[0]),
          keepalive: true,
        });
      } catch (e) {
        console.warn('continue save failed', lastErr || e);
      }
    }
  };

  // Warn on close/hidden (no silent autosave; just set local cache)
  useEffect(() => {
    if (!enabled) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (Math.abs(seconds - lastSaved.current) >= 1) {
        try { if (lsKey) localStorage.setItem(lsKey, JSON.stringify({ s: Math.floor(seconds) })); } catch {}
        e.preventDefault();
        e.returnValue = '';
      }
    };
    const onPageHide = () => {
      if (Math.abs(seconds - lastSaved.current) >= 1) {
        try { if (lsKey) localStorage.setItem(lsKey, JSON.stringify({ s: Math.floor(seconds) })); } catch {}
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, [enabled, seconds, productId, lsKey]);

  return { seconds, setSeconds, duration, setDuration, loaded, save };
}

/* ---------------- YouTube audio-only (ready handshake + queue) ---------------- */
type AudioHandle = { play: () => void; pause: () => void; save: () => void; };

const YouTubeAudioOnly = forwardRef(function _YouTubeAudioOnly(
  {
    embedUrl,
    cover,
    title,
    resumeAt = 0,
    onProgress,
    onSaveClick,
  }: {
    embedUrl: string;
    cover?: string;
    title?: string;
    resumeAt?: number;
    onProgress: (cur: number, dur?: number) => void;
    onSaveClick: (cur: number, dur?: number) => void;
  },
  ref: React.Ref<AudioHandle>
) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);

  const readyRef = useRef(false);
  const handshakeId = useRef<number | null>(null);
  const queue = useRef<Array<{ func: string; args?: any[] }>>([]);
  const lastTick = useRef(0);

  const post = (func: string, args: any[] = []) => {
    const w = iframeRef.current?.contentWindow;
    if (!w) return;
    if (!readyRef.current && func !== 'seekTo') {
      queue.current.push({ func, args });
    }
    w.postMessage(JSON.stringify({ event: 'command', func, args }), '*');
  };

  // handshake + listeners
  useEffect(() => {
    const sayListening = () => {
      const w = iframeRef.current?.contentWindow;
      if (!w || readyRef.current) return;
      w.postMessage(JSON.stringify({ event: 'listening' }), '*');
    };
    // @ts-ignore
    handshakeId.current = window.setInterval(sayListening, 300);

    const onMsg = (e: MessageEvent) => {
      try {
        const d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;

        if (d?.event === 'onReady') {
          readyRef.current = true;
          if (handshakeId.current) window.clearInterval(handshakeId.current);
          handshakeId.current = null;

          // resume 1 lần
          if (resumeAt > 0) post('seekTo', [Math.floor(resumeAt), true]);

          // flush queue
          while (queue.current.length) {
            const c = queue.current.shift()!;
            post(c.func, c.args || []);
          }
        }

        if (d?.event === 'infoDelivery' && d?.info) {
          if (typeof d.info.currentTime === 'number') {
            const now = d.info.currentTime as number;
            setCur(now);
            const t = Date.now();
            if (t - lastTick.current > 500) {
              lastTick.current = t;
              onProgress(now, dur);
            }
          }
          if (typeof d.info.duration === 'number') {
            setDur(d.info.duration as number);
          }
        }
      } catch {}
    };

    window.addEventListener('message', onMsg);

    const poll = window.setInterval(() => {
      post('getCurrentTime');
      post('getDuration');
    }, 1000);

    return () => {
      window.removeEventListener('message', onMsg);
      window.clearInterval(poll);
      if (handshakeId.current) window.clearInterval(handshakeId.current);
      handshakeId.current = null;
    };
  }, [resumeAt, dur, onProgress]);

  // If saved resumeAt arrives after ready, seek to it
  useEffect(() => {
    const target = Math.max(0, Math.floor(resumeAt || 0));
    if (!readyRef.current || target <= 0) return;
    if (Math.abs((cur || 0) - target) > 1) {
      post('seekTo', [target, true]);
      setCur(target);
    }
  }, [resumeAt]);

  const play  = () => { setPlaying(true);  post('playVideo'); };
  const pause = () => { setPlaying(false); post('pauseVideo'); onSaveClick(cur, dur); };
  const toggle= () => (playing ? pause() : play());
  const seek  = (sec: number) => { const t = Math.max(0, Math.floor(sec)); setCur(t); post('seekTo', [t, true]); };
  const saveNow = () => onSaveClick(cur, dur);

  useImperativeHandle(ref, () => ({ play, pause, save: saveNow }), [cur, dur]);

  return (
    <div className="rounded-2xl overflow-hidden ring-1 ring-black/10 bg-white p-4 shadow-lg">
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={toAbs(cover) || FALLBACK_IMG}
          alt={title || 'podcast'}
          className="w-16 h-16 object-cover rounded-md"
          onError={(e)=>{ (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG; }}
        />
        <button onClick={toggle} className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700">
          {playing ? 'Pause' : 'Play'}
        </button>
        <div className="text-sm text-zinc-700">{secToClock(cur)}{dur ? ` / ${secToClock(dur)}` : ''}</div>
        <button onClick={saveNow} className="ml-auto px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700">
          Save
        </button>
      </div>

      <input
        type="range"
        min={0}
        max={Math.max(1, Math.floor(dur || 1))}
        value={Math.floor(cur)}
        onChange={(e) => seek(Number(e.target.value))}
        className="mt-3 w-full"
      />

      {/* Hidden iframe - audio only */}
      <iframe
        ref={iframeRef}
        src={`${embedUrl}?enablejsapi=1&playsinline=1&controls=0&modestbranding=1&rel=0&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
        title="yt-audio"
        className="w-0 h-0 absolute opacity-0 pointer-events-none -z-10"
        allow="autoplay; encrypted-media"
        aria-hidden="true"
      />
    </div>
  );
});

/* ---------------- Extract youtube helpers ---------------- */
function extractYoutubeFromFiles(files: ProductFile[]) {
  for (const f of files) {
    const type = String(f.file_type || '').toLowerCase();
    const meta = parseMaybeJSON(f.meta) || {};
    const url  = String(f.file_url || '');
    const looks = type.includes('youtube') || type.includes('video') ||
      /youtube\.com|youtu\.be/i.test(url) || String(meta?.provider||'').toLowerCase()==='youtube';
    if (!looks) continue;
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

/* ============================== PAGE ============================== */
export default function PodcastDetailPage() {
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
  const [loading, setLoading] = useState(true);
  const [favOn, setFavOn] = useState(false);
  const [canFav, setCanFav] = useState(true);
  const [related, setRelated] = useState<any[]>([]);

  // fetch product + favourites
  useEffect(() => {
    if (!id) return;
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true); setErr(null);
        const r = await fetch(`${API_BASE}/v1/catalog/products/${id}`, { signal: ac.signal });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j = await r.json();
        let payload = j?.data || null;
        if (isLoggedIn) {
          try {
            const pr = await api.get(`/v1/catalog/products/${id}`, { signal: ac.signal as any });
            if (pr.data?.data) payload = pr.data.data;
          } catch {}
        }
        setData(payload);

        if (isLoggedIn && !isAdmin) {
          try {
            const rf = await api.get('/v1/favourites', { signal: ac.signal as any });
            const d  = rf.data?.data || rf.data || {};
            const ids: number[] = d.product_ids || [];
            setFavOn(ids.includes(id!));
            setCanFav(true);
          } catch { setFavOn(false); setCanFav(false); }
        } else { setFavOn(false); setCanFav(false); }
      } catch (e: any) {
        if (e?.name !== 'AbortError') setErr(e?.message || 'Failed to load data');
      } finally { setLoading(false); }
    })();
    return () => ac.abort();
  }, [id, isLoggedIn, isAdmin]);

  const { seconds, setSeconds, duration, setDuration, loaded, save } =
    useListenContinue(id, isCustomer);

  const playerRef = useRef<AudioHandle>(null);
  const [savedSec, setSavedSec] = useState(0);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | 'back' | null>(null);

  // After initial load, take current seconds as saved baseline
  useEffect(() => { if (loaded) setSavedSec(seconds); }, [loaded]);
  const hasUnsaved = Math.abs(Math.floor(seconds) - Math.floor(savedSec || 0)) >= 1;

  // Intercept link clicks to confirm saving
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!hasUnsaved) return;
      const target = e.target as Element | null;
      if (!target) return;
      const a = target.closest('a') as HTMLAnchorElement | null;
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#')) return;
      if (a.target === '_blank' || (e as any).metaKey || (e as any).ctrlKey || (e as any).shiftKey || (e as any).altKey) return;
      e.preventDefault(); e.stopPropagation();
      setPendingUrl(a.href);
      setLeaveOpen(true);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [hasUnsaved]);

  // Guard back/forward navigation
  useEffect(() => {
    const onPop = () => {
      if (!hasUnsaved) return;
      history.pushState(null, '', location.href);
      setPendingUrl('back');
      setLeaveOpen(true);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [hasUnsaved]);

  // Load related podcasts (same category), ~7 items — keep this before any early return (Rules of Hooks)
  useEffect(() => {
    const cat = (data as any)?.product?.category as string | undefined;
    const pid = (data as any)?.product?.id as number | undefined;
    if (!cat || !pid) { setRelated([]); return; }
    const ac = new AbortController();
    (async () => {
      try {
        const params = new URLSearchParams({ type: 'podcast', per_page: '14', category: String(cat) });
        const res = await fetch(`${API_BASE}/v1/catalog/products?${params.toString()}`, { signal: ac.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const j = await res.json();
        const items = (j?.data?.items || []).filter((it: any) => Number(it.id) !== Number(pid));
        setRelated(items.slice(0, 7));
      } catch { setRelated([]); }
    })();
    return () => ac.abort();
  }, [data]);

  if (!id) return <div className="p-6 text-red-600">Invalid URL.</div>;
  if (loading || !loaded) return <div className="p-6">Loading…</div>;
  if (err) return <div className="p-6 text-red-600">Error: {err}</div>;
  if (!data) return <div className="p-6">No data.</div>;

  const p = data.product;
  const files = data.files || [];
  const canView = Boolean((data as any)?.access?.can_view);
  const priceCents = Number(p?.price_cents || 0);
  // Align with book: only customers can listen; admin is blocked even if can_view
  const owned = isCustomer && (canView || priceCents === 0);

  const ytPreviewFile = files.find(f => String(f.file_type).toLowerCase()==='youtube' && (f.is_preview===1 || f.is_preview===true));
  const ytFullFile    = files.find(f => String(f.file_type).toLowerCase()==='youtube' && !(f.is_preview===1 || f.is_preview===true));
  const pickYt = (f?: any) => f ? {
    embed: (parseMaybeJSON(f.meta)?.embed_url) || f.file_url,
    watch: (parseMaybeJSON(f.meta)?.watch_url) || f.file_url,
    thumb: (parseMaybeJSON(f.meta)?.thumbnail_url) || p?.thumbnail_url || FALLBACK_IMG,
  } : null;
  // Only allow media when owned; previews are disabled per requirement
  const yt  = owned
    ? (pickYt(ytFullFile) || pickYt(ytPreviewFile) || extractYoutubeFromFiles(files) || extractYoutubeFromProductMeta(p))
    : null;

  const aud = owned ? files.find(f => (f.file_type === 'audio' || /\.(mp3|m4a|wav)(\?|$)/i.test(f.file_url))) : undefined;
  const vid = owned ? files.find(f => (f.file_type === 'video' || /\.mp4(\?|$)/i.test(f.file_url))) : undefined;
  const cover = toAbs(p.thumbnail_url) || yt?.thumb || FALLBACK_IMG;

  const onBuy = async () => {
    if (!isLoggedIn) {
      alert('Please sign in to purchase.');
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/auth/login?next=${next}`;
      return;
    }
    if (isAdmin) return alert('Admin accounts cannot purchase.');
    try {
      const r = await add(p.id, 1);
      if ((r as any)?.alreadyInCart) toast.show('This product is already in your cart');
      else toast.show('Added to cart');
    } catch { toast.show('Failed to add to cart. Please try again.'); }
  };

  const toggleFav = async () => {
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
    } catch { setFavOn(!next); alert('Failed to update Favorites.'); }
  };

  const onListenNow = () => {
    const el = document.getElementById('player');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    playerRef.current?.play?.();
  };

  const saveNowEverywhere = async (cur: number, dur?: number) => {
    await save(cur, dur);
    setSavedSec(Math.floor(cur || 0));
    toast.show('Progress saved');
  };

  const confirmLeave = async (saveIt: boolean) => {
    const dest = pendingUrl;
    setLeaveOpen(false);
    if (saveIt) {
      await saveNowEverywhere(seconds, duration);
    }
    if (dest === 'back') {
      window.history.back();
    } else if (typeof dest === 'string' && dest) {
      window.location.href = dest;
    }
    setPendingUrl(null);
  };

  

  return (
    <>
      <div className="relative">
        {/* BG */}
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

        {/* Two columns */}
        <section className="relative w-screen left-[50%] right-[50%] -ml-[50vw] -mr-[50vw]">
          <div className="grid md:grid-cols-[1fr_1.2fr] gap-6 md:gap-10 p-6 md:p-12">
            {/* LEFT: Info & CTAs */}
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 text-xs font-bold tracking-wide bg-black/5 backdrop-blur px-3 py-1 rounded-full border border-black/5">
                <span className="inline-block h-2 w-2 rounded-full bg-indigo-500" />
                {p.category || 'Podcast'}
              </div>
              <h1 className="mt-2 text-3xl md:text-4xl font-extrabold leading-tight text-zinc-900 drop-shadow-sm">
                {p.title}
              </h1>
              {p.description && (
                <p className="mt-2 text-zinc-700 whitespace-pre-wrap">{String(p.description)}</p>
              )}

              <div className="mt-5 flex items-center gap-3">
                {owned ? (
                  <button
                    onClick={onListenNow}
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow transition"
                  >
                    Listen now
                  </button>
                ) : isAdmin ? (
                  <button
                    aria-disabled
                    className="inline-flex items-center gap-2 bg-zinc-300 text-white opacity-60 cursor-not-allowed font-semibold px-5 py-2.5 rounded-xl shadow transition"
                    title="Admins cannot listen"
                  >
                    Listen (Locked)
                  </button>
                ) : (
                  priceCents === 0 ? (
                    <button
                      onClick={() => { window.location.href = `/auth/login?next=${encodeURIComponent(window.location.pathname)}`; }}
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow transition"
                    >
                      Sign in to listen
                    </button>
                  ) : (
                    <button
                      onClick={onBuy}
                      aria-disabled={!isCustomer}
                      className={cn(
                        'inline-flex items-center gap-2 bg-[color:var(--brand-500)] hover:bg-[color:var(--brand-600)] text-white font-semibold px-5 py-2.5 rounded-xl shadow transition',
                        !isCustomer && 'opacity-70'
                      )}
                    >
                      Buy {priceCents>0 ? `(${formatUSD(priceCents)})` : '(Free)'}
                    </button>
                  )
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
              </div>

              {/* progress quick actions (hide when not owned) */}
              {isLoggedIn && owned && (
                <div className="mt-4 flex items-center gap-2 text-sm text-zinc-700">
                  <span className="px-2 py-1 rounded bg-zinc-100">
                    Progress: {secToClock(seconds)}{duration ? ` / ${secToClock(duration)}` : ''}
                  </span>
                  <button
                    onClick={() => saveNowEverywhere(seconds, duration)}
                    className="px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    Save progress
                  </button>
                  {seconds > 0 && (
                    <button onClick={onListenNow} className="px-3 py-1 rounded border border-zinc-300 hover:bg-zinc-50">
                      Continue at {secToClock(seconds)}
                    </button>
                  )}
                </div>
              )}

              {/* Price card */}
              <div className="mt-6 max-w-sm">
                <div className="relative rounded-2xl border border-zinc-200 bg-white p-4 shadow-lg">
                  <div className="absolute -top-3 left-4 text-xs font-bold text-white px-2 py-0.5 rounded-full bg-[color:var(--brand-500)]">
                    One-off
                  </div>
                  {canView ? (
                    <>
                      <div className="text-3xl font-extrabold text-emerald-700">Owned</div>
                      <div className="mt-2 text-sm text-emerald-600">You already own this podcast</div>
                    </>
                  ) : (
                    <>
                      <div className="text-3xl font-extrabold text-zinc-900">{priceCents>0?formatUSD(priceCents):'Free'}</div>
                      <div className="mt-2 text-sm text-zinc-600">Own this podcast forever</div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT: Player */}
            <div id="player">
              {owned ? (
                yt ? (
                  <YouTubeAudioOnly
                    ref={playerRef}
                    embedUrl={yt.embed}
                    cover={cover}
                    title={p.title}
                    resumeAt={seconds}
                    onProgress={(cur, dur) => { setSeconds(cur); if (dur) setDuration(dur); }}
                    onSaveClick={(cur, dur) => saveNowEverywhere(cur, dur)}
                  />
                ) : aud ? (
                  <div className="rounded-2xl overflow-hidden shadow-lg ring-1 ring-black/10 bg-white p-4">
                    <audio
                      controls
                      className="w-full"
                      src={toAbs(aud.file_url)}
                      onTimeUpdate={(e) => setSeconds((e.target as HTMLAudioElement).currentTime || 0)}
                      onDurationChange={(e) => setDuration((e.target as HTMLAudioElement).duration || 0)}
                      onPause={(e) => {
                        const el = e.target as HTMLAudioElement;
                        saveNowEverywhere(el.currentTime || 0, el.duration || 0);
                      }}
                      onLoadedMetadata={(e) => {
                        const el = e.target as HTMLAudioElement;
                        if (seconds > 0 && Math.abs((el.currentTime||0) - seconds) > 2) {
                          try { el.currentTime = seconds; } catch {}
                        }
                      }}
                    />
                    <div className="mt-2 text-sm text-zinc-700">
                      {secToClock(seconds)}{duration ? ` / ${secToClock(duration)}` : ''}
                      <button
                        className="ml-3 px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                        onClick={() => saveNowEverywhere(seconds, duration)}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : vid ? (
                  <div className="rounded-2xl overflow-hidden shadow-lg ring-1 ring-black/10 bg-white p-4">
                    <video
                      controls
                      className="w-full"
                      src={toAbs(vid.file_url)}
                      onTimeUpdate={(e) => setSeconds((e.target as HTMLVideoElement).currentTime || 0)}
                      onLoadedMetadata={(e) => {
                        const el = e.target as HTMLVideoElement;
                        setDuration(el.duration || 0);
                        if (seconds > 0 && Math.abs((el.currentTime||0) - seconds) > 2) {
                          try { el.currentTime = seconds; } catch {}
                        }
                      }}
                      onPause={(e) => {
                        const el = e.target as HTMLVideoElement;
                        saveNowEverywhere(el.currentTime || 0, el.duration || 0);
                      }}
                    />
                    <div className="mt-2 text-sm text-zinc-700">
                      {secToClock(seconds)}{duration ? ` / ${secToClock(duration)}` : ''}
                      <button
                        className="ml-3 px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                        onClick={() => saveNowEverywhere(seconds, duration)}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border p-6 text-zinc-600 bg-white">
                    {canView ? 'No media available.' : 'Please purchase to listen to the full podcast.'}
                  </div>
                )
              ) : (
                <div className="rounded-2xl overflow-hidden ring-1 ring-black/10 bg-white p-4 shadow-lg">
                  <div className="flex items-center gap-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cover}
                      alt={p.title}
                      className="w-16 h-16 object-cover rounded-md"
                      onError={(e)=>{ (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG; }}
                    />
                    <button
                      disabled
                      aria-disabled="true"
                      className="px-4 py-2 rounded bg-zinc-300 text-white opacity-60 cursor-not-allowed"
                      title="Locked — purchase to listen"
                    >
                      Play
                    </button>
                    <div className="text-sm text-zinc-500">00:00 / --:--</div>
                  </div>
                  <div className="mt-3 text-sm text-zinc-600">
                    Please purchase to listen to the full podcast.
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      <Toast open={toast.open} msg={toast.msg} onClose={toast.hide} />

      {/* Leave confirm modal */}
      {leaveOpen && (
        <div className="fixed inset-0 z-[1100] bg-black/50 flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-xl bg-white shadow-xl p-5">
            <h3 className="text-lg font-semibold mb-2">Save progress?</h3>
            <p className="text-sm text-zinc-700">You have unsaved listening progress. Do you want to save it before leaving?</p>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => confirmLeave(false)} className="px-3 py-1 rounded border border-zinc-300 hover:bg-zinc-50">Don’t save</button>
              <button onClick={() => confirmLeave(true)} className="px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700">Save and leave</button>
            </div>
          </div>
        </div>
      )}

      {/* Related podcasts */}
      {related.length > 0 && (
        <section className="mt-6 mb-16">
          <div className="px-4 md:px-8">
            <h2 className="text-xl font-semibold">You may also like</h2>
          </div>
          <div className="relative w-screen left-[50%] right-[50%] -ml-[50vw] -mr-[50vw]">
            <RelatedRowPodcasts items={related} />
          </div>
        </section>
      )}
    </>
  );
}

function RelatedRowPodcasts({ items }: { items: any[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const scrollBy = (delta: number) => scrollerRef.current?.scrollBy({ left: delta, behavior: 'smooth' });

  return (
    <div className="px-4 md:px-8">
      <div className="relative">
        <div ref={scrollerRef} className="flex gap-4 overflow-x-auto scroll-smooth pb-3 [scrollbar-width:thin] snap-x snap-mandatory">
          {items.map((p: any) => (
            <div key={p.id} className="snap-start shrink-0 basis-[calc((100vw-8rem)/1.2)] sm:basis-[calc((100vw-10rem)/1.6)] md:basis-[calc((100vw-14rem)/3)]">
              <PodcastCard podcast={{ id: p.id, title: p.title, cover: toAbs(p.thumbnail_url || ''), price_cents: p.price_cents }} variant="wide" />
            </div>
          ))}
        </div>
        <button aria-label="left" onClick={()=>scrollBy(-600)} className="hidden md:grid place-items-center absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 shadow hover:bg-white">‹</button>
        <button aria-label="right" onClick={()=>scrollBy(600)} className="hidden md:grid place-items-center absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 shadow hover:bg-white">›</button>
      </div>
    </div>
  );
}
