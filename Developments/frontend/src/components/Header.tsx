"use client";

import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { normalizeRole } from "@/lib/role";
import { ShoppingCartIcon, BellIcon } from "@heroicons/react/24/outline";
import { useCart } from "@/contexts/CartContext";

/* ========= Small helpers ========= */
function useClickOutside<T extends HTMLElement>(open: boolean, onClose: () => void) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) onClose();
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", esc);
    };
  }, [open, onClose]);
  return ref;
}

function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return scrolled;
}

/* ========= Logo ========= */
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

/* ========= Nav Item (underline grow) ========= */
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
        "group relative px-3 py-2 rounded-xl transition-all",
        "text-base font-semibold tracking-wide",
        active ? "text-zinc-900" : "text-zinc-700 hover:text-zinc-900"
      )}
    >
      <span className="relative inline-block">
        {label}
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

/* ========= Header ========= */
export default function Header() {
  const { user, isLoading, logout, subscriptionLevel } = useAuth();
  const { count } = useCart();
  const pathname = usePathname();
  const router = useRouter();
  const scrolled = useScrolled(8);

  const role = normalizeRole(user); // 'admin' | 'user' | 'guest'
  const next = encodeURIComponent(pathname || "/");
  const isPremium = subscriptionLevel === "premium" || subscriptionLevel === "vip";
  const planLabel = subscriptionLevel ? subscriptionLevel.toUpperCase() : "FREE";

  // Dropdown auth
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useClickOutside<HTMLDivElement>(menuOpen, () => setMenuOpen(false));

  // bump animation when cart count changes
  const [bump, setBump] = useState(false);
  useEffect(() => {
    if (count <= 0) return;
    setBump(true);
    const t = setTimeout(() => setBump(false), 300);
    return () => clearTimeout(t);
  }, [count]);

  const nav = [
    { href: "/", label: "(SOUL) Stories Online, Unified Library" },
    { href: "/hot", label: "Hot" },
    { href: "/book", label: "Books" },
    { href: "/podcast", label: "Podcasts" },
    { href: "/about", label: "About" },
    { href: "/FAQ", label: "FAQ" },
  ];

  return (
    <header className="sticky top-0 z-40">
      <div
        className={cn(
          "backdrop-blur supports-[backdrop-filter]:bg-white/50 bg-white/60 border-b transition-shadow neon-bar",
          scrolled ? "shadow-sm" : "shadow-none"
        )}
      >
        <div className="px-4 full-bleed">
          <div className="flex h-16 items-center justify-between">
            {/* Brand */}
            <Link href="/" className="flex items-center gap-3 group">
              <SoulLogo />
              <span className="text-lg sm:text-xl font-extrabold tracking-wide text-zinc-900">
                SOUL
              </span>
            </Link>

            {/* Public nav – always visible for everyone */}
            <nav className="hidden md:flex items-center gap-1">
              {nav.map((n) => {
                const active =
                  pathname === n.href || (n.href !== "/" && pathname?.startsWith(n.href));
                return <NavItem key={n.href} href={n.href} label={n.label} active={active} />;
              })}
            </nav>

            {/* Right area */}
            <div className="flex items-center gap-3">
              {/* Upgrade plan: users can click; admin view-only */}
              {role === "user" && !isPremium && (
                <Link
                  href="/pricing"
                  className="relative px-3 py-2 rounded-xl text-white bg-gradient-to-r from-fuchsia-500 to-indigo-500 shadow hover:shadow-md transition hover:-translate-y-0.5"
                  title="Upgrade plan"
                >
                  <span className="relative z-10">Upgrade</span>
                  <span className="absolute inset-0 rounded-xl animate-pulse bg-white/10" />
                </Link>
              )}
              {role === "admin" && (
                <span
                  title="Admins cannot upgrade plans"
                  className="hidden sm:inline-flex items-center rounded-xl border px-3 py-1.5 text-sm text-gray-400 cursor-not-allowed"
                >
                  Upgrade
                </span>
              )}

              {/* Notifications – users -> /notifications, admins -> /admin/notifications */}
              <Link
                href={role === "admin" ? "/admin/notifications" : "/notifications"}
                className="relative p-2 rounded-lg hover:bg-gray-100 transition"
                aria-label="Notifications"
                title="Notifications"
              >
                <BellIcon className="h-6 w-6 text-zinc-700" />
              </Link>

              {/* Cart (guests can view) */}
              <Link
                href="/cart"
                className={cn(
                  "relative p-2 rounded-lg hover:bg-gray-100 transition",
                  bump && "animate-[cartbump_.3s_ease-out]"
                )}
                aria-label="Open cart"
                title="Cart"
              >
                <ShoppingCartIcon className="h-6 w-6 text-zinc-700" />
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full grid place-items-center min-w-5 h-5 bg-[color:var(--brand-500,#111)]">
                    {count}
                  </span>
                )}
              </Link>

              {/* Auth area */}
              {isLoading ? (
                <div className="h-8 w-28 bg-gray-200 animate-pulse rounded" />
              ) : user ? (
                <div className="relative" ref={menuRef}>
                  <button
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen((s) => !s)}
                    className={cn(
                      "group flex items-center gap-2 px-3 py-2 rounded-lg",
                      "bg-gray-100 hover:bg-gray-200 transition",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    )}
                  >
                    {/* Avatar + premium pulse ring */}
                    <div
                      className={cn(
                        "h-8 w-8 rounded-full grid place-items-center text-white font-semibold",
                        "bg-blue-500",
                        isPremium && "ring-2 ring-amber-400 relative"
                      )}
                      title={isPremium ? `Plan: ${planLabel}` : `Plan: ${planLabel}`}
                    >
                      {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                      {isPremium && (
                        <span className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-amber-400/40 animate-[pulse_2s_ease-out_infinite] [@media(prefers-reduced-motion:reduce)]:hidden" />
                      )}
                    </div>

                    <span className="hidden sm:block text-sm">
                      {user.name || user.email}
                    </span>

                    <span className="text-gray-400 text-xs">({role})</span>

                    <svg
                      className={cn(
                        "h-4 w-4 opacity-70 transition-transform",
                        menuOpen ? "rotate-180" : "rotate-0"
                      )}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z" />
                    </svg>
                  </button>

                  {/* Dropdown with scale/opacity animation */}
                  <div
                    className={cn(
                      "absolute right-0 mt-2 w-64 rounded-xl border bg-white shadow-lg z-50 origin-top-right",
                      "transition will-change-transform will-change-opacity",
                      menuOpen
                        ? "opacity-100 scale-100"
                        : "pointer-events-none opacity-0 scale-95",
                      "[&]:[@media(prefers-reduced-motion:reduce)]:scale-100"
                    )}
                    role="menu"
                    tabIndex={-1}
                  >
                    <div className="absolute -top-2 right-6 h-4 w-4 rotate-45 bg-white border-l border-t" />
                    <div className="p-2">
                      {/* Plan label only for users (hidden for admins) */}
                      {role === "user" && (
                        <>
                          <div className="px-3 py-2 text-xs text-gray-600">
                            Current plan: <span className="font-semibold">{planLabel}</span>
                          </div>
                          <div className="h-px bg-gray-100 my-2" />
                        </>
                      )}

                      {/* Menu items */}
                      {role === "admin" ? (
                        <>
                          <Link
                            href="/profile"
                            className="block px-3 py-2 rounded-md hover:bg-gray-50 text-sm focus:bg-gray-50 focus:outline-none"
                            onClick={() => setMenuOpen(false)}
                            role="menuitem"
                          >
                            Profile
                          </Link>
                          <Link
                            href="/admin/dashboard"
                            className="block px-3 py-2 rounded-md hover:bg-gray-50 text-sm focus:bg-gray-50 focus:outline-none"
                            onClick={() => setMenuOpen(false)}
                            role="menuitem"
                          >
                            Admin Panel
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link
                            href="/profile"
                            className="block px-3 py-2 rounded-md hover:bg-gray-50 text-sm focus:bg-gray-50 focus:outline-none"
                            onClick={() => setMenuOpen(false)}
                            role="menuitem"
                          >
                            Profile
                          </Link>
                          <Link
                            href="/favourites"
                            className="block px-3 py-2 rounded-md hover:bg-gray-50 text-sm focus:bg-gray-50 focus:outline-none"
                            onClick={() => setMenuOpen(false)}
                            role="menuitem"
                          >
                            Favorites
                          </Link>
                          <Link
                            href="/library"
                            className="block px-3 py-2 rounded-md hover:bg-gray-50 text-sm focus:bg-gray-50 focus:outline-none"
                            onClick={() => setMenuOpen(false)}
                            role="menuitem"
                          >
                            Library
                          </Link>
                          <Link
                            href="/orders"
                            className="block px-3 py-2 rounded-md hover:bg-gray-50 text-sm focus:bg-gray-50 focus:outline-none"
                            onClick={() => setMenuOpen(false)}
                            role="menuitem"
                          >
                            Orders
                          </Link>
                          <Link
                            href="/continues"
                            className="block px-3 py-2 rounded-md hover:bg-gray-50 text-sm focus:bg-gray-50 focus:outline-none"
                            onClick={() => setMenuOpen(false)}
                            role="menuitem"
                          >
                            Continue
                          </Link>
                          <Link
                            href="/payment-history"
                            className="block px-3 py-2 rounded-md hover:bg-gray-50 text-sm focus:bg-gray-50 focus:outline-none"
                            onClick={() => setMenuOpen(false)}
                            role="menuitem"
                          >
                            Payment History
                          </Link>
                          <Link
                            href="/my-package"
                            className="block px-3 py-2 rounded-md hover:bg-gray-50 text-sm focus:bg-gray-50 focus:outline-none"
                            onClick={() => setMenuOpen(false)}
                            role="menuitem"
                          >
                            My Plan
                          </Link>
                        </>
                      )}

                      <button
                        className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 text-sm text-red-600 focus:bg-gray-50 focus:outline-none"
                        onClick={async () => {
                          setMenuOpen(false);
                          await logout();
                          router.push(`/?next=${next}`);
                        }}
                        role="menuitem"
                      >
                        Log out
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Link
                    href={`/auth/register?next=${next}`}
                    className="rounded-xl border px-3 py-1.5 text-sm hover:bg-gray-50"
                  >
                    Sign up
                  </Link>
                  <Link
                    href={`/auth/login?next=${next}`}
                    className="rounded-xl bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-900"
                  >
                    Log in
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* neon divider bar */}
        <div className="h-px bg-gradient-to-r from-transparent via-zinc-300 to-transparent" />
      </div>

      {/* keyframes & helpers */}
      <style jsx global>{`
        @keyframes cartbump {
          0% { transform: scale(1); }
          10% { transform: scale(0.95); }
          50% { transform: scale(1.06); }
          100% { transform: scale(1); }
        }
      `}</style>
    </header>
  );
}
