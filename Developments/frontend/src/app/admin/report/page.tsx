"use client";

import React, { useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { normalizeRole } from "@/lib/role";

/* ================= Types & utils ================= */
type IncomeResp = {
  success: boolean;
  data: {
    mode: "day" | "month";
    labels: string[];
    revenue_cents: number[];
    summary: { orders: number; subs: number; products: number };
  };
};
type DailyResp = {
  success: boolean;
  data: { labels: string[]; orders: number[]; subscriptions: number[]; products: number[] };
};

const fmtUSD = (cents: number) => ((cents || 0) / 100).toFixed(1);

/* ================= Color palette (4 charts) ================= */
const CHART_COLORS = {
  revenue: { line: "#2563eb", areaTop: "#2563eb", areaMid: "#93c5fd" }, // blue
  orders: { line: "#10b981", areaTop: "#10b981", areaMid: "#86efac" },  // emerald/green
  subs:   { line: "#f59e0b", areaTop: "#f59e0b", areaMid: "#fcd34d" },  // amber/orange
  products:{ line:"#8b5cf6", areaTop: "#8b5cf6", areaMid: "#c4b5fd" },  // violet/purple
};


/* ================ Page ================ */
export default function AdminReportPage() {
  const { user } = useAuth();
  const role = normalizeRole(user);
  const adminName = user?.name || user?.email || "Unknown";
  const adminEmail = user?.email || "unknown@example.com";
  const [mode, setMode] = useState<"day" | "month">("day");
  const [from, setFrom] = useState<string>(() => new Date(Date.now() - 13 * 86400000).toISOString().slice(0, 10));
  const [to, setTo] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [fromM, setFromM] = useState<string>(() =>
    new Date(new Date().getFullYear(), new Date().getMonth() - 1).toISOString().slice(0, 7)
  );
  const [toM, setToM] = useState<string>(() => new Date().toISOString().slice(0, 7));
  const [income, setIncome] = useState<IncomeResp["data"] | null>(null);
  const [loadingTop, setLoadingTop] = useState(false);

  const [fromMini, setFromMini] = useState<string>(() => new Date(Date.now() - 13 * 86400000).toISOString().slice(0, 10));
  const [toMini, setToMini] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [mini, setMini] = useState<DailyResp["data"] | null>(null);
  const [loadingMini, setLoadingMini] = useState(false);

  // === Today / current month for date constraints ===
  const TODAY_DATE = new Date().toISOString().slice(0, 10);
  const THIS_MONTH = new Date().toISOString().slice(0, 7);

  const buildParams = () => {
    if (mode === "day") return { mode: "day", from, to } as const;
    return { mode: "month", from_month: fromM, to_month: toM } as const;
  };

  // Removed server-side export action as requested

  const handlePrintPdf = () => {
    // Client-side print to PDF with neon theme and professional layout
    // The print-ready DOM lives in this component and is shown only in @media print
    try {
      window.print();
    } catch (e) {
      alert("Unable to open print dialog. Please use your browser's print to PDF.");
    }
  };

  const handleShare = async () => {
    try {
      if (mode === "day") validateDayRange(from, to);
      else validateMonthRange(fromM, toM);

      const payload = buildParams() as any;
      const res = await api.post(`/v1/admin/reports/income/share`, payload);
      const url = res?.data?.data?.url;
      if (!url) throw new Error("No share URL returned");
      try {
        await navigator.clipboard.writeText(url);
        alert("Copied share link to clipboard:\n" + url);
      } catch {
        window.open(url, "_blank");
        window.prompt("Share link (copy):", url);
      }
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || "Failed to create share link");
    }
  };

  const validateDayRange = (a: string, b: string) => {
    const d1 = new Date(a + "T00:00:00");
    const d2 = new Date(b + "T00:00:00");
    if (!(d1 < d2)) throw new Error("From date must be earlier than To date");
    const diff = Math.abs(+d2 - +d1) / 86400000 + 1;
    if (diff < 14 || diff > 92) throw new Error("Range must be 14–92 days");
  };
  const validateMonthRange = (a: string, b: string) => {
    const [ay, am] = a.split("-").map(Number);
    const [by, bm] = b.split("-").map(Number);
    const cmp = (by - ay) * 12 + (bm - am);
    if (!(cmp > 0)) throw new Error("From month must be earlier than To month");
    const diff = cmp + 1; // inclusive months
    if (diff < 1 || diff > 6) throw new Error("Month range must be 1–6 months");
  };

  const loadTop = async () => {
    setLoadingTop(true);
    try {
      if (mode === "day") {
        validateDayRange(from, to);
        const res = await api.get(`/v1/admin/reports/income`, { params: { mode: "day", from, to } });
        setIncome(res.data?.data);
      } else {
        validateMonthRange(fromM, toM);
        const res = await api.get(`/v1/admin/reports/income`, {
          params: { mode: "month", from_month: fromM, to_month: toM },
        });
        setIncome(res.data?.data);
      }
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || "Failed to load income report");
      setIncome(null);
    } finally {
      setLoadingTop(false);
    }
  };

  const loadMini = async () => {
    setLoadingMini(true);
    try {
      validateDayRange(fromMini, toMini);
      const res = await api.get(`/v1/admin/reports/daily`, { params: { from: fromMini, to: toMini } });
      setMini(res.data?.data);
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || "Failed to load daily metrics");
      setMini(null);
    } finally {
      setLoadingMini(false);
    }
  };

  useEffect(() => {
    loadTop();
  }, [mode]);
  useEffect(() => {
    loadMini();
  }, []);

  const topSummary = income?.summary || { orders: 0, subs: 0, products: 0 };

  // Build human-friendly range text for the report header
  const rangeLabel = mode === "day" ? `${from} → ${to}` : `${fromM} → ${toM}`;
  const generatedAt = new Date().toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Trend helper: compare average of first half vs last half
  const trendOf = (values: number[]) => {
    if (!values || values.length < 2) return "Steady" as const;
    const n = values.length;
    const mid = Math.floor(n / 2);
    const avg = (arr: number[]) => (arr.reduce((s, v) => s + (Number(v) || 0), 0) / Math.max(1, arr.length));
    const a = avg(values.slice(0, mid));
    const b = avg(values.slice(mid));
    const diff = b - a;
    const tol = Math.max(1, a) * 0.05; // 5% tolerance
    if (diff > tol) return "Growth" as const;
    if (diff < -tol) return "Decline" as const;
    return "Steady" as const;
  };

  return (
    <section id="report-print-root" className="relative">
      {/* nền nhẹ */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute -bottom-24 -right-10 h-72 w-72 rounded-full bg-cyan-200/30 blur-3xl" />
      </div>

      {/* container full width */}
      <div id="screen-only" className="mx-auto max-w-none px-0">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            {/* Simple SOUL logo for context (top-left) */}
            <div className="relative">
              <div className="absolute inset-0 blur-md opacity-60 bg-gradient-to-tr from-indigo-500 via-fuchsia-500 to-rose-500 rounded-xl" />
              <div className="relative h-10 w-10 grid place-items-center rounded-xl bg-gradient-to-tr from-indigo-500 via-fuchsia-500 to-rose-500 text-white font-bold shadow-md">
                S
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold tracking-tight leading-none">SOUL</div>
              <div className="text-xs text-zinc-500">Income and Activity Report</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrintPdf} className="rounded-xl bg-[color:var(--brand-500)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[color:var(--brand-600)]" title="Export PDF">
              Export
            </button>
            <button onClick={handleShare} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700">Share</button>
          </div>
        </div>

        {/* Card full-bleed */}
        <div className="rounded-none border-y bg-white/90 p-4 shadow-sm backdrop-blur sm:rounded-3xl sm:mx-4 sm:p-6 lg:mx-8">
          {/* Controls */}
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-xl font-semibold">Revenue</div>
              <div className="text-sm text-zinc-600">Real-time metrics from your database</div>
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <div className="inline-flex overflow-hidden rounded-2xl border bg-white">
                <button
                  onClick={() => setMode("day")}
                  className={`px-4 py-2 text-sm ${mode === "day" ? "bg-zinc-900 text-white" : "hover:bg-zinc-50"}`}
                >
                  Day range
                </button>
                <button
                  onClick={() => setMode("month")}
                  className={`px-4 py-2 text-sm ${mode === "month" ? "bg-zinc-900 text-white" : "hover:bg-zinc-50"}`}
                >
                  Month range
                </button>
              </div>

              {mode === "day" ? (
                <div className="flex items-end gap-3">
                  <LabeledInput label="From" type="date" value={from} onChange={(v) => setFrom(v > TODAY_DATE ? TODAY_DATE : v)} max={TODAY_DATE} />
                  <LabeledInput label="To" type="date" value={to} onChange={(v) => setTo(v > TODAY_DATE ? TODAY_DATE : v)} max={TODAY_DATE} />
                  <button
                    onClick={loadTop}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
                  >
                    Apply
                  </button>
                </div>
              ) : (
                <div className="flex items-end gap-3">
                  <LabeledInput label="From month" type="month" value={fromM} onChange={(v) => setFromM(v > THIS_MONTH ? THIS_MONTH : v)} max={THIS_MONTH} />
                  <LabeledInput label="To month" type="month" value={toM} onChange={(v) => setToM(v > THIS_MONTH ? THIS_MONTH : v)} max={THIS_MONTH} />
                  <button
                    onClick={loadTop}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Big chart very wide */}
          <div className="relative rounded-2xl border bg-white p-2 sm:p-3 md:p-4">
            {income && (
              <InteractiveLineChart
                labels={income.labels}
                values={income.revenue_cents}
                color={CHART_COLORS.revenue}
                yTicks={5}
                xGrids={14}
                height={620}
                unit="USD"
                xUnit="days"
                formatY={(n) => ((n || 0) / 100).toFixed(1)}
                tickLongEnds
                axisEmphasis="normal"
              />
            )}
            {loadingTop && (
              <div className="absolute inset-0 grid place-items-center rounded-2xl bg-white/60 text-sm">Loading…</div>
            )}
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Stat title="Total Orders" value={String(topSummary.orders)} />
            <Stat title="Plan Purchases" value={String(topSummary.subs)} />
            <Stat title="Total Products" value={String(topSummary.products)} />
          </div>
        </div>

        {/* Bottom filter */}
        <div className="mt-6 flex flex-wrap items-end gap-3 px-4 sm:px-6 lg:px-8">
          <LabeledInput label="From" type="date" value={fromMini} onChange={(v) => setFromMini(v > TODAY_DATE ? TODAY_DATE : v)} max={TODAY_DATE} />
          <LabeledInput label="To" type="date" value={toMini} onChange={(v) => setToMini(v > TODAY_DATE ? TODAY_DATE : v)} max={TODAY_DATE} />
          <button
            onClick={loadMini}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            Apply
          </button>
          <span className="text-xs text-zinc-500">(Min 14 days, Max 3 months)</span>
        </div>

        {/* === 3 charts: mỗi cái full-width, xuống hàng riêng === */}
        <div className="mt-4 grid grid-cols-1 gap-6 px-0 sm:px-4 lg:px-8">
          <MiniChart
            title="Orders"
            labels={mini?.labels || []}
            values={mini?.orders || []}
            yTicks={5}
            unit="orders"
            color={CHART_COLORS.orders}
            tickLongEnds
            axisEmphasis="strong"
            height={520}       
          />
          <MiniChart
            title="Plan Purchases"
            labels={mini?.labels || []}
            values={mini?.subscriptions || []}
            yTicks={5}
            unit="subscriptions"
            color={CHART_COLORS.subs}
            tickLongEnds
            axisEmphasis="strong"
            height={520}       
          />
          <MiniChart
            title="Products"
            labels={mini?.labels || []}
            values={mini?.products || []}
            yTicks={5}
            unit="products"
            color={CHART_COLORS.products}
            tickLongEnds
            axisEmphasis="normal"
            height={420}       
          />
        </div>
      </div>
      {/* Print-only: Neon PDF layout (moved outside screen-only for clean printing) */}
      <PrintDocument
        adminName={adminName}
        adminEmail={adminEmail}
        adminRole={role}
        rangeLabel={rangeLabel}
        generatedAt={generatedAt}
        mode={mode}
        income={income}
        mini={mini}
        fmtUSD={fmtUSD}
        trendOf={trendOf}
      />
    </section>
  );
}

