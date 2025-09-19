"use client";

import React, { useMemo } from 'react';
import toast from 'react-hot-toast';
import { userSubscriptionsAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface Plan {
  key: 'basic' | 'standard' | 'premium';
  name: string;
  price: string;
  description: string;
}

const plans: Plan[] = [
  { key: 'basic', name: 'Basic', price: 'Free', description: 'Good for exploring content.' },
  { key: 'standard', name: 'Standard', price: '$99 / mo', description: 'More features and access.' },
  { key: 'premium', name: 'Premium', price: '$199 / mo', description: 'All features unlocked.' },
];

export default function UpgradePage() {
  const router = useRouter();
  const { subscriptionLevel } = useAuth();

  const visiblePlans = useMemo(() => {
    // Nếu đã premium -> không cần hiển thị plan nào (hoặc chỉ hiển thị thông báo)
    if (subscriptionLevel === 'premium') return [];
    return plans;
  }, [subscriptionLevel]);

  const choosePlan = async (plan: Plan) => {
    try {
      const res = await userSubscriptionsAPI.create({ plan: plan.key });
      if (res.data?.success) {
        toast.success(`Subscribed to ${plan.name} successfully!`);
        router.replace('/');
      } else {
        toast.error(res.data?.message || 'Subscribe failed');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Subscribe failed');
    }
  };

  if (subscriptionLevel === 'premium') {
    return (
      <section className="space-y-6">
        <h1 className="text-3xl font-bold">Your Plan</h1>
        <p className="text-zinc-700">You are already on the <strong>PREMIUM</strong> plan 🎉</p>
        <button className="btn" onClick={() => router.replace('/')}>Back to Home</button>
      </section>
    );
  }

  return (
    <section className="space-y-8">
      <h1 className="text-3xl font-bold">Choose Your Plan</h1>
      <p className="text-zinc-600 max-w-2xl">
        Support our platform by subscribing to a paid plan. You can upgrade, downgrade or cancel at any time.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {visiblePlans.map((plan) => (
          <div key={plan.key} className="card p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <h2 className="text-xl font-semibold mb-2">{plan.name}</h2>
              <p className="text-2xl font-bold mb-4">{plan.price}</p>
              <p className="text-sm text-zinc-700 mb-6 min-h-[4rem]">{plan.description}</p>
            </div>
            <button onClick={() => choosePlan(plan)} className="btn w-full">
              Choose {plan.name}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
