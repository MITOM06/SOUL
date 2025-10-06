// src/app/hot/page.tsx
"use client";

// This page is the former Home page content, moved to /hot
import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import BookCard from "@/components/BookCard";
import PodcastCard from "@/components/PodcastCard";
import { demoBooks } from "@/data/demoBooks";
import { demoPodcasts } from "@/data/demoPodcasts";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { normalizeRole } from "@/lib/role";
import { toAbsoluteImgUrl as toAbs } from '@/lib/img'

// Normalize thumbnail/file URLs to absolute URLs that the browser can load
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '');
const ORIGIN   = API_BASE.replace(/\/api$/, '');

const FALLBACK_IMG = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='600'>
     <rect width='100%' height='100%' fill='#f8fafc'/>
     <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
       font-family='sans-serif' font-size='22' fill='#94a3b8'>SOUL</text>
   </svg>`
)}`;

function toBookHref(b: any) { return `/book/${b?.id}`; }
function toPodcastHref(p: any) { return `/podcast/${p?.id}`; }
function partitionByTag<T extends { tags?: string[] }>(items: T[], tag: string, fallbackIdxs: number[]) {
  const has = items.filter((i) => i?.tags?.includes?.(tag));
  if (has.length) return has;
  return fallbackIdxs.map((i) => items[i]).filter(Boolean);
}

function FullSlideCarousel({ items, autoMs = 6000, heightClass = "h-[88vh] md:h-[92vh]" }: {
  items: Array<{ type: "book"|"podcast"; id: string|number; cover?: string; image?: string; slug?: string }>;
  autoMs?: number; heightClass?: string;
}) {
  const [idx, setIdx] = useState(0);
  const count = items.length || 0;
  const timerRef = useRef<number | null>(null);
  const hovering = useRef(false);
  const go = (n: number) => setIdx((p) => (n + count) % count);
  const next = () => go(idx + 1);
  const prev = () => go(idx - 1);
  useEffect(() => {
    if (!count) return; const tick = () => { if (!hovering.current) setIdx((p) => (p + 1) % count); // @ts-ignore
      timerRef.current = window.setTimeout(tick, autoMs); }; // @ts-ignore
    timerRef.current = window.setTimeout(tick, autoMs);
    return () => { if (timerRef.current) window.clearTimeout(timerRef.current); };
  }, [count, autoMs]);
  return (
    <section className={`relative w-full ${heightClass}`}>
      <div className="relative w-full h-full overflow-hidden" onMouseEnter={() => (hovering.current = true)} onMouseLeave={() => (hovering.current = false)}>
        <div className="flex h-full transition-transform duration-700 ease-out" style={{ transform: `translateX(-${idx * 100}%)` }}>
          {items.map((item, i) => {
            const img = toAbs((item as any).cover || (item as any).image);
            const href = item.type === "book" ? toBookHref(item as any) : toPodcastHref(item as any);
            return (
              <div key={`${item.type}-${(item as any).id}-${i}`} className="w-full shrink-0 h-full">
                <Link href={href} className="block w-full h-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img || FALLBACK_IMG} alt="" className="w-full h-full object-cover" loading="eager" onError={(e)=>{ (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG; }} />
                </Link>
              </div>
            );
          })}
        </div>
        <button aria-label="Previous" onClick={prev} className="absolute left-4 bottom-16 md:bottom-10 z-10 h-11 w-11 grid place-items-center rounded-full bg-white/90 shadow hover:bg-white">‹</button>
        <button aria-label="Next" onClick={next} className="absolute right-4 bottom-16 md:bottom-10 z-10 h-11 w-11 grid place-items-center rounded-full bg-white/90 shadow hover:bg-white">›</button>
        <div className="absolute left-1/2 -translate-x-1/2 bottom-4 md:bottom-6 z-10 flex gap-2">
          {items.map((_, i) => (
            <button key={i} onClick={() => go(i)} aria-label={`Go to slide ${i + 1}`} className={`h-2.5 rounded-full transition-all ${i === idx ? "w-8 bg-[color:var(--brand-600)]" : "w-2.5 bg-zinc-300 hover:bg-zinc-400"}`} />
          ))}
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/10 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/10 to-transparent" />
      </div>
    </section>
  );
}

