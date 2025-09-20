// Favourites page.  Displays books and podcasts that the user has saved.
'use client';

import React, { useEffect, useState } from 'react';
import UserPanelLayout from '@/components/UserPanelLayout';
import BookCard from '@/components/BookCard';
import PodcastCard from '@/components/PodcastCard';
import { demoBooks } from '@/data/demoBooks';
import { demoPodcasts } from '@/data/demoPodcasts';
import api, { favouritesAPI } from '@/lib/api';
import toast from 'react-hot-toast';

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

export default function FavouritesPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Try known or conventional endpoints; fallback if not available
        let done = false;
        try {
          const resp = await api.get('/v1/favourites');
          const data = resp.data?.data || resp.data;
          if (data) {
            const bs = (data.books || data.items || []).filter(Boolean);
            const ps = (data.podcasts || []).filter(Boolean);
            if (bs.length) setBooks(bs as any[]);
            if (ps.length) setPodcasts(ps as any[]);
            done = true;
          }
        } catch (err) {
          // ignore and try user specific endpoint
        }
        if (!done) {
          try {
            const r2 = await api.get('/v1/user/favourites');
            const d2 = r2.data?.data || r2.data;
            if (d2) {
              setBooks((d2.books || d2.items || []) as any[]);
              setPodcasts((d2.podcasts || []) as any[]);
              done = true;
            }
          } catch (err) {
            // ignore
          }
        }
        if (!done) {
          // No backend endpoint available yet — keep demo fallback
          setBooks(demoBooks.slice(0, 3) as any[]);
          setPodcasts(demoPodcasts.slice(0, 3) as any[]);
        }
      } catch (err) {
        setBooks([]);
        setPodcasts([]);
      } finally { setLoading(false); }
    }
    fetchData();
  }, []);

  const removeFav = async (id: number) => {
    try {
      await favouritesAPI.remove(id);
      setBooks((prev) => prev.filter((x) => x.id !== id));
      setPodcasts((prev) => prev.filter((x) => x.id !== id));
      toast.success('Removed from favourites');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to remove');
    }
  };

  // Fallback to a subset of demo data if API hasn't returned anything
  const bookItems = books.length ? books : demoBooks.slice(0, 3);
  const podcastItems = podcasts.length ? podcasts : demoPodcasts.slice(0, 3);

  return (
    <UserPanelLayout>
      <div className="space-y-6">
<h1 className="text-2xl font-bold">Favourites</h1>
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Favourite Books</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {bookItems.map((b) => (
              <div key={b.id} className="relative group">
                <BookCard book={b as any} />
                <button
                  onClick={() => removeFav(b.id)}
                  className="hidden group-hover:inline-flex absolute top-2 right-2 text-xs px-2 py-1 rounded bg-red-600 text-white"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Favourite Podcasts</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {podcastItems.map((p) => (
              <div key={p.id} className="relative group">
                <PodcastCard podcast={p as any} />
                <button
                  onClick={() => removeFav(p.id)}
                  className="hidden group-hover:inline-flex absolute top-2 right-2 text-xs px-2 py-1 rounded bg-red-600 text-white"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </UserPanelLayout>
  );
}
