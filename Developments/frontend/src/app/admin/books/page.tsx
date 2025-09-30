'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type ProductType = 'ebook';

interface ProductInput {
  type: ProductType;
  title: string;
  description?: string;
  price_cents: number;
  thumbnail_url?: string;
  category?: string;
  slug?: string;
  files?: { file_type: string; file_url: string; is_preview?: boolean }[]; // URL ngoài
}

interface ProductListItem {
  id: number;
  type: ProductType;
  title: string;
  description?: string | null;
  price_cents: number;
  thumbnail_url?: string | null;
  category?: string | null;
  slug?: string | null;
  is_active?: number;
}

const API = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '');

export default function AdminProductsV2() {
  const [items, setItems] = useState<ProductListItem[]>([]);
  const [form, setForm] = useState<ProductInput>({ type: 'ebook', title: '', price_cents: 0, files: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Chế độ sửa
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<number | null>(null);

  // Hàng chờ upload local (PDF/ảnh từ PC)
  const [localQueue, setLocalQueue] = useState<{ file: File; is_preview: boolean }[]>([]);
  const [uploadingLocal, setUploadingLocal] = useState(false);

  const [minPriceUSD, setMinPriceUSD] = useState<string>('');
  const [maxPriceUSD, setMaxPriceUSD] = useState<string>('');

  // Toolbar + paging states (declare early to avoid TDZ with effects)
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 15;
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams({ type: 'ebook', per_page: '100' });
    if (query.trim()) params.set('search', query.trim());
    if (cat !== 'all') params.set('category', cat);
    const min = Number(minPriceUSD);
    const max = Number(maxPriceUSD);
    if (!Number.isNaN(min) && min > 0) params.set('min_price', String(min * 100));
    if (!Number.isNaN(max) && max > 0) params.set('max_price', String(max * 100));
    const r = await fetch(`${API}/v1/catalog/products?${params.toString()}`, { credentials: 'include' });
    const j = await r.json();
    setItems(j?.data?.items || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { setPage(1); load(); }, [query, cat]);

  const resetForm = () => {
    setForm({ type: 'ebook', title: '', price_cents: 0, files: [] });
    setLocalQueue([]);
    setMode('create');
    setEditingId(null);
  };

  // ---- helpers ----
  const formatUSD = (n: number | null | undefined) => {
    const v = Number(n ?? 0);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(v / 100);
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach(i => { if (i.category) set.add(i.category); });
    return ['all', ...Array.from(set.values())];
  }, [items]);
  const filtered = useMemo(() => items, [items]);

  const uploadLocalFiles = async (productId: number, queue: { file: File; is_preview: boolean }[]) => {
    if (!queue.length) return { ok: true };
    setUploadingLocal(true);
    try {
      const fd = new FormData();
      if (queue.length === 1) {
        fd.append('file', queue[0].file);
        fd.append('is_preview', queue[0].is_preview ? '1' : '0');
      } else {
        queue.forEach((q, i) => {
          fd.append('files[]', q.file);
          fd.append('previews[]', q.is_preview ? '1' : '0');
        });
      }
      const res = await fetch(`${API}/v1/catalog/products/${productId}/files`, {
        method: 'POST',
        body: fd,
        credentials: 'include',
      });
      if (!res.ok) {
        const t = await res.text();
        alert('Upload failed: ' + t);
        return { ok: false };
      }
      return { ok: true };
    } finally {
      setUploadingLocal(false);
    }
  };

  // ---- tạo mới ----
  const create = async () => {
    setSaving(true);
    try {
      // 1) tạo product + (tuỳ chọn) files URL ngoài
      const r = await fetch(`${API}/v1/catalog/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      const j = await r.json();
      if (!j?.success) {
        alert(j?.message || 'Lỗi tạo sản phẩm');
        return;
      }
      const newId = Number(j?.data?.id);

      // 2) nếu có local files → upload qua multipart
      if (localQueue.length) {
        const up = await uploadLocalFiles(newId, localQueue);
        if (!up.ok) return;
      }

      alert('Đã tạo sản phẩm');
      resetForm();
      await load();
    } finally {
      setSaving(false);
    }
  };

  // ---- sửa ----
  const startEdit = async (id: number) => {
    const r = await fetch(`${API}/v1/catalog/products/${id}`, { credentials: 'include' });
    const j = await r.json();
    if (!j?.success) { alert('Không tải được sản phẩm'); return; }
    const p = j.data.product as ProductListItem;

    setForm({
      type: (p.type as ProductType) || 'ebook',
      title: p.title || '',
      description: p.description || '',
      price_cents: p.price_cents || 0,
      thumbnail_url: p.thumbnail_url || '',
      category: p.category || '',
      slug: p.slug || '',
      // CHÚ Ý: files (URL ngoài) chỉ dùng khi tạo; cập nhật file bằng URL cần endpoint riêng ở backend.
      files: [],
    });
    setLocalQueue([]);
    setMode('edit');
    setEditingId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const update = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      // 1) cập nhật thông tin cơ bản
      const body: Partial<ProductInput> = {
        type: form.type,
        title: form.title,
        description: form.description,
        price_cents: form.price_cents,
        thumbnail_url: form.thumbnail_url,
        category: form.category,
        slug: form.slug,
      };
      const r = await fetch(`${API}/v1/catalog/products/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const j = await r.json();
      if (!j?.success) {
        alert(j?.message || 'Update failed');
        return;
      }

      // 2) có hàng chờ local → upload bổ sung
      if (localQueue.length) {
        const up = await uploadLocalFiles(editingId, localQueue);
        if (!up.ok) return;
      }

      alert('Saved changes');
      resetForm();
      await load();
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: number) => {
    if (!confirm('Delete this product?')) return;
    const r = await fetch(`${API}/v1/catalog/products/${id}`, { method: 'DELETE', credentials: 'include' });
    const j = await r.json();
    if (j?.success) {
      if (editingId === id) resetForm();
      await load();
    } else {
      alert(j?.message || 'Delete failed');
    }
  };

  // ---- UI helpers ----
  const handlePickLocal = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const files = ev.target.files;
    if (!files?.length) return;
    const toAdd: { file: File; is_preview: boolean }[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      toAdd.push({ file: f, is_preview: localQueue.length === 0 }); // mặc định file đầu là preview
    }
    setLocalQueue(prev => [...prev, ...toAdd]);
    ev.currentTarget.value = '';
  };

  const removeLocalItem = (idx: number) =>
    setLocalQueue(prev => prev.filter((_, i) => i !== idx));

  // Thêm 1 hàng file URL vào form.files (áp dụng khi tạo mới)
  const addUrlRow = () =>
    setForm({ ...form, files: [...(form.files || []), { file_type: 'pdf', file_url: '', is_preview: false }] });

  // New edge-to-edge list UI with search + category + actions
  // Keep legacy UI below for reference but not rendered.
  const listUI = (
    <section className="space-y-4 animate-fade-in">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold">Books Management</h1>
        <div className="flex flex-col md:flex-row gap-2 md:items-center w-full md:w-auto">
          <div className="relative md:w-80">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by product name..."
              className="w-full border rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔎</span>
          </div>
          <select
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
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
          <Link href="/admin/books/create" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:brightness-110 text-center">
            Add New Book
          </Link>
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
            {loading && (
              <tr><td className="p-3 text-center" colSpan={6}>Loading...</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td className="p-3 text-center" colSpan={6}>No items</td></tr>
            )}
            {filtered.slice((page-1)*perPage, page*perPage).map((it, idx) => (
              <tr
                key={it.id}
                className={`cursor-pointer ${selectedId===it.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                onClick={() => setSelectedId(prev => prev===it.id ? null : it.id)}
              >
                <td className="p-2 border">{(page-1)*perPage + idx + 1}</td>
                <td className="p-2 border">{it.title}</td>
                <td className="p-2 border">{it.category || '-'}</td>
                <td className="p-2 border">{new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format((it.price_cents||0)/100)}</td>
                <td className="p-2 border">{(it.is_active ?? 1) ? '✅' : '❌'}</td>
                <td className="p-2 border">
                  {selectedId===it.id ? (
                    <div className="flex gap-2">
                      <Link href={`/book/${it.id}`} className="px-3 py-1 border rounded" onClick={(e)=>e.stopPropagation()}>View</Link>
                      <Link href={`/admin/books/${it.id}/edit`} className="px-3 py-1 bg-yellow-500 text-white rounded" onClick={(e)=>e.stopPropagation()}>Edit</Link>
                      <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={(e)=>{ e.stopPropagation(); del(it.id); }}>Delete</button>
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

  return listUI;

  // Legacy UI (hidden)
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Admin · Book Management</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LEFT: Form */}
        <div className="border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold mb-3">
              {mode === 'create' ? 'Tạo sách' : `Sửa sách #${editingId}`}
            </h2>
            {mode === 'edit' && (
              <button onClick={resetForm} className="px-2 py-1 rounded bg-gray-200" title="Hủy chỉnh sửa">
                Hủy
              </button>
            )}
          </div>

          <div className="space-y-3">
            <label className="block text-sm">Loại
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as ProductType })}
                      className="w-full border rounded px-2 py-1">
                <option value="ebook">Ebook</option>
              </select>
            </label>

            <label className="block text-sm">Tiêu đề
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                     className="w-full border rounded px-2 py-1" />
            </label>

            <label className="block text-sm">Mô tả
              <textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })}
                        className="w-full border rounded px-2 py-1" />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">Giá (đồng)
                <input type="number" value={form.price_cents}
                       onChange={e => setForm({ ...form, price_cents: Number(e.target.value) })}
                       className="w-full border rounded px-2 py-1" />
              </label>
              <label className="block text-sm">Thể loại
                <input value={form.category || ''} onChange={e => setForm({ ...form, category: e.target.value })}
                       className="w-full border rounded px-2 py-1" />
              </label>
            </div>

            <label className="block text-sm">Ảnh bìa URL
              <input value={form.thumbnail_url || ''} onChange={e => setForm({ ...form, thumbnail_url: e.target.value })}
                     placeholder="http(s)://... hoặc /storage/..."
                     className="w-full border rounded px-2 py-1" />
            </label>

            {/* URL ngoài – chỉ dùng khi tạo mới (backend xử lý trong store) */}
            <div className="border rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">File bằng URL (CDN/đường dẫn ngoài)</div>
                <button className="px-2 py-1 border rounded" onClick={addUrlRow}>+ Thêm URL</button>
              </div>
              {(form.files || []).length === 0 && (
                <div className="text-sm text-gray-500">Chưa có URL nào. Bạn có thể bỏ qua mục này.</div>
              )}
              {(form.files || []).map((f, idx) => (
                <div key={idx} className="grid grid-cols-8 gap-2 mb-2 items-center">
                  <select
                    value={f.file_type}
                    onChange={e => {
                      const files = [...(form.files || [])];
                      files[idx] = { ...files[idx], file_type: e.target.value };
                      setForm({ ...form, files });
                    }}
                    className="col-span-2 border rounded px-2 py-1"
                  >
                    <option value="pdf">pdf</option>
                    <option value="image">image</option>
                    <option value="txt">txt</option>
                    <option value="doc">doc</option>
                    <option value="docx">docx</option>
                  </select>

                  <input
                    placeholder="https://... hoặc /storage/..."
                    value={f.file_url}
                    onChange={e => {
                      const files = [...(form.files || [])];
                      files[idx] = { ...files[idx], file_url: e.target.value };
                      setForm({ ...form, files });
                    }}
                    className="col-span-5 border rounded px-2 py-1"
                  />

                  <label className="text-sm flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={!!f.is_preview}
                      onChange={e => {
                        const files = [...(form.files || [])];
                        files[idx] = { ...files[idx], is_preview: e.target.checked };
                        setForm({ ...form, files });
                      }}
                    />
                    Preview
                  </label>
                </div>
              ))}
              <div className="text-xs text-gray-500">
                * URL ngoài chỉ được gửi khi <b>Tạo mới</b>. Muốn thêm URL cho sách đã có, nên bổ sung qua trang
                quản trị backend hoặc tạo endpoint riêng (ví dụ <code>POST /v1/catalog/products/:id/files-url</code>).
              </div>
            </div>

            {/* Upload từ máy – dùng cho cả tạo mới & sửa (sau khi có ID) */}
            <div className="border rounded p-3">
              <div className="font-medium mb-2">Upload từ máy (PDF/Tài liệu/Ảnh)</div>
              <input type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp" multiple onChange={handlePickLocal} />
              {localQueue.length > 0 && (
                <div className="mt-2 space-y-2">
                  {localQueue.map((q, i) => (
                    <div key={i} className="flex items-center justify-between border rounded px-2 py-1">
                      <div className="truncate text-sm">{q.file.name}</div>
                      <div className="flex items-center gap-3">
                        <label className="text-sm flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={q.is_preview}
                            onChange={(e) => {
                              const arr = [...localQueue];
                              arr[i] = { ...arr[i], is_preview: e.target.checked };
                              setLocalQueue(arr);
                            }}
                          />
                          Preview
                        </label>
                        <button className="text-sm px-2 py-1 border rounded" onClick={() => removeLocalItem(i)}>
                          Xoá
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="text-xs text-gray-500 mt-2">
                * Các file chọn ở đây sẽ được tải lên thư mục <code>storage/app/public/products/&lt;id&gt;</code>.
                Hãy đảm bảo bạn đã chạy <code>php artisan storage:link</code>.
              </div>
            </div>

            <div className="flex items-center gap-2">
              {mode === 'create' ? (
                <button
                  onClick={create}
                  disabled={saving || uploadingLocal}
                  className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
                >
                  {saving || uploadingLocal ? 'Đang tạo…' : 'Tạo'}
                </button>
              ) : (
                <button
                  onClick={update}
                  disabled={saving || uploadingLocal || !editingId}
                  className="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-60"
                >
                  {saving || uploadingLocal ? 'Đang lưu…' : 'Lưu'}
                </button>
              )}
              {mode === 'edit' && (
                <button onClick={resetForm} className="px-4 py-2 rounded bg-gray-200">Hủy</button>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: List */}
        <div className="border rounded-xl p-4">
          <h2 className="font-semibold mb-3">Danh sách</h2>
          {loading ? <div>Đang tải…</div> : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map(p => (
                <div key={p.id} className="border rounded p-3">
                  <div className="font-medium">{p.title}</div>
                  <div className="text-sm text-gray-500">{p.type} · {p.category || '—'}</div>
                  <div className="text-sm">{p.price_cents ? new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format((p.price_cents||0)/100) : 'Free'}</div>
                  <div className="mt-2 flex gap-2">
                    <a href={`/book/${p.id}`} className="px-2 py-1 rounded bg-gray-100">Xem</a>
                    <button onClick={() => startEdit(p.id)} className="px-2 py-1 rounded bg-yellow-500 text-white">Sửa</button>
                    <button onClick={() => del(p.id)} className="px-2 py-1 rounded bg-red-600 text-white">Xoá</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
