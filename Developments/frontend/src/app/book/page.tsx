'use client';

import Link from 'next/link'
import { useEffect, useState } from 'react'

interface Product {
  id: number; title: string; thumbnail_url?: string|null; description?: string|null; category?: string|null; price_cents: number;
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

export default function BooksListPage() {
  const [items, setItems] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/v1/catalog/products?type=ebook&per_page=50`).then(r=>r.json()).then(j=>{
      setItems(j?.data?.items || [])
    }).finally(()=>setLoading(false))
  }, [])

  if (loading) return <div className="p-6">Đang tải sách…</div>

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Books (v2)</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map(p => (
          <Link key={p.id} href={`/books2/${p.id}`} className="block border rounded-xl p-3 hover:shadow">
            {p.thumbnail_url ? <img src={p.thumbnail_url} alt={p.title} className="w-full h-40 object-cover rounded-md" /> : null}
            <div className="mt-2 font-medium line-clamp-2">{p.title}</div>
            <div className="text-sm text-gray-500">{p.category || '—'}</div>
            <div className="text-sm">{p.price_cents ? (p.price_cents/100).toLocaleString('vi-VN', {style:'currency', currency:'VND'}) : 'Miễn phí'}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
