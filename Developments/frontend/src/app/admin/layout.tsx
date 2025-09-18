// Layout component for all admin pages.  Provides a sidebar with links to
// various management screens and protects against unauthorized access.
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { normalizeRole } from '@/lib/role';

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
    { href: '/admin/users', label: 'User Management' },
    { href: '/admin/role', label: 'Roles' },
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
      </aside>
      <main className="flex-1 p-4 bg-white">{children}</main>
    </div>
  );
}
