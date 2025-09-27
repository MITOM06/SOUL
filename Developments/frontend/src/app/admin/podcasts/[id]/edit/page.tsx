"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type ProductType = 'podcast';

interface Payload {
  type: ProductType;
  title: string;
  description?: string;
  price_cents: number;
  category?: string | null;
  thumbnail_url?: string | null;
  is_active?: boolean;
}

const API = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '');

export default function EditPodcastPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params?.id);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [cat, setCat] = useState('');
  const [slug, setSlug] = useState('');
  const [thumb, setThumb] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API}/v1/catalog/products/${id}`, { credentials: 'include' });
        const j = await r.json();
        const p = j?.data?.product;
        setTitle(p?.title || '');
        setDesc(p?.description || '');
        setPrice(p?.price_cents || 0);
        setCat(p?.category || '');
        setSlug(p?.slug || '');
        setThumb(p?.thumbnail_url || '');
        setActive(Boolean(p?.is_active ?? 1));
      } catch {}
      setLoading(false);
    })();
  }, [id]);

  const save = async () => {
    const payload: Payload = {
      type: 'podcast', title, description: desc, price_cents: Number(price || 0),
      category: cat || null, thumbnail_url: thumb || null, is_active: !!active,
    };
    const body: any = { ...payload };
    if (slug.trim()) body.slug = slug.trim();
    const r = await fetch(`${API}/v1/catalog/products/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body)
    });
    const j = await r.json();
    if (!j?.success) return alert(j?.message || 'Update failed');
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
    router.push('/admin/podcasts');
  };

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <section className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Podcast</h1>
      </div>

      <div className="grid md:grid-cols-1 gap-6">
        <div className="border rounded-xl p-4">
          <label className="block text-sm mt-2">Title</label>
          <input value={title} onChange={e=>setTitle(e.target.value)} className="w-full border rounded px-3 py-2" />

          <label className="block text-sm mt-3">Description</label>
          <textarea value={desc} onChange={e=>setDesc(e.target.value)} className="w-full border rounded px-3 py-2 h-28" />

          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block text-sm">Price (cents, USD)</label>
              <input type="number" value={price} onChange={e=>setPrice(Number(e.target.value))} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm">Category</label>
              <input value={cat} onChange={e=>setCat(e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block text-sm">Slug</label>
              <input value={slug} onChange={e=>setSlug(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="optional" />
            </div>
          </div>
          <label className="block text-sm mt-3">Cover image</label>
          <input type="file" accept="image/*" onChange={(e)=>{
            const f = e.target.files?.[0] || null;
            setCoverFile(f);
            if (f) setCoverPreview(URL.createObjectURL(f)); else setCoverPreview(null);
          }} className="w-full border rounded px-3 py-2" />
          {(coverPreview || thumb) && (
            <div className="mt-2">
              <img src={coverPreview || thumb} alt="cover" className="w-40 h-40 object-cover rounded border" />
            </div>
          )}

          <label className="inline-flex items-center gap-2 mt-3">
            <input type="checkbox" checked={active} onChange={e=>setActive(e.target.checked)} />
            Active
          </label>

          <div className="mt-4 flex gap-2">
            <button onClick={save} className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
            <button onClick={() => history.back()} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
          </div>
        </div>

        {/* removed right panel */}
      </div>
    </section>
  );
}
