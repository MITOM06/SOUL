"use client";

import React, { useEffect, useState } from 'react';
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
  const labels = daily?.labels ?? [];
  const orders = daily?.orders ?? [];
  const revenue = daily?.revenue_cents ?? [];

  const maxOrders = Math.max(1, ...orders, 0);
  const maxRevenue = Math.max(1, ...revenue, 0);

  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-2">
          {[1,3,6].map((m) => (
            <button
              key={m}
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

      {/* ======= LARGE CHARTS — mỗi khung 1 dòng full-width ======= */}
      <div className="space-y-8">
        {/* Orders per day */}
        <div className="rounded-2xl border p-6 bg-white w-full">
          <div className="flex items-center justify-between mb-4">
            <div className="text-base font-medium text-zinc-700">Orders per day</div>
            <div className="text-xs text-zinc-500">Last {months} month(s)</div>
          </div>
          <BarChartFixed
            labels={labels}
            values={orders}
            maxY={maxOrders}
            yLabel="Orders"
            height={520}
          />
        </div>

        {/* Revenue trend */}
        <div className="rounded-2xl border p-6 bg-white w-full">
          <div className="flex items-center justify-between mb-4">
            <div className="text-base font-medium text-zinc-700">Revenue trend</div>
            <div className="text-xs text-zinc-500">Last {months} month(s)</div>
          </div>
          <LineChartFixed
            labels={labels}
            values={revenue}
            maxY={maxRevenue}
            yLabel="Revenue"
            height={520}
            formatY={formatUSD}
          />
        </div>
      </div>

      {/* ======= PIE BLOCK (giữ nguyên) ======= */}
      <PiesBlock data={data} />

      {loading && <div className="text-sm text-zinc-500">Loading…</div>}
    </section>
  );
}

/** ---------- PIE BLOCK ---------- */
function PiesBlock({ data }: { data: StatsResp | null }) {
  const planPie = data?.pies?.plans;
  const productPie = data?.pies?.products;
  const sum = (arr: number[]) => arr.reduce((a,b)=>a+b,0);

  return (
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
  );
}

/** ---------- FIXED-FRAME BAR CHART (full-width, ticks/labels ngoài khung, to hơn) ---------- */
function BarChartFixed({
  labels, values, maxY, yLabel, height = 520
}: {
  labels: string[];
  values: number[];
  maxY: number;
  yLabel: string;
  height?: number;
}) {
  // Khung vẽ cố định — đổi timeframe chỉ scale dữ liệu vào cùng plot area
  const vb = { w: 1200, h: 360 };
  const left = 110;                // rộng để nhãn Y ở ngoài
  const right = 24;
  const top = 30;
  const bottom = vb.h - 70;        // chừa đáy cho nhãn X to
  const chartW = vb.w - left - right;
  const chartH = bottom - top;

  const N = Math.max(1, labels.length);
  const step = chartW / N;                     // dàn đều vào cùng khung
  const barW = Math.max(6, step * 0.7);        // cột to
  const offset = (step - barW) / 2;

  const yTicks = 6;
  const labelStep = Math.max(1, Math.ceil(N / 8));
  const axisStroke = 1.5;
  const tickLen = 12;
  const fontY = 14;
  const fontX = 13;

  return (
    <svg viewBox={`0 0 ${vb.w} ${vb.h}`} className="w-full" style={{ height }}>
      <rect x="0" y="0" width={vb.w} height={vb.h} fill="#fff" />

      {/* Trục bám sát mép plot area */}
      <line x1={left} y1={top} x2={left} y2={bottom} stroke="#e5e7eb" strokeWidth={axisStroke} />
      <line x1={left} y1={bottom} x2={vb.w - right} y2={bottom} stroke="#e5e7eb" strokeWidth={axisStroke} />

      {/* Y ticks + nhãn (ngoài trục) + grid ngang */}
      {Array.from({ length: yTicks + 1 }).map((_, i) => {
        const frac = i / yTicks;
        const y = bottom - frac * chartH;
        const val = Math.round(frac * maxY);
        return (
          <g key={i}>
            <line x1={left - tickLen} y1={y} x2={left} y2={y} stroke="#9ca3af" strokeWidth={1.2} />
            <text x={left - tickLen - 8} y={y + 5} textAnchor="end" fontSize={fontY} fill="#475569" fontWeight={500}>
              {val}
            </text>
            <line x1={left} y1={y} x2={vb.w - right} y2={y} stroke="#f1f5f9" strokeWidth={1} />
          </g>
        );
      })}

      {/* Cột */}
      {values.map((v, i) => {
        const h = (v / maxY) * chartH;
        const x = left + i * step + offset;
        const y = bottom - h;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barW}
            height={Math.max(0, h)}
            rx="3"
            fill="#60a5fa"
          />
        );
      })}

      {/* X ticks + nhãn (ngoài đáy) */}
      {labels.map((l, i) => {
        if (i % labelStep !== 0 && i !== labels.length - 1) return null;
        const x = left + i * step + step / 2;
        return (
          <g key={i}>
            <line x1={x} y1={bottom} x2={x} y2={bottom + tickLen} stroke="#9ca3af" strokeWidth={1.2} />
            <text x={x} y={bottom + tickLen + 18} textAnchor="middle" fontSize={fontX} fill="#475569">
              {String(l).slice(5)}
            </text>
          </g>
        );
      })}

      {/* Nhãn trục */}
      <text x={left} y={top - 10} textAnchor="start" fontSize={15} fill="#334155" fontWeight={600}>{yLabel}</text>
      <text x={vb.w - right} y={bottom + tickLen + 30} textAnchor="end" fontSize={15} fill="#334155" fontWeight={600}>Date</text>
    </svg>
  );
}

