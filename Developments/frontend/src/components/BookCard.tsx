import Link from 'next/link'
import React from 'react'
import { Book } from '@/types'

export default function BookCard({ book }: { book: Book }) {
  return (
    <article className="card p-4">
      <Link href={`/book/${book.id}`}>
        <div className="overflow-hidden rounded-xl">
          {book.cover ? (
            <img src={book.cover} alt={book.title} className="w-full h-48 object-cover" />
          ) : (
            <div className="cover-placeholder h-48 flex flex-col items-center justify-center">
              <div className="text-sm text-zinc-500">Ảnh sách (placeholder)</div>
            </div>
          )}
        </div>
      </Link>
      <div className="mt-3">
        <Link href={`/book/${book.id}`} className="text-lg font-semibold hover:text-[color:var(--brand-500)]">{book.title}</Link>
        <div className="meta mt-1">{book.author} • {book.category}</div>
        <p className="mt-2 text-sm text-zinc-600 line-clamp-3">{book.description}</p>
      </div>
      <div className="mt-4 flex justify-between items-center">
        <Link href={`/book/${book.id}`} className="btn">Mở</Link>
        <div className="text-xs text-zinc-500">{book.access_level}</div>
      </div>
    </article>
  )
}
