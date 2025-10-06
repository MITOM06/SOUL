// Favourites page – load user's favourites and render books/podcasts with nice UX.
'use client';

import React, { useEffect, useState } from 'react';
import UserPanelLayout from '@/components/UserPanelLayout';
import BookCard from '@/components/BookCard';
import PodcastCard from '@/components/PodcastCard';
import api, { favouritesAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { normalizeRole } from '@/lib/role';

type ProductType = 'ebook' | 'podcast';
interface Product {
  id: number;
  type: ProductType | string;
  title: string;
  thumbnail_url?: string | null;
  // optional
  category?: string | null;
  metadata?: any;
}

export default function FavouritesPage() {
  const { user } = useAuth();
  const role = normalizeRole(user);
  const isAdmin = role === 'admin';
  const [books, setBooks] = useState<Product[]>([]);
  const [podcasts, setPodcasts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();

    async function fetchData() {
      setLoading(true);
      setErr(null);
      try {
        // 1) Load favourites via API (supports multiple shapes)
        const favRes = await favouritesAPI.getAll(); // GET /v1/favourites
        const raw = favRes?.data?.data ?? favRes?.data ?? {};

        // CASE A: backend returns arrays books/podcasts directly
        if (Array.isArray(raw.books) || Array.isArray(raw.podcasts)) {
          const bs = (raw.books ?? []) as Product[];
          const ps = (raw.podcasts ?? []) as Product[];
          setBooks(bs);
          setPodcasts(ps);
          return;
        }

        // CASE B: backend returns product_ids => fetch each product detail
        const ids: number[] = Array.isArray(raw.product_ids) ? raw.product_ids : [];
        if (!ids.length) {
          setBooks([]);
          setPodcasts([]);
          return;
        }

        const fetchOne = (id: number) =>
          api
            .get(`/v1/catalog/products/${id}`, { signal: ac.signal as any })
            .then((r) => (r?.data?.data?.product ?? r?.data?.data ?? r?.data) as Product)
            .catch(() => null);

        const results = await Promise.all(ids.map(fetchOne));
        const products = (results.filter(Boolean) as Product[]).map((p) => ({
          ...p,
          // Normalize type
          type: String(p.type) === 'podcast' ? 'podcast' : 'ebook',
        }));

        setBooks(products.filter((p) => p.type === 'ebook'));
        setPodcasts(products.filter((p) => p.type === 'podcast'));
      } catch (e: any) {
        setErr(e?.response?.data?.message || 'Failed to load favorites.');
        setBooks([]);
        setPodcasts([]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    return () => ac.abort();
  }, []);

  const onRemove = async (productId: number) => {
    // Optimistic update
    setBooks((prev) => prev.filter((b) => b.id !== productId));
    setPodcasts((prev) => prev.filter((p) => p.id !== productId));
    try {
      await favouritesAPI.remove(productId); // DELETE /v1/favourites/{productId}
      toast.success('Removed from Favorites');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to remove');
      // rollback đơn giản: reload
      setTimeout(() => location.reload(), 600);
    }
  };

  const Empty = ({ text }: { text: string }) => (
    <p className="text-zinc-600">{text}</p>
  );

  return (
    <UserPanelLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Favorites</h1>

        {isAdmin && (
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
            Admin accounts cannot use Favourites.
          </div>
        )}

        {!isAdmin && err && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700">
            {err}
          </div>
        )}

        {/* Books */}
        {!isAdmin && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Favorite Books</h2>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 rounded-xl bg-zinc-100 animate-pulse" />
              ))}
            </div>
          ) : books.length === 0 ? (
            <Empty text="You have no favorite books yet." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {books.map((b) => (
                <div key={b.id} className="relative group">
                  {/* BookCard của bạn có thể dùng prop khác; mình map cover <- thumbnail_url */}
                  <BookCard book={{ ...b, cover: b.thumbnail_url } as any} />
                  <button
                    onClick={() => onRemove(b.id)}
                    className="hidden group-hover:inline-flex absolute top-2 right-2 text-xs px-2 py-1 rounded bg-red-600 text-white"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
        )}

        {/* Podcasts */}
        {!isAdmin && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Favorite Podcasts</h2>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-44 rounded-xl bg-zinc-100 animate-pulse" />
              ))}
            </div>
          ) : podcasts.length === 0 ? (
            <Empty text="You have no favorite podcasts yet." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {podcasts.map((p) => (
                <div key={p.id} className="relative group">
                  {/* Hide price to avoid overlap with Remove */}
                  <PodcastCard podcast={{ ...p, cover: p.thumbnail_url } as any} variant="wide" hidePrice />
                  <button
                    onClick={() => onRemove(p.id)}
                    className="hidden group-hover:inline-flex absolute top-2 right-2 z-30 text-xs px-2 py-1 rounded bg-red-600 text-white shadow"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
        )}
      </div>
    </UserPanelLayout>
  );
}
