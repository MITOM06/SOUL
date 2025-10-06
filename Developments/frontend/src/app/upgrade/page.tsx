"use client";

import React, { useMemo } from 'react';
import toast from 'react-hot-toast';
import { userSubscriptionsAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { normalizeRole } from '@/lib/role';

interface Plan {
  key: 'vip' | 'basic' | 'premium';
  name: string;
  price: string;
  description: string;
  color: string; // tailwind color class
}

const plans: Plan[] = [
  { key: 'basic', name: 'Basic', price: 'Free', description: 'Good for exploring content.', color: 'from-zinc-100 to-zinc-200' },
  { key: 'premium', name: 'Premium', price: '$199 / mo', description: 'More features and access.', color: 'from-indigo-100 to-indigo-200' },
  { key: 'vip', name: 'VIP', price: '$299 / mo', description: 'All features unlocked + VIP perks.', color: 'from-amber-100 to-amber-200' },
];

export default function UpgradePage() {
  const router = useRouter();
  const { subscriptionLevel, user } = useAuth();
  const role = normalizeRole(user);
  const isLoggedIn = Boolean(user);
  const isAdmin = role === 'admin';


  const currentPlanKey: 'basic'|'premium'|'vip' = (subscriptionLevel === 'vip' || subscriptionLevel === 'premium')
    ? (subscriptionLevel as 'premium'|'vip')
    : 'basic';

  const choosePlan = async (plan: Plan) => {
    if (!isLoggedIn) {
      toast.error('Please sign in to subscribe.');
      const next = encodeURIComponent('/upgrade');
      router.push(`/auth/login?next=${next}`);
      return;
    }
    if (isAdmin) {
      toast.error('Admin accounts cannot purchase subscriptions.');
      return;
    }
    if (plan.key === currentPlanKey) return; // no-op
    try {
      // Free plan: subscribe immediately; paid: go to lightweight subscription checkout (no backend payment record)
      if (plan.key === 'basic') {
        const res = await userSubscriptionsAPI.create({ plan: 'basic' });
        if (res.data?.success) {
          toast.success('Subscribed to BASIC');
          router.replace('/my-package');
        } else {
          toast.error(res.data?.message || 'Subscribe failed');
        }
        return;
      }

      const amountMap: Record<string, number> = { premium: 19900, vip: 29900 };
      const q = new URLSearchParams({
        plan: plan.key,
        amount: String(amountMap[plan.key] || 0),
        provider: 'bank',
      }).toString();
      router.push(`/subscription-checkout?${q}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Subscribe failed');
    }
  };

  return (
    <section className="space-y-8 full-bleed">
      <h1 className="text-3xl font-bold">Choose Your Plan</h1>
      <p className="text-zinc-600 max-w-3xl">
        Support our platform by subscribing to a paid plan. You can upgrade, downgrade or cancel at any time.
      </p>
      {(() => {
        // Hide lower-tier plans depending on current subscription
        let visible: Plan[] = plans;
        if (currentPlanKey === 'premium') {
          visible = plans.filter(p => p.key !== 'basic');
        } else if (currentPlanKey === 'vip') {
          visible = plans.filter(p => p.key === 'vip');
        }
        const cols = visible.length >= 3 ? 'md:grid-cols-3' : (visible.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-1');
        return (
      <div className={`grid grid-cols-1 ${cols} gap-6`}>
        {visible.map((plan) => {
          const isCurrent = plan.key === currentPlanKey;
          return (
            <div
              key={plan.key}
              className={`relative rounded-2xl p-6 border shadow-sm bg-gradient-to-br ${plan.color} transition ${isCurrent ? 'opacity-60' : 'hover:shadow-md hover:-translate-y-0.5'}`}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">{plan.name}</h2>
                {plan.key === 'vip' && (
                  <span className="px-2 py-0.5 text-xs rounded bg-amber-400 text-white">Popular</span>
                )}
              </div>
              <p className="text-3xl font-extrabold mt-2">{plan.price}</p>
              <p className="text-sm text-zinc-700 mt-2 min-h-[3rem]">{plan.description}</p>
              <ul className="mt-4 text-sm space-y-1 text-zinc-700">
                <li>• Access to exclusive content</li>
                <li>• Priority support</li>
                <li>• Cancel anytime</li>
              </ul>
              <button
                onClick={() => choosePlan(plan)}
                className={`mt-6 btn w-full ${isCurrent ? 'cursor-not-allowed' : ''}`}
                disabled={isCurrent}
                aria-disabled={isCurrent}
              >
                {isCurrent ? 'Your current plan' : `Choose ${plan.name}`}
              </button>
              {plan.key !== 'basic' && (
                <div className="mt-3">
                  <a href={`/upgrade/${plan.key}`} className="text-sm text-[color:var(--brand-600)] hover:underline">
                    View details
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
        );
      })()}
    </section>
  );
}
