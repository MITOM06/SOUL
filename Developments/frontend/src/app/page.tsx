// src/app/page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Layout from "@/components/Layout";
import BookCard from "@/components/BookCard";
import PodcastCard from "@/components/PodcastCard";
import { demoBooks } from "@/data/demoBooks";
import { demoPodcasts } from "@/data/demoPodcasts";
import { productsAPI } from "@/lib/api";

/* ---------------- helpers ---------------- */
function toBookHref(b: any) {
  return b?.slug ? `/books/${b.slug}` : `/books/${b.id}`;
}
function toPodcastHref(p: any) {
  return p?.slug ? `/podcasts/${p.slug}` : `/podcasts/${p.id}`;
}
function partitionByTag<T extends { tags?: string[] }>(
  items: T[],
  tag: string,
  fallbackIdxs: number[]
) {
  const has = items.filter((i) => i?.tags?.includes?.(tag));
  if (has.length) return has;
  return fallbackIdxs.map((i) => items[i]).filter(Boolean);
}

/* ------------- Full-screen slide carousel (1 item/slide) ------------- */
function FullSlideCarousel({
  items,
  autoMs = 6000, // chậm
  heightClass = "h-[88vh] md:h-[92vh]", // gần full màn hình, không che header
}: {
  items: Array<
    | { type: "book"; id: string | number; cover?: string; image?: string; slug?: string }
    | { type: "podcast"; id: string | number; cover?: string; image?: string; slug?: string }
  >;
  autoMs?: number;
  heightClass?: string;
}) {
  const [idx, setIdx] = useState(0);
  const count = items.length || 0;
  const timerRef = useRef<number | null>(null);
  const hovering = useRef(false);

  const go = (n: number) => setIdx((p) => (n + count) % count);
  const next = () => go(idx + 1);
  const prev = () => go(idx - 1);

  useEffect(() => {
    if (!count) return;
    const tick = () => {
      if (!hovering.current) setIdx((p) => (p + 1) % count);
      // @ts-ignore
      timerRef.current = window.setTimeout(tick, autoMs);
    };
    // @ts-ignore
    timerRef.current = window.setTimeout(tick, autoMs);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [count, autoMs]);

  return (
    <section className={`relative w-full ${heightClass}`}>
      {/* slides wrapper */}
      <div
        className="relative w-full h-full overflow-hidden"
        onMouseEnter={() => (hovering.current = true)}
        onMouseLeave={() => (hovering.current = false)}
      >
        <div
          className="flex h-full transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${idx * 100}%)` }}
        >
          {items.map((item, i) => {
            const img = (item as any).cover || (item as any).image;
            const href = item.type === "book" ? toBookHref(item as any) : toPodcastHref(item as any);
            return (
              <div key={`${item.type}-${(item as any).id}-${i}`} className="w-full shrink-0 h-full">
                <Link href={href} className="block w-full h-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img || "/placeholder.jpg"}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                </Link>
              </div>
            );
          })}
        </div>

        {/* prev/next buttons */}
        <button
          aria-label="Previous"
          onClick={prev}
          className="absolute left-4 bottom-16 md:bottom-10 z-10 h-11 w-11 grid place-items-center rounded-full bg-white/90 shadow hover:bg-white"
        >
          ‹
        </button>
        <button
          aria-label="Next"
          onClick={next}
          className="absolute right-4 bottom-16 md:bottom-10 z-10 h-11 w-11 grid place-items-center rounded-full bg-white/90 shadow hover:bg-white"
        >
          ›
        </button>

        {/* dots */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-4 md:bottom-6 z-10 flex gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-2.5 rounded-full transition-all ${
                i === idx ? "w-8 bg-zinc-900" : "w-2.5 bg-zinc-300 hover:bg-zinc-400"
              }`}
            />
          ))}
        </div>

        {/* gradient viền trên/dưới cho đẹp (tuỳ chọn) */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/10 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/10 to-transparent" />
      </div>
    </section>
  );
}

/* --------------------------------- Page --------------------------------- */
function RowWithArrows({
  title,
  href,
  children,
}: {
  title: string;
  href?: string;
  children: React.ReactNode;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const scrollBy = (delta: number) => scrollerRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">{title}</h3>
        {href && (
          <Link href={href} className="text-sm text-brand-600 hover:underline">
            See all
          </Link>
        )}
      </div>
      <div className="relative">
        <div ref={scrollerRef} className="flex gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:thin]">
          {children}
        </div>
        <button
          aria-label="Scroll left"
          onClick={() => scrollBy(-600)}
          className="hidden md:grid place-items-center absolute left-0 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 shadow hover:bg-white"
        >
          ‹
        </button>
        <button
          aria-label="Scroll right"
          onClick={() => scrollBy(600)}
          className="hidden md:grid place-items-center absolute right-0 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 shadow hover:bg-white"
        >
          ›
        </button>
      </div>
    </div>
  );
}

export default function HomePage() {
  // Data cho carousel: fetch products from backend and fallback to demo data
  const [books, setBooks] = useState<any[]>([]);
  const [podcasts, setPodcasts] = useState<any[]>([]);
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
  const resp = await productsAPI.getAll({ limit: 24 });
        const items = resp.data?.data?.data || resp.data?.data || [];
        // products have a `type` field: 'ebook' or 'podcast' (or similar)
        const bs = items.filter((i: any) => (i.type || '').toLowerCase() === 'ebook' || (i.type || '').toLowerCase() === 'book');
        const ps = items.filter((i: any) => (i.type || '').toLowerCase() === 'podcast' || (i.metadata?.kind || '').toLowerCase() === 'podcast');
        if (mounted) {
          setBooks(bs);
          setPodcasts(ps);
        }
      } catch (err) {
        // fallback to demo data on error
        if (mounted) {
          setBooks(demoBooks as any[]);
          setPodcasts(demoPodcasts as any[]);
        }
      }
    };
    load();
    return () => { mounted = false };
  }, []);

  // Data cho carousel: 6 sản phẩm hot (3 book + 3 podcast)
  const hotBooks = partitionByTag(books.length ? books : (demoBooks as any[]), "hot", [0, 1, 2, 3, 4, 5]);
  const hotPodcasts = partitionByTag(podcasts.length ? podcasts : (demoPodcasts as any[]), "hot", [0, 1, 2, 3, 4, 5]);
  const carouselItems = useMemo(
    () => [
      ...hotBooks.slice(0, 3).map((b) => ({ ...b, type: "book" as const })),
      ...hotPodcasts.slice(0, 3).map((p) => ({ ...p, type: "podcast" as const })),
    ],
    [hotBooks, hotPodcasts]
  );

  const comingBooks = partitionByTag(books.length ? books : (demoBooks as any[]), "coming_soon", [6, 7, 8, 9, 10, 11]);
  const comingPodcasts = partitionByTag(podcasts.length ? podcasts : (demoPodcasts as any[]), "coming_soon", [6, 7, 8, 9, 10, 11]);

  return (
    <Layout>
      {/* full-width carousel */}
      <div className="w-screen relative left-[50%] right-[50%] -ml-[50vw] -mr-[50vw] bg-white">
        <FullSlideCarousel items={carouselItems as any[]} />
      </div>

      {/* content dưới */}
      <section className="space-y-10 mt-10">
        <section id="books" className="space-y-6">
          <h2 className="text-2xl font-bold">Books</h2>
          <RowWithArrows title="Coming Soon" href="/library">
            {(comingBooks as any[]).map((b) => (
              <Link href={toBookHref(b)} key={`cb-${b.id}`} className="min-w-[260px] max-w-[260px]">
                <BookCard book={b} />
              </Link>
            ))}
          </RowWithArrows>
          <RowWithArrows title="Hot" href="/library">
            {(hotBooks as any[]).map((b) => (
              <Link href={toBookHref(b)} key={`hb-${b.id}`} className="min-w-[260px] max-w-[260px]">
                <BookCard book={b} />
              </Link>
            ))}
          </RowWithArrows>
        </section>

        <section id="podcasts" className="space-y-6">
          <h2 className="text-2xl font-bold">Podcasts</h2>
          <RowWithArrows title="Coming Soon" href="/podcasts">
            {(comingPodcasts as any[]).map((p) => (
              <Link href={toPodcastHref(p)} key={`cp-${p.id}`} className="min-w-[300px] max-w-[300px]">
                <PodcastCard podcast={p} />
              </Link>
            ))}
          </RowWithArrows>
          <RowWithArrows title="Hot" href="/podcasts">
            {(hotPodcasts as any[]).map((p) => (
              <Link href={toPodcastHref(p)} key={`hp-${p.id}`} className="min-w-[300px] max-w-[300px]">
                <PodcastCard podcast={p} />
              </Link>
            ))}
          </RowWithArrows>
        </section>
      </section>
    </Layout>
  );
}