function RowWithArrows({ title, href, children }: { title: string; href?: string; children: React.ReactNode }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const scrollBy = (delta: number) => scrollerRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  return (
    <div className="space-y-3">
      <div className="relative w-screen left-[50%] right-[50%] -ml-[50vw] -mr-[50vw]">
        <div className="flex items-center justify-between px-4 md:px-8">
          <h3 className="text-lg md:text-xl font-semibold tracking-tight">{title}</h3>
          {href && (
            <Link href={href} className="group inline-flex items-center gap-1 text-xs md:text-sm font-semibold tracking-wide uppercase text-zinc-700 hover:text-zinc-900">
              See all <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
          )}
        </div>
      </div>
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

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="relative w-screen left-[50%] right-[50%] -ml-[50vw] -mr-[50vw]">
      <div className="px-4 md:px-8">
        <div className="flex items-center gap-3">
          <span className="inline-block h-6 w-1.5 rounded-full bg-gradient-to-b from-fuchsia-500 to-rose-400" />
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h2>
        </div>
      </div>
    </div>
  );
}

/* ===== Favourite helpers ===== */
function useFavourites() {
  const [favIds, setFavIds] = useState<Set<number>>(new Set());
  const [canFav, setCanFav] = useState(true);
  const [loading, setLoading] = useState(false);

  const load = async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const res = await api.get('/v1/favourites', { signal: signal as any });
      const data = res.data?.data || res.data || {};
      const ids: number[] = data.product_ids || [];
      setFavIds(new Set(ids));
      setCanFav(true);
    } catch (e: any) {
      if (e?.response?.status === 401) {
        setCanFav(false);
        setFavIds(new Set());
      }
    } finally { setLoading(false); }
  };

  const toggle = async (productId: number) => {
    if (!canFav) {
      alert('Please sign in to use Favorites');
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/auth/login?next=${next}`;
      return;
    }
    const willAdd = !favIds.has(productId);
    const optimistic = new Set(favIds);
    if (willAdd) optimistic.add(productId); else optimistic.delete(productId);
    setFavIds(optimistic);
    try {
      if (willAdd) await api.post('/v1/favourites', { product_id: productId });
      else         await api.delete(`/v1/favourites/${productId}`);
    } catch (e: any) {
      const reverted = new Set(optimistic);
      if (willAdd) reverted.delete(productId); else reverted.add(productId);
      setFavIds(reverted);
      if (e?.response?.status === 401) {
        setCanFav(false);
        alert('Session expired. Please sign in again.');
        const next = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/auth/login?next=${next}`;
      } else {
        alert('Failed to update Favorites.');
      }
    }
  };

  return { favIds, canFav, loading, load, toggle };
}

function FavBtn({ on, onToggle, variant }: { on: boolean; onToggle: () => void; variant: 'book' | 'podcast' }) {
  const topClass = variant === 'book' ? 'top-10' : 'top-10';
  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggle(); }}
      aria-pressed={on}
      aria-label={on ? 'Unfavorite' : 'Favorite'}
      className={`absolute ${topClass} right-2 z-20 h-8 px-3 rounded-full border backdrop-blur bg-white/80 hover:bg-white transition text-xs 
      ${on ? 'border-rose-200 text-rose-600 bg-rose-50' : 'border-zinc-200 text-zinc-700'}`}
      title={on ? 'Unfavorite' : 'Favorite'}
    >
      <span className="text-sm align-middle">{on ? '♥' : '♡'}</span>
      <span className="ml-1 hidden sm:inline">{on ? 'Unfavourite' : 'Favourite'}</span>
    </button>
  );
}

