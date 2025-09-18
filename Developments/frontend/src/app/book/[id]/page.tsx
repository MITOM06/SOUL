'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';

interface Product {
  id: number;
  title: string;
  description?: string | null;
  category?: string | null;
}
interface ProductFile {
  id: number;
  file_type: string;
  file_url: string;
  is_preview?: number | boolean;
}

// Chuẩn hoá BASE URL (loại dấu / ở cuối)
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace(
  /\/$/,
  ''
);

/** Hook lưu/đọc tiến độ (demo dùng header X-User-Id) */
function useContinue(productId: number | null) {
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/v1/continues/${productId}`, {
        headers: { 'X-User-Id': '1' },
      });
      const j = await r.json();
      setProgress(j?.data || null);
    } finally {
      setLoading(false);
    }
  };

  const save = async (p: any) => {
    if (!productId) return;
    await fetch(`${API_BASE}/v1/continues/${productId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-User-Id': '1' },
      body: JSON.stringify(p),
    });
    await load();
  };

  return { progress, loading, load, save };
}

export default function BookDetail() {
  const params = useParams();

  // id có thể là string | string[] tùy Next; normalize về number an toàn
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

  if (!id) return <div className="p-6 text-red-600">URL không hợp lệ (thiếu id).</div>;
  if (err) return <div className="p-6 text-red-600">Lỗi: {err}</div>;
  if (!data) return <div className="p-6">Đang tải…</div>;

  const preview = data.files.find((f) => !!f.is_preview);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">{data.product.title}</h1>
      <div className="text-gray-600 mb-4">{data.product.category || '—'}</div>
      <p className="mb-4 whitespace-pre-wrap">{data.product.description}</p>

      {preview ? (
        <a
          href={preview.file_url}
          target="_blank"
          rel="noreferrer"
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded"
        >
          Xem trước (PDF)
        </a>
      ) : null}

      <div className="mt-8 border-t pt-4">
        <h2 className="font-semibold mb-2">Tiến độ đọc</h2>
        <div className="text-sm text-gray-600 mb-2">
          Trang hiện tại: {progress?.current_page ?? 0}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
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
