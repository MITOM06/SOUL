// Generic layout component for user-facing pages with a sidebar on the left and
// content area on the right.  It displays a list of navigation links for
// personal information, password change and user‑specific sections like
// favourites, continues, orders and payment history.  It also checks for
// authentication.
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function UserPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();

  // If user is not logged in show a message.  You may redirect to login here.
  if (!isLoading && !user) {
    return (
      <div className="p-4">
        <p>Please sign in to view this page.</p>
      </div>
    );
  }

  const links = [
    { href: '/profile', label: 'Personal Information' },
    { href: '/profile/password', label: 'Change Password' },
    { href: '/favourites', label: 'Favourites' },
    { href: '/continues', label: 'Continues' },
    { href: '/orders', label: 'My Orders' },
    { href: '/payment-history', label: 'My Payment' },
  ];

  return (
    <div className="flex flex-col md:flex-row">
      <aside className="md:w-60 md:border-r p-4 space-y-2 bg-white">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`block px-3 py-2 rounded-md hover:bg-gray-100 ${
              pathname === link.href
                ? 'bg-gray-100 font-semibold text-blue-600'
                : 'text-gray-700'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </aside>
      <main className="flex-1 p-4 bg-white">{children}</main>
    </div>
  );
}
