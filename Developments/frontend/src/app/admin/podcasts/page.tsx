'use client';

import { useEffect, useMemo, useState } from 'react';
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


const formatUSD = (n: number | null | undefined) =>
new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format((n ?? 0) / 100);


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
  const [minPriceUSD, setMinPriceUSD] = useState<string>('');
  const [maxPriceUSD, setMaxPriceUSD] = useState<string>('');

  // toolbar states (declare BEFORE effects/load to avoid TDZ issues)
  const [query, setQuery] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [page, setPage] = useState(1);

  const load = async () => {
    setLoadingList(true);
    const params = new URLSearchParams({ type: 'podcast', per_page: '100' });
    const min = Number(minPriceUSD);
    const max = Number(maxPriceUSD);
    if (!Number.isNaN(min) && min > 0) params.set('min_price', String(min * 100));
    if (!Number.isNaN(max) && max > 0) params.set('max_price', String(max * 100));
    const r = await fetch(`${API}/v1/catalog/products?${params.toString()}`);
    const j = await r.json();
    setItems(j?.data?.items || []);
    setLoadingList(false);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { setPage(1); load(); }, [query, catFilter]);

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
      if (!j?.success) return alert(j?.message || 'Create failed');
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
    if (!confirm('Delete this podcast?')) return;
    const r = await fetch(`${API}/v1/catalog/products/${id}`, { method: 'DELETE' });
    const j = await r.json();
    if (!j?.success) return alert(j?.message || 'Delete failed');
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

  // New list toolbar
  // moved above
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach(i => { if (i.category) set.add(i.category); });
    return ['all', ...Array.from(set.values())];
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter(item => {
      const matchesQuery = !query || item.title.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = catFilter === 'all' || item.category === catFilter;
      return matchesQuery && matchesCategory;
    });
  }, [items, query, catFilter]);

  // moved above
  const perPage = 15;
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // New list-only UI
  const listUI = (
    <section className="space-y-4 animate-fade-in">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold">Podcasts Management</h1>
        <div className="flex flex-col md:flex-row gap-2 md:items-center w-full md:w-auto">
          <div className="relative md:w-80">
            <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search by product name..." className="w-full border rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔎</span>
          </div>
          <select value={catFilter} onChange={(e)=>setCatFilter(e.target.value)} className="border rounded-lg px-3 py-2">
            {categories.map(c => <option key={c} value={c}>{c === 'all' ? 'All' : c}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={minPriceUSD}
              onChange={(e)=>setMinPriceUSD(e.target.value)}
              placeholder="Min $"
              className="w-28 border rounded px-2 py-2"
            />
            <span>–</span>
            <input
              type="number"
              value={maxPriceUSD}
              onChange={(e)=>setMaxPriceUSD(e.target.value)}
              placeholder="Max $"
              className="w-28 border rounded px-2 py-2"
            />
            <button
              onClick={() => {
                const min = Number(minPriceUSD || '0');
                const max = Number(maxPriceUSD || '0');
                if (min && max && max < min) { alert('Max price must be ≥ Min price'); return; }
                setPage(1);
                load();
              }}
              className="px-3 py-2 border rounded-lg bg-white hover:bg-gray-50"
            >Apply</button>
          </div>
          <Link href="/admin/podcasts/create" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:brightness-110 text-center">Add New Podcast</Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border text-left">#</th>
              <th className="p-2 border text-left">Title</th>
              <th className="p-2 border text-left">Category</th>
              <th className="p-2 border text-left">Price</th>
              <th className="p-2 border text-left">Active</th>
              <th className="p-2 border text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {filtered.slice((page-1)*perPage, page*perPage).map((it, idx) => (
              <tr
                key={it.id}
                className={`cursor-pointer ${selectedId===it.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                onClick={() => setSelectedId(prev => prev===it.id ? null : it.id)}
              >
                <td className="p-2 border">{(page-1)*perPage + idx + 1}</td>
                <td className="p-2 border">{it.title}</td>
                <td className="p-2 border">{it.category || '-'}</td>
                <td className="p-2 border">{it.price_cents ? new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format((it.price_cents||0)/100) : 'Free'}</td>
                <td className="p-2 border">{(it.is_active ?? 1) ? '✅' : '❌'}</td>
                <td className="p-2 border">
                  {selectedId===it.id ? (
                    <div className="flex gap-2">
                      <Link className="px-3 py-1 border rounded" href={`/podcast/${it.id}`} target="_blank" onClick={(e)=>e.stopPropagation()}>View</Link>
                      <Link className="px-3 py-1 bg-yellow-500 text-white rounded" href={`/admin/podcasts/${it.id}/edit`} onClick={(e)=>e.stopPropagation()}>Edit</Link>
                      <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={(e)=>{ e.stopPropagation(); remove(it.id); }}>Delete</button>
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-500">Click row to select</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between items-center p-3">
        <button className="px-3 py-1 border rounded disabled:opacity-50" disabled={page===1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Prev</button>
        <span className="text-sm text-zinc-600">Page {page}</span>
        <button className="px-3 py-1 border rounded disabled:opacity-50" disabled={filtered.length <= page*perPage} onClick={()=>setPage(p=>p+1)}>Next</button>
      </div>
    </section>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Admin · Podcast Management (YouTube audio)</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Form */}
        <div className="border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold">{editingId ? `Edit podcast #${editingId}` : 'Create podcast'}</div>
            <button className="text-sm px-3 py-1 border rounded" onClick={resetForm}>New</button>
          </div>

          <label className="block text-sm mt-2">Tiêu đề</label>
          <input value={title} onChange={e=>setTitle(e.target.value)} className="w-full border rounded px-3 py-2" />

          <label className="block text-sm mt-3">Mô tả</label>
          <textarea value={desc} onChange={e=>setDesc(e.target.value)} className="w-full border rounded px-3 py-2 h-28" />

          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block text-sm">Price (cents)</label>
              <input type="number" value={price} onChange={e=>setPrice(Number(e.target.value))} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm">Category</label>
              <input value={cat} onChange={e=>setCat(e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>
          </div>

          <label className="block text-sm mt-3">Cover URL</label>
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

            {ytMeta ? (
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
            ) : null}
          </div>

          <div className="mt-4 flex gap-2">
            <button onClick={save} className="px-4 py-2 bg-green-600 text-white rounded">Lưu</button>
            {editingId && <button onClick={()=>remove(editingId!)} className="px-4 py-2 bg-red-600 text-white rounded">Xoá</button>}
          </div>
        </div>

        {/* List */}
        <div className="border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold">List</div>
            <Link href="/podcasts" className="text-sm text-blue-600 hover:underline">Open public page →</Link>
          </div>
          {loadingList ? (
            <div>Loading…</div>
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
                          {it.category || '—'} · {it.price_cents ? formatUSD(it.price_cents) : 'Miễn phí'}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button className="px-3 py-1 text-sm border rounded" onClick={()=>pickEdit(it)}>Edit</button>
                      <button className="px-3 py-1 text-sm border rounded" onClick={()=>remove(it.id)}>Delete</button>
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
