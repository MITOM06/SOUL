"use client";

import UserPanelLayout from "@/components/UserPanelLayout";
import { useEffect, useMemo, useState } from "react";
import { libraryAPI } from "@/lib/api";
import Link from "next/link";

type Item = {
  id: number;
  type: 'ebook'|'podcast';
  title: string;
  description?: string|null;
  price_cents?: number|null;
  thumbnail_url?: string|null;
  category?: string|null;
  purchased_at?: string;
};

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
  `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='800'>
     <rect width='100%' height='100%' fill='#f1f5f9'/>
     <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
       font-family='sans-serif' font-size='18' fill='#94a3b8'>No cover</text>
   </svg>`
)}`;

export default function LibraryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [type, setType] = useState<'all'|'ebook'|'podcast'>('all');
  const [category, setCategory] = useState('all');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const params: any = {};
        if (type !== 'all') params.type = type;
        const res = await libraryAPI.getAll(params);
        setItems(res.data?.data || []);
      } finally {
        setLoading(false);
      }
    })();
  }, [type]);

  const categories = useMemo(() => {
    const s = new Set<string>();
    items.forEach(i => { if (i.category) s.add(i.category); });
    return ['all', ...Array.from(s.values())];
  }, [items]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return items.filter(i => {
      if (type !== 'all' && i.type !== type) return false;
      if (category !== 'all' && (i.category||'') !== category) return false;
      if (qq && !i.title.toLowerCase().includes(qq)) return false;
      return true;
    });
  }, [items, q, type, category]);

  return (
    <UserPanelLayout>
      <section className="space-y-4">
        <h1 className="text-2xl font-bold">My Library</h1>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search purchased items by name..." className="w-64 border rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔎</span>
          </div>
          <select value={type} onChange={e=>setType(e.target.value as any)} className="border rounded px-2 py-2">
            <option value="all">All</option>
            <option value="ebook">Books</option>
            <option value="podcast">Podcasts</option>
          </select>
          <select value={category} onChange={e=>setCategory(e.target.value)} className="border rounded px-2 py-2">
            {categories.map(c => <option key={c} value={c}>{c==='all'?'All categories':c}</option>)}
          </select>
        </div>

        {loading ? <div>Loading…</div> : filtered.length === 0 ? (
          <div>No purchased items yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filtered.map(i => (
              <Link key={i.id} href={i.type==='ebook' ? `/book/${i.id}` : `/podcast/${i.id}`} className="group rounded-xl border overflow-hidden bg-white shadow-sm hover:shadow-md transition">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={toAbs(i.thumbnail_url) || FALLBACK_IMG}
                  alt={i.title}
                  className="w-full aspect-[3/4] object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  onError={(e)=>{ (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG; }}
                />
                <div className="p-3">
                  <div className="text-xs text-zinc-500">{i.type.toUpperCase()} · {i.category || '-'}</div>
                  <div className="font-medium line-clamp-2 group-hover:text-blue-600 transition-colors">{i.title}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </UserPanelLayout>
  );
}
