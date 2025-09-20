import Link from 'next/link'
import React from 'react'
import { Book } from '@/types'

// Image-only frame; caption sits below as a separate block
export default function BookCard({ book }: { book: Book }) {
  return (
    <Link href={`/book/${book.id}`} className="group block">
      <article className="card overflow-hidden transition shadow-sm hover:shadow-md hover:-translate-y-0.5 duration-200">
        <div className="w-full aspect-[3/4] bg-zinc-100 overflow-hidden">
          {book.cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={book.cover}
              alt={book.title}
              className="block w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              loading="lazy"
            />
          ) : (
            <div className="cover-placeholder w-full h-full" />
          )}
        </div>
      </article>
      <div className="px-1.5 pt-2">
        <div className="text-sm font-medium line-clamp-1 group-hover:text-[color:var(--brand-600)]">
          {book.title}
        </div>
      </div>
    </Link>
  )
}
