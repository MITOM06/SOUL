// src/components/HeaderAuthArea.tsx
"use client";

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

// Small authenticated area used inside the Header (sign in / user menu)
export function HeaderAuthArea() {
  const { user, isLoading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  if (isLoading) {
    // skeleton nho nhỏ
    return <div className="h-8 w-28 bg-gray-200 animate-pulse rounded" />;
  }

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
        <svg className="h-4 w-4 opacity-70" viewBox="0 0 20 20" fill="currentColor"><path d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"/></svg>
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-48 rounded-lg border bg-white shadow-lg p-1"
          onMouseLeave={() => setOpen(false)}
        >
          <Link
            href="/profile"
            className="block rounded-md px-3 py-2 hover:bg-gray-100 text-sm"
          >
            Profile
          </Link>
          <Link
            href="/orders"
            className="block rounded-md px-3 py-2 hover:bg-gray-100 text-sm"
          >
            My Orders
          </Link>
          <button
            className="w-full text-left rounded-md px-3 py-2 hover:bg-gray-100 text-sm"
            onClick={() => {
              setOpen(false);
              logout();
              router.replace('/');
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

// Main Header / Navbar (default export) — includes brand, primary nav and auth area
export default function Header() {
  return (
    <header className="border-b">
      <div className="container-max flex items-center justify-between py-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-md bg-blue-600 text-white grid place-items-center font-bold">S</div>
            <span className="font-semibold">SOUL</span>
          </Link>

          <nav className="hidden md:flex items-center gap-4 text-sm text-zinc-700">
            {/* Top navigation. Note: use descriptive labels and keep URLs consistent with new pages. */}
            <Link href="/" className="hover:text-zinc-900">Home</Link>
            <Link href="/library" className="hover:text-zinc-900">Books</Link>
            <Link href="/podcasts" className="hover:text-zinc-900">Podcasts</Link>
            <Link href="/upgrade" className="hover:text-zinc-900">Upgrade</Link>
            <Link href="/about" className="hover:text-zinc-900">About</Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {/* Search shortcut / cart etc. could go here */}
          <HeaderAuthArea />
        </div>
      </div>
    </header>
  );
}
