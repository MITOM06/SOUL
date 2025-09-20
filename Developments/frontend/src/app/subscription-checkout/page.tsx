"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { userSubscriptionsAPI } from "@/lib/api";

type PlanKey = 'basic'|'premium'|'vip';

export default function SubscriptionCheckoutPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const [provider, setProvider] = useState('bank');

  const plan: PlanKey = (sp.get('plan') as PlanKey) || 'premium';
  const amount: number = Number(sp.get('amount') || (plan === 'vip' ? 29900 : plan === 'premium' ? 19900 : 0));

  const qrUrl = useMemo(() => {
    const text = `${plan} via ${provider}`;
    return `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(text)}&size=200x200`;
  }, [plan, provider]);

  const confirm = async () => {
    const res = await userSubscriptionsAPI.create({ plan });
    if (res.data?.success) {
      setTimeout(() => router.replace('/my-package'), 600);
    }
  };

  const badge = plan === 'vip' ? 'bg-amber-500' : plan === 'premium' ? 'bg-indigo-500' : 'bg-zinc-500';
  const gradient = plan === 'vip' ? 'from-amber-100 to-yellow-50' : plan === 'premium' ? 'from-indigo-100 to-indigo-50' : 'from-zinc-100 to-zinc-50';
  const emoji = plan === 'vip' ? '🏆' : plan === 'premium' ? '💎' : '🎫';

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4 text-center">Subscription Checkout</h1>

      <div className="grid md:grid-cols-2 gap-6 items-start">
        {/* Left: Plan card + method + QR */}
        <div className="space-y-4">
          <div className={`rounded-2xl border p-4 bg-gradient-to-br ${gradient}`}>
            <div className="flex items-center gap-3">
              <div className={`h-12 w-12 rounded-full grid place-items-center text-xl text-white ${badge}`}>{emoji}</div>
              <div>
                <div className="text-lg font-semibold">{plan.toUpperCase()} Plan</div>
                <div className="text-sm text-zinc-700">The best content for you.</div>
              </div>
            </div>
          </div>

          <div className="text-center border rounded-2xl p-4 bg-white">
            <div className="mb-3">
              <label className="block text-sm font-medium text-left mb-1">Payment method</label>
              <div className="flex gap-2">
                <select value={provider} onChange={e=>setProvider(e.target.value)} className="flex-1 border rounded px-3 py-2">
                  <option value="bank">Bank</option>
                  <option value="momo">Momo</option>
                  <option value="apple-pay">Apple Pay</option>
                  <option value="paypal">PayPal</option>
                </select>
              </div>
            </div>
            <img src={qrUrl} alt="QR Code" className="mx-auto border rounded-lg" />
            <p className="mt-2 text-gray-600">Scan the QR to pay</p>
            <div className="mt-3 text-sm text-gray-700">Provider: <strong>{provider}</strong></div>
          </div>
        </div>

        {/* Right: Summary */}
        <div className="border rounded-2xl p-4 bg-white">
          <div className="font-semibold mb-2">Summary</div>
          <div className="flex justify-between py-2 border-b text-sm">
            <div>{plan.toUpperCase()} (Qty 1)</div>
            <div className="font-medium">{(amount/100).toLocaleString()} ₫</div>
          </div>
          <div className="mt-3 flex justify-between">
            <div>Payment method</div>
            <div className="font-medium">{provider}</div>
          </div>
          <div className="mt-1 flex justify-between">
            <div>Total</div>
            <div className="text-lg font-bold">{(amount/100).toLocaleString()} ₫</div>
          </div>
          <button onClick={confirm} className="mt-4 w-full px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            I have paid
          </button>
        </div>
      </div>
    </div>
  );
}
