"use client";

import Link from "next/link";
import React from "react";

// Artistic landing for SOUL
// Full-bleed sections use the same full-width trick as other pages

function NeonOrb({ className }: { className?: string }) {
  return (
    <div className={`absolute rounded-full blur-3xl opacity-60 ${className || ''}`} />
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-5 py-4 rounded-2xl bg-white/70 backdrop-blur ring-1 ring-black/5 shadow-sm min-w-[160px]">
      <div className="text-2xl font-extrabold tracking-tight text-zinc-900">{value}</div>
      <div className="text-sm text-zinc-600">{label}</div>
    </div>
  );
}

export default function LandingHome() {
  return (
    <div className="space-y-20">
      {/* HERO */}
      <section className="relative w-screen left-[50%] right-[50%] -ml-[50vw] -mr-[50vw] overflow-hidden">
        <div className="relative min-h-[84vh] sm:min-h-[90vh] flex items-center">
          {/* Neon orbs */}
          <NeonOrb className="w-[52vw] h-[52vw] -left-20 -top-20 bg-[radial-gradient(circle_at_center,rgba(99,102,241,.25),transparent_60%)]" />
          <NeonOrb className="w-[48vw] h-[48vw] right-[-12vw] top-28 bg-[radial-gradient(circle_at_center,rgba(217,70,239,.22),transparent_60%)]" />
          <NeonOrb className="w-[60vw] h-[60vw] left-1/4 bottom-[-20vw] bg-[radial-gradient(circle_at_center,rgba(244,63,94,.18),transparent_60%)]" />

          <div className="relative z-10 w-full px-6 md:px-12 grid lg:grid-cols-2 items-center gap-10">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-white/70 backdrop-blur px-3 py-1 rounded-full ring-1 ring-black/5 text-xs font-semibold text-zinc-700">
                <span className="inline-block h-2 w-2 rounded-full bg-[color:var(--brand-500)]" />
                Welcome to SOUL
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tighter text-zinc-900">
                Stories Online,
                <span className="block text-transparent bg-clip-text bg-gradient-to-tr from-indigo-500 via-fuchsia-500 to-rose-500">
                  Unified Library
                </span>
              </h1>
              <p className="text-zinc-700 max-w-xl">
                A living space for ebooks and podcasts, crafted with a neon soul.
                Read, listen and collect—your journey begins here.
              </p>
              <div className="flex items-center gap-3">
                <Link href="/book" className="px-5 py-2.5 rounded-xl text-white font-semibold bg-[color:var(--brand-500)] hover:bg-[color:var(--brand-600)] shadow">
                  Explore Books
                </Link>
                <Link href="/podcast" className="px-5 py-2.5 rounded-xl border border-zinc-300 hover:bg-white/70 backdrop-blur font-medium text-zinc-800">
                  Explore Podcasts
                </Link>
              </div>

              {/* Stats */}
              <div className="mt-6 flex flex-wrap gap-3">
                <Stat value="25k+" label="Titles" />
                <Stat value="48k+" label="Listeners" />
                <Stat value="1.2M" label="Pages read" />
                <Stat value="4.8★" label="Avg. rating" />
              </div>
            </div>

            {/* Art panel */}
            <div className="relative h-[360px] md:h-[520px]">
              <div className="absolute inset-0 rounded-3xl bg-white/60 backdrop-blur ring-1 ring-black/5 shadow-xl" />
              {/* floating tiles */}
              <div className="absolute inset-0">
                <div className="absolute left-6 top-6 h-28 w-40 rounded-2xl bg-gradient-to-br from-indigo-500/70 to-fuchsia-500/70 shadow-lg rotate-[-6deg]" />
                <div className="absolute right-8 top-10 h-36 w-36 rounded-full bg-gradient-to-tr from-fuchsia-500/70 to-rose-500/70 shadow-lg" />
                <div className="absolute left-1/2 -translate-x-1/2 top-24 h-44 w-72 rounded-3xl bg-gradient-to-br from-white/90 to-white/70 ring-1 ring-black/5 shadow-lg" />
                <div className="absolute left-8 bottom-10 h-24 w-24 rounded-xl bg-gradient-to-br from-rose-500/70 to-indigo-500/70 shadow-lg rotate-[8deg]" />
                <div className="absolute right-6 bottom-6 h-40 w-64 rounded-3xl bg-gradient-to-br from-white/90 to-white/60 ring-1 ring-black/5 shadow-lg" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Curated vignette */}
      <section className="relative w-screen left-[50%] right-[50%] -ml-[50vw] -mr-[50vw]">
        <div className="px-6 md:px-12 py-16 grid md:grid-cols-3 gap-6">
          {[0,1,2].map((i) => (
            <article key={i} className="relative overflow-hidden rounded-3xl group">
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-zinc-800" />
              <div className="relative h-64">
                <div className="absolute inset-0 opacity-30 group-hover:opacity-40 transition">
                  <div className="absolute -left-10 -top-10 w-72 h-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,.35),transparent_60%)]" />
                  <div className="absolute right-[-30px] bottom-[-30px] w-64 h-64 rounded-full bg-[radial-gradient(circle_at_center,rgba(217,70,239,.30),transparent_60%)]" />
                </div>
                <div className="absolute inset-0 grid place-items-center text-center px-8">
                  <h3 className="text-white text-2xl font-bold tracking-tight">
                    {i===0? 'Read. Listen. Flow.' : i===1? 'Neon nights, bright stories.' : 'From page to sound.'}
                  </h3>
                  <p className="mt-2 text-white/80 text-sm max-w-sm">
                    {i===0? 'Lose yourself in pages and episodes crafted for modern readers.' : i===1? 'A visual rhythm for a library that moves with you.' : 'Your narratives, your pace—carry them anywhere.'}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative w-screen left-[50%] right-[50%] -ml-[50vw] -mr-[50vw]">
        <div className="px-6 md:px-12 pb-24">
          <div className="relative overflow-hidden rounded-3xl p-8 md:p-12 ring-1 ring-black/5 bg-white/70 backdrop-blur">
            <div className="absolute -left-10 -top-6 h-48 w-48 rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,.25),transparent_60%)]" />
            <div className="absolute right-0 -bottom-8 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_center,rgba(244,63,94,.20),transparent_60%)]" />
            <div className="relative grid md:grid-cols-[1fr_auto] items-center gap-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-900">Start your SOUL journey</h2>
                <p className="text-zinc-700 mt-1">Pick a path and begin. We’ll bring the neon.</p>
              </div>
              <div className="flex gap-3">
                <Link href="/book" className="px-5 py-2.5 rounded-xl text-white font-semibold bg-[color:var(--brand-500)] hover:bg-[color:var(--brand-600)] shadow">Browse Books</Link>
                <Link href="/podcast" className="px-5 py-2.5 rounded-xl border border-zinc-300 hover:bg-white/70 font-medium text-zinc-800">Browse Podcasts</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
