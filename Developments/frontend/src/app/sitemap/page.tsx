"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { normalizeRole } from "@/lib/role";

export default function SiteMapPage() {
  const { user } = useAuth();
  const role = normalizeRole(user);

  const userSection = {
    title: 'General',
    links: [
      { href: '/', label: 'Home' },
      { href: '/book', label: 'Books' },
      { href: '/podcast', label: 'Podcasts' },
      { href: '/about', label: 'About' },
      { href: '/contact', label: 'Contact' },
      { href: '/upgrade', label: 'Upgrade' },
      { href: '/my-package', label: 'My Package' },
      { href: '/payment-history', label: 'My Payment' },
      { href: '/orders', label: 'My Orders' },
      { href: '/notifications', label: 'Notifications' },
    ],
  };

  const adminSection = {
    title: 'Admin',
    links: [
      { href: '/admin/dashboard', label: 'Dashboard' },
      { href: '/admin/orders', label: 'Orders' },
      { href: '/admin/role/admin', label: 'Admins' },
      { href: '/admin/role/users', label: 'Users' },
      { href: '/admin/users-sub', label: 'Users Sub' },
      { href: '/admin/books', label: 'Books Management' },
      { href: '/admin/podcasts', label: 'Podcasts Management' },
      { href: '/admin/notifications', label: 'Notifications' },
    ],
  };

  const sections = role === 'admin' ? [adminSection] : [userSection];

  return (
    <section className="full-bleed p-6 md:p-10">
      <h1 className="text-3xl font-bold mb-6">Site Map</h1>
      <div className="grid gap-6 md:grid-cols-2">
        {sections.map((s) => (
          <div key={s.title} className="rounded-2xl border bg-white p-6">
            <h2 className="text-xl font-semibold mb-3">{s.title}</h2>
            <ul className="grid gap-2">
              {s.links.map((l) => (
                <li key={l.href}>
                  <Link className="text-blue-700 hover:underline" href={l.href}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
