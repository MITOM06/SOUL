"use client";

import React from 'react';

// Define a type for subscription plans. Each plan has a key, a user
// friendly name, a price string and a description to help users
// choose. You can extend this with additional fields like
// "features" if required.
interface Plan {
  key: string;
  name: string;
  price: string;
  description: string;
}

// Hard-coded subscription plans for the upgrade page. Pricing is for
// demonstration only; in a real app these values would be fetched
// from your backend or a configuration file.
const plans: Plan[] = [
  {
    key: 'basic',
    name: 'Basic',
    price: 'Free',
    description: 'Access free books and podcasts with ads.',
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '99.000 ₫/month',
    description:
      'Unlock the full library of ebooks and podcasts. Remove ads and get early access to new content.',
  },
  {
    key: 'premium',
    name: 'Premium',
    price: '199.000 ₫/month',
    description:
      'Everything in Pro plus offline downloads and exclusive premium-only releases.',
  },
];

export default function UpgradePage() {
  return (
    <section className="space-y-8">
      <h1 className="text-3xl font-bold">Choose Your Plan</h1>
      <p className="text-zinc-600 max-w-2xl">
        Support our platform by subscribing to a paid plan. You can upgrade,
        downgrade or cancel at any time. Plan changes take effect immediately
        after payment is processed.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.key}
            className="card p-6 flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            <div>
              <h2 className="text-xl font-semibold mb-2">{plan.name}</h2>
              <p className="text-2xl font-bold mb-4">{plan.price}</p>
              <p className="text-sm text-zinc-700 mb-6 min-h-[4rem]">{plan.description}</p>
            </div>
            <button
              onClick={() => alert(`You selected the ${plan.name} plan`)}
              className="btn w-full"
            >
              Choose {plan.name}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}