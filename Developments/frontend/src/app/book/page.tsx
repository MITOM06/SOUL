'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import BookCard from '@/components/BookCard';

type ProductType = 'ebook' | 'podcast';
interface ProductApi {
  id: number;
  type: ProductType;
  title: string;
  thumbnail_url?: string | null;
  description?: string | null;
  category?: string | null;
  price_cents: number;
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '');
const ORIGIN   = API_BASE.replace(/\/api$/, '');

const toAbs = (u?: string | null) => {
  if (!u) return '';
  const s = u.trim();
  if (/^file:\/\//i.test(s) || /^[A-Za-z]:\\/.test(s)) return '';
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  if (s.startsWith('/')) return `${ORIGIN}${s}`;
  return s;
};

/* ===================== Hero (Books) ===================== */
function BooksHero({ items, loading }: { items: Array<any>; loading: boolean }) {
  const [idx, setIdx] = useState(0);
  const count = items.length;
  const timer = useRef<number | null>(null);
  const hovering = useRef(false);
  const [anim, setAnim] = useState<null | 'next' | 'prev'>(null);

  const goImmediate = (n: number) => setIdx((p) => (n + count) % count);
  const doNext = () => {
    if (anim || count < 2) return;
    setAnim('next');
    window.setTimeout(() => {
      setAnim(null);
      goImmediate(idx + 1);
    }, 700);
  };
  const doPrev = () => {
    if (anim || count < 2) return;
    setAnim('prev');
    window.setTimeout(() => {
      setAnim(null);
      goImmediate(idx - 1);
    }, 700);
  };

  useEffect(() => {
    if (!count) return;
    const tick = () => {
      if (!hovering.current && !anim) setIdx((p) => (p + 1) % count);
      // @ts-ignore
      timer.current = window.setTimeout(tick, 6000);
    };
    // @ts-ignore
    timer.current = window.setTimeout(tick, 6000);
    return () => { if (timer.current) window.clearTimeout(timer.current); };
  }, [count, anim]);

  // background
  const bg = toAbs(items[idx]?.thumbnail_url || items[idx]?.cover || undefined);

  if (loading) {
    return (
      <div className="relative w-screen left-[50%] right-[50%] -ml-[50vw] -mr-[50vw]">
        <div className="relative overflow-hidden min-h-[56vh] md:min-h-[64vh]">
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900" />
          <div className="relative grid md:grid-cols-2 gap-8 p-6 md:p-12">
            <div className="space-y-4">
              <div className="h-6 w-28 bg-white/30 rounded animate-pulse" />
              <div className="h-10 w-2/3 bg-white/40 rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-white/30 rounded animate-pulse" />
              <div className="h-24 w-full max-w-xl bg-white/20 rounded animate-pulse" />
              <div className="h-9 w-36 bg-emerald-500/70 rounded-xl animate-pulse" />
            </div>
            <div className="relative h-[320px] md:h-[420px]">
              <div className="absolute inset-y-10 left-8 right-1/3 rounded-xl bg-white/20 animate-pulse" />
              <div className="absolute inset-y-6 left-1/3 right-1/4 rounded-xl bg-white/40 animate-pulse" />
              <div className="absolute inset-y-2 left-1/2 right-8 rounded-xl bg-white/60 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!count) return null;

  const cur = items[idx];
  const prevItem = items[(idx - 1 + count) % count];
  const nextItem = items[(idx + 1) % count];

  return (
    <section className="relative w-screen left-[50%] right-[50%] -ml-[50vw] -mr-[50vw]">
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {bg && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={bg} alt="" className="w-full h-full object-cover opacity-20 blur-md" />
        )}
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/70" />
      </div>

      <div className="relative grid md:grid-cols-2 gap-8 p-6 md:p-12 min-h-[56vh] md:min-h-[64vh]">
        {/* Left: text */}
        <div className="text-white max-w-2xl space-y-4 z-10">
          <div className="inline-flex items-center gap-2 text-xs font-bold tracking-wide bg-white/10 backdrop-blur px-3 py-1 rounded-full border border-white/10">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
            Featured
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold leading-tight drop-shadow-sm">{cur.title}</h2>
          {cur.description && (
            <p className="text-emerald-300 font-semibold">“{String(cur.description).slice(0, 120)}{String(cur.description).length > 120 ? '…' : ''}”</p>
          )}
          <p className="text-white/80 text-sm md:text-base max-w-xl">
            {cur.description ? String(cur.description).slice(0, 220) : "Discover today’s featured title."}
            {cur.description && String(cur.description).length > 220 ? '…' : ''}
          </p>
          <div className="pt-2">
            <Link
              href={`/book/${cur.id}`}
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-5 py-2.5 rounded-xl shadow transition"
            >
              Buy now
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* Right: stacked covers */}
        <div
          className="relative h-[360px] md:h-[520px] z-10"
          onMouseEnter={() => (hovering.current = true)}
          onMouseLeave={() => (hovering.current = false)}
        >
          {/* previous */}
          {prevItem && (
            <Link
              href={`/book/${prevItem.id}`}
              className={`absolute inset-y-12 left-[8%] w-[36%] rounded-2xl shadow-2xl overflow-hidden transition-all duration-700 ease-in-out
                ${anim === 'prev' ? 'left-[33%] w-[34%] opacity-100 scale-100 rotate-0 z-20' : anim === 'next' ? '-left-[20%] opacity-0 scale-75 -rotate-2 z-0' : 'opacity-70 scale-90 -rotate-2 z-10'}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={toAbs(prevItem.thumbnail_url || prevItem.cover)} alt={prevItem.title || ''} className="w-full h-full object-cover" />
            </Link>
          )}
          {/* current */}
          <Link href={`/book/${cur.id}`} className={`absolute inset-y-0 left-[33%] w-[34%] rounded-2xl shadow-2xl ring-1 ring-black/10 overflow-hidden transition-all duration-700 ease-in-out
            ${anim === 'next' ? 'left-[56%] w-[36%] opacity-70 scale-90 rotate-2 z-10' : anim === 'prev' ? 'left-[8%] w-[36%] opacity-70 scale-90 -rotate-2 z-10' : 'opacity-100 scale-100 rotate-0 z-20'}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={toAbs(cur.thumbnail_url || cur.cover)} alt={cur.title} className="w-full h-full object-cover" />
          </Link>
          {/* next */}
          {nextItem && (
            <Link
              href={`/book/${nextItem.id}`}
              className={`absolute inset-y-12 left-[56%] w-[36%] rounded-2xl shadow-2xl overflow-hidden transition-all duration-700 ease-in-out
                ${anim === 'next' ? 'left-[33%] w-[34%] opacity-100 scale-100 rotate-0 z-20' : anim === 'prev' ? 'left-[120%] opacity-0 scale-75 rotate-2 z-0' : 'opacity-70 scale-90 rotate-2 z-10'}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={toAbs(nextItem.thumbnail_url || nextItem.cover)} alt={nextItem.title || ''} className="w-full h-full object-cover" />
            </Link>
          )}

          {/* Controls */}
          <button aria-label="Prev" onClick={doPrev} className="absolute -left-2 top-1/2 -translate-y-1/2 h-10 w-10 grid place-items-center rounded-full bg-white/90 shadow hover:bg-white">‹</button>
          <button aria-label="Next" onClick={doNext} className="absolute -right-2 top-1/2 -translate-y-1/2 h-10 w-10 grid place-items-center rounded-full bg-white/90 shadow hover:bg-white">›</button>

          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => (!anim ? goImmediate(i) : null)}
                className={`h-2 rounded-full transition-all ${i === idx ? 'w-8 bg-white' : 'w-2 bg-white/60 hover:bg-white/80'}`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ===== UI bits to match Home ===== */
function SectionHeader({ title }: { title: string }) {
  return (
    <div className="relative w-screen left-[50%] right-[50%] -ml-[50vw] -mr-[50vw]">
      <div className="px-4 md:px-8">
        <div className="flex items-center gap-3">
          <span className="inline-block h-6 w-1.5 rounded-full bg-gradient-to-b from-fuchsia-500 to-rose-400" />
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
        </div>
      </div>
    </div>
  );
}

function RowWithArrows({ title, children }: { title: string; children: React.ReactNode }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const scrollBy = (delta: number) => scrollerRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  return (
    <div className="space-y-3">
      {/* header full-bleed */}
      <div className="relative w-screen left-[50%] right-[50%] -ml-[50vw] -mr-[50vw]">
        <div className="flex items-center justify-between px-4 md:px-8">
          <h3 className="text-lg md:text-xl font-semibold tracking-tight">{title}</h3>
        </div>
      </div>
      {/* scroller full-bleed */}
      <div className="relative w-screen left-[50%] right-[50%] -ml-[50vw] -mr-[50vw]">
        <div ref={scrollerRef} className="flex gap-4 overflow-x-auto scroll-smooth pb-3 [scrollbar-width:thin] px-4 md:px-8 snap-x snap-mandatory">
          {children}
        </div>
        <button aria-label="Scroll left" onClick={() => scrollBy(-600)} className="hidden md:grid place-items-center absolute left-2 md:left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 shadow hover:bg-white">‹</button>
        <button aria-label="Scroll right" onClick={() => scrollBy(600)} className="hidden md:grid place-items-center absolute right-2 md:right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 shadow hover:bg-white">›</button>
      </div>
    </div>
  );
}

export default function BooksListPage() {
  const [items, setItems] = useState<ProductApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true); setError(null);
        const res = await fetch(`${API_BASE}/v1/catalog/products?type=ebook&per_page=200`, { signal: ac.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const j = await res.json();
        setItems(j?.data?.items || []);
      } catch (e: any) {
        if (e?.name !== 'AbortError') setError(e?.message || 'Failed to load list');
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, []);

  // Normalize
  const books = useMemo(() => {
    return (items || []).map((i) => ({
      ...i,
      cover: toAbs(i.thumbnail_url || undefined),
    }));
  }, [items]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    books.forEach((b: any) => { if (b.category) set.add(b.category); });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [books]);

  return (
    <section className="space-y-10">
      <BooksHero items={books.slice(0, 12)} loading={loading} />
      <SectionHeader title="Books" />

      {/* Category sections (each category is a row like on Home) */}
      {categories.map((cat) => {
        const list = books.filter((b: any) => (b.category || '') === cat);
        return (
          <RowWithArrows key={cat} title={cat}>
            {(loading ? Array.from({ length: 10 }) : list.slice(0, 10)).map((b: any, i: number) => (
              <div
                key={b?.id ?? i}
                className="snap-start shrink-0 basis-[calc((100vw-3rem)/2)] sm:basis-[calc((100vw-4rem)/3)] md:basis-[calc((100vw-8rem)/5)]"
              >
                {loading ? (
                  <>
                    <article className="card overflow-hidden">
                      <div className="w-full aspect-[3/4] bg-zinc-100 animate-pulse" />
                    </article>
                    <div className="px-1.5 pt-2">
                      <div className="h-3.5 w-3/4 bg-zinc-200 rounded animate-pulse" />
                    </div>
                  </>
                ) : (
                  <BookCard book={b} />
                )}
              </div>
            ))}
          </RowWithArrows>
        );
      })}

      {error && (
        <div className="px-4 md:px-8 text-red-600 text-sm">{error}</div>
      )}
    </section>
  );
}