/** ---------- FIXED-FRAME LINE CHART (full-width, ticks/labels ngoài khung, to hơn) ---------- */
function LineChartFixed({
  labels, values, maxY, yLabel, height = 520, formatY = (n: number) => String(n)
}: {
  labels: string[];
  values: number[];
  maxY: number;
  yLabel: string;
  height?: number;
  formatY?: (n: number) => string;
}) {
  const vb = { w: 1200, h: 360 };
  const left = 120;               // để vừa nhãn tiền tệ lớn
  const right = 24;
  const top = 30;
  const bottom = vb.h - 70;
  const chartW = vb.w - left - right;
  const chartH = bottom - top;

  const N = Math.max(1, labels.length);
  const step = N > 1 ? chartW / (N - 1) : 0;

  const yTicks = 6;
  const labelStep = Math.max(1, Math.ceil(N / 8));
  const axisStroke = 1.5;
  const tickLen = 12;
  const fontY = 14;
  const fontX = 13;

  const toY = (v: number) => bottom - (v / maxY) * chartH;
  const toX = (i: number) => left + i * step;

  const points = values.map((v, i) => `${toX(i)},${toY(v)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${vb.w} ${vb.h}`} className="w-full" style={{ height }}>
      <rect x="0" y="0" width={vb.w} height={vb.h} fill="#fff" />

      {/* Trục bám sát plot area */}
      <line x1={left} y1={top} x2={left} y2={bottom} stroke="#e5e7eb" strokeWidth={axisStroke} />
      <line x1={left} y1={bottom} x2={vb.w - right} y2={bottom} stroke="#e5e7eb" strokeWidth={axisStroke} />

      {/* Y ticks/nhãn (ngoài trục) + grid */}
      {Array.from({ length: yTicks + 1 }).map((_, i) => {
        const frac = i / yTicks;
        const y = bottom - frac * chartH;
        const val = Math.round(frac * maxY);
        return (
          <g key={i}>
            <line x1={left - tickLen} y1={y} x2={left} y2={y} stroke="#9ca3af" strokeWidth={1.2} />
            <text x={left - tickLen - 10} y={y + 5} textAnchor="end" fontSize={fontY} fill="#475569" fontWeight={500}>
              {formatY(val)}
            </text>
            <line x1={left} y1={y} x2={vb.w - right} y2={y} stroke="#f1f5f9" strokeWidth={1} />
          </g>
        );
      })}

      {/* Đường + điểm to hơn */}
      <polyline fill="none" stroke="#f59e0b" strokeWidth={3.2} points={points} />
      {values.map((v, i) => (
        <circle key={i} cx={toX(i)} cy={toY(v)} r="3.2" fill="#f59e0b" />
      ))}

      {/* X ticks/labels ngoài đáy */}
      {labels.map((l, i) => {
        if (i % labelStep !== 0 && i !== labels.length - 1) return null;
        const x = toX(i);
        return (
          <g key={i}>
            <line x1={x} y1={bottom} x2={x} y2={bottom + tickLen} stroke="#9ca3af" strokeWidth={1.2} />
            <text x={x} y={bottom + tickLen + 18} textAnchor="middle" fontSize={fontX} fill="#475569">
              {String(l).slice(5)}
            </text>
          </g>
        );
      })}

      {/* Nhãn trục */}
      <text x={left} y={top - 10} textAnchor="start" fontSize={15} fill="#334155" fontWeight={600}>{yLabel}</text>
      <text x={vb.w - right} y={bottom + tickLen + 30} textAnchor="end" fontSize={15} fill="#334155" fontWeight={600}>Date</text>
    </svg>
  );
}

/** ---------- Pie (nguyên bản) ---------- */
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
