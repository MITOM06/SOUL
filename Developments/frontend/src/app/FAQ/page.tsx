"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import Script from "next/script";

/**
 * SOUL – FAQ Page
 * - Professional layout with hero, search, category filters, accordion list, and support CTA
 * - Accessible accordion (keyboard + ARIA)
 * - JSON-LD schema for SEO (FAQPage)
 * - Tailwind only (no extra deps), motion-safe transitions
 */

// ---- Types ----
interface FaqItem {
  id: string;
  q: string;
  a: string;
  cat: "Account" | "Ordering" | "Payments" | "Reading" | "Technical" | "Other";
}

const FAQS: FaqItem[] = [
  {
    id: "acc-1",
    q: "How do I create an account?",
    a: "Click Sign Up in the header, enter your email and a secure password, then verify your email. You can also use Google or GitHub to sign in if enabled.",
    cat: "Account",
  },
  {
    id: "acc-2",
    q: "Can I change my email or password later?",
    a: "Yes. Go to Settings → Security. For email changes, we’ll send a confirmation link to both your old and new addresses for safety.",
    cat: "Account",
  },
  {
    id: "ord-1",
    q: "Where can I find my orders?",
    a: "Open your profile menu → Orders. You’ll see each order’s items, status, and invoice. Click an order to view details.",
    cat: "Ordering",
  },
  {
    id: "ord-2",
    q: "What is the difference between ‘Buy now’ and ‘Add to cart’?",
    a: "Buy now creates a single order and takes you directly to checkout. Add to cart lets you continue browsing and pay for multiple items together.",
    cat: "Ordering",
  },
  {
    id: "pay-1",
    q: "Which payment methods do you support?",
    a: "We support popular cards and regional e-wallets depending on your country. At checkout, supported methods are listed automatically.",
    cat: "Payments",
  },
  {
    id: "pay-2",
    q: "My payment failed. What should I do?",
    a: "First, confirm your card has sufficient balance and 3-D Secure/OTP is enabled. Then retry. If the issue persists, contact support with your order ID and timestamp.",
    cat: "Payments",
  },
  {
    id: "read-1",
    q: "How do I start reading a book I purchased?",
    a: "After payment is completed, the Read button appears on the product page and in your Library. Click it to open the reader.",
    cat: "Reading",
  },
  {
    id: "read-2",
    q: "Can I listen to podcasts offline?",
    a: "For now, listening is streaming-only in the web app. We’re exploring offline mode for a future mobile release.",
    cat: "Reading",
  },
  {
    id: "tech-1",
    q: "Images or covers don’t load—how to fix?",
    a: "Try refreshing, then clear your browser cache. If you’re behind a corporate firewall or VPN, ensure our CDN domain is allowed.",
    cat: "Technical",
  },
  {
    id: "tech-2",
    q: "I entered the correct OTP but it says invalid.",
    a: "Ensure the code hasn’t expired (most codes are valid for 2–5 minutes). Check your device time is accurate and try again.",
    cat: "Technical",
  },
  {
    id: "oth-1",
    q: "Do you offer student discounts?",
    a: "Yes, occasionally. Follow our social channels or subscribe to the newsletter to be notified when discounts are available.",
    cat: "Other",
  },
];

const CATEGORIES = [
  { key: "All", label: "All" },
  { key: "Account", label: "Account" },
  { key: "Ordering", label: "Ordering" },
  { key: "Payments", label: "Payments" },
  { key: "Reading", label: "Reading" },
  { key: "Technical", label: "Technical" },
  { key: "Other", label: "Other" },
] as const;

type CatKey = (typeof CATEGORIES)[number]["key"]; 

