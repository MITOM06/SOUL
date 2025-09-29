"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";

/** ================ Tiny visual helpers ================ */
function NeonOrb({ className }: { className?: string }) {
  // dùng pulse + blur để tạo cảm giác “thở”
  return (
    <div
      className={`pointer-events-none absolute rounded-full blur-3xl opacity-60 motion-safe:animate-pulse ${className || ""}`}
    />
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-5 py-4 rounded-2xl bg-white/80 backdrop-blur ring-1 ring-zinc-200 shadow-sm min-w-[160px]">
      <div className="text-2xl font-extrabold tracking-tight text-zinc-900">{value}</div>
      <div className="text-sm text-zinc-600">{label}</div>
    </div>
  );
}

/** SVG placeholder tươi sáng (data URL) */
const brightSVG = (w: number, h: number, from: string, to: string, label: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>
      <defs>
        <linearGradient id='g' x1='0' x2='1' y1='0' y2='1'>
          <stop offset='0%' stop-color='${from}'/><stop offset='100%' stop-color='${to}'/>
        </linearGradient>
      </defs>
      <rect width='100%' height='100%' rx='24' fill='url(#g)'/>
      <circle cx='85%' cy='18%' r='40' fill='rgba(255,255,255,0.28)' />
      <circle cx='12%' cy='82%' r='28' fill='rgba(255,255,255,0.18)' />
      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
        font-family='Inter, system-ui, sans-serif' font-size='22' fill='rgba(255,255,255,0.85)'>${label}</text>
    </svg>`
  )}`;

const IMG_CIRCLE = brightSVG(900, 900, "#a78bfa", "#f0abfc", "SOUL");
const IMG_SQUARE = brightSVG(900, 900, "#60a5fa", "#34d399", "Square");
const IMG_RECT1  = brightSVG(1200, 800, "#f59e0b", "#ef4444", "Story");
const IMG_RECT2  = brightSVG(1200, 800, "#22d3ee", "#8b5cf6", "Listen");
const IMG_RECT3  = brightSVG(1200, 800, "#fb7185", "#f97316", "Flow");

/** ================ Page ================ */
export default function LandingHome() {
  /** Search state (home quick search) */
  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/$/, "");
  const ORIGIN = API_BASE.replace(/\/api$/, "");
  const toAbs = (u?: string | null) => {
    if (!u) return "";
    const s = u.trim();
    if (/^file:\/\//i.test(s) || /^[A-Za-z]:\\/.test(s)) return "";
    if (s.startsWith("http://") || s.startsWith("https://")) return s;
    if (s.startsWith("/")) return `${ORIGIN}${s}`;
    return s;
  };

  const [q, setQ] = useState("");
  const [stype, setStype] = useState<"all" | "ebook" | "podcast">("all");
  const [category, setCategory] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const FALLBACK_IMG = `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='800'>
       <defs>
         <linearGradient id='g' x1='0' x2='1'>
           <stop offset='0%' stop-color='#e9eff5'/>
           <stop offset='100%' stop-color='#f8fafc'/>
         </linearGradient>
       </defs>
       <rect width='100%' height='100%' fill='url(#g)'/>
       <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
         font-family='Inter, system-ui, sans-serif' font-size='18' fill='#94a3b8'>No cover</text>
     </svg>`
  )}`;

  const doSearch = async (ev?: React.FormEvent) => {
    ev?.preventDefault();
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (stype !== "all") params.set("type", stype);
      if (q.trim()) params.set("search", q.trim());
      if (category.trim()) params.set("category", category.trim());
      params.set("per_page", "24");
      const r = await fetch(`${API_BASE}/v1/catalog/products?${params.toString()}`);
      const j = await r.json();
      setResults(j?.data?.items || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  /** ========== Mount + simple reveal animations ========== */
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  /** ========== Parallax nhẹ cho art panel ========== */
  const artRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = artRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / rect.width; // -0.5..0.5
      const dy = (e.clientY - cy) / rect.height;
      el.style.setProperty("--rx", `${dy * 6}deg`);
      el.style.setProperty("--ry", `${-dx * 6}deg`);
      el.style.setProperty("--tx", `${-dx * 10}px`);
      el.style.setProperty("--ty", `${-dy * 10}px`);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // 5 images in public/home␠ (note: folder name ends with a space)
  // Use a trailing slash when joining and encode URI to preserve the space.
  const HOME_DIR = '/home ';
  const homeImages = useMemo(
    () => [
      '—Pngtree—gilded microphone a conceptual 3d_6299480.jpg',
      '—Pngtree—modern podcast studio with neon_15937169.jpg',
      'download.jpeg',
      'download (1).jpeg',
      '2e46dca2-8bc4-47a7-9afd-db1f3341f883.jpeg',
    ],
    []
  );

  return (
    <div className={`space-y-20 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"} transition-all duration-700 ease-out`}>
      {/* ===================== HERO ===================== */}
      <section className="relative w-screen left-[50%] right-[50%] -ml-[50vw] -mr-[50vw] overflow-hidden">
        <div className="relative min-h-screen flex items-center">
          {/* Neon orbs */}
          <NeonOrb className="w-[52vw] h-[52vw] -left-20 -top-20 bg-[radial-gradient(circle_at_center,rgba(99,102,241,.22),transparent_60%)]" />
          <NeonOrb className="w-[48vw] h-[48vw] right-[-12vw] top-28 bg-[radial-gradient(circle_at_center,rgba(217,70,239,.20),transparent_60%)]" />
          <NeonOrb className="w-[60vw] h-[60vw] left-1/4 bottom-[-20vw] bg-[radial-gradient(circle_at_center,rgba(244,63,94,.16),transparent_60%)]" />

          <div className="relative z-10 w-full px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 items-center gap-12">
            {/* Left copy */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur px-3 py-1 rounded-full ring-1 ring-zinc-200 text-xs font-semibold text-zinc-700 shadow-sm">
                <span className="inline-block h-2 w-2 rounded-full bg-[color:var(--brand-500)]" />
                Welcome to SOUL
              </div>
              <h1 className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight text-zinc-900">
                Stories Online,
                <span className="block text-transparent bg-clip-text bg-gradient-to-tr from-indigo-500 via-fuchsia-500 to-rose-500">
                  Unified Library
                </span>
              </h1>
              <p className="text-lg md:text-xl text-zinc-700">
                A vibrant home for ebooks and podcasts—with a neon heartbeat.
                Read, listen, and collect—your journey begins here.
              </p>
              <div className="flex items-center gap-3">
                <Link
                  href="/book"
                  className="relative px-5 py-2.5 rounded-xl text-white font-semibold bg-[color:var(--brand-500)] hover:bg-[color:var(--brand-600)] shadow transition-transform hover:-translate-y-0.5"
                >
                  <span className="relative z-10">Explore Books</span>
                  <span className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-white/30" />
                </Link>
                <Link
                  href="/podcast"
                  className="relative px-5 py-2.5 rounded-xl border border-zinc-300/80 hover:bg-white/80 backdrop-blur font-medium text-zinc-800 shadow-sm transition-transform hover:-translate-y-0.5"
                >
                  Browse Podcasts
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

            {/* Art panel (mosaic) – artistic collage using 5 images from public/home␠ */}
            <div
              ref={artRef}
              className="relative w-full h-[60vh] md:h-[72vh] [transform:perspective(1200px)_rotateX(var(--rx,0deg))_rotateY(var(--ry,0deg))] transition-transform duration-200 ease-out will-change-transform"
            >
              <div className="relative h-full rounded-3xl bg-white/80 backdrop-blur ring-1 ring-zinc-200 shadow-xl p-4 md:p-6">
                <div className="grid grid-rows-6 grid-cols-6 gap-4 h-full">
                  {homeImages.map((name, idx) => {
                    // Hand-crafted mosaic positions for 5 tiles
                    const pos = [
                      'row-span-4 col-span-3', // 0 big left
                      'row-span-2 col-span-3', // 1 top right
                      'row-span-2 col-span-2', // 2 bottom left
                      'row-span-3 col-span-2', // 3 bottom middle
                      'row-span-3 col-span-2', // 4 bottom right
                    ][idx] || 'row-span-2 col-span-2';
                    const tilt = ['-rotate-1','rotate-1','-rotate-[0.5deg]','rotate-[0.5deg]','-rotate-1'][idx] || '';
                    return (
                      <figure
                        key={idx}
                        className={`relative overflow-hidden rounded-2xl bg-zinc-100 ${pos} group`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={encodeURI(`${HOME_DIR}/${name}`)}
                          alt={name}
                          className={`w-full h-full object-cover ${tilt} transition-transform duration-500 group-hover:scale-[1.03]`}
                          onError={(e) => {
                            // graceful fallback to bright SVGs
                            (e.currentTarget as HTMLImageElement).src = IMG_RECT1;
                          }}
                        />
                        {/* Soft inner glow */}
                        <span className="pointer-events-none absolute inset-0 ring-1 ring-white/40" />
                      </figure>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== SEARCH BAND ===================== */}
      <section className="relative w-screen left-[50%] right-[50%] -ml-[50vw] -mr-[50vw]">
        <div className="px-6 md:px-12">
          <div className="relative -mt-16 md:-mt-24 rounded-3xl bg-white/85 backdrop-blur ring-1 ring-zinc-200 shadow-xl p-4 md:p-6">
            {/* subtle shine */}
            <div className="pointer-events-none absolute inset-0 rounded-3xl overflow-hidden">
              <div className="absolute -inset-1 opacity-0 group-hover:opacity-5" />
            </div>

            <form onSubmit={doSearch} className="grid gap-3 md:grid-cols-[1fr_160px_220px_auto]">
              <div className="relative">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search by title…"
                  className="w-full border rounded-2xl pl-10 pr-3 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/70 focus:border-indigo-300 border-zinc-200"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">🔎</span>
              </div>
              <select
                value={stype}
                onChange={(e) => setStype(e.target.value as any)}
                className="border rounded-2xl px-3 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/70 border-zinc-200"
              >
                <option value="all">All</option>
                <option value="ebook">Books</option>
                <option value="podcast">Podcasts</option>
              </select>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Category (e.g., Programming, Design)"
                className="border rounded-2xl px-3 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/70 border-zinc-200"
              />
              <button
                type="submit"
                className="rounded-2xl bg-[color:var(--brand-500)] hover:bg-[color:var(--brand-600)] text-white font-semibold px-6 py-3 shadow transition-transform hover:-translate-y-0.5"
              >
                Search
              </button>
            </form>

            {/* Results grid */}
            <div className="mt-4">
              {loading ? (
                <div className="text-sm text-zinc-600">Searching…</div>
              ) : results.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {results.map((it) => (
                    <Link
                      key={it.id}
                      href={it.type === "podcast" ? `/podcast/${it.id}` : `/book/${it.id}`}
                      className="group relative rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={toAbs(it.thumbnail_url) || FALLBACK_IMG}
                        alt={it.title}
                        className={`w-full ${it.type === "podcast" ? "aspect-video" : "aspect-[3/4]"} object-cover transition-transform duration-300 group-hover:scale-[1.03]`}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG;
                        }}
                      />
                      {/* Shine effect */}
                      <span className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="absolute -inset-1 translate-x-[-60%] -translate-y-[60%] rotate-45 bg-gradient-to-r from-white/0 via-white/25 to-white/0 w-2/3 h-2/3" />
                      </span>
                      <div className="p-3">
                        <div className="text-xs text-zinc-500">
                          {(it.type || "").toUpperCase()} · {it.category || "-"}
                        </div>
                        <div className="font-medium line-clamp-2 group-hover:text-indigo-600 transition-colors">
                          {it.title}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-zinc-500">Type above to search books and podcasts.</div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Removed geometric image strip section as requested */}

      {/* ===================== CTA ===================== */}
      <section className="relative w-screen left-[50%] right-[50%] -ml-[50vw] -mr-[50vw]">
        <div className="px-6 md:px-12 pb-24">
          <div className="relative overflow-hidden rounded-3xl p-8 md:p-12 ring-1 ring-zinc-200 bg-white/80 backdrop-blur shadow-lg">
            <div className="absolute -left-10 -top-6 h-48 w-48 rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,.22),transparent_60%)]" />
            <div className="absolute right-0 -bottom-8 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_center,rgba(244,63,94,.18),transparent_60%)]" />
            <div className="relative grid md:grid-cols-[1fr_auto] items-center gap-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-900">
                  Start your SOUL journey
                </h2>
                <p className="text-zinc-700 mt-1">Pick a path and begin. We’ll bring the neon.</p>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/book"
                  className="px-5 py-2.5 rounded-xl text-white font-semibold bg-[color:var(--brand-500)] hover:bg-[color:var(--brand-600)] shadow transition-transform hover:-translate-y-0.5"
                >
                  Browse Books
                </Link>
                <Link
                  href="/podcast"
                  className="px-5 py-2.5 rounded-xl border border-zinc-300 hover:bg-white/80 font-medium text-zinc-800 transition-transform hover:-translate-y-0.5"
                >
                  Browse Podcasts
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Removed styled-jsx to avoid nested tags; motion-safe already respects reduced motion */}
    </div>
  );
}
