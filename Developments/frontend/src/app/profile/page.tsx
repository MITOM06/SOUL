// Profile info page.  Shows personal details of the logged in user.  It uses
// UserPanelLayout to provide a sidebar and consistent layout across user pages.
'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import UserPanelLayout from '@/components/UserPanelLayout';
import { normalizeRole } from '@/lib/role';

export default function ProfilePage() {
  const { user } = useAuth();
  const role = normalizeRole(user);

  return (
    <UserPanelLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Personal Information</h1>
        <p>
          <strong>Name:</strong> {user?.name ?? '—'}
        </p>
        <p>
          <strong>Email:</strong> {user?.email ?? '—'}
        </p>
        <p>
          <strong>Role:</strong> {role}
        </p>
        <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Edit Profile
        </button>
      </div>
    </UserPanelLayout>
  );
}
