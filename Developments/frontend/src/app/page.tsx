"use client";

import Link from "next/link";
import React, { useState } from "react";

// Artistic landing for SOUL
// Full-bleed sections use the same full-width trick as other pages

function NeonOrb({ className }: { className?: string }) {
  return (
    <div className={`absolute rounded-full blur-3xl opacity-60 ${className || ''}`} />
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-5 py-4 rounded-2xl bg-white/70 backdrop-blur ring-1 ring-black/5 shadow-sm min-w-[160px]">
      <div className="text-2xl font-extrabold tracking-tight text-zinc-900">{value}</div>
      <div className="text-sm text-zinc-600">{label}</div>
    </div>
  );
}

export default function LandingHome() {
  // Search state (home quick search)
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
  const [q, setQ] = useState('');
  const [stype, setStype] = useState<'all'|'ebook'|'podcast'>('all');
  const [category, setCategory] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const FALLBACK_IMG = `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='800'>
       <rect width='100%' height='100%' fill='#f1f5f9'/>
       <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
         font-family='sans-serif' font-size='18' fill='#94a3b8'>No cover</text>
     </svg>`
  )}`;

  const doSearch = async (ev?: React.FormEvent) => {
    ev?.preventDefault();
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (stype !== 'all') params.set('type', stype);
      if (q.trim()) params.set('search', q.trim());
      if (category.trim()) params.set('category', category.trim());
      params.set('per_page', '24');
      const r = await fetch(`${API_BASE}/v1/catalog/products?${params.toString()}`);
      const j = await r.json();
      setResults(j?.data?.items || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-20">
      {/* HERO */}
      <section className="relative w-screen left-[50%] right-[50%] -ml-[50vw] -mr-[50vw] overflow-hidden">
        <div className="relative min-h-[84vh] sm:min-h-[90vh] flex items-center">
          {/* Neon orbs */}
          <NeonOrb className="w-[52vw] h-[52vw] -left-20 -top-20 bg-[radial-gradient(circle_at_center,rgba(99,102,241,.25),transparent_60%)]" />
          <NeonOrb className="w-[48vw] h-[48vw] right-[-12vw] top-28 bg-[radial-gradient(circle_at_center,rgba(217,70,239,.22),transparent_60%)]" />
          <NeonOrb className="w-[60vw] h-[60vw] left-1/4 bottom-[-20vw] bg-[radial-gradient(circle_at_center,rgba(244,63,94,.18),transparent_60%)]" />

          <div className="relative z-10 w-full px-6 md:px-12 grid lg:grid-cols-2 items-center gap-10">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-white/70 backdrop-blur px-3 py-1 rounded-full ring-1 ring-black/5 text-xs font-semibold text-zinc-700">
                <span className="inline-block h-2 w-2 rounded-full bg-[color:var(--brand-500)]" />
                Welcome to SOUL
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tighter text-zinc-900">
                Stories Online,
                <span className="block text-transparent bg-clip-text bg-gradient-to-tr from-indigo-500 via-fuchsia-500 to-rose-500">
                  Unified Library
                </span>
              </h1>
              <p className="text-zinc-700 max-w-xl">
                A living space for ebooks and podcasts, crafted with a neon soul.
                Read, listen and collect—your journey begins here.
              </p>
              <div className="flex items-center gap-3">
                <Link href="/book" className="px-5 py-2.5 rounded-xl text-white font-semibold bg-[color:var(--brand-500)] hover:bg-[color:var(--brand-600)] shadow">
                  Explore Books
                </Link>
                <Link href="/podcast" className="px-5 py-2.5 rounded-xl border border-zinc-300 hover:bg-white/70 backdrop-blur font-medium text-zinc-800">
                  Explore Podcasts
                </Link>
              </div>

              {/* Stats */}
              <div className="mt-6 flex flex-wrap gap-3">
                <Stat value="25k+" label="Titles" />
                <Stat value="48k+" label="Listeners" />
                <Stat value="1.2M" label="Pages read" />
                <Stat value="4.8★" label="Avg. rating" />
              </div>
            </div>

            {/* Art panel */}
            <div className="relative h-[360px] md:h-[520px]">
              <div className="absolute inset-0 rounded-3xl bg-white/60 backdrop-blur ring-1 ring-black/5 shadow-xl" />
              {/* floating tiles */}
              <div className="absolute inset-0">
                <div className="absolute left-6 top-6 h-28 w-40 rounded-2xl bg-gradient-to-br from-indigo-500/70 to-fuchsia-500/70 shadow-lg rotate-[-6deg]" />
                <div className="absolute right-8 top-10 h-36 w-36 rounded-full bg-gradient-to-tr from-fuchsia-500/70 to-rose-500/70 shadow-lg" />
                <div className="absolute left-1/2 -translate-x-1/2 top-24 h-44 w-72 rounded-3xl bg-gradient-to-br from-white/90 to-white/70 ring-1 ring-black/5 shadow-lg" />
                <div className="absolute left-8 bottom-10 h-24 w-24 rounded-xl bg-gradient-to-br from-rose-500/70 to-indigo-500/70 shadow-lg rotate-[8deg]" />
                <div className="absolute right-6 bottom-6 h-40 w-64 rounded-3xl bg-gradient-to-br from-white/90 to-white/60 ring-1 ring-black/5 shadow-lg" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEARCH BAND below stats */}
      <section className="relative w-screen left-[50%] right-[50%] -ml-[50vw] -mr-[50vw]">
        <div className="px-6 md:px-12">
          <div className="relative -mt-16 md:-mt-24 rounded-3xl bg-white/80 backdrop-blur ring-1 ring-black/5 shadow-xl p-4 md:p-6">
            <form onSubmit={doSearch} className="grid gap-3 md:grid-cols-[1fr_160px_220px_auto]">
              <div className="relative">
                <input
                  value={q}
                  onChange={(e)=>setQ(e.target.value)}
                  placeholder="Tìm theo tên sản phẩm..."
                  className="w-full border rounded-2xl pl-10 pr-3 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔎</span>
              </div>
              <select value={stype} onChange={e=>setStype(e.target.value as any)} className="border rounded-2xl px-3 py-3">
                <option value="all">Tất cả</option>
                <option value="ebook">Sách</option>
                <option value="podcast">Podcast</option>
              </select>
              <input
                value={category}
                onChange={(e)=>setCategory(e.target.value)}
                placeholder="Thể loại (vd: Programming, Design)"
                className="border rounded-2xl px-3 py-3"
              />
              <button type="submit" className="rounded-2xl bg-[color:var(--brand-500)] hover:bg-[color:var(--brand-600)] text-white font-semibold px-6 py-3">Tìm kiếm</button>
            </form>

            {/* Results grid */}
            <div className="mt-4">
              {loading ? (
                <div className="text-sm text-zinc-600">Đang tìm…</div>
              ) : results.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {results.map((it) => (
                    <Link
                      key={it.id}
                      href={it.type==='podcast' ? `/podcast/${it.id}` : `/book/${it.id}`}
                      className="group rounded-2xl border bg-white overflow-hidden shadow-sm hover:shadow-md transition"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={toAbs(it.thumbnail_url) || FALLBACK_IMG}
                        alt={it.title}
                        className={`w-full ${it.type==='podcast' ? 'aspect-video' : 'aspect-[3/4]'} object-cover group-hover:scale-[1.02] transition-transform`}
                        onError={(e)=>{ (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG; }}
                      />
                      <div className="p-3">
                        <div className="text-xs text-zinc-500">{(it.type||'').toUpperCase()} · {it.category || '-'}</div>
                        <div className="font-medium line-clamp-2 group-hover:text-indigo-600 transition-colors">{it.title}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-zinc-500">Nhập từ khóa để tìm kiếm sách và podcast.</div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Curated vignette */}
      <section className="relative w-screen left-[50%] right-[50%] -ml-[50vw] -mr-[50vw]">
        <div className="px-6 md:px-12 py-16 grid md:grid-cols-3 gap-6">
          {[0,1,2].map((i) => (
            <article key={i} className="relative overflow-hidden rounded-3xl group">
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-zinc-800" />
              <div className="relative h-64">
                <div className="absolute inset-0 opacity-30 group-hover:opacity-40 transition">
                  <div className="absolute -left-10 -top-10 w-72 h-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,.35),transparent_60%)]" />
                  <div className="absolute right-[-30px] bottom-[-30px] w-64 h-64 rounded-full bg-[radial-gradient(circle_at_center,rgba(217,70,239,.30),transparent_60%)]" />
                </div>
                <div className="absolute inset-0 grid place-items-center text-center px-8">
                  <h3 className="text-white text-2xl font-bold tracking-tight">
                    {i===0? 'Read. Listen. Flow.' : i===1? 'Neon nights, bright stories.' : 'From page to sound.'}
                  </h3>
                  <p className="mt-2 text-white/80 text-sm max-w-sm">
                    {i===0? 'Lose yourself in pages and episodes crafted for modern readers.' : i===1? 'A visual rhythm for a library that moves with you.' : 'Your narratives, your pace—carry them anywhere.'}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative w-screen left-[50%] right-[50%] -ml-[50vw] -mr-[50vw]">
        <div className="px-6 md:px-12 pb-24">
          <div className="relative overflow-hidden rounded-3xl p-8 md:p-12 ring-1 ring-black/5 bg-white/70 backdrop-blur">
            <div className="absolute -left-10 -top-6 h-48 w-48 rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,.25),transparent_60%)]" />
            <div className="absolute right-0 -bottom-8 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_center,rgba(244,63,94,.20),transparent_60%)]" />
            <div className="relative grid md:grid-cols-[1fr_auto] items-center gap-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-900">Start your SOUL journey</h2>
                <p className="text-zinc-700 mt-1">Pick a path and begin. We’ll bring the neon.</p>
              </div>
              <div className="flex gap-3">
                <Link href="/book" className="px-5 py-2.5 rounded-xl text-white font-semibold bg-[color:var(--brand-500)] hover:bg-[color:var(--brand-600)] shadow">Browse Books</Link>
                <Link href="/podcast" className="px-5 py-2.5 rounded-xl border border-zinc-300 hover:bg-white/70 font-medium text-zinc-800">Browse Podcasts</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
