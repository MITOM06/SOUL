"use client";

import React from 'react';
import { demoBooks } from '@/data/demoBooks';
import { demoPodcasts } from '@/data/demoPodcasts';
import { demoUsers } from '@/data/demoUsers';

// Admin dashboard overview. This page provides a quick glance at
// system statistics (counts of users, books and podcasts) and
// shortcuts to the various management pages. When the backend is
// wired up, these counts should come from API endpoints rather than
// demo arrays.

export default function AdminDashboardPage() {
  const userCount = demoUsers.length;
  const bookCount = demoBooks.length;
  const podcastCount = demoPodcasts.length;

  const cards = [
    {
      title: 'Users',
      count: userCount,
      link: '/admin/users',
      bg: 'bg-blue-100',
    },
    {
      title: 'Books',
      count: bookCount,
      link: '/admin/products',
      bg: 'bg-green-100',
    },
    {
      title: 'Podcasts',
      count: podcastCount,
      link: '/admin/products',
      bg: 'bg-yellow-100',
    },
    {
      title: 'Orders',
      count: 0,
      link: '/admin/orders',
      bg: 'bg-purple-100',
    },
  ];

  return (
    <section className="space-y-6">
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
      <p className="text-zinc-600 max-w-xl">
        Use the cards above to navigate to the respective management
        screens. Additional statistics, such as revenue or most
        popular content, can be added here once available from the
        backend.
      </p>
    </section>
  );
}