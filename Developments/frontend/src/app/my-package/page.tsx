"use client";

import { useEffect, useMemo, useState } from "react";
import UserPanelLayout from "@/components/UserPanelLayout";
import { useAuth } from "@/contexts/AuthContext";
import { userSubscriptionsAPI } from "@/lib/api";

/** ====== Tiny inline icons ====== */
function Check({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function Sparkle({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3l1.6 3.8L17 8.4l-3.4 1.2L12 13l-1.6-3.4L7 8.4l3.4-1.6L12 3zM19 14l.9 2.1 2.1.9-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14zM5 14l.7 1.6L7 17l-1.3.4L5 19l-.7-1.6L3 17l1.3-.4L5 14z" stroke="currentColor" strokeWidth={1.5} />
    </svg>
  );
}

/** ====== Types ====== */
type SubItem = {
  id: number | string;
  status: string;
  end_date?: string | null;
  start_date?: string | null;
  plan?: string | null;
};

export default function MyPackagePage() {
  const { subscriptionLevel, user } = useAuth();
  const [expiry, setExpiry] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [subs, setSubs] = useState<SubItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Normalize plan → "FREE" | "PREMIUM" | "VIP"
  const rawPlan = (subscriptionLevel || "free").toString().toUpperCase();
  const plan = (["FREE", "PREMIUM", "VIP"] as const).includes(rawPlan as any)
    ? (rawPlan as "FREE" | "PREMIUM" | "VIP")
    : "FREE";

  /** ====== Strict color system for 3 plans ======
   * FREE:   neutral gray (zinc)
   * PREMIUM: indigo
   * VIP:    amber/gold
   */
  const palette = useMemo(() => {
    const map = {
      FREE: {
        solid: "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900",
        subtle: "bg-zinc-50 dark:bg-zinc-900/60",
        text: "text-zinc-900 dark:text-zinc-100",
        badge: "bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900",
        ring: "ring-zinc-200 dark:ring-zinc-700",
        gradient: "from-zinc-100 via-white to-zinc-50 dark:from-zinc-800 dark:via-zinc-900 dark:to-zinc-900",
        glow: "shadow-[0_0_60px_-10px_rgba(24,24,27,0.35)]",
        meter: "bg-zinc-800",
      },
      PREMIUM: {
        solid: "bg-indigo-600 text-white dark:bg-indigo-500 dark:text-white",
        subtle: "bg-indigo-50/80 dark:bg-indigo-500/10",
        text: "text-indigo-800 dark:text-indigo-200",
        badge: "bg-indigo-600 text-white",
        ring: "ring-indigo-200 dark:ring-indigo-700",
        gradient: "from-indigo-100 via-white to-indigo-50 dark:from-indigo-700/30 dark:via-zinc-900 dark:to-zinc-900",
        glow: "shadow-[0_0_60px_-10px_rgba(79,70,229,0.55)]",
        meter: "bg-indigo-600",
      },
      VIP: {
        solid: "bg-amber-500 text-zinc-900 dark:bg-amber-400 dark:text-zinc-900",
        subtle: "bg-amber-50/80 dark:bg-amber-400/10",
        text: "text-amber-900 dark:text-amber-200",
        badge: "bg-amber-500 text-zinc-900",
        ring: "ring-amber-200 dark:ring-amber-600",
        gradient: "from-amber-100 via-white to-amber-50 dark:from-amber-500/20 dark:via-zinc-900 dark:to-zinc-900",
        glow: "shadow-[0_0_60px_-10px_rgba(245,158,11,0.55)]",
        meter: "bg-amber-500",
      },
    } as const;
    return map[plan];
  }, [plan]);

  useEffect(() => {
    (async () => {
      try {
        const res = await userSubscriptionsAPI.getAll();
        const list: SubItem[] = res?.data?.data || [];
        setSubs(list);
        const active = list.find((s) => s.status === "active");
        if (active?.end_date) setExpiry(new Date(active.end_date).toLocaleString());
      } catch {
        setError("Couldn't load subscription details.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /** Dynamic perks by plan */
  const perkMap: Record<"FREE" | "PREMIUM" | "VIP", string[]> = {
    FREE: ["Basic library access", "Community support"],
    PREMIUM: ["Unlimited library access", "Priority support", "Early releases"],
    VIP: ["Unlimited access", "Priority+ concierge support", "Early releases", "VIP exclusive events"],
  };
  const currentPerks = perkMap[plan];

  /** Example usage percent (replace with real metric if you have) */
  const usage = plan === "FREE" ? 38 : plan === "PREMIUM" ? 67 : 82;

  return (
    <UserPanelLayout>
      {/* Page container wider to remove empty space */}
     <div className="mx-auto max-w-7xl px-3 sm:px-6">
        {/* HERO STRIP */}
        <div
          className={`relative overflow-hidden rounded-3xl border ${palette.ring} bg-gradient-to-br ${palette.gradient} ${palette.glow}`}
        >
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full blur-3xl opacity-30 bg-white/60 dark:bg-white/5" />
          <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full blur-3xl opacity-30 bg-white/60 dark:bg-white/5" />

          <div className="p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${palette.badge}`}>{plan}</span>
                  {plan === "VIP" && (
                    <span className={`${palette.text} inline-flex items-center gap-1 text-sm`}>
                      <Sparkle /> VIP privileges unlocked
                    </span>
                  )}
                </div>

                <h1 className={`mt-3 text-3xl sm:text-4xl font-black tracking-tight ${palette.text}`}>My Package</h1>
                <p className="mt-2 text-zinc-700 dark:text-zinc-300">
                  Manage membership, billing, and benefits. Keep track of your plan and upgrades.
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <span>Linked:</span>
                  <strong className="truncate">{user?.email}</strong>
                  {expiry && (
                    <>
                      <span className="opacity-60">•</span>
                      <span>
                        Next renewal: <strong>{expiry}</strong>
                      </span>
                    </>
                  )}
                  {subs.find((s) => s.status === "active") && (
                    <>
                      <span className="opacity-60">•</span>
                      <span>
                        Status: <strong>Active</strong>
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Right: Avatar + Usage bar */}
              <div className="shrink-0 flex flex-col items-end gap-3">
                <div className="h-16 w-16 rounded-full bg-white/80 dark:bg-zinc-800/70 grid place-items-center text-xl font-bold ring-1 ring-white/50 dark:ring-zinc-700">
                  {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
                </div>
                <div className="w-56">
                  <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
                    <span>Usage</span>
                    <span>{usage}%</span>
                  </div>
                  <div className="mt-1 h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                    <div className={`h-full rounded-full ${palette.meter}`} style={{ width: `${usage}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* CTAs — respect color of plan */}
            <div className="mt-6 flex flex-wrap gap-3">
              {plan === "FREE" ? (
                <>
                  <a
                    href="/upgrade"
                    className={`inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold ${palette.solid} transition`}
                  >
                    Upgrade to PREMIUM
                  </a>
                  <a
                    href="/pricing"
                    className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold bg-white text-zinc-900 ring-1 ring-zinc-200 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-700 dark:hover:bg-zinc-800 transition"
                  >
                    View all plans
                  </a>
                </>
              ) : (
                <>
                  <a
                    href="/upgrade"
                    className={`inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold ${palette.solid} transition`}
                  >
                    Change plan
                  </a>
                  <a
                    href="/payment-history"
                    className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold bg-white text-zinc-900 ring-1 ring-zinc-200 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-700 dark:hover:bg-zinc-800 transition"
                  >
                    Billing history
                  </a>
                </>
              )}
            </div>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
          {/* Left: Benefits + Compare (2 cols) */}
          <div className="space-y-6">
            {/* Benefits (colored by plan) */}
            <div className={`rounded-2xl border ${palette.ring} ${palette.subtle} p-6`}>
              <h3 className={`text-lg font-semibold ${palette.text}`}>Your Benefits</h3>

              {loading ? (
                <div className="mt-4 grid sm:grid-cols-2 gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-11 rounded-xl bg-white/70 dark:bg-zinc-800/70 animate-pulse" />
                  ))}
                </div>
              ) : error ? (
                <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
              ) : (
                <ul className="mt-4 grid sm:grid-cols-2 gap-3">
                  {currentPerks.map((label) => (
                    <li
                      key={label}
                      className="flex items-center gap-3 rounded-xl bg-white dark:bg-zinc-900/60 px-4 py-3 ring-1 ring-white/50 dark:ring-zinc-800"
                    >
                      <span className={palette.text}>
                        <Check />
                      </span>
                      <span className="text-sm text-zinc-800 dark:text-zinc-200">{label}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Quick Compare table (fixed, neutral) */}
            <div className="rounded-2xl border ring-1 ring-zinc-200 dark:ring-zinc-700 bg-white/80 dark:bg-zinc-900/60 overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Compare Plans</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-800/60 text-left text-zinc-600 dark:text-zinc-300">
                      <th className="px-5 py-3 font-medium">Feature</th>
                      <th className="px-5 py-3 font-medium">FREE</th>
                      <th className="px-5 py-3 font-medium">PREMIUM</th>
                      <th className="px-5 py-3 font-medium">VIP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {[
                      { name: "Library access", free: "Limited", premium: "Unlimited", vip: "Unlimited" },
                      { name: "Support", free: "Community", premium: "Priority", vip: "Priority+" },
                      { name: "Early releases", free: "—", premium: "Yes", vip: "Yes" },
                      { name: "VIP events", free: "—", premium: "—", vip: "Included" },
                    ].map((row) => (
                      <tr key={row.name} className="text-zinc-800 dark:text-zinc-200">
                        <td className="px-5 py-3">{row.name}</td>
                        <td className="px-5 py-3">{row.free}</td>
                        <td className="px-5 py-3">{row.premium}</td>
                        <td className="px-5 py-3">{row.vip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right: Status panel (colored by plan) */}
          <aside className={`rounded-2xl border ${palette.ring} ${palette.subtle} p-6`}>
            <h3 className={`text-lg font-semibold ${palette.text}`}>Subscription Status</h3>

            <div className="mt-4 grid gap-3">
              <div className="rounded-xl bg-white dark:bg-zinc-900/60 p-4 ring-1 ring-white/50 dark:ring-zinc-800">
                <div className="text-sm text-zinc-700 dark:text-zinc-300">
                  <span className="font-medium">Plan:</span> {plan}
                </div>
                <div className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                  <span className="font-medium">Linked:</span> {user?.email}</div>
                {expiry && (
                  <div className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                    <span className="font-medium">Next renewal:</span> {expiry}
                  </div>
                )}
              </div>

              {/* Quick Actions following plan color */}
              <div className="flex flex-col gap-2">
                <a
                  href="/upgrade"
                  className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold ${palette.solid} transition`}
                >
                  {plan === "FREE" ? "Upgrade" : "Change plan"}
                </a>
                <a
                  href="/payment-history"
                  className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold bg-white text-zinc-900 ring-1 ring-zinc-200 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-700 dark:hover:bg-zinc-800 transition"
                >
                  Billing history
                </a>
                <a
                  href="/support"
                  className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold bg-white text-zinc-900 ring-1 ring-zinc-200 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-700 dark:hover:bg-zinc-800 transition"
                >
                  Contact support
                </a>
              </div>

              {/* Invoices preview (placeholder) */}
              <div className="mt-3 rounded-xl bg-white dark:bg-zinc-900/60 p-4 ring-1 ring-white/50 dark:ring-zinc-800">
                <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Recent invoices</div>
                <ul className="mt-2 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <li className="flex items-center justify-between">
                    <span>INV-000123</span><span>$9.99</span>
                  </li>
                  <li className="flex items-center justify-between opacity-70">
                    <span>INV-000122</span><span>$9.99</span>
                  </li>
                  <li className="flex items-center justify-between opacity-60">
                    <span>INV-000121</span><span>$9.99</span>
                  </li>
                </ul>
                <a href="/payment-history" className="mt-3 inline-block text-xs underline opacity-80">
                  View all
                </a>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </UserPanelLayout>
  );
}
