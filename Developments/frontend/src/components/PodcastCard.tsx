import Link from 'next/link'
import React from 'react'
import { Podcast } from '@/types'

// Minimal card for podcasts: cover square + single-line title
export default function PodcastCard({ podcast }: { podcast: Podcast }) {
  return (
    <Link href={`/podcast/${podcast.id}`} className="group block">
      <article className="card overflow-hidden transition shadow-sm hover:shadow-md hover:-translate-y-0.5 duration-200">
        <div className="w-full aspect-square bg-zinc-100 overflow-hidden">
          {podcast.cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={podcast.cover}
              alt={podcast.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              loading="lazy"
            />
          ) : (
            <div className="cover-placeholder w-full h-full" />
          )}
        </div>
        <div className="px-3 py-3">
          <div className="text-sm font-medium line-clamp-1 group-hover:text-[color:var(--brand-600)]">
            {podcast.title}
          </div>
        </div>
      </article>
    </Link>
  )
}