'use client';

import { useEffect, useState } from 'react';

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

  const load = async () => {
    setLoading(true);
    const r = await fetch(`${API}/v1/catalog/products?type=ebook&per_page=100`, { credentials: 'include' });
    const j = await r.json();
    setItems(j?.data?.items || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm({ type: 'ebook', title: '', price_cents: 0, files: [] });
    setLocalQueue([]);
    setMode('create');
    setEditingId(null);
  };

  // ---- helpers ----
  const formatVND = (n: number | null | undefined, withSymbol = true) => {
    const v = Number(n ?? 0);
    const s = v.toLocaleString('vi-VN', { maximumFractionDigits: 0 });
    return withSymbol ? `${s} đ` : s;
  };

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
        alert('Upload thất bại: ' + t);
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
        alert(j?.message || 'Lỗi cập nhật sản phẩm');
        return;
      }

      // 2) có hàng chờ local → upload bổ sung
      if (localQueue.length) {
        const up = await uploadLocalFiles(editingId, localQueue);
        if (!up.ok) return;
      }

      alert('Đã lưu thay đổi');
      resetForm();
      await load();
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: number) => {
    if (!confirm('Xoá sản phẩm này?')) return;
    const r = await fetch(`${API}/v1/catalog/products/${id}`, { method: 'DELETE', credentials: 'include' });
    const j = await r.json();
    if (j?.success) {
      if (editingId === id) resetForm();
      await load();
    } else {
      alert(j?.message || 'Không xoá được');
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
              <div className="font-medium mb-2">Upload từ máy (PDF/ảnh)</div>
              <input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" multiple onChange={handlePickLocal} />
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
                  <div className="text-sm">{p.price_cents ? formatVND(p.price_cents, true) : 'Miễn phí'}</div>
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
