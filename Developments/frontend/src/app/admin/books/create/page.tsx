"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ProductType = "ebook";

interface ProductInput {
  type: ProductType;
  title: string;
  description?: string;
  // keep cents internally computed from priceStr
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
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [priceStr, setPriceStr] = useState<string>("0.00");
  const [categories, setCategories] = useState<string[]>([]);
  const [categorySelect, setCategorySelect] = useState<string>("");
  const [categoryOther, setCategoryOther] = useState<string>("");

  // Load existing ebook categories from catalog (public endpoint)
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API}/v1/catalog/products?type=ebook&per_page=200`);
        const j = await r.json();
        const items = j?.data?.items || [];
        const set = new Set<string>();
        for (const it of items) {
          const c = String(it?.category || '').trim();
          if (c) set.add(c);
        }
        setCategories(Array.from(set).sort());
      } catch {}
    })();
  }, []);

  const addUrlRow = () => setForm({ ...form, files: [...(form.files || []), { file_type: 'pdf', file_url: '', is_preview: false }] });

  const handlePickLocal = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const files = ev.target.files;
    if (!files?.length) return;
    const toAdd: { file: File; is_preview: boolean }[] = [];
    for (let i = 0; i < files.length; i++) toAdd.push({ file: files[i], is_preview: false });
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
      // required checks
      if (!form.title.trim()) { alert('Please enter title'); return; }
      if (!form.description?.trim()) { alert('Please enter description'); return; }
      // validate price (allow commas, require non-negative, max $10,000.00)
     const priceNum = Number.parseFloat((priceStr || '0').replace(/,/g, ''));
     if (isNaN(priceNum) || priceNum < 0) { alert('Please enter a valid price (e.g., 00.00)'); return; }
     if (priceNum > 10000) { alert('Price must not exceed $10,000.00'); return; }

      if (!(categorySelect && categorySelect !== '__other__') && !categoryOther.trim()) { alert('Please select a category or enter Other'); return; }
      if (!coverFile) { alert('Please upload a cover image'); return; }
      // sanitize price: non-negative, cents
      const dollars = Math.max(0, Number.parseFloat((priceStr || '0').replace(/,/g, '')) || 0);
      const price_cents = Math.round(dollars * 100);
      // resolve category: selected or other
      const category = categorySelect === '__other__' ? (categoryOther.trim() || undefined) : (categorySelect || undefined);
      const r = await fetch(`${API}/v1/catalog/products`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({
          type: form.type,
          title: form.title,
          description: form.description,
          price_cents,
          thumbnail_url: form.thumbnail_url,
          category,
          slug: form.slug,
          files: form.files,
        })
      });
      const j = await r.json();
      if (!j?.success) { alert(j?.message || 'Create failed'); return; }
      const id = Number(j?.data?.id);

      // upload thumbnail if selected
      if (coverFile) {
        const fd = new FormData();
        fd.append('image', coverFile);
        const upThumb = await fetch(`${API}/v1/catalog/products/${id}/thumbnail`, { method: 'POST', body: fd, credentials: 'include' });
        if (!upThumb.ok) {
          const t = await upThumb.text();
          alert('Product created but thumbnail upload failed: ' + t + '\nYou can add the thumbnail later by editing the product.');
        }
      }
      const up = await uploadLocalFiles(id);
      if (!up.ok) return;
      alert('🎉 Book created successfully.');
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

      <div className="grid md:grid-cols-1 gap-6">
        <div className="border rounded-xl p-4 space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600">Type <span className="text-red-500">*</span></label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as ProductType })} className="w-full border rounded px-3 py-2">
                <option value="ebook">Ebook</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600">Price (USD) <span className="text-red-500">*</span></label>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="00.00"
                value={priceStr}
                onChange={e => setPriceStr(e.target.value)}
                required
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600">Title <span className="text-red-500">*</span></label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Description <span className="text-red-500">*</span></label>
            <textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} required className="w-full border rounded px-3 py-2 h-28" />
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600">Category <span className="text-red-500">*</span></label>
              <select
                value={categorySelect}
                onChange={e => setCategorySelect(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required={categorySelect !== '__other__'}
              >
                <option value="">Select a category</option>
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
                <option value="__other__">Other…</option>
              </select>
              {categorySelect === '__other__' && (
                <input
                  className="mt-2 w-full border rounded px-3 py-2"
                  placeholder="Enter new category"
                  value={categoryOther}
                  onChange={e => setCategoryOther(e.target.value)}
                  required
                />
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-600">Slug</label>
              <input value={form.slug || ''} onChange={e => setForm({ ...form, slug: e.target.value })} className="w-full border rounded px-3 py-2" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600">Cover image <span className="text-red-500">*</span></label>
            <input type="file" accept="image/*,.avif,.heic,.heif,.tif,.tiff" required onChange={(e)=>{
              const f = e.target.files?.[0] || null;
              setCoverFile(f);
              if (f) {
                const url = URL.createObjectURL(f);
                setCoverPreview(url);
              } else {
                setCoverPreview(null);
              }
            }} className="w-full border rounded px-3 py-2" />
            {coverPreview && (
              <div className="mt-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coverPreview} alt="preview" className="w-40 h-40 object-cover rounded border" />
              </div>
            )}
          </div>

          <div className="border rounded p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium">External file URLs <span className="text-xs text-zinc-500 font-normal">(optional)</span></div>
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
            <div className="font-medium mb-2">Upload local files (documents: PDF, TXT, DOC, DOCX) <span className="text-xs text-zinc-500 font-normal">(optional)</span></div>
            <input type="file" accept=".pdf,.txt,.doc,.docx" multiple onChange={handlePickLocal} />
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

        {/* removed right-side tip panel */}
      </div>
    </section>
  );
}
