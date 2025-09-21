"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ProductType = "ebook";

interface ProductInput {
  type: ProductType;
  title: string;
  description?: string;
  price_cents: number;
  thumbnail_url?: string;
  category?: string;
  slug?: string;
  files?: { file_type: string; file_url: string; is_preview?: boolean }[];
}

const API = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/$/, "");

export default function CreateBookPage() {
  const router = useRouter();
  const [form, setForm] = useState<ProductInput>({ type: "ebook", title: "", price_cents: 0, files: [] });
  const [saving, setSaving] = useState(false);
  const [localQueue, setLocalQueue] = useState<{ file: File; is_preview: boolean }[]>([]);
  const [uploadingLocal, setUploadingLocal] = useState(false);

  const addUrlRow = () => setForm({ ...form, files: [...(form.files || []), { file_type: 'pdf', file_url: '', is_preview: false }] });

  const handlePickLocal = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const files = ev.target.files;
    if (!files?.length) return;
    const toAdd: { file: File; is_preview: boolean }[] = [];
    for (let i = 0; i < files.length; i++) toAdd.push({ file: files[i], is_preview: i === 0 });
    setLocalQueue(prev => [...prev, ...toAdd]);
    ev.currentTarget.value = '';
  };
  const removeLocalItem = (idx: number) => setLocalQueue(prev => prev.filter((_, i) => i !== idx));

  const uploadLocalFiles = async (productId: number) => {
    if (!localQueue.length) return { ok: true } as const;
    setUploadingLocal(true);
    try {
      const fd = new FormData();
      localQueue.forEach((q) => { fd.append('files[]', q.file); fd.append('previews[]', q.is_preview ? '1' : '0'); });
      const res = await fetch(`${API}/v1/catalog/products/${productId}/files`, { method: 'POST', body: fd, credentials: 'include' });
      if (!res.ok) return { ok: false } as const;
      return { ok: true } as const;
    } finally {
      setUploadingLocal(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch(`${API}/v1/catalog/products`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(form)
      });
      const j = await r.json();
      if (!j?.success) { alert(j?.message || 'Create failed'); return; }
      const id = Number(j?.data?.id);
      const up = await uploadLocalFiles(id);
      if (!up.ok) return;
      alert('Created');
      router.push('/admin/books');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Create Book</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="border rounded-xl p-4 space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600">Type</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as ProductType })} className="w-full border rounded px-3 py-2">
                <option value="ebook">Ebook</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600">Price (vnd)</label>
              <input type="number" value={form.price_cents} onChange={e => setForm({ ...form, price_cents: Number(e.target.value) })} className="w-full border rounded px-3 py-2" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600">Title</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Description</label>
            <textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full border rounded px-3 py-2 h-28" />
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600">Category</label>
              <input value={form.category || ''} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Slug</label>
              <input value={form.slug || ''} onChange={e => setForm({ ...form, slug: e.target.value })} className="w-full border rounded px-3 py-2" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600">Thumbnail URL</label>
            <input value={form.thumbnail_url || ''} onChange={e => setForm({ ...form, thumbnail_url: e.target.value })} placeholder="http(s)://... or /storage/..." className="w-full border rounded px-3 py-2" />
          </div>

          <div className="border rounded p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium">External file URLs</div>
              <button className="px-2 py-1 border rounded" onClick={addUrlRow}>+ Add URL</button>
            </div>
            {(form.files || []).length === 0 && <div className="text-sm text-gray-500">No external URLs. You can skip this.</div>}
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
                  placeholder="https://... or /storage/..."
                  value={f.file_url}
                  onChange={(e) => {
                    const files = [...(form.files || [])];
                    files[idx] = { ...files[idx], file_url: e.target.value };
                    setForm({ ...form, files });
                  }}
                  className="col-span-5 border rounded px-2 py-1"
                />
                <label className="col-span-1 text-sm flex items-center gap-1">
                  <input type="checkbox" checked={!!f.is_preview} onChange={(e) => {
                    const files = [...(form.files || [])];
                    files[idx] = { ...files[idx], is_preview: e.target.checked };
                    setForm({ ...form, files });
                  }} />
                  Preview
                </label>
              </div>
            ))}
          </div>

          <div className="border rounded p-3">
            <div className="font-medium mb-2">Upload local files (PDF/images)</div>
            <input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" multiple onChange={handlePickLocal} />
            {localQueue.length > 0 && (
              <div className="mt-2 space-y-2">
                {localQueue.map((q, i) => (
                  <div key={i} className="flex items-center justify-between border rounded px-2 py-1">
                    <div className="truncate text-sm">{q.file.name}</div>
                    <div className="flex items-center gap-3">
                      <label className="text-sm flex items-center gap-1">
                        <input type="checkbox" checked={q.is_preview} onChange={(e) => {
                          const arr = [...localQueue];
                          arr[i] = { ...arr[i], is_preview: e.target.checked };
                          setLocalQueue(arr);
                        }} />
                        Preview
                      </label>
                      <button className="text-sm px-2 py-1 border rounded" onClick={() => removeLocalItem(i)}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={save} disabled={saving || uploadingLocal} className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60">
              {saving || uploadingLocal ? 'Saving…' : 'Create'}
            </button>
            <button onClick={() => history.back()} className="px-4 py-2 rounded bg-gray-200">Cancel</button>
          </div>
        </div>

        <div className="hidden md:block p-4 rounded-xl border text-sm text-gray-600">
          <p>Tips:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Use external URLs for files hosted on CDN, or upload local files after creating.</li>
            <li>Ensure you have run <code>php artisan storage:link</code> on the backend.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

