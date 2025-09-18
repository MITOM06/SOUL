import React from 'react';
import Link from 'next/link';

export default function RolesLandingPage() {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Roles</h1>
        <Link href="/admin/role/admin" className="btn">Manage roles</Link>
      </div>
      <p className="text-sm text-zinc-600">View and manage application roles and permissions.</p>
    </section>
  );
}
