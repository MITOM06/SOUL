"use client";

import React, { useEffect, useRef, useState } from "react";
import api from "@/lib/api";

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

  const validateDayRange = (a: string, b: string) => {
    const d1 = new Date(a + "T00:00:00");
    const d2 = new Date(b + "T00:00:00");
    const diff = Math.abs(+d2 - +d1) / 86400000 + 1;
    if (diff < 14 || diff > 92) throw new Error("Range must be 14–92 days");
  };
  const validateMonthRange = (a: string, b: string) => {
    const [ay, am] = a.split("-").map(Number);
    const [by, bm] = b.split("-").map(Number);
    const diff = (by - ay) * 12 + (bm - am) + 1;
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

  return (
    <section className="relative">
      {/* nền nhẹ */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute -bottom-24 -right-10 h-72 w-72 rounded-full bg-cyan-200/30 blur-3xl" />
      </div>

      {/* container full width */}
      <div className="mx-auto max-w-none px-0">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight">Income Summary</h1>
          <div className="flex items-center gap-2">
            <button className="rounded-xl border bg-white/90 px-4 py-2 text-sm shadow-sm hover:bg-white">Export</button>
            <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700">
              Share
            </button>
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
                  <LabeledInput label="From" type="date" value={from} onChange={setFrom} />
                  <LabeledInput label="To" type="date" value={to} onChange={setTo} />
                  <button
                    onClick={loadTop}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
                  >
                    Apply
                  </button>
                </div>
              ) : (
                <div className="flex items-end gap-3">
                  <LabeledInput label="From month" type="month" value={fromM} onChange={setFromM} />
                  <LabeledInput label="To month" type="month" value={toM} onChange={setToM} />
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
                // Y: chỉ hiển thị 3 mốc cho khung tiền
                yTicks={5}
                xGrids={14}
                height={620} // to hơn
                unit="USD"
                xUnit="days"
                // thước đo 1 chữ số – dữ liệu là cents
                formatY={(n) => ((n || 0) / 100).toFixed(1)}
                // 3 đồ thị đầu tiên cần “vạch chia” dài gần chạm khung
                tickLongEnds
                // trục đậm bình thường
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
          <LabeledInput label="From" type="date" value={fromMini} onChange={setFromMini} />
          <LabeledInput label="To" type="date" value={toMini} onChange={setToMini} />
          <button
            onClick={loadMini}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            Apply
          </button>
          <span className="text-xs text-zinc-500">(Min 14 days, Max 3 months)</span>
        </div>

        {/* 2 chart trên 1 hàng, chart thứ 3 xuống hàng full-width */}
        <div className="mt-4 grid grid-cols-1 gap-6 px-0 sm:px-4 lg:grid-cols-2 lg:px-8">
          <MiniChart
            title="Orders"
            labels={mini?.labels || []}
            values={mini?.orders || []}
            yTicks={5}
            unit="orders"
            color={CHART_COLORS.orders}
            tickLongEnds
            // Một trong “2 đồ thị ở giữa” → trục & nhãn to/đậm hơn
            axisEmphasis="strong"
          />
          <MiniChart
            title="Plan Purchases"
            labels={mini?.labels || []}
            values={mini?.subscriptions || []}
            yTicks={5}
            unit="subscriptions"
            color={CHART_COLORS.subs}
            tickLongEnds
            // Cái thứ hai ở giữa → trục & nhãn to/đậm hơn
            axisEmphasis="strong"
          />
          <MiniChart
            title="Products"
            labels={mini?.labels || []}
            values={mini?.products || []}
            yTicks={5}
            unit="products"
            color={CHART_COLORS.products}
            className="lg:col-span-2"
            tickLongEnds
            axisEmphasis="normal"
          />
        </div>
      </div>
    </section>
  );
}

/* ============== UI helpers ============== */
function LabeledInput({
  label,
  type,
  value,
  onChange,
}: {
  label: string;
  type: "date" | "month" | "text";
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-zinc-500">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
}) {
  return (
    <div className={`rounded-3xl border bg-white/90 p-4 shadow-sm ${className}`}>
      <div className="mb-2 text-sm font-medium">{title}</div>
      <InteractiveLineChart
        labels={labels}
        values={values}
        yTicks={yTicks}
        // 3 khung dưới chỉ 7 đơn vị chia theo ngày
        xGrids={7}
        height={420} // to hơn
        unit={unit}
        xUnit="days"
        // Hiển thị giá trị; đơn vị hiển thị ở nhãn trục
        formatY={(n) => `${Number(n || 0).toFixed(1)}`}
        color={color}
        tickLongEnds={tickLongEnds}
        axisEmphasis={axisEmphasis}
      />
    </div>
  );
}

/** SVG chart: lưới Y nét đứt kéo dài, đường cong mượt, hover bám chuột */
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
  unit?: string; // y-axis unit: "USD", "orders", ...
  xUnit?: string; // x-axis unit label, e.g., "days"
  formatY?: (n: number) => string;
  color: { line: string; areaTop: string; areaMid: string };
  /** vạch chia trục dọc dài hơn, gần chạm hai đầu khung (3 đồ thị đầu tiên) */
  tickLongEnds?: boolean;
  /** làm trục & nhãn to/đậm hơn (2 đồ thị ở giữa) */
  axisEmphasis?: "normal" | "strong";
}) {
  // viewport rộng; trục X sát đáy, trục Y sát trái
  const vb = { w: 1600, h: 420 };
  const left = 56,
    right = 16,
    top = 10,
    bottom = vb.h - 22;
  const chartW = vb.w - left - right;
  const chartH = bottom - top;
  const N = Math.max(1, labels.length);
  const step = N > 1 ? chartW / (N - 1) : 0;
  const toX = (i: number) => left + i * step;
  const maxY = Math.max(1, ...values, 0);
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
      // Catmull-Rom to Bezier
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };
  const pathD = getSmoothPath(pts);

  // Nhịp label theo số ô dọc (xGrids)
  const labelStep = Math.max(1, Math.round(N / Math.max(1, xGrids)));
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
  const areaD = `${pathD} L ${pts.length ? pts[pts.length - 1].x : left} ${bottom} L ${pts.length ? pts[0].x : left} ${bottom} Z`;

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
        {/* gradient đổ bóng: từ màu đường → mid nhạt hơn → trắng gần đáy */}
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color.areaTop} stopOpacity="0.45" />
          <stop offset="55%" stopColor={color.areaMid} stopOpacity="0.22" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.85" />
        </linearGradient>
        {/* glow nhẹ cho đường */}
        <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.0" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* clip vùng biểu đồ để không tràn khỏi khung */}
        <clipPath id={clipId}>
          <rect x={left} y={top} width={chartW} height={chartH} rx="0" ry="0" />
        </clipPath>
      </defs>
      <rect x="0" y="0" width={vb.w} height={vb.h} fill="#ffffff" />

      {/* Axes (vẽ trước) */}
      <line x1={left} y1={top} x2={left} y2={bottom} stroke="#e5e7eb" strokeWidth={AXIS.axisW} />
      <line x1={left} y1={bottom} x2={vb.w - right} y2={bottom} stroke="#e5e7eb" strokeWidth={AXIS.axisW} />

      {/* Grids dọc nhẹ (đằng sau) */}
      {Array.from({ length: xGrids }).map((_, i) => {
        const x = left + (i / (xGrids - 1)) * chartW;
        return <line key={i} x1={x} y1={top} x2={x} y2={bottom} stroke="#f1f5f9" />;
      })}

      {/* Area + Smooth line & nodes (clip để không tràn) */}
      <g clipPath={`url(#${clipId})`}>
        {/* vùng màu gradient dưới đường */}
        <path d={areaD} fill={`url(#${gradId})`} opacity={1}>
          <animate attributeName="opacity" from="0" to="1" dur="0.8s" fill="freeze" />
        </path>

        {/* đường chính */}
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

        {/* nodes nhỏ hiện dần */}
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="0" fill={color.line}>
            <animate attributeName="r" from="0" to="3.2" dur="0.5s" begin={`${0.2 + i * 0.02}s`} fill="freeze" />
          </circle>
        ))}
      </g>

      {/* Y ticks + dashed grid + nhãn (VẼ SAU để luôn nằm TRÊN đồ thị) */}
      {Array.from({ length: yTicks + 1 }).map((_, i) => {
        const frac = i / yTicks;
        const y = bottom - frac * chartH;
        const val = frac * maxY;
        return (
          <g key={i}>
            {/* vạch chia ngắn ở trục Y, dài hơn nếu tickLongEnds */}
            <line x1={left - AXIS.tickLen} y1={y} x2={left} y2={y} stroke="#64748b" strokeWidth={AXIS.tickW} />
            {/* lưới ngang nét đứt kéo dài toàn đồ thị */}
            <line x1={left} y1={y} x2={vb.w - right} y2={y} stroke="#e2e8f0" strokeDasharray="4 4" />
            <text x={left - AXIS.tickLen - 4} y={y + 5} textAnchor="end" fontSize={AXIS.font} fill="#475569">
              {formatY(val)}
            </text>
          </g>
        );
      })}

      {/* X labels – sát đáy khung */}
      {labels.map((l, i) => {
        const labelFont = AXIS.font;
        if (i % Math.max(1, Math.round(labels.length / Math.max(1, xGrids))) !== 0 && i !== labels.length - 1)
          return null;
        const x = toX(i);
        return (
          <g key={i}>
            <line x1={x} y1={bottom} x2={x} y2={bottom + AXIS.tickLen * 0.6} stroke="#64748b" strokeWidth={AXIS.tickW} />
            <text x={x} y={bottom + AXIS.tickLen * 0.6 + labelFont + 2} textAnchor="middle" fontSize={labelFont} fill="#475569">
              {String(l).slice(5)}
            </text>
          </g>
        );
      })}

      {/* Nhãn đơn vị cho trục */}
      {unit && (
        <text
          x={left - 42}
          y={top + 12}
          textAnchor="start"
          fontSize={axisEmphasis === "strong" ? 14 : 12}
          fill="#64748b"
          transform={`rotate(-90 ${left - 42}, ${top + 12})`}
        >
          {unit}
        </text>
      )}
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

      {/* Hover – bám đúng vị trí chuột */}
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