export default function FAQPage() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<CatKey>("All");
  const [openId, setOpenId] = useState<string | null>(null);
  const [helpful, setHelpful] = useState<Record<string, "yes" | "no" | undefined>>({});

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAQS.filter((item) => {
      const matchCat = cat === "All" || item.cat === cat;
      const matchQ = !q || item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [query, cat]);

  // JSON-LD for SEO
  const jsonLd = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: filtered.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  }), [filtered]);

  return (
    <div className="min-h-[80vh]">
      {/* Breadcrumbs */}
      <nav className="mb-6 text-sm text-zinc-600">
        <div className="mx-auto max-w-6xl px-6 md:px-8 pt-8">
          <ol className="flex items-center gap-2">
            <li>
              <Link href="/" className="hover:text-zinc-900">Home</Link>
            </li>
            <li className="text-zinc-400">/</li>
            <li className="text-zinc-900 font-medium">FAQ</li>
          </ol>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] overflow-hidden">
        <div className="relative">
          <div className="absolute -left-24 -top-24 h-[36rem] w-[36rem] rounded-full blur-3xl opacity-60 bg-[radial-gradient(circle_at_center,rgba(99,102,241,.22),transparent_60%)] motion-safe:animate-pulse" />
          <div className="absolute right-0 -bottom-32 h-[30rem] w-[30rem] rounded-full blur-3xl opacity-60 bg-[radial-gradient(circle_at_center,rgba(244,63,94,.18),transparent_60%)] motion-safe:animate-pulse" />

          <div className="relative mx-auto max-w-6xl px-6 md:px-8 py-14">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur px-3 py-1 rounded-full ring-1 ring-zinc-200 text-xs font-semibold text-zinc-700 shadow-sm">
              <span className="inline-block h-2 w-2 rounded-full bg-[color:var(--brand-500)]" />
              Help Center
            </div>
            <h1 className="mt-4 text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900">
              Frequently Asked Questions
            </h1>
            <p className="mt-2 max-w-2xl text-zinc-600">
              Quick answers about accounts, orders, payments, and reading. Can’t find what you need? Reach out—we’re here to help.
            </p>

            {/* Search + Categories */}
            <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto] items-center">
              <div className="relative">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search the knowledge base…"
                  className="w-full border rounded-2xl pl-10 pr-3 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/70 focus:border-indigo-300 border-zinc-200 bg-white/90 backdrop-blur"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">🔎</span>
              </div>
              <div className="flex flex-wrap gap-2 md:justify-end">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setCat(c.key)}
                    className={`px-3 py-2 rounded-xl text-sm border transition ${
                      cat === c.key
                        ? "bg-zinc-900 text-white border-zinc-900 shadow"
                        : "bg-white text-zinc-800 border-zinc-200 hover:bg-zinc-50"
                    }`}
                    aria-pressed={cat === c.key}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* FAQ List */}
      <main className="mx-auto max-w-6xl px-6 md:px-8 pb-20">
        <div className="rounded-3xl bg-white/80 backdrop-blur ring-1 ring-zinc-200 shadow-sm p-4 md:p-6">
          {filtered.length === 0 ? (
            <div className="p-6 text-zinc-600">No results. Try a different keyword or choose another category.</div>
          ) : (
            <ul className="divide-y divide-zinc-200">
              {filtered.map((item) => (
                <li key={item.id}>
                  <AccordionRow
                    item={item}
                    open={openId === item.id}
                    onToggle={() => setOpenId(openId === item.id ? null : item.id)}
                    markHelpful={(v) => setHelpful((h) => ({ ...h, [item.id]: v }))}
                    helpful={helpful[item.id]}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Contact / Support */}
        <section className="mt-8 grid md:grid-cols-[1fr_auto] gap-4 items-center">
          <div className="rounded-3xl bg-zinc-900 text-white p-6 md:p-8 shadow ring-1 ring-zinc-800/50">
            <h2 className="text-xl md:text-2xl font-semibold">Still need help?</h2>
            <p className="mt-1 text-white/80">
              Our team replies within 24 hours on business days. Share your order ID for faster assistance.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/contact" className="px-4 py-2.5 rounded-xl bg-white text-zinc-900 font-medium hover:bg-white/90 transition">
                Contact Support
              </Link>
              <Link href="/docs" className="px-4 py-2.5 rounded-xl ring-1 ring-white/30 hover:bg-white/10 transition">
                Browse Docs
              </Link>
            </div>
          </div>
          <div className="rounded-3xl bg-white/80 backdrop-blur ring-1 ring-zinc-200 p-4 text-sm text-zinc-600">
            <div>Last updated: <time dateTime="2025-09-22">Sep 22, 2025</time></div>
            <div>Status: <span className="inline-flex items-center gap-1 text-emerald-600"><span className="h-2 w-2 rounded-full bg-emerald-500"/> Operational</span></div>
          </div>
        </section>
      </main>

      {/* JSON-LD for SEO */}
      <Script id="faq-jsonld" type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </Script>
    </div>
  );
}

// ---- Accessible Accordion Row ----
function AccordionRow({
  item,
  open,
  onToggle,
  helpful,
  markHelpful,
}: {
  item: FaqItem;
  open: boolean;
  onToggle: () => void;
  helpful?: "yes" | "no";
  markHelpful: (v: "yes" | "no") => void;
}) {
  const panelId = `${item.id}-panel`;
  const btnId = `${item.id}-button`;

  return (
    <div className="py-3">
      <button
        id={btnId}
        aria-controls={panelId}
        aria-expanded={open}
        onClick={onToggle}
        className="w-full text-left py-3 flex items-start gap-3 group"
      >
        <span
          className={`mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full border text-sm transition ${
            open ? "bg-zinc-900 text-white border-zinc-900" : "bg-white border-zinc-300 text-zinc-600 group-hover:border-zinc-400"
          }`}
        >
          {open ? "–" : "+"}
        </span>
        <span className="flex-1">
          <span className="block text-zinc-900 font-medium leading-snug">{item.q}</span>
          <span className="mt-0.5 inline-flex items-center rounded-full bg-zinc-100 text-zinc-700 text-xs px-2 py-0.5 border border-zinc-200">{item.cat}</span>
        </span>
      </button>

      <div
        id={panelId}
        role="region"
        aria-labelledby={btnId}
        className={`grid overflow-hidden transition-all duration-300 ease-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="min-h-0">
          <div className="ml-9 mb-3 text-zinc-700 leading-relaxed">
            {item.a}
            <div className="mt-3 flex items-center gap-3 text-sm text-zinc-500">
              <span>Was this helpful?</span>
              <button
                onClick={() => markHelpful("yes")}
                className={`px-3 py-1.5 rounded-lg border transition ${
                  helpful === "yes" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
                }`}
              >
                Yes
              </button>
              <button
                onClick={() => markHelpful("no")}
                className={`px-3 py-1.5 rounded-lg border transition ${
                  helpful === "no" ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
                }`}
              >
                No
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
