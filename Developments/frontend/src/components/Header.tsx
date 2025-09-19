"use client";

import Link from "next/link";
import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { cn } from "@/lib/utils";
import { normalizeRole } from '@/lib/role';
import { ShoppingCartIcon } from "@heroicons/react/24/outline";
import { useCart } from "@/contexts/CartContext";
import { cartAPI } from "@/lib/api";

export function HeaderAuthArea() {
  const { user, isLoading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { reset } = useCart();

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
        <svg className="h-4 w-4 opacity-70" viewBox="0 0 20 20" fill="currentColor"><path d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z" /></svg>
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-56 rounded-lg border bg-white shadow-lg p-1 z-10"
          onMouseLeave={() => setOpen(false)}
        >
          {(() => {
            const role = normalizeRole(user);
            // Links common to both roles
            const commonItems = (
              <>
                <Link
                  href="/profile"
                  className="block rounded-md px-3 py-2 hover:bg-gray-100 text-sm"
                  onClick={() => setOpen(false)}
                >
                  Profile
                </Link>
                <Link
                  href="/orders"
                  className="block rounded-md px-3 py-2 hover:bg-gray-100 text-sm"
                  onClick={() => setOpen(false)}
                >
                  My Orders
                </Link>
              </>
            );
            if (role === 'admin') {
              // Admin sees an Admin Panel link plus the common items
              return (
                <>
                  <Link
                    href="/admin/dashboard"
                    className="block rounded-md px-3 py-2 hover:bg-gray-100 text-sm"
                    onClick={() => setOpen(false)}
                  >
                    Admin Panel
                  </Link>
                  {commonItems}
                  <button
                    className="w-full text-left rounded-md px-3 py-2 hover:bg-gray-100 text-sm"
                    onClick={() => {
                      setOpen(false);
                      logout();
                      reset(); // 👈 reset giỏ khi logout
                      router.replace("/");
                    }}
                  >
                    Sign out
                  </button>
                </>
              );
            }
            // Standard user sees favourites, continues and payment links along with common
            return (
              <>
                {commonItems}
                <Link
                  href="/favourites"
                  className="block rounded-md px-3 py-2 hover:bg-gray-100 text-sm"
                  onClick={() => setOpen(false)}
                >
                  Favourites
                </Link>
                <Link
                  href="/continues"
                  className="block rounded-md px-3 py-2 hover:bg-gray-100 text-sm"
                  onClick={() => setOpen(false)}
                >
                  Continues
                </Link>
                <Link
                  href="/payment-history"
                  className="block rounded-md px-3 py-2 hover:bg-gray-100 text-sm"
                  onClick={() => setOpen(false)}
                >
                  My Payment
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
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
function SoulLogo() {
  return (
    <div className="relative">
      <div className="absolute inset-0 blur-md opacity-60 bg-gradient-to-tr from-indigo-500 via-fuchsia-500 to-rose-500 rounded-xl" />
      <div className="relative h-10 w-10 grid place-items-center rounded-xl bg-gradient-to-tr from-indigo-500 via-fuchsia-500 to-rose-500 text-white font-bold shadow-md">
        S
      </div>
    </div>
  );
}

// --- A single nav item with underline/slide animation ---
function NavItem({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "relative px-3 py-2 rounded-xl transition-all",
        "text-base font-semibold tracking-wide",
        active ? "text-zinc-900" : "text-zinc-700 hover:text-zinc-900"
      )}
    >
      <span className="relative inline-block">
        {label}
        {/* underline grow */}
        <span
          className={cn(
            "pointer-events-none absolute left-0 -bottom-1 h-0.5 rounded-full bg-zinc-900 origin-left transition-transform duration-300 ease-out",
            active ? "w-full scale-x-100" : "w-full scale-x-0 group-hover:scale-x-100"
          )}
        />
      </span>
    </Link>
  );
}

export default function Header() {
  const pathname = usePathname();
  const { count } = useCart();
  const nav = [
    { href: "/", label: "Home" },
    { href: "/book", label: "Books" },
    { href: "/podcast", label: "Podcasts" },
    { href: "/upgrade", label: "Upgrade" },
    { href: "/about", label: "About" },
  ];

  return (
    <header className="sticky top-0 z-40">
      <div className="backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/90 border-b border-zinc-200 shadow-sm">
        <div className="container-max">
          <div className="flex items-center justify-between py-3">
            {/* Brand */}
            <Link href="/" className="flex items-center gap-3 group">
              <SoulLogo />
              <span className="text-lg sm:text-xl font-extrabold tracking-wide text-zinc-900">
                SOUL
              </span>
            </Link>

            {/* Nav */}
            <nav className="hidden md:flex items-center gap-1 group">
              {nav.map((n) => (
                <NavItem
                  key={n.href}
                  href={n.href}
                  label={n.label}
                  active={
                    pathname === n.href ||
                    (n.href !== "/" && pathname?.startsWith(n.href))
                  }
                />
              ))}
            </nav>

            {/* Right area */}
            <div className="flex items-center gap-4">
              {/* Cart Icon */}
              <Link
                href="/orders"
                className="relative p-2 rounded-lg hover:bg-gray-100 transition"
              >
                <ShoppingCartIcon className="h-6 w-6 text-zinc-700" />
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                    {count}
                  </span>
                )}
              </Link>

              <HeaderAuthArea />
            </div>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-zinc-300 to-transparent" />
      </div>
    </header>
  );
}

/* --------- NOTES ----------
- Typography: text-base + font-semibold cho nav; brand font-extrabold.
- Khoảng cách: px-3 py-2, gap-1/3 giúp thoáng hơn.
- Animation:
  + Underline scale-x mượt (duration-300) khi hover, và giữ nguyên nếu active.
  + Glass effect cho nền header (backdrop-blur + opacity).
- Logo: khối gradient phát sáng nhẹ (blur-md + gradient).
- Sticky: header dính đỉnh trang (sticky top-0).
-------------------------------- */
