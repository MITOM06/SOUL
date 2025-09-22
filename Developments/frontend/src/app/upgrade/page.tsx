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

  const visiblePlans = useMemo(() => {
    if (subscriptionLevel === 'vip') return [];
    if (subscriptionLevel === 'premium') return plans.filter(p => p.key === 'vip');
    return plans;
  }, [subscriptionLevel]);

  const choosePlan = async (plan: Plan) => {
    if (!isLoggedIn) {
      toast.error('Vui lòng đăng nhập để mua gói.');
      const next = encodeURIComponent('/upgrade');
      router.push(`/auth/login?next=${next}`);
      return;
    }
    if (isAdmin) {
      toast.error('Tài khoản admin không thể mua gói dịch vụ.');
      return;
    }
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

  if (subscriptionLevel === 'premium') {
    return (
      <section className="space-y-6">
        <h1 className="text-3xl font-bold">Your Plan</h1>
        <p className="text-zinc-700">You are on <strong>PREMIUM</strong>. Only VIP remains available.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.filter(p => p.key === 'vip').map((plan) => (
            <div key={plan.key} className={`rounded-2xl p-6 border bg-gradient-to-br ${plan.color}`}>
              <h2 className="text-2xl font-bold">{plan.name}</h2>
              <p className="text-3xl font-extrabold mt-2">{plan.price}</p>
              <p className="text-sm text-zinc-700 mt-2">{plan.description}</p>
              <button onClick={() => choosePlan(plan)} className="mt-4 btn w-full">Choose VIP</button>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (subscriptionLevel === 'vip') {
    return (
      <section className="space-y-6 text-center">
        <h1 className="text-3xl font-extrabold">Congratulations! 🎉</h1>
        <p className="text-zinc-700">You are on the highest plan: <strong>VIP</strong>.</p>
        <div className="mx-auto max-w-2xl mt-4 p-8 rounded-2xl border bg-gradient-to-br from-amber-100 to-yellow-50">
          <div className="text-6xl">🏆</div>
          <p className="mt-2 text-lg font-semibold">Thank you for supporting us!</p>
        </div>
        <button className="btn" onClick={() => router.replace('/my-package')}>Go to My Package</button>
      </section>
    );
  }

  if (isAdmin) {
    return (
      <section className="space-y-6 text-center">
        <h1 className="text-3xl font-bold">Quản trị viên</h1>
        <p className="text-zinc-600">Tài khoản admin không thể đăng ký các gói dịch vụ người dùng.</p>
      </section>
    );
  }

  return (
    <section className="space-y-8 full-bleed">
      <h1 className="text-3xl font-bold">Choose Your Plan</h1>
      <p className="text-zinc-600 max-w-3xl">
        Support our platform by subscribing to a paid plan. You can upgrade, downgrade or cancel at any time.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {visiblePlans.map((plan, idx) => (
          <div
            key={plan.key}
            className={`rounded-2xl p-6 border shadow-sm bg-gradient-to-br ${plan.color} hover:shadow-md transition hover:-translate-y-0.5`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">{plan.name}</h2>
              {plan.key === 'vip' && (
                <span className="px-2 py-0.5 text-xs rounded bg-amber-400 text-white animate-pulse">Popular</span>
              )}
            </div>
            <p className="text-3xl font-extrabold mt-2">{plan.price}</p>
            <p className="text-sm text-zinc-700 mt-2 min-h-[3rem]">{plan.description}</p>
            <ul className="mt-4 text-sm space-y-1 text-zinc-700">
              <li>• Access to exclusive content</li>
              <li>• Priority support</li>
              <li>• Cancel anytime</li>
            </ul>
            <button onClick={() => choosePlan(plan)} className="mt-6 btn w-full">
              Choose {plan.name}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
