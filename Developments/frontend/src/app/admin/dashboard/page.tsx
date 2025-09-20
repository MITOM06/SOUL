"use client";

import React, { useEffect, useState } from 'react';
import { demoBooks } from '@/data/demoBooks';
import { demoPodcasts } from '@/data/demoPodcasts';
import { demoUsers } from '@/data/demoUsers';
import api from '@/lib/api';

// Admin dashboard overview. This page provides a quick glance at
// system statistics (counts of users, books and podcasts) and
// shortcuts to the various management pages. When the backend is
// wired up, these counts should come from API endpoints rather than
// demo arrays.

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({ users: demoUsers.length, products: demoBooks.length, orders: 0, revenue: 0 });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp = await api.get('/v1/admin/stats');
        const d = resp.data?.data || resp.data;
        if (mounted && d) setStats(d);
      } catch (err) {
        // keep demo stats
      }
    })();
    return () => { mounted = false };
  }, []);

  const cards = [
    {
      title: 'Users',
      count: stats.users,
      link: '/admin/role/users',
      bg: 'bg-blue-100',
    },
    {
      title: 'Products',
      count: stats.products,
      link: '/admin/products',
      bg: 'bg-green-100',
    },
    {
      title: 'Orders',
      count: stats.orders,
      link: '/admin/orders',
      bg: 'bg-yellow-100',
    },
    {
      title: 'Revenue',
      count: stats.revenue,
      link: '/admin/orders',
      bg: 'bg-purple-100',
    },
  ];

  return (
    <section className="space-y-8">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <a
            key={c.title}
            href={c.link}
            className={`block p-6 rounded-xl shadow-sm ${c.bg} hover:shadow-md transition`}
          >
            <div className="text-2xl font-bold">{c.count}</div>
            <div className="text-sm text-zinc-700 mt-1">{c.title}</div>
          </a>
        ))}
      </div>

      {/* Quick KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border p-4 bg-white">
          <div className="text-sm text-zinc-600">New users (7d)</div>
          <div className="text-2xl font-bold">128</div>
        </div>
        <div className="rounded-xl border p-4 bg-white">
          <div className="text-sm text-zinc-600">Active subs</div>
          <div className="text-2xl font-bold">342</div>
        </div>
        <div className="rounded-xl border p-4 bg-white">
          <div className="text-sm text-zinc-600">Conversion</div>
          <div className="text-2xl font-bold">4.2%</div>
        </div>
        <div className="rounded-xl border p-4 bg-white">
          <div className="text-sm text-zinc-600">ARPU</div>
          <div className="text-2xl font-bold">$12.7</div>
        </div>
      </div>

      {/* Fake charts (SVG) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar chart */}
        <div className="rounded-xl border p-4 bg-white">
          <div className="text-sm text-zinc-700 mb-2">Orders per day</div>
          <svg viewBox="0 0 120 60" className="w-full h-40">
            {[12, 22, 18, 30, 45, 34, 50].map((v, i) => (
              <rect key={i} x={i*16+6} y={60-v} width="10" height={v} fill="#60a5fa" />
            ))}
          </svg>
        </div>
        {/* Line chart */}
        <div className="rounded-xl border p-4 bg-white">
          <div className="text-sm text-zinc-700 mb-2">Revenue trend</div>
          <svg viewBox="0 0 120 60" className="w-full h-40">
            <polyline fill="none" stroke="#f59e0b" strokeWidth="2" points="0,40 20,35 40,38 60,28 80,20 100,25 120,18" />
          </svg>
        </div>
        {/* Pie chart */}
        <div className="rounded-xl border p-4 bg-white grid place-items-center">
          <div className="text-sm text-zinc-700 mb-2 self-start">Plan mix</div>
          <svg viewBox="0 0 42 42" className="w-32 h-32 -rotate-90">
            <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#e5e7eb" strokeWidth="6" />
            <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#6366f1" strokeWidth="6" strokeDasharray="40 60" strokeDashoffset="25" />
            <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f59e0b" strokeWidth="6" strokeDasharray="30 70" strokeDashoffset="-15" />
            <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#10b981" strokeWidth="6" strokeDasharray="20 80" strokeDashoffset="-45" />
          </svg>
        </div>
      </div>
    </section>
  );
}
