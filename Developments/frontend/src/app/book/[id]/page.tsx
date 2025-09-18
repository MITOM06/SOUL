'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';

interface Product {
  id: number;
  title: string;
  description?: string | null;
  category?: string | null;
  thumbnail_url?: string | null;
}
interface ProductFile {
  id: number;
  file_type: string;   // 'image' | 'pdf' | 'txt' | 'doc' | 'docx' | 'audio' ...
  file_url: string;    // /storage/... hoặc http(s)://...
  is_preview?: number | boolean;
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '');
const ORIGIN   = API_BASE.replace(/\/api$/, '');

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


/** Hook tiến độ – dùng cookie Sanctum thay vì X-User-Id */
function useContinue(productId: number | null) {
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/v1/continues/${productId}`, {
        credentials: 'include', // gửi cookie đăng nhập
      });
      if (r.status === 401) {   // chưa đăng nhập
        setProgress(null);
        return;
      }
      const j = await r.json();
      setProgress(j?.data || null);
    } finally {
      setLoading(false);
    }
  };

  const save = async (p: any) => {
    if (!productId) return;
    const res = await fetch(`${API_BASE}/v1/continues/${productId}`, {
      method: 'POST',
      credentials: 'include',          // gửi cookie
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p),
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
      } catch (e: any) {
        if (e?.name !== 'AbortError') setErr(e?.message || 'Không tải được dữ liệu');
      }
    })();
    return () => ac.abort();
  }, [id]);

  if (!id)  return <div className="p-6 text-red-600">URL không hợp lệ (thiếu id).</div>;
  if (err)  return <div className="p-6 text-red-600">Lỗi: {err}</div>;
  if (!data) return <div className="p-6">Đang tải…</div>;

  const files   = data.files || [];
  const preview = files.find(f => !!f.is_preview && canOpenDirect(f.file_url)) ||
                  files.find(f => f.file_type === 'pdf' && canOpenDirect(f.file_url)) || null;
  const gallery = files.filter(f => f.file_type === 'image' && canOpenDirect(f.file_url));

  const coverSrc = toAbs(data.product.thumbnail_url) || FALLBACK_IMG;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-start gap-4">
        <img
          src={coverSrc}
          alt={data.product.title}
          className="w-40 h-56 object-cover rounded"
          onError={(e)=>{ (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG; }}
        />
        <div>
          <h1 className="text-2xl font-bold mb-1">{data.product.title}</h1>
          <div className="text-gray-600 mb-2">{data.product.category || '—'}</div>

          {preview ? (
            <a
              href={toAbs(preview.file_url)}
              target="_blank"
              rel="noreferrer"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded"
            >
              Xem trước (PDF)
            </a>
          ) : (
            files.some(f => f.is_preview || f.file_type === 'pdf') && (
              // <div className="text-sm text-red-600">
              //   File xem trước là đường dẫn cục bộ (file://…). Hãy upload lại file qua Admin để dùng trên web.
              // </div>
              <div>
                </div>
            ))
          }
        </div>
      </div>

      {data.product.description ? (
        <p className="mt-6 whitespace-pre-wrap">{data.product.description}</p>
      ) : null}

      {gallery.length > 0 && (
        <div className="mt-6">
          <h2 className="font-semibold mb-2">Hình ảnh</h2>
          <div className="flex flex-wrap gap-2">
            {gallery.map(img => (
              <img
                key={img.id}
                src={toAbs(img.file_url) || FALLBACK_IMG}
                alt=""
                className="w-24 h-32 object-cover rounded"
                onError={(e)=>{ (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG; }}
              />
            ))}
          </div>
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-6">
          <h2 className="font-semibold mb-2">Tệp đính kèm</h2>
        <ul className="list-disc pl-6 space-y-1">
          {files.map(f => (
            <li key={f.id}>
              <a
                href={downloadUrl(data.product.id, f.id)}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline"
              >
                Tải về: {f.file_type.toUpperCase()}
              </a>
            </li>
          ))}
        </ul>
        </div>
      )}

      <div className="mt-8 border-t pt-4">
        <h2 className="font-semibold mb-2">Tiến độ đọc</h2>
        <div className="text-sm text-gray-600 mb-2">
          Trang hiện tại: {progress?.current_page ?? 0}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number" min={0}
            value={page}
            onChange={(e) => setPage(Number(e.target.value))}
            className="border rounded px-2 py-1 w-24"
          />
          <button
            onClick={() => save({ current_page: page })}
            className="px-3 py-1 rounded bg-green-600 text-white"
          >
            Lưu tiến độ
          </button>
        </div>
      </div>
    </div>
  );
}
