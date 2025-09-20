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

  return (
    <UserPanelLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Profile</h1>

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
              {subscriptionLevel !== 'premium' && (
                <a href="/upgrade" className="text-blue-700 hover:underline">Upgrade</a>
              )}
            </span>
          </p>
        </div>

        <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Edit Profile
        </button>
      </div>
    </UserPanelLayout>
  );
}
