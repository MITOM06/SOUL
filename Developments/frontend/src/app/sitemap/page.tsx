"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { normalizeRole } from "@/lib/role";
import {
  Home,
  BookOpen,
  Headphones,
  Flame,
  Bookmark,
  History,
  User,
  ShoppingBag,
  Package,
  CreditCard,
  Bell,
  Rocket,
  CircleHelp,
  Info,
  Mail,
  Shield,
  ScrollText,
  LayoutDashboard,
  Users as UsersIcon,
  UserCheck,
  BookMarked,
  Mic,
} from "lucide-react";

type Item = { href: string; label: string; icon: React.ElementType; badge?: "HOT" | "NEW" | "UPDATED" };
type Section = { title: string; links: Item[] };

function IconLink({ item }: { item: Item }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className="group flex items-center gap-2 text-zinc-900 hover:text-red-600 transition-colors"
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      <span>{item.label}</span>
      {item.badge && (
        <span
          className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1
          ${item.badge === "HOT" ? "bg-red-50 text-red-600 ring-red-200" : ""}
          ${item.badge === "NEW" ? "bg-emerald-50 text-emerald-600 ring-emerald-200" : ""}
          ${item.badge === "UPDATED" ? "bg-amber-50 text-amber-700 ring-amber-200" : ""}`}
        >
          {item.badge}
        </span>
      )}
    </Link>
  );
}

export default function SiteMapPage() {
  const { user } = useAuth();
  const role = normalizeRole(user);

  const general: Section = {
    title: "General",
    links: [
      { href: "/", label: "Home", icon: Home },
      { href: "/book", label: "Books", icon: BookOpen },
      { href: "/podcast", label: "Podcasts", icon: Headphones },
      { href: "/hot", label: "Hot", icon: Flame, badge: "HOT" },
    ],
  };

  const library: Section = {
    title: "Library",
    links: [
      { href: "/library", label: "My Library", icon: Bookmark },
      { href: "/continues", label: "Continues", icon: History },
    ],
  };

  const account: Section = {
    title: "Account",
    links: [
      { href: "/profile", label: "Profile", icon: User },
      { href: "/orders", label: "My Orders", icon: ShoppingBag },
      { href: "/my-package", label: "My Package", icon: Package },
      { href: "/payment-history", label: "My Payment", icon: CreditCard },
      { href: "/notifications", label: "Notifications", icon: Bell },
      { href: "/upgrade", label: "Upgrade", icon: Rocket },
    ],
  };

  const support: Section = {
    title: "Support",
    links: [
      { href: "/faq", label: "FAQ", icon: CircleHelp },
      { href: "/about", label: "About", icon: Info },
      { href: "/contact", label: "Contact", icon: Mail },
    ],
  };

  const legal: Section = {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy Policy", icon: Shield },
      { href: "/terms", label: "Terms of Service", icon: ScrollText },
    ],
  };

  const admin: Section = {
    title: "Admin",
    links: [
      { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
      { href: "/admin/role/admin", label: "Admins", icon: Shield },
      { href: "/admin/role/users", label: "Users", icon: UsersIcon },
      { href: "/admin/users-sub", label: "Users Subscriptions", icon: UserCheck },
      { href: "/admin/books", label: "Books Management", icon: BookMarked },
      { href: "/admin/podcasts", label: "Podcasts Management", icon: Mic },
      { href: "/admin/notifications", label: "Notifications", icon: Bell },
    ],
  };

  const sections: Section[] =
    role === "admin"
      ? [general, library, account, support, legal, admin]
      : [general, library, account, support, legal];

  return (
    <section className="full-bleed p-6 md:p-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Site Map</h1>
        <p className="mt-2 text-sm text-zinc-600">
          All key destinations, neatly grouped for quick access.
        </p>
      </header>

      <nav aria-label="Sitemap">
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {sections.map((s) => (
            <div
              key={s.title}
              className="rounded-2xl border bg-white p-6 shadow-sm ring-1 ring-zinc-100"
            >
              <h2 className="text-lg font-semibold text-zinc-900">{s.title}</h2>
              <ul className="mt-4 grid gap-2">
                {s.links.map((item) => (
                  <li key={`${s.title}-${item.href}`}>
                    <IconLink item={item} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </nav>
    </section>
  );
}
