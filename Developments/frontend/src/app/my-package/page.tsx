"use client";

import UserPanelLayout from "@/components/UserPanelLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { userSubscriptionsAPI } from "@/lib/api";

export default function MyPackagePage() {
  const { subscriptionLevel, user } = useAuth();
  const [expiry, setExpiry] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const res = await userSubscriptionsAPI.getAll();
        const subs = res.data?.data || [];
        const active = subs.find((s: any) => s.status === 'active');
        if (active?.end_date) setExpiry(new Date(active.end_date).toLocaleString());
      } catch {}
    })();
  }, []);
  const plan = (subscriptionLevel || 'free').toUpperCase();
  const fancy = plan === 'VIP' ? 'from-amber-200 to-yellow-100' : plan === 'PREMIUM' ? 'from-indigo-200 to-indigo-50' : 'from-zinc-200 to-zinc-50';

  return (
    <UserPanelLayout>
      <section className="space-y-4 animate-fade-in">
        <h1 className="text-2xl font-bold">My Package</h1>
        <div className={`relative rounded-2xl border shadow-sm p-8 bg-gradient-to-br ${fancy}`}>
          {plan === 'VIP' && (
            <div className="pointer-events-none absolute -top-3 -right-3 text-5xl animate-bounce">🎉</div>
          )}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-zinc-700">Current Plan</div>
              <div className="text-4xl font-extrabold">{plan}</div>
              <div className="mt-2 text-zinc-700">Linked to: {user?.email}</div>
              {expiry && (
                <div className="mt-1 text-sm text-zinc-700">Expires at: <strong>{expiry}</strong></div>
              )}
            </div>
            <div className="h-16 w-16 rounded-full bg-white/70 grid place-items-center text-xl font-bold">{(user?.name || user?.email || 'U').charAt(0).toUpperCase()}</div>
          </div>
          {subscriptionLevel ? (
            <div className="mt-6 grid md:grid-cols-3 gap-3 text-sm">
              <div className="p-3 rounded-xl bg-white/70 border">Unlimited access</div>
              <div className="p-3 rounded-xl bg-white/70 border">Priority support</div>
              <div className="p-3 rounded-xl bg-white/70 border">Early releases</div>
            </div>
          ) : (
            <div className="mt-6">
              <a href="/upgrade" className="btn">Upgrade Now</a>
            </div>
          )}
        </div>
      </section>
    </UserPanelLayout>
  );
}
