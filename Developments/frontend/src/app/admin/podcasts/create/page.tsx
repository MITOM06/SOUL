"use client";

import { useEffect, useState } from "react";
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
  const [priceStr, setPriceStr] = useState<string>('0.00');
  const [categories, setCategories] = useState<string[]>([]);
  const [catMode, setCatMode] = useState<string>('');
  const [catOther, setCatOther] = useState<string>('');
  const [slug, setSlug] = useState('');
  const [thumb, setThumb] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [active, setActive] = useState(true);
  const [ytUrl, setYtUrl] = useState('');
  const [videoMode, setVideoMode] = useState<'youtube'|'upload'>('youtube');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API}/v1/catalog/podcast/categories`);
        const j = await r.json();
        const arr: string[] = (j?.data || [])
          .map((x: any) => String(x?.category || ''))
          .filter(Boolean);
        setCategories(arr);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    })();
  }, []);

  const save = async () => {
    setLoading(true);
    try {
      // basic required validations
      if (!title.trim()) { alert('Please enter title'); return; }
      if (!desc.trim()) { alert('Please enter description'); return; }
      if (!priceStr || isNaN(Number(priceStr))) { alert('Please enter price (e.g., 00.00)'); return; }
      if (!(catMode && catMode !== '__other__') && !catOther.trim()) { alert('Please select a category or enter Other'); return; }
      if (!coverFile) { alert('Please upload a cover image'); return; }
      const dollars = Math.max(0, Number.parseFloat((priceStr || '0').replace(/,/g, '')) || 0);
      const price_cents = Math.round(dollars * 100);
      const category = catMode === '__other__' ? (catOther.trim() || null) : (catMode || null);
      const payload: Payload = {
        type: 'podcast', title, description: desc, price_cents,
        category, thumbnail_url: thumb || null, is_active: !!active,
      };
      // include slug if provided
      const body: any = { ...payload };
      if (slug.trim()) body.slug = slug.trim();

      const r = await fetch(`${API}/v1/catalog/products`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      });
      const j = await r.json();
      if (!j?.success) return alert(j?.message || 'Create failed');
      const newId = j?.data?.id;
      if (coverFile) {
        const fd = new FormData();
        fd.append('image', coverFile);
        const upThumb = await fetch(`${API}/v1/catalog/products/${newId}/thumbnail`, { method: 'POST', body: fd, credentials: 'include' });
        if (!upThumb.ok) {
          const t = await upThumb.text();
          alert('Upload thumbnail failed: ' + t);
          return;
        }
      }
      if (videoMode === 'youtube' && ytUrl.trim()) {
        await fetch(`${API}/v1/catalog/products/${newId}/youtube`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: ytUrl.trim() })
        });
      } else if (videoMode === 'upload' && videoFile) {
        const fd = new FormData();
        fd.append('files[]', videoFile);
        const up = await fetch(`${API}/v1/catalog/products/${newId}/files`, { method: 'POST', body: fd, credentials: 'include' });
        if (!up.ok) {
          const t = await up.text();
          alert('Video upload failed: ' + t);
          return;
        }
      }
      alert('🎉 Podcast created successfully.');
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

      <div className="grid md:grid-cols-1 gap-6">
        <div className="border rounded-xl p-4 space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600">Type <span className="text-red-500">*</span></label>
              <select value={'podcast'} disabled className="w-full border rounded px-3 py-2 bg-gray-50 text-gray-700">
                <option value="podcast">Podcast</option>
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
                onChange={e=>setPriceStr(e.target.value)}
                required
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>
          <label className="block text-sm mt-2">Title <span className="text-red-500">*</span></label>
          <input value={title} onChange={e=>setTitle(e.target.value)} required className="w-full border rounded px-3 py-2" />

          <label className="block text-sm mt-3">Description <span className="text-red-500">*</span></label>
          <textarea value={desc} onChange={e=>setDesc(e.target.value)} required className="w-full border rounded px-3 py-2 h-28" />

          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block text-sm">Category <span className="text-red-500">*</span></label>
              <select
                value={catMode}
                onChange={e=>setCatMode(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required={catMode !== '__other__'}
              >
                <option value="">Select a category</option>
                {categories.map(c => (<option key={c} value={c}>{c}</option>))}
                <option value="__other__">Other…</option>
              </select>
              {catMode === '__other__' && (
                <input
                  value={catOther}
                  onChange={e=>setCatOther(e.target.value)}
                  placeholder="Enter new category"
                  className="mt-2 w-full border rounded px-3 py-2"
                  required
                />
              )}
            </div>
            <div>
              <label className="block text-sm">Slug</label>
              <input value={slug} onChange={e=>setSlug(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="optional" />
            </div>
          </div>
          <label className="block text-sm mt-3">Cover image <span className="text-red-500">*</span></label>
          <input type="file" accept="image/*,.avif,.heic,.heif,.tif,.tiff" required onChange={(e)=>{
            const f = e.target.files?.[0] || null;
            setCoverFile(f);
            if (f) setCoverPreview(URL.createObjectURL(f)); else setCoverPreview(null);
          }} className="w-full border rounded px-3 py-2" />
          {coverPreview && (
            <div className="mt-2">
              <img src={coverPreview} alt="cover" className="w-40 h-40 object-cover rounded border" />
            </div>
          )}

          <label className="inline-flex items-center gap-2 mt-3">
            <input type="checkbox" checked={active} onChange={e=>setActive(e.target.checked)} />
            Active
          </label>

          <div className="mt-5 border-t pt-4">
            <div className="font-semibold mb-2">Video</div>
            <div className="flex items-center gap-4 mb-2 text-sm">
              <label className="inline-flex items-center gap-2">
                <input type="radio" name="videoMode" value="youtube" checked={videoMode==='youtube'} onChange={()=>setVideoMode('youtube')} />
                Link YouTube
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="radio" name="videoMode" value="upload" checked={videoMode==='upload'} onChange={()=>setVideoMode('upload')} />
                Upload video
              </label>
            </div>
            {videoMode === 'youtube' ? (
              <input value={ytUrl ?? ''} onChange={e=>setYtUrl(e.target.value)} placeholder="Paste YouTube URL (optional)" className="w-full border rounded px-3 py-2" />
            ) : (
              <input type="file" accept="video/mp4,audio/mp3,audio/m4a" onChange={(e)=>setVideoFile(e.target.files?.[0] || null)} className="w-full border rounded px-3 py-2" />
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <button onClick={save} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">{loading ? 'Saving…' : 'Create'}</button>
            <button onClick={() => history.back()} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
          </div>
        </div>

        {/* removed right-side panel */}
      </div>
    </section>
  );
}
