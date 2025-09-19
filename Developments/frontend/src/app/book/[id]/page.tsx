'use client';

import { useEffect, useMemo, useState } from 'react';
import { favouritesAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { useParams } from 'next/navigation';
import Link from 'next/link';

type ProductType = 'ebook' | 'podcast';
interface Product {
  id: number;
  type: ProductType;
  title: string;
  description?: string | null;
  category?: string | null;
  thumbnail_url?: string | null;
  price_cents: number;
}
interface ProductFile {
  id: number;
  file_type: string;   // 'pdf' | 'image' | ...
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

const formatVND = (n: number | null | undefined) =>
  Number(n ?? 0).toLocaleString('vi-VN', { maximumFractionDigits: 0 }) + ' đ';

const toAbs = (u?: string | null) => {
  if (!u) return '';
  const s = String(u).trim();
  if (/^file:\/\//i.test(s) || /^[A-Za-z]:\\/.test(s)) return ''; // chặn đường dẫn cục bộ
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  if (s.startsWith('/')) return `${ORIGIN}${s}`;
  return s;
};
const canOpenDirect = (u: string) => /^https?:\/\//i.test(u) || u.startsWith('/');
const isPdf = (f: ProductFile) =>
  f.file_type?.toLowerCase() === 'pdf' || /\.pdf(\?|$)/i.test(f.file_url || '');
const isImage = (f: ProductFile) =>
  f.file_type?.toLowerCase() === 'image' || /\.(png|jpe?g|webp)(\?|$)/i.test(f.file_url || '');
const downloadUrl = (productId: number, fileId: number) =>
  `${API_BASE}/v1/catalog/products/${productId}/files/${fileId}/download`;

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
  const [loading, setLoading] = useState(true);

  // modal states
  const [showPreview, setShowPreview] = useState(false);
  const [showReader, setShowReader] = useState(false);

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

  if (!id)  return <div className="p-6 text-red-600">URL không hợp lệ (thiếu id).</div>;
  if (loading) return <div className="p-6">Đang tải…</div>;
  if (err)  return <div className="p-6 text-red-600">Lỗi: {err}</div>;
  if (!data) return <div className="p-6">Không có dữ liệu.</div>;

  const p = data.product;
  const files = data.files || [];
  const cover = toAbs(p.thumbnail_url) || FALLBACK_IMG;

  // 1) file preview (ưu tiên is_preview, sau đó bất kỳ PDF nào)
  const previewFile =
    files.find(f => !!f.is_preview && isPdf(f) && canOpenDirect(f.file_url)) ||
    files.find(f => isPdf(f) && canOpenDirect(f.file_url)) ||
    null;

  // 2) file đọc online (ưu tiên PDF đầy đủ; nếu không có PDF thì dùng ảnh trang)
  const fullPdf   = files.find(f => isPdf(f)); // có thể là preview nếu chỉ có 1 PDF
  const imgPages  = files.filter(f => isImage(f) && canOpenDirect(f.file_url));

  const previewUrl = previewFile
    ? (canOpenDirect(previewFile.file_url) ? toAbs(previewFile.file_url) : downloadUrl(p.id, previewFile.id))
    : '';

  const readerPdfUrl = fullPdf
    ? (canOpenDirect(fullPdf.file_url) ? toAbs(fullPdf.file_url) : downloadUrl(p.id, fullPdf.id))
    : '';


  // 1 file để tải (nếu có)
  const downloadable = fullPdf || files[0] || null;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-4">
        <img
          src={cover}
          alt={p.title}
          className="w-40 h-56 object-cover rounded"
          onError={(e)=>{ (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG; }}
        />
        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-1">{p.title}</h1>
          <div className="text-gray-600 mb-2">{p.category || '—'}</div>
          <div className="text-sm mb-4">{p.price_cents > 0 ? formatVND(p.price_cents) : 'Miễn phí'}</div>

          <div className="flex flex-wrap gap-2">
            {previewUrl && (
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => setShowPreview(true)}
              >
                Đọc thử
              </button>
            )}

            {(readerPdfUrl || imgPages.length) ? (
              <button
                className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={() => setShowReader(true)}
              >
                Đọc online (xem thêm)
              </button>
            ) : null}

            {downloadable && (
              <a
                href={downloadUrl(p.id, downloadable.id)}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded border"
              >
                Tải về: {downloadable.file_type.toUpperCase()}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Mô tả */}
      {p.description ? (
        <p className="mt-6 whitespace-pre-wrap">{p.description}</p>


      {/* ========= Modal: Đọc thử ========= */}
      {showPreview && previewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="bg-white rounded-xl w-full max-w-4xl h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-2 border-b">
              <div className="font-semibold">Đọc thử</div>
              <button className="text-sm px-3 py-1 border rounded" onClick={() => setShowPreview(false)}>Đóng</button>
            </div>
            <div className="flex-1">
              <iframe src={previewUrl} className="w-full h-full" title="Preview" />
            </div>
          </div>
        </div>
      )}

      {/* ========= Overlay toàn màn hình: Đọc online ========= */}
      {showReader && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 border-b">
            <div className="font-semibold truncate">Đọc online — {p.title}</div>
            <div className="flex items-center gap-2">
              {fullPdf && (
                <a
                  href={downloadUrl(p.id, fullPdf.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm px-3 py-1 border rounded"
                >
                  Tải PDF
                </a>
              )}
              <button
                className="text-sm px-3 py-1 border rounded"
                onClick={() => setShowReader(false)}
              >
                Đóng
              </button>
            </div>
          </div>

          <div className="flex-1 bg-neutral-50">
            {readerPdfUrl ? (
              <iframe src={readerPdfUrl} title="Reader" className="w-full h-full" />
            ) : imgPages.length > 0 ? (
              <div className="max-w-3xl mx-auto p-4 space-y-4 overflow-y-auto h-full">
                {imgPages.map(img => (
                  <img
                    key={img.id}
                    src={toAbs(img.file_url)}
                    alt=""
                    className="w-full rounded shadow"
                  />
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                Chưa có nội dung để đọc online.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}