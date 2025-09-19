'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';

type ProductType = 'ebook' | 'podcast';
interface Product {
  id: number;
  type: ProductType;
  title: string;
  description?: string | null;
  category?: string | null;
  thumbnail_url?: string | null;
  price_cents: number;
  // Backend có thể nhét youtube vào đây (object hoặc JSON string)
  metadata?: any;
}
interface ProductFile {
  id: number;
  file_type: string;
  file_url: string;
  is_preview?: number | boolean;
  // object hoặc JSON string (có thể có { provider:'youtube', video_id, embed_url, thumbnail_url, watch_url })
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
  // chặn đường dẫn cục bộ
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
  const y = m?.youtube || m?.yt || m; // linh hoạt khoá
  let vid =
    y?.video_id ||
    (y?.watch_url && pickYoutubeId(String(y.watch_url))) ||
    (y?.embed_url && pickYoutubeId(String(y.embed_url)));

  // Nếu thumbnail là ảnh youtube thì cũng suy ra ID
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
      <img
        src={toAbs(cover) || FALLBACK_IMG}
        alt={title || 'podcast'}
        className="w-16 h-16 object-cover rounded-md"
        onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG; }}
      />
      <button
        onClick={toggle}
        className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
        aria-label={playing ? 'Tạm dừng' : 'Nghe podcast'}
      >
        {playing ? 'Tạm dừng' : 'Nghe podcast'}
      </button>
      <span className="text-sm text-gray-500">{title || 'YouTube'}</span>

      {/* Ẩn video – vẫn phát được audio nhờ enablejsapi */}
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

  const id = useMemo(() => {
    const raw = (params as any)?.id;
    const s = Array.isArray(raw) ? raw[0] : raw;
    const n = Number(s);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [params]);

  const [data, setData] = useState<{ product: Product; files: ProductFile[] } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true); setErr(null);
        const r = await fetch(`${API_BASE}/v1/catalog/products/${id}`, { signal: ac.signal });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j = await r.json();
        setData(j?.data || null);
      } catch (e: any) {
        if (e?.name !== 'AbortError') setErr(e?.message || 'Không tải được dữ liệu');
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [id]);

  if (!id)   return <div className="p-6 text-red-600">URL không hợp lệ.</div>;
  if (loading) return <div className="p-6">Đang tải…</div>;
  if (err)   return <div className="p-6 text-red-600">Lỗi: {err}</div>;
  if (!data) return <div className="p-6">Không có dữ liệu.</div>;

  const p = data.product;
  const files = data.files || [];

  const yt  = extractYoutubeFromFiles(files) || extractYoutubeFromProductMeta(p);
  const aud = files.find(f => f.file_type === 'audio' || /\.mp3(\?|$)/i.test(f.file_url));

  const cover = toAbs(p.thumbnail_url) || yt?.thumb || FALLBACK_IMG;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-start gap-6">
        <img
          src={cover}
          alt={p.title}
          className="w-40 h-56 object-cover rounded-md"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG; }}
        />

        <div className="flex-1">
          <h1 className="text-2xl font-bold">{p.title}</h1>
          <div className="text-gray-600">{p.category || '—'}</div>
          <div className="mt-1 font-medium">
            {p.price_cents > 0 ? formatVND(p.price_cents) : 'Miễn phí'}
          </div>

          <div className="mt-6 space-y-3">
            <h2 className="font-semibold">Nghe podcast</h2>

            {aud ? (
              <div className="border rounded-xl p-4">
                <audio controls className="w-full">
                  <source src={toAbs(aud.file_url)} />
                </audio>
              </div>
            ) : yt ? (
              <div className="space-y-2">
                <YoutubeAudio embedUrl={yt.embed} cover={cover} title={p.title} />
                <a href={yt.watch} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">
                  Mở trên YouTube
                </a>
                <div className="text-xs text-gray-500">* Video ẩn – chỉ phát âm thanh từ YouTube.</div>
              </div>
            ) : (
              <div className="text-gray-500">Hiện chưa có tệp âm thanh.</div>
            )}
          </div>
        </div>
      </div>

      {p.description ? (
        <div className="mt-8">
          <h2 className="font-semibold mb-2">Mô tả</h2>
          <p className="whitespace-pre-wrap text-gray-800">{p.description}</p>
        </div>
      ) : null}
    </div>
  );
}
