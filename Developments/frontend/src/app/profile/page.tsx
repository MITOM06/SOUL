// Profile info page with current subscription plan.
'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import UserPanelLayout from '@/components/UserPanelLayout';
import { normalizeRole } from '@/lib/role';

export default function ProfilePage() {
  const { user, subscriptionLevel } = useAuth();
  const role = normalizeRole(user);

  const planLabel = subscriptionLevel ? subscriptionLevel.toUpperCase() : 'FREE';

  const needsUpgrade = (!subscriptionLevel || subscriptionLevel === 'basic') && role === 'user';

  return (
    <UserPanelLayout>
      <section className="grid gap-6 lg:grid-cols-2">
        {/* Profile card */}
        <div className="bg-white rounded-2xl border p-6">
          <h1 className="text-2xl font-bold mb-4">Profile</h1>
          <div className="grid gap-2 text-sm">
            <p><strong>Name:</strong> {user?.name ?? '—'}</p>
            <p><strong>Email:</strong> {user?.email ?? '—'}</p>
            <p><strong>Role:</strong> {role}</p>
            <p>
              <strong>Current plan:</strong>{' '}
              <span className="inline-flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  {planLabel}
                </span>
              </span>
            </p>
          </div>
          <button className="mt-5 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Edit Profile</button>
        </div>

        {/* Upgrade panel (next to profile) – user only */}
        {role === 'user' && (
          <div className={`rounded-2xl border p-6 bg-gradient-to-br from-indigo-50 via-fuchsia-50 to-rose-50 ${needsUpgrade ? 'animate-[pulse_1.6s_ease-in-out_infinite]' : ''}`}>
            <h2 className="text-xl font-semibold mb-2">Upgrade Your Plan</h2>
            <p className="text-sm text-zinc-700 mb-4">Unlock more content and features with a paid plan.</p>
            <a href="/upgrade" className="inline-block px-4 py-2 rounded-xl text-white bg-[color:var(--brand-500)] hover:bg-[color:var(--brand-600)]">
              Go to Upgrade
            </a>
          </div>
        )}
      </section>
    </UserPanelLayout>
  );
}
