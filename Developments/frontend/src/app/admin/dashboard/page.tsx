"use client";

import React, { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';

type StatsResp = {
  totals: { users: number; products: number; orders_paid: number; revenue_cents: number };
  timeframe: { months: number };
  series: { daily: { labels: string[]; orders: number[]; revenue_cents: number[] } };
  pies: { plans: { labels: string[]; values: number[] }; products: { labels: string[]; values: number[] } };
};

function formatUSD(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format((cents || 0) / 100);
}

export default function AdminDashboardPage() {
  const [months, setMonths] = useState<1|3|6>(6);
  const [data, setData] = useState<StatsResp | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async (m: 1|3|6) => {
    setLoading(true);
    try {
      const r = await api.get(`/v1/admin/stats?months=${m}`);
      const d = r.data?.data || r.data;
      setData(d as StatsResp);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(months); }, [months]);

  const totals = data?.totals || { users: 0, products: 0, orders_paid: 0, revenue_cents: 0 };

  const cards = [
    { title: 'Users', count: totals.users, link: '/admin/role/users', bg: 'bg-blue-100' },
    { title: 'Products', count: totals.products, link: '/admin/books', bg: 'bg-green-100' },
    { title: 'Orders (paid)', count: totals.orders_paid, link: '/admin/orders', bg: 'bg-yellow-100' },
    { title: 'Revenue', count: formatUSD(totals.revenue_cents), link: '/admin/orders', bg: 'bg-purple-100' },
  ];

  const daily = data?.series?.daily;
  const maxOrders = Math.max(1, ...(daily?.orders || [0]));
  const maxRevenue = Math.max(1, ...(daily?.revenue_cents || [0]));

  // Pie helpers
  const planPie = data?.pies?.plans;
  const productPie = data?.pies?.products;
  const sum = (arr: number[]) => arr.reduce((a,b)=>a+b,0);

  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-2">
          {[1,3,6].map((m) => (
            <button key={m}
              onClick={() => setMonths(m as 1|3|6)}
              className={`px-3 py-1.5 rounded-full border ${months===m?'bg-zinc-900 text-white':'bg-white text-zinc-700 hover:bg-zinc-50'}`}
            >{m} mo</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <a key={c.title} href={c.link} className={`block p-6 rounded-2xl shadow-sm ${c.bg} hover:shadow-md transition`}>
            <div className="text-3xl font-extrabold">{c.count}</div>
            <div className="text-sm text-zinc-700 mt-1">{c.title}</div>
          </a>
        ))}
      </div>

      {/* Large charts */}
      <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6">
        {/* Orders per day (huge bar) */}
        <div className="rounded-2xl border p-5 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-zinc-700">Orders per day</div>
            <div className="text-xs text-zinc-500">Last {months} month(s)</div>
          </div>
          <svg viewBox={`0 0 ${Math.max(120, (daily?.labels?.length||30)*4)} 120`} className="w-full h-[360px]">
            <rect x="0" y="0" width="100%" height="100%" fill="#fff" />
            {(daily?.orders || []).map((v, i) => {
              const h = (v / maxOrders) * 100;
              const x = i * 4 + 2; // dense bars
              const y = 110 - h;
              return <rect key={i} x={x} y={y} width="2.2" height={h} fill="#60a5fa" />
            })}
          </svg>
        </div>

        {/* Revenue trend (huge line) */}
        <div className="rounded-2xl border p-5 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-zinc-700">Revenue trend</div>
            <div className="text-xs text-zinc-500">Last {months} month(s)</div>
          </div>
          <svg viewBox={`0 0 ${Math.max(120, (daily?.labels?.length||30)*2)} 120`} className="w-full h-[360px]">
            <rect x="0" y="0" width="100%" height="100%" fill="#fff" />
            {(() => {
              const points: string[] = [];
              (daily?.revenue_cents || []).forEach((v, i) => {
                const y = 110 - ((v / maxRevenue) * 100);
                const x = i * 2 + 2;
                points.push(`${x},${y}`);
              });
              return (
                <>
                  <polyline fill="none" stroke="#f59e0b" strokeWidth="1.8" points={points.join(' ')} />
                  {(daily?.revenue_cents || []).map((v, i) => {
                    const y = 110 - ((v / maxRevenue) * 100);
                    const x = i * 2 + 2;
                    return <circle key={i} cx={x} cy={y} r="0.9" fill="#f59e0b" />
                  })}
                </>
              );
            })()}
          </svg>
        </div>
      </div>

      {/* Pies bigger */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border p-5 bg-white grid place-items-center">
          <div className="self-start text-sm text-zinc-700 mb-2">Active plan mix</div>
          <Pie labels={planPie?.labels || []} values={planPie?.values || []} colors={["#6366f1","#f59e0b","#10b981"]} />
          <div className="mt-2 text-xs text-zinc-600">Total: {sum(planPie?.values||[])} subs</div>
        </div>
        <div className="rounded-2xl border p-5 bg-white grid place-items-center">
          <div className="self-start text-sm text-zinc-700 mb-2">Products by type</div>
          <Pie labels={productPie?.labels || []} values={productPie?.values || []} colors={["#22c55e","#06b6d4"]} />
          <div className="mt-2 text-xs text-zinc-600">Total: {sum(productPie?.values||[])} products</div>
        </div>
      </div>

      {loading && <div className="text-sm text-zinc-500">Loading…</div>}
    </section>
  );
}

function Pie({ labels, values, colors }: { labels: string[]; values: number[]; colors: string[] }) {
  const total = Math.max(1, values.reduce((a,b)=>a+b,0));
  let acc = 0;
  const segs = values.map((v, i) => {
    const frac = v / total;
    const dash = `${(frac*100).toFixed(3)} ${(100 - frac*100).toFixed(3)}`;
    const el = (
      <circle key={i} cx="21" cy="21" r="15.915" fill="transparent" stroke={colors[i % colors.length]}
        strokeWidth="6" strokeDasharray={dash} strokeDashoffset={`${25 - acc*100}` as any} />
    );
    acc += frac;
    return el;
  });
  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 42 42" className="w-52 h-52 -rotate-90">
        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#e5e7eb" strokeWidth="6" />
        {segs}
      </svg>
      <div className="space-y-1 text-sm">
        {labels.map((l, i) => (
          <div key={l} className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: colors[i % colors.length] }} />
            <span>{l}</span>
            <span className="ml-1 text-zinc-500">({values[i] ?? 0})</span>
          </div>
        ))}
      </div>
    </div>
  );
}
