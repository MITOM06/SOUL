import Link from 'next/link'
import React from 'react'
import { Podcast } from '@/types'

// Minimal card for podcasts; supports square or wide variant for Home
export default function PodcastCard({ podcast, variant = 'square' }: { podcast: Podcast; variant?: 'square' | 'wide' }) {
  const ratioClass = variant === 'wide' ? 'aspect-[16/9]' : 'aspect-square'
  const priceCents = (podcast as any)?.price_cents
  const priceBadge = typeof priceCents === 'number'
    ? (priceCents > 0
        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(priceCents / 100)
        : 'Free')
    : null
  return (
    <Link href={`/podcast/${podcast.id}`} className="group block">
      <article className="card overflow-hidden transition shadow-sm hover:shadow-md hover:-translate-y-0.5 duration-200 relative">
        {priceBadge && (
          <span className="absolute top-2 right-2 z-20 text-xs font-semibold px-2 py-0.5 rounded-full bg-black/70 text-white">
            {priceBadge}
          </span>
        )}
        <div className={`w-full ${ratioClass} bg-zinc-100 overflow-hidden`}>
          {podcast.cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={podcast.cover}
              alt={podcast.title}
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
          {podcast.title}
        </div>
      </div>
    </Link>
  )
}