export default function HotPage() {
  const { user } = useAuth();
  const role = normalizeRole(user);
  const isAdmin = role === 'admin';
  const [books, setBooks] = useState<any[]>([]);
  const [podcasts, setPodcasts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { favIds, load: loadFavs, toggle: toggleFav } = useFavourites();
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const [booksResp, podcastsResp] = await Promise.all([
          api.get('/v1/catalog/products', { params: { type: 'ebook', per_page: 50 } }),
          api.get('/v1/catalog/products', { params: { type: 'podcast', per_page: 50 } }),
        ]);
        const bookItems = booksResp.data?.data?.items || booksResp.data?.data?.data || [];
        const podcastItems = podcastsResp.data?.data?.items || podcastsResp.data?.data?.data || [];
        const bs = (bookItems as any[]).map((i) => ({
          ...i,
          type: (i.type || 'ebook').toLowerCase(),
          cover: toAbs(i.thumbnail_url || i.cover || i.image || ''),
          tags: i.tags || i.metadata?.tags || undefined,
        }));
        const ps = (podcastItems as any[]).map((i) => ({
          ...i,
          type: (i.type || 'podcast').toLowerCase(),
          cover: toAbs(i.thumbnail_url || i.cover || i.image || ''),
          tags: i.tags || i.metadata?.tags || undefined,
        }));
        if (mounted) { setBooks(bs); setPodcasts(ps); }
      } catch (err) {
        if (mounted) { setBooks(demoBooks as any[]); setPodcasts(demoPodcasts as any[]); }
      } finally { if (mounted) setLoading(false); }
    };
    load();
    return () => { mounted = false; };
  }, []);

  // After initial lists loaded, fetch favourites
  useEffect(() => {
    const ac = new AbortController();
    loadFavs(ac.signal);
    return () => ac.abort();
  }, []);

  // (Search UI removed for Hot page per request)

  const hotBooksRaw = partitionByTag(books.length ? books : (demoBooks as any[]), "hot", [0,1,2,3,4,5,6,7,8,9]);
  const hotPodcastsRaw = partitionByTag(podcasts.length ? podcasts : (demoPodcasts as any[]), "hot", [0,1,2,3,4,5,6,7,8,9]);
  // Exclude Coming Soon from Hot rows to avoid duplication
  const hotBooks = hotBooksRaw.filter((b:any) => !(Array.isArray((b as any)?.tags) && (b as any).tags.includes('coming_soon')) && !String((b as any)?.category||'').toLowerCase().includes('coming'));
  const hotPodcasts = hotPodcastsRaw.filter((p:any) => !(Array.isArray((p as any)?.tags) && (p as any).tags.includes('coming_soon')) && !String((p as any)?.category||'').toLowerCase().includes('coming'));
  const carouselItems = useMemo(() => [
    ...hotBooks.slice(0,3).map((b) => ({ ...b, type: "book" as const })),
    ...hotPodcasts.slice(0,3).map((p) => ({ ...p, type: "podcast" as const })),
  ], [hotBooks, hotPodcasts]);

  const comingBooks = partitionByTag(books.length ? books : (demoBooks as any[]), "coming_soon", [10,11,12,13,14,15,16,17,18,19]);
  const comingPodcasts = partitionByTag(podcasts.length ? podcasts : (demoPodcasts as any[]), "coming_soon", [10,11,12,13,14,15,16,17,18,19]);

  return (
    <>
      <div className="w-screen relative left-[50%] right-[50%] -ml-[50vw] -mr-[50vw]">
        <FullSlideCarousel items={carouselItems as any[]} />
      </div>
      {/* Search band removed from Hot page */}
      <section className="space-y-12 mt-10">
        <section id="books" className="space-y-6">
          <SectionHeader title="Books" />
          <RowWithArrows title="Coming Soon" href="/book">
            {(loading ? Array.from({ length: 10 }) : (comingBooks as any[]).slice(0, 10)).map((b: any, i: number) => (
              <div key={`cb-${b?.id ?? i}`} className="snap-start shrink-0 basis-[calc((100vw-3rem)/2)] sm:basis-[calc((100vw-4rem)/3)] md:basis-[calc((100vw-8rem)/5)]">
                {loading ? (
                  <>
                    <article className="card overflow-hidden"><div className="w-full aspect-[3/4] bg-zinc-100 animate-pulse" /></article>
                    <div className="px-1.5 pt-2"><div className="h-3.5 w-3/4 bg-zinc-200 rounded animate-pulse" /></div>
                  </>
                ) : (
                  <BookCard book={b} qs="?coming=1" />
                )}
              </div>
            ))}
          </RowWithArrows>
          <RowWithArrows title="Hot" href="/book">
            {(loading ? Array.from({ length: 10 }) : (hotBooks as any[]).slice(0, 10)).map((b: any, i: number) => {
              const favOn = favIds.has(b?.id);
              return (
                <div key={`hb-${b?.id ?? i}`} className="relative snap-start shrink-0 basis-[calc((100vw-3rem)/2)] sm:basis-[calc((100vw-4rem)/3)] md:basis-[calc((100vw-8rem)/5)]">
                  {!loading && !isAdmin && (
                    <FavBtn variant="book" on={favOn} onToggle={() => toggleFav(b.id)} />
                  )}
                  {loading ? (
                    <>
                      <article className="card overflow-hidden"><div className="w-full aspect-[3/4] bg-zinc-100 animate-pulse" /></article>
                      <div className="px-1.5 pt-2"><div className="h-3.5 w-3/5 bg-zinc-200 rounded animate-pulse" /></div>
                    </>
                  ) : (
                    <BookCard book={b} qs="?coming=0" />
                  )}
                </div>
              );
            })}
          </RowWithArrows>
        </section>

        <section id="podcasts" className="space-y-6">
          <SectionHeader title="Podcasts" />
          <RowWithArrows title="Coming Soon" href="/podcast">
            {(loading ? Array.from({ length: 10 }) : (comingPodcasts as any[]).slice(0, 10)).map((p: any, i: number) => (
              <div key={`cp-${p?.id ?? i}`} className="min-w-[300px] max-w-[300px] md:min-w-[616px] md:max-w-[616px] snap-start">
                {loading ? (
                  <>
                    <article className="card overflow-hidden"><div className="w-full aspect-[16/9] bg-zinc-100 animate-pulse" /></article>
                    <div className="px-1.5 pt-2"><div className="h-3.5 w-2/3 bg-zinc-200 rounded animate-pulse" /></div>
                  </>
                ) : (
                  <PodcastCard podcast={p} variant="wide" hidePrice qs="?coming=1" />
                )}
              </div>
            ))}
          </RowWithArrows>
          <RowWithArrows title="Hot" href="/podcast">
            {(loading ? Array.from({ length: 10 }) : (hotPodcasts as any[]).slice(0, 10)).map((p: any, i: number) => {
              const favOn = favIds.has(p?.id);
              return (
                <div key={`hp-${p?.id ?? i}`} className="relative min-w-[300px] max-w-[300px] md:min-w-[616px] md:max-w-[616px] snap-start">
                  {!loading && !isAdmin && (
                    <FavBtn variant="podcast" on={favOn} onToggle={() => toggleFav(p.id)} />
                  )}
                  {loading ? (
                    <>
                      <article className="card overflow-hidden"><div className="w-full aspect-[16/9] bg-zinc-100 animate-pulse" /></article>
                      <div className="px-1.5 pt-2"><div className="h-3.5 w-1/2 bg-zinc-200 rounded animate-pulse" /></div>
                    </>
                  ) : (
                    <PodcastCard podcast={p} variant="wide" qs="?coming=0" />
                  )}
                </div>
              );
            })}
          </RowWithArrows>
        </section>
      </section>
    </>
  );
}
