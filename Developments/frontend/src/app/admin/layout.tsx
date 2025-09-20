// Layout component for all admin pages. Provides a sidebar with links and protects routes.
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { normalizeRole } from '@/lib/role';
import React, { useState, useRef } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const role = normalizeRole(user);
  const [open, setOpen] = useState(false);

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="h-8 w-8 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Guard non-admin
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
    // Users Sub (quản lý user_subscriptions)
    { href: '/admin/users-sub', label: 'Users Sub' },
    { href: '/admin/notifications', label: 'Notifications' },
  ];

  return (
    <div className="full-bleed min-h-screen grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)]">
      {/* Sidebar */}
      <aside className="border-r bg-white flex flex-col min-h-screen">
        <div className="flex items-center justify-between p-4 lg:block border-b">
          <div className="font-extrabold text-xl">Admin</div>
          <button
            className="lg:hidden px-3 py-2 rounded bg-gray-100"
            onClick={() => setOpen(v => !v)}
            aria-label="Toggle menu"
          >
            Menu
          </button>
        </div>

        <nav className={`px-2 py-3 ${open ? 'block' : 'hidden lg:block'} flex-1`}> {/* grow */}
          {links.map(link => {
            const active = pathname === link.href || pathname.startsWith(link.href + '/');
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-3 py-2 rounded mb-1 transition ${
                  active ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            );
          })}

          {/* Roles dropdown with stable hover/click behavior */}
          <StableDropdown pathname={pathname} />

          {/* Back to Home just below Roles */}
          <Link
            href="/"
            className={`mt-1 block px-3 py-2 rounded text-gray-700 hover:bg-gray-50 transition ${
              pathname === '/' ? 'bg-blue-50 text-blue-700 font-semibold' : ''
            }`}
            onClick={() => setOpen(false)}
          >
            Back to Home
          </Link>
        </nav>
        
      </aside>

      {/* Content */}
      <main className="min-h-screen w-full p-3 md:p-4 lg:p-6 neon-main">
        <div className="animate-fade-in">{children}</div>
      </main>
    </div>
  );
}

function StableDropdown({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);

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

  const itemBase =
    'block px-3 py-2 hover:bg-gray-50';
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  return (
    <div
      className="relative mt-2"
      onMouseEnter={openNow}
      onMouseLeave={closeSoon}
    >
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`w-full text-left px-3 py-2 rounded-md font-medium transition ${
          open ? 'bg-gray-100 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        Roles
      </button>

      {open && (
        <div className="absolute left-2 top-full w-56 bg-white border rounded-md shadow z-20 overflow-hidden animate-fade-in">
          <Link
            href="/admin/role/admin"
            className={`${itemBase} ${isActive('/admin/role/admin') ? 'font-semibold text-blue-600' : 'text-gray-700'}`}
            onClick={() => setOpen(false)}
          >
            Admins
          </Link>
          <Link
            href="/admin/role/users"
            className={`${itemBase} ${isActive('/admin/role/users') ? 'font-semibold text-blue-600' : 'text-gray-700'}`}
            onClick={() => setOpen(false)}
          >
            Users
          </Link>
        </div>
      )}
    </div>
  );
}
