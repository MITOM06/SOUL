// Layout component for all admin pages. Provides a sidebar with links and protects routes.
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { normalizeRole } from '@/lib/role';
import React, { useState } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const role = normalizeRole(user);
  const [open, setOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="h-8 w-8 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || role !== 'admin') {
    return (
      <div className="min-h-screen grid place-items-center p-8 text-center">
        <div>
          <h1 className="text-2xl font-bold mb-2">Unauthorized</h1>
          <p className="text-gray-600">You must be an admin to access this page.</p>
          <Link href="/" className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const links = [
    { href: '/admin/dashboard', label: 'Dashboard' },
    { href: '/admin/books', label: 'Book Management' },
    { href: '/admin/podcasts', label: 'Podcast Management' },
    { href: '/admin/orders', label: 'Orders' },
    // 👇 Thêm mục Users Sub (quản lý user_subscriptions)
    { href: '/admin/users-sub', label: 'Users Sub' },
    { href: '/', label: 'Back to Home' },
  ];

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[260px_1fr]">
      {/* Sidebar */}
      <aside className="border-r bg-white">
        <div className="flex items-center justify-between p-4 lg:block">
          <div className="font-extrabold text-xl">Admin</div>
          <button
            className="lg:hidden px-3 py-2 rounded bg-gray-100"
            onClick={() => setOpen(v => !v)}
          >
            Menu
          </button>
        </div>
        <nav className={`px-2 pb-4 ${open ? 'block' : 'hidden lg:block'}`}>
          {links.map(link => {
            const active = pathname === link.href || pathname.startsWith(link.href + '/');
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-3 py-2 rounded mb-1 ${
                  active ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Content */}
      <main className="p-4 lg:p-8 bg-gray-50">{children}</main>
    </div>
  );
}
