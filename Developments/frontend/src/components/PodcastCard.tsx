import Link from 'next/link'
import React from 'react'
import { Podcast } from '@/types'

// Minimal card for podcasts; supports square or wide variant for Home
export default function PodcastCard({ podcast, variant = 'square', hidePrice = false, qs = '' }: { podcast: Podcast; variant?: 'square' | 'wide'; hidePrice?: boolean; qs?: string }) {
  const ratioClass = variant === 'wide' ? 'aspect-[16/9]' : 'aspect-square'
  const priceCents = (podcast as any)?.price_cents
  const priceBadge = typeof priceCents === 'number'
    ? (priceCents > 0
        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(priceCents / 100)
        : 'Free')
    : null
  const FALLBACK = `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='450'>
       <rect width='100%' height='100%' fill='#f1f5f9'/>
       <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
         font-family='sans-serif' font-size='22' fill='#94a3b8'>Podcast</text>
     </svg>`
  )}`
  return (
    <Link href={`/podcast/${podcast.id}${qs || ''}`} className="group block">
      <article className="card overflow-hidden transition shadow-sm hover:shadow-md hover:-translate-y-0.5 duration-200 relative">
        {priceBadge && !hidePrice && (
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
              onError={(e)=>{ (e.currentTarget as HTMLImageElement).src = FALLBACK; }}
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
