"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { subscriptionCatalogAPI } from '@/lib/api';
import BookCard from '@/components/BookCard';
import PodcastCard from '@/components/PodcastCard';
import { toAbsoluteImgUrl as toAbs } from '@/lib/img';

type PlanKey = 'premium' | 'vip';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '');
const ORIGIN   = API_BASE.replace(/\/api$/, '');

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

  const ebooks = (data?.ebooks || []).map((b: any) => ({ id: b.id, title: b.title, cover: toAbs(b.thumbnail_url), price_cents: b.price_cents }));
  const podcasts = (data?.podcasts || []).map((p: any) => ({ id: p.id, title: p.title, cover: toAbs(p.thumbnail_url), price_cents: p.price_cents }));

  // Pricing and savings (derived, not hooks)
  const PLAN_PRICE: Record<PlanKey, number> = { premium: 19900, vip: 29900 };
  const sumCents = [...(data?.ebooks || []), ...(data?.podcasts || [])]
    .reduce((acc: number, it: any) => acc + (Number(it?.price_cents || 0) || 0), 0);
  const planPrice = plan ? PLAN_PRICE[plan] : 0;
  const saveCents = Math.max(0, sumCents - planPrice);
  const savePct = sumCents > 0 ? Math.round((saveCents / sumCents) * 100) : 0;
  const fmtUSD = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format((n || 0) / 100);

  // Theming per plan
  const theme = plan === 'vip'
    ? {
        bg: 'from-amber-50 via-yellow-50 to-orange-50',
        ring: 'ring-amber-200',
        badge: 'bg-amber-400 text-white',
        icon: '👑',
        title: 'VIP Plan',
        sub: 'Includes everything in Premium + VIP perks',
      }
    : {
        bg: 'from-indigo-50 via-violet-50 to-fuchsia-50',
        ring: 'ring-indigo-200',
        badge: 'bg-indigo-500 text-white',
        icon: '✨',
        title: 'Premium Plan',
        sub: 'Unlock premium books and podcasts',
      };

  return (
    <section className="space-y-6">
      {/* Hero with themed background */}
      <div className="relative w-screen left-[50%] right-[50%] -ml-[50vw] -mr-[50vw]">
        <div className={`px-4 md:px-8 py-8 bg-gradient-to-br ${theme.bg} ${theme.ring} ring-1 rounded-b-3xl overflow-hidden` }>
          <div className="max-w-5xl mx-auto">
            <div className="text-sm"><Link href="/upgrade" className="hover:underline">← Back to Upgrade</Link></div>
            <div className="mt-2 flex items-center gap-3">
              <div className="text-3xl md:text-4xl font-extrabold tracking-tight">{theme.icon} {theme.title}</div>
              <span className={`px-2 py-0.5 text-xs rounded-full ${theme.badge}`}>{plan?.toUpperCase()}</span>
            </div>
            {plan === 'vip' && (
              <div className="mt-2 text-sm font-semibold text-amber-700">Includes all Premium products</div>
            )}
            <p className="mt-1 text-zinc-700">{theme.sub}</p>

            {/* Savings panel */}
            <div className="mt-4 grid sm:grid-cols-3 gap-3">
              <div className="rounded-xl bg-white/80 backdrop-blur ring-1 ring-black/5 p-4">
                <div className="text-xs text-zinc-500">Total value if bought individually</div>
                <div className="text-2xl font-extrabold">{fmtUSD(sumCents)}</div>
              </div>
              <div className="rounded-xl bg-white/80 backdrop-blur ring-1 ring-black/5 p-4">
                <div className="text-xs text-zinc-500">{plan?.toUpperCase()} monthly price</div>
                <div className="text-2xl font-extrabold">{fmtUSD(planPrice)}</div>
              </div>
              <div className="rounded-xl bg-white/80 backdrop-blur ring-1 ring-black/5 p-4 relative overflow-hidden">
                <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,.25),transparent_60%)]" />
                <div className="text-xs text-zinc-500">You save</div>
                <div className="text-2xl font-extrabold text-emerald-700">{fmtUSD(saveCents)} <span className="text-sm font-semibold text-emerald-600">({savePct}% off)</span></div>
              </div>
            </div>
          </div>
        </div>
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
