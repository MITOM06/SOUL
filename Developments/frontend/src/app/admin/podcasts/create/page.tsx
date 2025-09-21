"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

export default function CreatePodcastPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [cat, setCat] = useState('');
  const [thumb, setThumb] = useState('');
  const [active, setActive] = useState(true);
  const [ytUrl, setYtUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    try {
      const payload: Payload = {
        type: 'podcast', title, description: desc, price_cents: Number(price || 0),
        category: cat || null, thumbnail_url: thumb || null, is_active: !!active,
      };
      const r = await fetch(`${API}/v1/catalog/products`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const j = await r.json();
      if (!j?.success) return alert(j?.message || 'Create failed');
      const newId = j?.data?.id;
      if (ytUrl.trim()) {
        await fetch(`${API}/v1/catalog/products/${newId}/youtube`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: ytUrl.trim() })
        });
      }
      alert('Created');
      router.push('/admin/podcasts');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Create Podcast</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="border rounded-xl p-4">
          <label className="block text-sm mt-2">Title</label>
          <input value={title} onChange={e=>setTitle(e.target.value)} className="w-full border rounded px-3 py-2" />

          <label className="block text-sm mt-3">Description</label>
          <textarea value={desc} onChange={e=>setDesc(e.target.value)} className="w-full border rounded px-3 py-2 h-28" />

          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block text-sm">Price (vnd)</label>
              <input type="number" value={price} onChange={e=>setPrice(Number(e.target.value))} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm">Category</label>
              <input value={cat} onChange={e=>setCat(e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>
          </div>

          <label className="block text-sm mt-3">Thumbnail URL</label>
          <input value={thumb} onChange={e=>setThumb(e.target.value)} placeholder="http(s)://... or /storage/..." className="w-full border rounded px-3 py-2" />

          <label className="inline-flex items-center gap-2 mt-3">
            <input type="checkbox" checked={active} onChange={e=>setActive(e.target.checked)} />
            Active
          </label>

          <div className="mt-5 border-t pt-4">
            <div className="font-semibold mb-2">YouTube</div>
            <input value={ytUrl} onChange={e=>setYtUrl(e.target.value)} placeholder="Paste YouTube URL (optional)" className="w-full border rounded px-3 py-2" />
          </div>

          <div className="mt-4 flex gap-2">
            <button onClick={save} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">{loading ? 'Saving…' : 'Create'}</button>
            <button onClick={() => history.back()} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
          </div>
        </div>

        <div className="hidden md:block p-4 rounded-xl border text-sm text-gray-600">
          <p>After creating, you can add YouTube audio via the URL field above.</p>
        </div>
      </div>
    </section>
  );
}

