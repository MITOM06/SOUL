// app/(user)/_components/UserPanelLayout.tsx (ví dụ)
// Generic user panel layout with role-aware sidebar
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { normalizeRole } from '@/lib/role';

export default function UserPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();

  if (!isLoading && !user) {
    return (
      <div className="p-4">
        <p>Please sign in to view this page.</p>
      </div>
    );
  }

  // Build links based on role
  const role = normalizeRole(user); // 'admin' | 'user' | undefined

  const baseLinks = [
    { href: '/profile', label: 'Personal Information' },
    { href: '/profile/password', label: 'Change Password' },
  ];

  const userOnlyLinks = [
    { href: '/favourites', label: 'Favourites' },
    { href: '/continues', label: 'Continues' },
    { href: '/orders', label: 'My Orders' },
    { href: '/payment-history', label: 'My Payment' },
  ];

  const links = role === 'admin' ? baseLinks : [...baseLinks, ...userOnlyLinks];

  return (
    <div className="flex flex-col md:flex-row">
      <aside className="md:w-60 md:border-r p-4 space-y-2 bg-white">
        {links.map((link) => {
          const active =
            pathname === link.href ||
            (link.href !== '/profile' && pathname?.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`block px-3 py-2 rounded-md hover:bg-gray-100 ${
                active ? 'bg-gray-100 font-semibold text-blue-600' : 'text-gray-700'
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </aside>
      <main className="flex-1 p-4 bg-white">{children}</main>
    </div>
  );
}
