'use client';

import { useEffect, useState } from 'react';
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
  is_active?: number | boolean;
}
interface YoutubeMeta {
  video_id: string;
  title: string;
  thumbnail_url: string;
  watch_url: string;
  embed_url: string;
}

const API = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '');
const ORIGIN = API.replace(/\/api$/, '');

const formatVND = (n: number | null | undefined) =>
  Number(n ?? 0).toLocaleString('vi-VN', { maximumFractionDigits: 0 }) + ' đ';

/** Ảnh dự phòng an toàn cho <img src> */
const FALLBACK_IMG = (() => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128'>
    <rect width='100%' height='100%' rx='8' fill='#f3f4f6'/>
    <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
      font-family='sans-serif' font-size='12' fill='#9ca3af'>Podcast</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
})();

/** Chuẩn hoá URL ảnh:
 *  - chặn file:// và đường dẫn C:\...
 *  - nối ORIGIN cho đường dẫn bắt đầu bằng /
 *  - giữ nguyên http(s)://
 *  - nếu không hợp lệ -> trả '' (sẽ rơi về fallback)
 */
const toAbs = (u?: string | null) => {
  if (!u) return '';
  const s = u.trim();
  if (/^file:\/\//i.test(s) || /^[A-Za-z]:\\/.test(s)) return '';
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  if (s.startsWith('/')) return `${ORIGIN}${s}`;
  return s;
};

export default function AdminPodcasts() {
  // list
  const [items, setItems] = useState<Product[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  // form
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [cat, setCat] = useState('');
  const [thumb, setThumb] = useState('');
  const [active, setActive] = useState(true);

  const [ytUrl, setYtUrl] = useState('');
  const [ytMeta, setYtMeta] = useState<YoutubeMeta | null>(null);
  const [previewVideo, setPreviewVideo] = useState(false);

  // load list
  const load = async () => {
    setLoadingList(true);
    const r = await fetch(`${API}/v1/catalog/products?type=podcast&per_page=100`);
    const j = await r.json();
    setItems(j?.data?.items || []);
    setLoadingList(false);
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setEditingId(null);
    setTitle(''); setDesc(''); setPrice(0); setCat(''); setThumb(''); setActive(true);
    setYtUrl(''); setYtMeta(null); setPreviewVideo(false);
  };

  const pickEdit = async (p: Product) => {
    setEditingId(p.id);
    setTitle(p.title);
    setDesc(p.description || '');
    setPrice(p.price_cents || 0);
    setCat(p.category || '');
    setThumb(p.thumbnail_url || '');
    setActive(Boolean(p.is_active ?? 1));
    setYtUrl(''); setYtMeta(null); setPreviewVideo(false);
  };

  const save = async () => {
    const payload = {
      type: 'podcast',
      title, description: desc, price_cents: Number(price || 0),
      category: cat || null,
      thumbnail_url: thumb || null,
      is_active: !!active,
    };

    if (!editingId) {
      const r = await fetch(`${API}/v1/catalog/products`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const j = await r.json();
      if (!j?.success) return alert(j?.message || 'Tạo thất bại');
      const newId = j?.data?.id;

      if (ytMeta) {
        await fetch(`${API}/v1/catalog/products/${newId}/youtube`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: ytUrl }),
        });
      }
      await load();
      resetForm();
      alert('Đã tạo podcast');
    } else {
      const r = await fetch(`${API}/v1/catalog/products/${editingId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const j = await r.json();
      if (!j?.success) return alert(j?.message || 'Cập nhật thất bại');

      if (ytMeta) {
        await fetch(`${API}/v1/catalog/products/${editingId}/youtube`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: ytUrl }),
        });
      }
      await load();
      alert('Đã lưu');
    }
  };

  const remove = async (id: number) => {
    if (!confirm('Xoá podcast này?')) return;
    const r = await fetch(`${API}/v1/catalog/products/${id}`, { method: 'DELETE' });
    const j = await r.json();
    if (!j?.success) return alert(j?.message || 'Xoá thất bại');
    await load();
    if (editingId === id) resetForm();
  };

  const lookupYt = async () => {
    if (!ytUrl.trim()) return;
    const r = await fetch(`${API}/v1/youtube/lookup?url=` + encodeURIComponent(ytUrl.trim()));
    const j = await r.json();
    if (!j?.success) return alert(j?.message || 'Không nhận diện được YouTube URL');
    setYtMeta(j.data);
    // auto-fill tiêu đề + bìa (có thể sửa lại)
    if (!title) setTitle(j.data.title || title);
    if (!thumb) setThumb(j.data.thumbnail_url || thumb);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Admin · Podcast Management (YouTube audio)</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Form */}
        <div className="border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold">{editingId ? `Sửa podcast #${editingId}` : 'Tạo podcast mới'}</div>
            <button className="text-sm px-3 py-1 border rounded" onClick={resetForm}>Tạo mới</button>
          </div>

          <label className="block text-sm mt-2">Tiêu đề</label>
          <input value={title} onChange={e=>setTitle(e.target.value)} className="w-full border rounded px-3 py-2" />

          <label className="block text-sm mt-3">Mô tả</label>
          <textarea value={desc} onChange={e=>setDesc(e.target.value)} className="w-full border rounded px-3 py-2 h-28" />

          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block text-sm">Giá (đồng)</label>
              <input type="number" value={price} onChange={e=>setPrice(Number(e.target.value))} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm">Thể loại</label>
              <input value={cat} onChange={e=>setCat(e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>
          </div>

          <label className="block text-sm mt-3">Ảnh bìa URL</label>
          <input value={thumb} onChange={e=>setThumb(e.target.value)} placeholder="http(s)://... hoặc /storage/..." className="w-full border rounded px-3 py-2" />

          <label className="inline-flex items-center gap-2 mt-3">
            <input type="checkbox" checked={active} onChange={e=>setActive(e.target.checked)} />
            Kích hoạt
          </label>

          <div className="mt-5 border-t pt-4">
            <div className="font-semibold mb-2">YouTube</div>
            <div className="flex gap-2">
              <input
                value={ytUrl}
                onChange={e=>setYtUrl(e.target.value)}
                placeholder="Dán URL YouTube (watch/share/shorts/embed...)"
                className="flex-1 border rounded px-3 py-2"
              />
              <button onClick={lookupYt} className="px-3 py-2 rounded bg-blue-600 text-white">Tra cứu</button>
            </div>

            {ytMeta && (
              <div className="mt-3 p-3 border rounded">
                <div className="font-medium">{ytMeta.title}</div>
                <div className="text-sm text-gray-600 break-all">{ytMeta.watch_url}</div>
                <div className="mt-2 flex items-center gap-3">
                  <img
                    src={toAbs(ytMeta.thumbnail_url) || FALLBACK_IMG}
                    alt=""
                    className="w-28 h-16 object-cover rounded"
                    onError={(e)=>{ (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG; }}
                  />
                  <button
                    className="px-3 py-2 border rounded"
                    onClick={()=>setPreviewVideo(v=>!v)}
                  >
                    {previewVideo ? 'Ẩn preview' : 'Xem/Nghe thử'}
                  </button>
                </div>
                {previewVideo && (
                  <div className="mt-3">
                    <iframe
                      className="rounded"
                      width="100%" height="300"
                      src={`${ytMeta.embed_url}?autoplay=0&rel=0&modestbranding=1`}
                      title="YouTube preview" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      * Người dùng có thể phát “chỉ nghe” bằng cách hiển thị giao diện audio riêng (ẩn video bằng CSS).
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <button onClick={save} className="px-4 py-2 bg-green-600 text-white rounded">Lưu</button>
            {editingId && <button onClick={()=>remove(editingId)} className="px-4 py-2 bg-red-600 text-white rounded">Xoá</button>}
          </div>
        </div>

        {/* List */}
        <div className="border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold">Danh sách</div>
            <Link href="/podcasts" className="text-sm text-blue-600 hover:underline">Xem trang người dùng →</Link>
          </div>
          {loadingList ? (
            <div>Đang tải…</div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {items.map(it => {
                const cover = toAbs(it.thumbnail_url) || FALLBACK_IMG;
                return (
                  <div key={it.id} className="border rounded p-3">
                    <div className="flex gap-3">
                      <img
                        src={cover}
                        alt={it.title}
                        className="w-16 h-16 object-cover rounded border"
                        onError={(e)=>{ (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG; }}
                      />
                      <div className="flex-1">
                        <div className="font-medium line-clamp-2">{it.title}</div>
                        <div className="text-xs text-gray-500">
                          {it.category || '—'} · {it.price_cents ? formatVND(it.price_cents) : 'Miễn phí'}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button className="px-3 py-1 text-sm border rounded" onClick={()=>pickEdit(it)}>Sửa</button>
                      <button className="px-3 py-1 text-sm border rounded" onClick={()=>remove(it.id)}>Xoá</button>
                      <Link className="px-3 py-1 text-sm border rounded" href={`/podcast/${it.id}`} target="_blank">Xem</Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
