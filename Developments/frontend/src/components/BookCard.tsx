import Link from 'next/link'
import React from 'react'
import { Book } from '@/types'

// Image-only frame; caption sits below as a separate block
export default function BookCard({ book, qs = '' }: { book: Book; qs?: string }) {
  const FALLBACK = `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='800'>
       <rect width='100%' height='100%' fill='#f8fafc'/>
       <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
         font-family='sans-serif' font-size='22' fill='#94a3b8'>Book</text>
     </svg>`
  )}`
  return (
    <Link href={`/book/${book.id}${qs || ''}`} className="group block">
      <article className="card overflow-hidden transition shadow-sm hover:shadow-md hover:-translate-y-0.5 duration-200">
        <div className="w-full aspect-[3/4] bg-zinc-100 overflow-hidden">
          {book.cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={book.cover}
              alt={book.title}
              className="block w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              loading="lazy"
              onError={(e)=>{ (e.currentTarget as HTMLImageElement).src = FALLBACK; }}
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