/* ============== UI helpers ============== */
function LabeledInput({
  label,
  type,
  value,
  onChange,
  max,
}: {
  label: string;
  type: "date" | "month" | "text";
  value: string;
  onChange: (v: string) => void;
  max?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-zinc-500">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        max={max}
        className="h-10 rounded-xl border bg-white px-3 text-sm shadow-sm outline-none ring-blue-500/20 focus:ring-4"
      />
    </label>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-white/90 p-4 shadow-sm">
      <div className="text-sm text-zinc-600">{title}</div>
      <div className="text-2xl font-extrabold tracking-tight text-zinc-900">{value}</div>
    </div>
  );
}

/* ============== Print Document (Neon PDF) ============== */
function PrintDocument({
  adminName,
  adminEmail,
  adminRole,
  rangeLabel,
  generatedAt,
  mode,
  income,
  mini,
  fmtUSD,
  trendOf,
}: {
  adminName: string;
  adminEmail: string;
  adminRole: string;
  rangeLabel: string;
  generatedAt: string;
  mode: "day" | "month";
  income: IncomeResp["data"] | null;
  mini: DailyResp["data"] | null;
  fmtUSD: (cents: number) => string;
  trendOf: (values: number[]) => "Growth" | "Decline" | "Steady";
}) {
  // Build trend captions for charts
  const revenueTrend = trendOf(income?.revenue_cents || []);
  const ordersTrend = trendOf(mini?.orders || []);
  const subsTrend = trendOf(mini?.subscriptions || []);
  const productsTrend = trendOf(mini?.products || []);

  return (
    <div className="hidden print:block">
      <style jsx global>{`
        @media print {
          @page { size: A4; margin: 14mm; }
          html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0 !important; padding: 0 !important; }
          /* Hide the on-screen UI completely so no blank pages are laid out */
          #screen-only { display: none !important; }
          /* Ensure print document flows from page 1 */
          #soul-print-doc { position: static !important; width: auto !important; }
          /* Fallback for gradient title in print */
          #soul-print-doc .print-title { background: none !important; color: #111 !important; -webkit-text-fill-color: #111 !important; }
        }
      `}</style>

      <div id="soul-print-doc" className="text-[13px]">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            <div className="absolute inset-0 blur-md opacity-70 bg-gradient-to-tr from-indigo-500 via-fuchsia-500 to-rose-500 rounded-xl" />
            <div className="relative h-12 w-12 grid place-items-center rounded-xl bg-gradient-to-tr from-indigo-500 via-fuchsia-500 to-rose-500 text-white font-bold shadow-md">
              S
            </div>
          </div>
          <div>
            <div className="text-2xl font-black tracking-tight">SOUL</div>
            <div className="text-[11px] text-zinc-600">Stories Online, Unified Library</div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-600">Official Report</div>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[color:var(--neon-from)] via-[color:var(--neon-via)] to-[color:var(--neon-to)] print-title">
            Income and Activity Report
          </h1>
          <div className="text-sm text-zinc-700 mt-1">Period: {rangeLabel}</div>
        </div>

        {/* Meta */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="rounded-xl p-3 border bg-gradient-to-br from-white to-white/90">
            <div className="text-xs text-zinc-500">Generated By</div>
            <div className="font-semibold">{adminName}</div>
            <div className="text-xs text-zinc-600">Role: {adminRole || "admin"}</div>
            <div className="text-xs text-zinc-600">Email: {adminEmail}</div>
          </div>
          <div className="rounded-xl p-3 border bg-gradient-to-br from-white to-white/90">
            <div className="text-xs text-zinc-500">Generated At</div>
            <div className="font-semibold">{generatedAt}</div>
            <div className="text-xs text-zinc-600">Scope: Income, Orders, Subscriptions, Products</div>
          </div>
        </div>

        {/* Introduction */}
        <section className="mb-6">
          <h2 className="text-xl font-bold mb-2">Introduction</h2>
          <p className="text-[13px] text-zinc-700">
            This document provides a comprehensive overview of SOUL platform revenue and operational activity for the selected period. All charts reflect live data aggregated by day or by month, and captions summarize overall trends: growth, decline, or steady state.
          </p>
        </section>

        {/* Body */}
        <section className="mb-6">
          <h2 className="text-xl font-bold mb-3">Body</h2>
          {/* Revenue chart */}
          {income && (
            <div className="mb-2">
              <div className="text-sm font-semibold mb-2">Revenue (USD)</div>
              <div className="border rounded-xl p-2">
                <InteractiveLineChart
                  labels={income.labels}
                  values={income.revenue_cents}
                  color={CHART_COLORS.revenue}
                  yTicks={5}
                  xGrids={14}
                  height={420}
                  unit="USD"
                  xUnit={mode === "day" ? "days" : "months"}
                  formatY={(n) => ((n || 0) / 100).toFixed(1)}
                  tickLongEnds
                  axisEmphasis="normal"
                />
              </div>
              <div className="text-[12px] text-zinc-600 mt-1">Overall trend: {revenueTrend}</div>
            </div>
          )}

          {/* Orders */}
          {mini && (
            <div className="mt-4">
              <div className="text-sm font-semibold mb-2">Orders</div>
              <div className="border rounded-xl p-2">
                <MiniChart
                  title="Orders"
                  labels={mini.labels}
                  values={mini.orders}
                  yTicks={5}
                  unit="orders"
                  color={CHART_COLORS.orders}
                  tickLongEnds
                  axisEmphasis="strong"
                  height={360}
                />
              </div>
              <div className="text-[12px] text-zinc-600 mt-1">Overall trend: {ordersTrend}</div>
            </div>
          )}

          {/* Subscriptions */}
          {mini && (
            <div className="mt-4">
              <div className="text-sm font-semibold mb-2">Plan Purchases</div>
              <div className="border rounded-xl p-2">
                <MiniChart
                  title="Plan Purchases"
                  labels={mini.labels}
                  values={mini.subscriptions}
                  yTicks={5}
                  unit="subscriptions"
                  color={CHART_COLORS.subs}
                  tickLongEnds
                  axisEmphasis="strong"
                  height={360}
                />
              </div>
              <div className="text-[12px] text-zinc-600 mt-1">Overall trend: {subsTrend}</div>
            </div>
          )}

          {/* Products */}
          {mini && (
            <div className="mt-4">
              <div className="text-sm font-semibold mb-2">Products</div>
              <div className="border rounded-xl p-2">
                <MiniChart
                  title="Products"
                  labels={mini.labels}
                  values={mini.products}
                  yTicks={5}
                  unit="products"
                  color={CHART_COLORS.products}
                  tickLongEnds
                  axisEmphasis="normal"
                  height={320}
                />
              </div>
              <div className="text-[12px] text-zinc-600 mt-1">Overall trend: {productsTrend}</div>
            </div>
          )}
        </section>

        {/* Conclusion */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-2">Conclusion</h2>
          <p className="text-[13px] text-zinc-700">
            The above charts summarize the platform’s performance over the selected timeframe. Use these insights to inform product planning, marketing activities, and capacity forecasting. For detailed breakdowns, consult the admin dashboard.
          </p>
        </section>

        {/* Footer */}
        <footer className="pt-4 border-t">
          <div className="text-[12px] text-zinc-700">
            Contact: (+84) 901 234 567 • hello@soul.app • {adminEmail}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Internal circulation document</div>
        </footer>
      </div>
    </div>
  );
}

/* ============== Charts ============== */
function MiniChart({
  title,
  labels,
  values,
  yTicks,
  unit = "",
  className = "",
  color,
  tickLongEnds,
  axisEmphasis = "normal",
  height = 420,
}: {
  title: string;
  labels: string[];
  values: number[];
  yTicks: number;
  unit?: string;
  className?: string;
  color: { line: string; areaTop: string; areaMid: string };
  tickLongEnds?: boolean;
  axisEmphasis?: "normal" | "strong";
  height?: number;
}) {
  return (
    <div className={`rounded-3xl border bg-white/90 p-4 shadow-sm ${className}`}>
      <div className="mb-2 text-sm font-medium">{title}</div>
      <InteractiveLineChart
        labels={labels}
        values={values}
        yTicks={yTicks}
        xGrids={7}
        height={height}
        unit={unit}
        xUnit="days"
        formatY={(n) => `${Number(n || 0).toFixed(1)}`}
        color={color}
        tickLongEnds={tickLongEnds}
        axisEmphasis={axisEmphasis}
      />
    </div>
  );
}

/** SVG chart: lưới Y nét đứt kéo dài, đường cong mượt, hover bám chuột
 *  - FIX: trục Y “nice scale” + headroom để không tràn khung
 *  - FIX: chiều cao viewBox bám theo prop `height` => trục đứng thật sự dài hơn
 */
/** SVG chart: lưới Y nét đứt kéo dài, đường cong mượt, hover bám chuột
 *  - Unit label (trục Y) hiển thị NGANG, đặt phía TRÊN trục Y
 *  - Lề trái (left) tính động theo độ dài nhãn Y để không bị chồng lấn
 *  - Nice scale + headroom tránh tràn khung
 */
function InteractiveLineChart({
  labels,
  values,
  yTicks = 5,
  xGrids = 14,
  height = 600,
  unit = "",
  xUnit,
  formatY = (n: number) => Number(n).toFixed(1),
  color,
  tickLongEnds = false,
  axisEmphasis = "normal",
}: {
  labels: string[];
  values: number[];
  yTicks?: number;
  xGrids?: number;
  height?: number;
  unit?: string; // y-axis unit
  xUnit?: string; // x-axis unit label
  formatY?: (n: number) => string;
  color: { line: string; areaTop: string; areaMid: string };
  tickLongEnds?: boolean;
  axisEmphasis?: "normal" | "strong";
}) {
  // ===== helper: nice number rounding (1,2,5 * 10^k) =====
  const niceCeil = (x: number) => {
    if (x <= 0) return 1;
    const exp = Math.floor(Math.log10(x));
    const f = x / Math.pow(10, exp);
    let nf = 1;
    if (f <= 1) nf = 1;
    else if (f <= 2) nf = 2;
    else if (f <= 5) nf = 5;
    else nf = 10;
    return nf * Math.pow(10, exp);
  };

  // viewBox CHẠY THEO height để trục đứng dài ra thật
  const vbH = Math.max(360, Math.floor(height));
  const vb = { w: 1600, h: vbH };

  // ==== Y scale: headroom + nice ceil ====
  const rawMax = Math.max(0, ...values);
  const padded = rawMax * 1.1; // +10% headroom
  const maxYBase = niceCeil(padded);
  const maxY = Math.max(1, maxYBase);

  // Ước lượng độ rộng nhãn lớn nhất ở trục Y để dành lề trái đủ rộng
  const largestLabel = formatY(maxY);
  const approxLabelW = largestLabel.length * 7.2; // ước lượng ~7.2px mỗi ký tự
  const tickLenBase = 12;
  const extraGap = 10;
  const baseLeft = 56;
  const left = Math.max(baseLeft, 16 + tickLenBase + approxLabelW + extraGap);

  // Tăng đệm phía trên để chừa chỗ cho unit label nằm NGANG
  const top = 32;            // trước đây là 10 → tăng để đặt nhãn
  const right = 16;
  const bottom = vb.h - 22;

  const chartW = vb.w - left - right;
  const chartH = bottom - top;

  const N = Math.max(1, labels.length);
  const step = N > 1 ? chartW / (N - 1) : 0;
  const toX = (i: number) => left + i * step;
  const toY = (v: number) => bottom - (v / maxY) * chartH;

  // ---- smooth path (Catmull-Rom -> Cubic Bézier) ----
  const pts = values.map((v, i) => ({ x: toX(i), y: toY(v || 0) }));
  const getSmoothPath = (p: { x: number; y: number }[]) => {
    if (p.length === 0) return "";
    if (p.length === 1) return `M ${p[0].x} ${p[0].y}`;
    let d = `M ${p[0].x} ${p[0].y}`;
    for (let i = 0; i < p.length - 1; i++) {
      const p0 = i > 0 ? p[i - 1] : p[i];
      const p1 = p[i];
      const p2 = p[i + 1];
      const p3 = i !== p.length - 2 ? p[i + 2] : p2;
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };
  const pathD = getSmoothPath(pts);

  const [hover, setHover] = useState<{ x: number; y: number; value: number } | null>(null);
  const ref = useRef<SVGSVGElement | null>(null);
  const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));

  // nội suy tuyến tính để marker nằm đúng vị trí chuột
  const interpolateAt = (xPx: number) => {
    const pos = clamp((xPx - left) / (step || 1), 0, N - 1);
    const iL = Math.floor(pos);
    const iR = Math.ceil(pos);
    const t = iL === iR ? 0 : (pos - iL) / (iR - iL);
    const v = ((values[iL] || 0) as number) * (1 - t) + ((values[iR] || 0) as number) * t;
    return { x: left + pos * step, y: toY(v), v };
  };

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const xi = clamp(x, left, vb.w - right);
    const itp = interpolateAt(xi);
    setHover({ x: itp.x, y: itp.y, value: itp.v });
  };

  const handleLeave = () => setHover(null);

  // Style cho trục & nhãn
  const AXIS = axisEmphasis === "strong"
    ? { axisW: 3, tickW: 2.6, tickLen: tickLongEnds ? 16 : 12, font: 15 }
    : { axisW: 2.2, tickW: 2.0, tickLen: tickLongEnds ? 14 : 10, font: 13 };

  // ClipPath và gradient/hiệu ứng theo màu
  const idBase = React.useId();
  const clipId = `clip-${idBase}`;
  const gradId = `grad-${idBase}`;
  const glowId = `glow-${idBase}`;

  // Path area phủ dưới đường (đóng kín)
  const areaD =
    `${pathD} L ${pts.length ? pts[pts.length - 1].x : left} ${bottom} ` +
    `L ${pts.length ? pts[0].x : left} ${bottom} Z`;

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${vb.w} ${vb.h}`}
      className="w-full"
      style={{ height }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color.areaTop} stopOpacity="0.45" />
          <stop offset="55%" stopColor={color.areaMid} stopOpacity="0.22" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.85" />
        </linearGradient>
        <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.0" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id={clipId}>
          <rect x={left} y={top} width={chartW} height={chartH} rx="0" ry="0" />
        </clipPath>
      </defs>
      <rect x="0" y="0" width={vb.w} height={vb.h} fill="#ffffff" />

      {/* Axes */}
      <line x1={left} y1={top} x2={left} y2={bottom} stroke="#e5e7eb" strokeWidth={AXIS.axisW} />
      <line x1={left} y1={bottom} x2={vb.w - right} y2={bottom} stroke="#e5e7eb" strokeWidth={AXIS.axisW} />

      {/* Unit label (NGANG) — đặt TRÊN trục Y */}
      {unit && (
        <text
          x={left}                 // ngay trên trục Y
          y={top - 8}              // phía trên vùng biểu đồ
          textAnchor="start"
          fontSize={axisEmphasis === "strong" ? 14 : 12}
          fontWeight={600}
          fill="#334155"
        >
          {unit}
        </text>
      )}

      {/* Grids dọc nhẹ */}
      {Array.from({ length: xGrids }).map((_, i) => {
        const x = left + (i / (xGrids - 1)) * chartW;
        return <line key={i} x1={x} y1={top} x2={x} y2={bottom} stroke="#f1f5f9" />;
      })}

      {/* Area + line + nodes */}
      <g clipPath={`url(#${clipId})`}>
        <path d={areaD} fill={`url(#${gradId})`} opacity={1}>
          <animate attributeName="opacity" from="0" to="1" dur="0.8s" fill="freeze" />
        </path>

        <path
          d={pathD}
          fill="none"
          stroke={color.line}
          strokeWidth={3.2}
          filter={`url(#${glowId})`}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1}
        >
          <animate attributeName="stroke-dashoffset" from={1} to={0} dur="1.2s" fill="freeze" />
        </path>

        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="0" fill={color.line}>
            <animate attributeName="r" from="0" to="3.2" dur="0.5s" begin={`${0.2 + i * 0.02}s`} fill="freeze" />
          </circle>
        ))}
      </g>

      {/* Y ticks + dashed grid + nhãn (để SAU cùng để nổi lên trên) */}
      {Array.from({ length: yTicks + 1 }).map((_, i) => {
        const frac = i / yTicks;
        const y = bottom - frac * chartH;
        const val = frac * maxY;
        return (
          <g key={i}>
            <line x1={left - AXIS.tickLen} y1={y} x2={left} y2={y} stroke="#64748b" strokeWidth={AXIS.tickW} />
            <line x1={left} y1={y} x2={vb.w - right} y2={y} stroke="#e2e8f0" strokeDasharray="4 4" />
            <text
              x={left - AXIS.tickLen - 4}
              y={y + 5}
              textAnchor="end"
              fontSize={AXIS.font}
              fill="#475569"
            >
              {formatY(val)}
            </text>
          </g>
        );
      })}

      {/* X labels */}
      {labels.map((l, i) => {
        if (i % Math.max(1, Math.round(labels.length / Math.max(1, xGrids))) !== 0 && i !== labels.length - 1)
          return null;
        const x = left + i * step;
        const labelFont = AXIS.font;
        return (
          <g key={i}>
            <line x1={x} y1={bottom} x2={x} y2={bottom + AXIS.tickLen * 0.6} stroke="#64748b" strokeWidth={AXIS.tickW} />
            <text x={x} y={bottom + AXIS.tickLen * 0.6 + labelFont + 2} textAnchor="middle" fontSize={labelFont} fill="#475569">
              {String(l).slice(5)}
            </text>
          </g>
        );
      })}

      {/* X unit (nếu cần) */}
      {xUnit && (
        <text
          x={vb.w - right}
          y={bottom + AXIS.tickLen * 0.6 + (axisEmphasis === "strong" ? 22 : 20)}
          textAnchor="end"
          fontSize={axisEmphasis === "strong" ? 14 : 12}
          fill="#64748b"
        >
          {xUnit}
        </text>
      )}

      {/* Hover */}
      {hover && (
        <g>
          <line x1={hover.x} y1={top} x2={hover.x} y2={bottom} stroke="#94a3b8" strokeDasharray="3 3" />
          <circle cx={hover.x} cy={hover.y} r="5" fill="#fff" stroke={color.line} strokeWidth={2} />
          <g transform={`translate(${hover.x - 46}, ${hover.y - 34})`}>
            <rect width="92" height="24" rx="6" fill="#111827" />
            <text x="46" y="16" textAnchor="middle" fontSize={12} fill="#fff">
              {formatY(hover.value)}
              {unit ? " " + unit : ""}
            </text>
          </g>
        </g>
      )}
    </svg>
  );
}
