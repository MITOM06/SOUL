import Link from 'next/link'
import React from 'react'
import { Book } from '@/types'

// Minimal, visual-first card: image in frame + single-line title below (Waka style)
export default function BookCard({ book }: { book: Book }) {
  return (
    <Link href={`/book/${book.id}`} className="group block">
      <article className="card overflow-hidden transition shadow-sm hover:shadow-md hover:-translate-y-0.5 duration-200">
        <div className="relative">
          <div className="w-full aspect-[3/4] bg-zinc-100 overflow-hidden">
            {book.cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={book.cover}
                alt={book.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                loading="lazy"
              />
            ) : (
              <div className="cover-placeholder w-full h-full" />
            )}
          </div>
        </div>
        <div className="px-3 py-3">
          <div className="text-sm font-medium line-clamp-1 group-hover:text-[color:var(--brand-600)]">
            {book.title}
          </div>
        </div>
      </article>
    </Link>
  )
}