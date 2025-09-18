// Continues page.  Shows books and podcasts that the user has started but not finished.
'use client';

import React, { useEffect, useState } from 'react';
import UserPanelLayout from '@/components/UserPanelLayout';
import BookCard from '@/components/BookCard';
import PodcastCard from '@/components/PodcastCard';
import { demoBooks } from '@/data/demoBooks';
import { demoPodcasts } from '@/data/demoPodcasts';
import api from '@/lib/api';

interface Book {
  id: number;
  title: string;
  image?: string;
  author?: string;
}

interface Podcast {
  id: number;
  title: string;
  image?: string;
  description?: string;
}

export default function ContinuesPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        // Try to fetch a listing of continues; backend currently exposes per-product continues
        // so we'll attempt common endpoints and otherwise fallback to demo data.
        let done = false;
        try {
          const resp = await api.get('/v1/continues');
          const data = resp.data?.data || resp.data || [];
          if (Array.isArray(data) && data.length) {
            // map to product items if required
            const bs = data.filter((d: any) => (d.type || '').toLowerCase() === 'ebook');
            const ps = data.filter((d: any) => (d.type || '').toLowerCase() === 'podcast');
            setBooks(bs as any[]);
            setPodcasts(ps as any[]);
            done = true;
          }
        } catch (err) {
          // ignore
        }
        if (!done) {
          setBooks(demoBooks.slice(3, 6) as any[]);
          setPodcasts(demoPodcasts.slice(3, 6) as any[]);
        }
      } catch (err) {
        setBooks([]);
        setPodcasts([]);
      }
    }
    fetchData();
  }, []);

  const bookItems = books.length ? books : demoBooks.slice(3, 6);
  const podcastItems = podcasts.length ? podcasts : demoPodcasts.slice(3, 6);

  return (
    <UserPanelLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Continues</h1>
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">In‑progress Books</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {bookItems.map((b) => (
              <BookCard key={b.id} book={b as any} />
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">In‑progress Podcasts</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {podcastItems.map((p) => (
              <PodcastCard key={p.id} podcast={p as any} />
            ))}
          </div>
        </div>
      </div>
    </UserPanelLayout>
  );
}
