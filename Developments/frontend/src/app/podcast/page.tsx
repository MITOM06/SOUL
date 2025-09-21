'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Cat = { category: string; count: number; thumbnail_url?: string | null };

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '');
const ORIGIN   = API_BASE.replace(/\/api$/, '');

const toAbs = (u?: string|null) => {
  if (!u) return '';
  const s = u.trim();
  if (/^file:\/\//i.test(s) || /^[A-Za-z]:\\/.test(s)) return '';
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  if (s.startsWith('/')) return `${ORIGIN}${s}`;
  return s;
};

const FALLBACK_IMG = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='400'>
     <rect width='100%' height='100%' fill='#f8fafc'/>
     <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
       font-family='sans-serif' font-size='22' fill='#94a3b8'>Podcast Category</text>
   </svg>`
)}`;

export default function PodcastCategoriesPage() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string|null>(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true); setErr(null);
        const res = await fetch(`${API_BASE}/v1/catalog/podcast/categories`, { signal: ac.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const j = await res.json();
        setCats(j?.data || []);
      } catch (e: any) {
        if (e?.name !== 'AbortError') setErr(e?.message || 'Failed to load categories');
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, []);

  if (loading) return <div className="p-6">Loading podcast categories…</div>;
  if (err) return <div className="p-6 text-red-600">Error: {err}</div>;
  if (!cats.length) return <div className="p-6">No podcast categories.</div>;

  const filtered = cats.filter(c => !q.trim() || c.category.toLowerCase().includes(q.toLowerCase()));

  return (
    <section className="space-y-6">
      <div className="px-4 md:px-8">
        <h1 className="text-3xl font-bold">Podcast Topics</h1>
        <div className="mt-3 max-w-2xl">
          <div className="relative">
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search topics by name..." className="w-full border rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔎</span>
          </div>
        </div>
      </div>
      <div className="relative w-screen left-[50%] right-[50%] -ml-[50vw] -mr-[50vw] px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((c) => {
          const img = toAbs(c.thumbnail_url) || FALLBACK_IMG;
          return (
            <Link key={c.category} href={`/podcast/category/${encodeURIComponent(c.category)}`} className="group relative rounded-3xl overflow-hidden border bg-white shadow-sm hover:shadow-md transition">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt={c.category} className="w-full h-72 md:h-[420px] object-cover transform transition-transform duration-500 group-hover:translate-y-2" onError={(e)=>{ (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG; }} />
              <div className="absolute inset-x-0 top-0 p-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 text-white text-sm font-semibold opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition">{c.category} <span className="text-white/80 text-xs">({c.count})</span></div>
              </div>
            </Link>
          );
        })}
        </div>
      </div>
    </section>
  );
}
