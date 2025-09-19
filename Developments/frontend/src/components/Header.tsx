"use client";

import Link from "next/link";
import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { cn } from "@/lib/utils";
import { normalizeRole } from '@/lib/role';
import { ShoppingCartIcon } from "@heroicons/react/24/outline";
import { useCart } from "@/contexts/CartContext";

export function HeaderAuthArea() {
  const { user, isLoading, logout, subscriptionLevel } = useAuth();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  if (isLoading) {
    return <div className="h-8 w-28 bg-gray-200 animate-pulse rounded" />;
  }

  // Not logged in
  if (!user) {
    const next = encodeURIComponent(pathname || '/');
    return (
      <Link
        href={`/auth/login?next=${next}`}
        className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
      >
        Sign in
      </Link>
    );
  }

  // Logged in: dropdown with current plan + actions
  const planLabel = subscriptionLevel ? subscriptionLevel.toUpperCase() : 'FREE';

  return (
    <div className="relative">
      <button
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
        onClick={() => setOpen(v => !v)}
      >
        <div className="h-8 w-8 rounded-full bg-blue-500 text-white grid place-items-center">
          {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
        </div>
        <span className="hidden sm:block text-sm">{user.name || user.email}</span>
        <svg className="h-4 w-4 opacity-70" viewBox="0 0 20 20" fill="currentColor"><path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z"/></svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-lg border bg-white shadow-lg p-2 z-50">
          <div className="px-3 py-2 text-xs text-gray-600">
            Current plan: <span className="font-semibold">{planLabel}</span>
          </div>
          <div className="h-px bg-gray-100 my-2" />
          <Link
            href="/profile"
            className="block px-3 py-2 rounded hover:bg-gray-50 text-sm"
            onClick={() => setOpen(false)}
          >
            Profile
          </Link>
          <Link
            href="/orders"
            className="block px-3 py-2 rounded hover:bg-gray-50 text-sm"
            onClick={() => setOpen(false)}
          >
            Orders
          </Link>

          {/* Hiện Upgrade trong menu nếu chưa premium */}
          {subscriptionLevel !== 'premium' && (
            <Link
              href="/upgrade"
              className="block px-3 py-2 rounded hover:bg-gray-50 text-sm text-blue-700 font-medium"
              onClick={() => setOpen(false)}
            >
              Upgrade
            </Link>
          )}

          {/* link admin nếu là admin */}
          {normalizeRole(user) === 'admin' && (
            <Link
              href="/admin/dashboard"
              className="block px-3 py-2 rounded hover:bg-gray-50 text-sm"
              onClick={() => setOpen(false)}
            >
              Admin
            </Link>
          )}

          <button
            className="w-full text-left px-3 py-2 rounded hover:bg-gray-50 text-sm text-red-600"
            onClick={async () => {
              setOpen(false);
              await logout();
              const next = encodeURIComponent(pathname || '/');
              // về home sau khi logout
              window.location.href = `/?next=${next}`;
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const { user, subscriptionLevel } = useAuth();
  const { count } = useCart();
  const pathname = usePathname();

  // Ẩn link "Upgrade" trên navbar nếu đã premium
  const nav = [
    { href: "/", label: "Home" },
    { href: "/book", label: "Books" },
    { href: "/podcast", label: "Podcasts" },
    ...(subscriptionLevel === 'premium' ? [] : [{ href: "/upgrade", label: "Upgrade" }]),
    { href: "/about", label: "About" },
  ];

  return (
    <header className="sticky top-0 z-40">
      <div className="backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/90 border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="font-extrabold text-lg">SOUL</Link>

          <nav className="hidden md:flex items-center gap-2">
            {nav.map(item => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative px-3 py-2 text-sm transition",
                    active ? "text-blue-700 font-semibold" : "text-gray-700 hover:text-gray-900"
                  )}
                >
                  {item.label}
                  <span
                    className={cn(
                      "absolute left-2 right-2 -bottom-0.5 h-0.5 origin-left scale-x-0 bg-blue-600 transition-transform duration-300",
                      active && "scale-x-100"
                    )}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/cart" className="relative p-2 rounded hover:bg-gray-100">
              <ShoppingCartIcon className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-blue-600 text-white text-[10px] grid place-items-center">
                  {count}
                </span>
              )}
            </Link>
            <HeaderAuthArea />
          </div>
        </div>
      </div>
    </header>
  );
}
