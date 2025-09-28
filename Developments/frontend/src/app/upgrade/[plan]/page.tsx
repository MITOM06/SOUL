"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { subscriptionCatalogAPI } from '@/lib/api';
import BookCard from '@/components/BookCard';
import PodcastCard from '@/components/PodcastCard';

type PlanKey = 'premium' | 'vip';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '');
const ORIGIN   = API_BASE.replace(/\/api$/, '');
const toAbs = (u?: string|null) => {
  if (!u) return '';
  const s = String(u).trim();
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  if (s.startsWith('/')) return `${ORIGIN}${s}`;
  return s;
};

function RowWithArrows({ title, children }: { title: string; children: React.ReactNode }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const scrollBy = (delta: number) => scrollerRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  return (
    <section className="space-y-3">
      <div className="relative w-screen left-[50%] right-[50%] -ml-[50vw] -mr-[50vw] px-4 md:px-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{title}</h2>
          <div className="hidden md:flex gap-2">
            <button aria-label="left" onClick={()=>scrollBy(-600)} className="h-9 w-9 grid place-items-center rounded-full bg-white shadow hover:bg-zinc-50">‹</button>
            <button aria-label="right" onClick={()=>scrollBy(600)}  className="h-9 w-9 grid place-items-center rounded-full bg-white shadow hover:bg-zinc-50">›</button>
          </div>
        </div>
        <div ref={scrollerRef} className="flex gap-4 overflow-x-auto scroll-smooth pb-3 [scrollbar-width:thin] snap-x snap-mandatory">
          {children}
        </div>
      </div>
    </section>
  );
}

export default function UpgradePlanDetailPage() {
  const params = useParams();
  const planRaw = Array.isArray((params as any)?.plan) ? (params as any).plan[0] : (params as any)?.plan;
  const plan: PlanKey | null = ['premium','vip'].includes(String(planRaw)) ? (planRaw as PlanKey) : null;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!plan) return;
    const run = async () => {
      try {
        setLoading(true); setErr(null);
        const res = await subscriptionCatalogAPI.details(plan);
        setData(res.data?.data?.[plan] || { ebooks: [], podcasts: [] });
      } catch (e: any) {
        setErr(e?.message || 'Failed to load plan details');
      } finally { setLoading(false); }
    };
    run();
  }, [plan]);

  if (!plan) return <div className="p-6 text-red-600">Invalid plan.</div>;
  if (loading) return <div className="p-6">Loading…</div>;
  if (err) return <div className="p-6 text-red-600">Error: {err}</div>;

  const ebooks = (data?.ebooks || []).map((b: any) => ({ id: b.id, title: b.title, cover: toAbs(b.thumbnail_url) }));
  const podcasts = (data?.podcasts || []).map((p: any) => ({ id: p.id, title: p.title, cover: toAbs(p.thumbnail_url), price_cents: p.price_cents }));

  return (
    <section className="space-y-6">
      <div className="px-4 md:px-8">
        <div className="text-sm"><Link href="/upgrade" className="hover:underline">← Back to Upgrade</Link></div>
        <h1 className="text-3xl font-bold mt-2">{plan.toUpperCase()} – Included Titles</h1>
        <p className="text-zinc-600">These books and podcasts are unlocked when you subscribe.</p>
      </div>

      <RowWithArrows title="Books included">
        {(ebooks || []).map((b: any) => (
          <div key={b.id} className="snap-start shrink-0 basis-[calc((100vw-8rem)/2)] sm:basis-[calc((100vw-10rem)/3)] md:basis-[calc((100vw-14rem)/5)]">
            <BookCard book={b} />
          </div>
        ))}
      </RowWithArrows>

      <RowWithArrows title="Podcasts included">
        {(podcasts || []).map((p: any) => (
          <div key={p.id} className="snap-start shrink-0 basis-[calc((100vw-8rem)/1.2)] sm:basis-[calc((100vw-10rem)/1.6)] md:basis-[calc((100vw-14rem)/3)]">
            <PodcastCard podcast={p} variant="wide" />
          </div>
        ))}
      </RowWithArrows>
    </section>
  );
}

