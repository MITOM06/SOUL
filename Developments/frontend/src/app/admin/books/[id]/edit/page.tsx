"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type ProductType = "ebook";

interface ProductInput {
  type: ProductType;
  title: string;
  description?: string;
  price_cents: number;
  thumbnail_url?: string;
  category?: string;
  slug?: string;
}

const API = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/$/, "");

export default function EditBookPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params?.id);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProductInput>({ type: 'ebook', title: '', price_cents: 0 });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API}/v1/catalog/products/${id}`, { credentials: 'include' });
        const j = await r.json();
        const p = j?.data?.product;
        setForm({
          type: (p?.type || 'ebook') as ProductType,
          title: p?.title || '',
          description: p?.description || '',
          price_cents: p?.price_cents || 0,
          thumbnail_url: p?.thumbnail_url || '',
          category: p?.category || '',
          slug: p?.slug || '',
        });
      } catch {}
      setLoading(false);
    })();
  }, [id]);

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch(`${API}/v1/catalog/products/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(form)
      });
      const j = await r.json();
      if (!j?.success) { alert(j?.message || 'Update failed'); return; }
      if (coverFile) {
        const fd = new FormData();
        fd.append('image', coverFile);
        const upThumb = await fetch(`${API}/v1/catalog/products/${id}/thumbnail`, { method: 'POST', body: fd, credentials: 'include' });
        if (!upThumb.ok) {
          const t = await upThumb.text();
          alert('Upload thumbnail failed: ' + t);
          return;
        }
      }
      alert('Saved');
      router.push('/admin/books');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <section className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Book</h1>
      </div>

      <div className="grid md:grid-cols-1 gap-6">
        <div className="border rounded-xl p-4 space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600">Type</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as ProductType })} className="w-full border rounded px-3 py-2">
                <option value="ebook">Ebook</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600">Price (cents, USD)</label>
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
            <label className="block text-sm text-gray-600">Cover image</label>
            <input type="file" accept="image/*" onChange={(e)=>{
              const f = e.target.files?.[0] || null;
              setCoverFile(f);
              if (f) {
                const url = URL.createObjectURL(f);
                setCoverPreview(url);
              } else {
                setCoverPreview(null);
              }
            }} className="w-full border rounded px-3 py-2" />
            {(coverPreview || form.thumbnail_url) && (
              <div className="mt-2">
                <img src={coverPreview || form.thumbnail_url || ''} alt="cover" className="w-40 h-40 object-cover rounded border" />
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60">{saving ? 'Saving…' : 'Save'}</button>
            <button onClick={() => history.back()} className="px-4 py-2 rounded bg-gray-200">Cancel</button>
          </div>
        </div>

        {/* removed right panel */}
      </div>
    </section>
  );
}
