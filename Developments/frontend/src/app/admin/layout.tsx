// Layout component for all admin pages.  Provides a sidebar with links to
// various management screens and protects against unauthorized access.
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { normalizeRole } from '@/lib/role';
import React from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const role = normalizeRole(user);

  // Prevent non‑admins from seeing admin pages
  if (!isLoading && role !== 'admin') {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  const links = [
    { href: '/admin/dashboard', label: 'Dashboard' },
    { href: '/admin/books', label: 'Book Management' },
    { href: '/admin/podcasts', label: 'Podcast Management' },
    { href: '/admin/orders', label: 'Orders' },
    // Removed duplicate "User Management"
    { href: '/', label: 'Back to Home' },
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 border-r p-4 space-y-2 bg-white">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`block px-3 py-2 rounded-md hover:bg-gray-100 ${
              pathname.startsWith(link.href)
                ? 'bg-gray-100 font-semibold text-blue-600'
                : 'text-gray-700'
            }`}
          >
            {link.label}
          </Link>
        ))}

        {/* Roles dropdown with stable hover/click behavior */}
        <StableDropdown pathname={pathname} />
      </aside>
      <main className="flex-1 p-4 bg-white">{children}</main>
    </div>
  );
}

function StableDropdown({ pathname }: { pathname: string }) {
  const [open, setOpen] = React.useState(false);
  const closeTimer = React.useRef<number | null>(null);

  const openNow = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const closeSoon = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    // small delay allows moving cursor from trigger to panel
    // @ts-ignore
    closeTimer.current = window.setTimeout(() => setOpen(false), 120);
  };

  return (
    <div
      className="relative"
      onMouseEnter={openNow}
      onMouseLeave={closeSoon}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full text-left px-3 py-2 rounded-md font-medium transition ${
          open ? 'bg-gray-100 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        Roles
      </button>
      {open && (
        <div className="absolute left-0 top-full w-56 bg-white border rounded-md shadow z-20 overflow-hidden animate-fade-in">
<Link
            href="/admin/role/admin"
            className={`block px-3 py-2 hover:bg-gray-50 ${
              pathname.startsWith('/admin/role/admin') ? 'font-semibold text-blue-600' : 'text-gray-700'
            }`}
            onClick={() => setOpen(false)}
          >
            Admins
          </Link>
          <Link
            href="/admin/role/users"
            className={`block px-3 py-2 hover:bg-gray-50 ${
              pathname.startsWith('/admin/role/users') ? 'font-semibold text-blue-600' : 'text-gray-700'
            }`}
            onClick={() => setOpen(false)}
          >
            Users
          </Link>
        </div>
      )}
    </div>
  );
}