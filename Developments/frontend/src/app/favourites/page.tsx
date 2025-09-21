// Favourites page – load user's favourites (product_ids) then fetch product details.
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import UserPanelLayout from '@/components/UserPanelLayout';
import BookCard from '@/components/BookCard';
import PodcastCard from '@/components/PodcastCard';
import api, { favouritesAPI } from '@/lib/api';
import toast from 'react-hot-toast';

type ProductType = 'ebook' | 'podcast';
interface Product {
  id: number;
  type: ProductType;
  title: string;
  thumbnail_url?: string | null;
  // optional fields from BE
  category?: string | null;
  metadata?: any;
}

export default function FavouritesPage() {
  const [books, setBooks] = useState<Product[]>([]);
  const [podcasts, setPodcasts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      setLoading(true); setErr(null);
      try {
        // 1) Lấy danh sách ID sp yêu thích
        const favRes = await favouritesAPI.getAll(); // GET /v1/favourites
        const data = favRes?.data?.data || favRes?.data || {};
        const ids: number[] = Array.isArray(data.product_ids) ? data.product_ids : [];

        if (!ids.length) { setBooks([]); setPodcasts([]); return; }

        // 2) Lấy chi tiết từng product (dùng catalog/public)
        const fetchOne = (id: number) =>
          api.get(`/v1/catalog/products/${id}`, { signal: ac.signal as any })
             .then(r => (r?.data?.data?.product || r?.data?.data || r?.data) as Product)
             .catch(() => null);

        const results = await Promise.all(ids.map(fetchOne));
        const products = results.filter(Boolean) as Product[];

        const bs: Product[] = [];
        const ps: Product[] = [];
        products.forEach(p => {
          if (String(p.type) === 'podcast') ps.push(p);
          else bs.push(p); // mặc định ebook
        });

        setBooks(bs);
        setPodcasts(ps);
      } catch (e: any) {
        setErr(e?.response?.data?.message || 'Không tải được danh sách yêu thích.');
        setBooks([]); setPodcasts([]);
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, []);

  const onRemove = async (productId: number) => {
    // optimistic
    setBooks(prev => prev.filter(b => b.id !== productId));
    setPodcasts(prev => prev.filter(p => p.id !== productId));
    try {
      await favouritesAPI.remove(productId); // DELETE /v1/favourites/{productId}
      toast.success('Đã xoá khỏi Yêu thích');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Xoá thất bại');
      // rollback nếu cần: không biết thuộc nhóm nào nên không khôi phục chính xác — reload toàn trang
      // hoặc gọi lại fetch; đơn giản: reload:
      setTimeout(() => location.reload(), 600);
    }
  };

  const Empty = ({ text }: { text: string }) => (
    <p className="text-zinc-600">{text}</p>
  );

  return (
    <UserPanelLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Favourites</h1>

        {err && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700">
            {err}
          </div>
        )}

        {/* Books */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Favourite Books</h2>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 rounded-xl bg-zinc-100 animate-pulse" />
              ))}
            </div>
          ) : books.length === 0 ? (
            <Empty text="Bạn chưa lưu sách nào." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {books.map(b => (
                <div key={b.id} className="relative group">
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

        {/* Podcasts */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Favourite Podcasts</h2>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-44 rounded-xl bg-zinc-100 animate-pulse" />
              ))}
            </div>
          ) : podcasts.length === 0 ? (
            <Empty text="Bạn chưa lưu podcast nào." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {podcasts.map(p => (
                <div key={p.id} className="relative group">
                  <PodcastCard podcast={{ ...p, image: p.thumbnail_url } as any} />
                  <button
                    onClick={() => onRemove(p.id)}
                    className="hidden group-hover:inline-flex absolute top-2 right-2 text-xs px-2 py-1 rounded bg-red-600 text-white"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </UserPanelLayout>
  );
}
