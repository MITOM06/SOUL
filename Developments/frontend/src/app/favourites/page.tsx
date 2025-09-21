// Favourites page.  Displays books and podcasts that the user has saved.
'use client';

import React, { useEffect, useState } from 'react';
import UserPanelLayout from '@/components/UserPanelLayout';
import BookCard from '@/components/BookCard';
import PodcastCard from '@/components/PodcastCard';
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
        const resp = await api.get('/v1/favourites');
        const data = resp.data?.data || resp.data;

        setBooks((data.books || []) as any[]);
        setPodcasts((data.podcasts || []) as any[]);
      } catch (err) {
        toast.error('Failed to load favourites');
        setBooks([]);
        setPodcasts([]);
      } finally {
        setLoading(false);
      }
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

  return (
    <UserPanelLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Favourites</h1>

        {/* Books */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Favourite Books</h2>
          {loading ? (
            <p>Loading...</p>
          ) : books.length === 0 ? (
            <p>No favourite books yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {books.map((b) => (
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
          )}
        </div>

        {/* Podcasts */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Favourite Podcasts</h2>
          {loading ? (
            <p>Loading...</p>
          ) : podcasts.length === 0 ? (
            <p>No favourite podcasts yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {podcasts.map((p) => (
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
          )}
        </div>
      </div>
    </UserPanelLayout>
  );
}
