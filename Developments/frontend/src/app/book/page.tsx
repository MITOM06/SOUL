'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type ProductType = 'ebook' | 'podcast';
interface Product {
  id: number;
  type: ProductType;
  title: string;
  thumbnail_url?: string | null;
  description?: string | null;
  category?: string | null;
  price_cents: number; // số đồng, KHÔNG chia 100
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '');
const ORIGIN   = API_BASE.replace(/\/api$/, ''); // http://127.0.0.1:8000

// Fallback ảnh inline (không cần file tĩnh)
const FALLBACK_IMG = (() => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='560'>
    <rect width='100%' height='100%' fill='#f3f4f6'/>
    <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
      font-family='sans-serif' font-size='20' fill='#9ca3af'>No cover</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
})();

// Chuẩn hoá URL ảnh: http(s) giữ nguyên; /storage/... → prefix ORIGIN; chặn file:// và C:\...
const toAbs = (u?: string | null) => {
  if (!u) return '';
  const s = u.trim();
  if (/^file:\/\//i.test(s) || /^[A-Za-z]:\\/.test(s)) return ''; // chặn local path
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  if (s.startsWith('/')) return `${ORIGIN}${s}`;
  return s;
};

const formatVND = (n: number | null | undefined, withSymbol = true) => {
  const v = Number(n ?? 0);
  const s = v.toLocaleString('vi-VN', { maximumFractionDigits: 0 });
  return withSymbol ? `${s} đ` : s;
};

// fetch kèm cookie Sanctum
const authFetch = (input: RequestInfo | URL, init?: RequestInit) =>
  fetch(input, { credentials: 'include', ...(init || {}) });

export default function BooksListPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [favIds, setFavIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canFav, setCanFav] = useState<boolean>(true);

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const [resProducts, resFav] = await Promise.all([
          fetch(`${API_BASE}/v1/catalog/products?type=ebook&per_page=50`, { signal: ac.signal }),
          authFetch(`${API_BASE}/v1/favourites`, { signal: ac.signal }),
        ]);

        if (!resProducts.ok) throw new Error(`HTTP ${resProducts.status}`);
        const jProducts = await resProducts.json();
        setItems(jProducts?.data?.items || []);

        if (resFav.status === 401) {
          setCanFav(false);
          setFavIds(new Set());
        } else if (resFav.ok) {
          const jFav = await resFav.json();
          setFavIds(new Set<number>(jFav?.data?.product_ids || []));
          setCanFav(true);
        } else {
          setCanFav(false);
        }
      } catch (e: any) {
        if (e?.name !== 'AbortError') setError(e?.message || 'Không tải được danh sách');
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, []);

  const toggleFav = async (productId: number) => {
    if (!canFav) {
      alert('Vui lòng đăng nhập để dùng Yêu thích.');
      return;
    }
    const willOn = !favIds.has(productId);

    // Optimistic
    setFavIds(prev => {
      const s = new Set(prev);
      willOn ? s.add(productId) : s.delete(productId);
      return s;
    });

    const url = willOn ? `${API_BASE}/v1/favourites` : `${API_BASE}/v1/favourites/${productId}`;
    const init: RequestInit = willOn
      ? { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product_id: productId }) }
      : { method: 'DELETE', credentials: 'include' };

    const res = await authFetch(url, init);
    if (!res.ok) {
      // revert
      setFavIds(prev => {
        const s = new Set(prev);
        willOn ? s.delete(productId) : s.add(productId);
        return s;
      });
      if (res.status === 401) {
        setCanFav(false);
        alert('Phiên đăng nhập hết hạn. Hãy đăng nhập lại.');
      } else {
        alert('Có lỗi khi cập nhật Yêu thích.');
      }
    }
  };

  if (loading) return <div className="p-6">Đang tải sách…</div>;
  if (error)   return <div className="p-6 text-red-600">Lỗi: {error}</div>;
  if (!items.length) return <div className="p-6">Chưa có sách nào.</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Books</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((p) => {
          const isFav = favIds.has(p.id);
          const imgSrc = toAbs(p.thumbnail_url) || FALLBACK_IMG;

          return (
            <Link
              key={p.id}
              href={`/book/${p.id}`}
              className="relative block border rounded-xl p-3 hover:shadow"
            >
              <img
                src={imgSrc}
                alt={p.title}
                className="w-full h-40 object-cover rounded-md"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG; }}
              />

              <button
                aria-label={isFav ? 'Bỏ yêu thích' : 'Yêu thích'}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFav(p.id); }}
                className={`absolute top-2 right-2 px-2 py-1 rounded-full shadow text-sm
                  ${isFav ? 'bg-red-600 text-white' : 'bg-white text-red-600 border'}`}
                title={isFav ? 'Bỏ yêu thích' : 'Yêu thích'}
              >
                {isFav ? '♥' : '♡'}
              </button>

              <div className="mt-2 font-medium line-clamp-2">{p.title}</div>
              <div className="text-sm text-gray-500">{p.category || '—'}</div>
              <div className="text-sm">
                {p.price_cents > 0 ? formatVND(p.price_cents, true) : 'Miễn phí'}
              </div>
            </Link>
          );
        })}
      </div>

      {!canFav && (
        <div className="mt-4 text-sm text-gray-600">
          * Hãy đăng nhập để dùng tính năng Yêu thích.
        </div>
      )}
    </div>
  );
}
