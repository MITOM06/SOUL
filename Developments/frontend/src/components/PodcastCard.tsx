import Link from 'next/link'
import React from 'react'
import { Podcast } from '@/types'

export default function PodcastCard({ podcast }: { podcast: Podcast }) {
  return (
    <article className="card p-4">
      <Link href={`/podcast/${podcast.id}`}>
        <div className="overflow-hidden rounded-xl">
          {podcast.cover ? (
            <img src={podcast.cover} alt={podcast.title} className="w-full h-40 object-cover" />
          ) : (
            <div className="cover-placeholder h-40 flex flex-col items-center justify-center">
              <div className="text-sm text-zinc-500">Ảnh podcast</div>
            </div>
          )}
        </div>
      </Link>
      <div className="mt-3">
        <Link href={`/podcast/${podcast.id}`} className="text-lg font-semibold hover:text-[color:var(--brand-500)]">{podcast.title}</Link>
        <div className="meta mt-1">{podcast.host} • {podcast.category}</div>
        <p className="mt-2 text-sm text-zinc-600 line-clamp-3">{podcast.description}</p>
      </div>
      <div className="mt-4 flex justify-between items-center">
        <Link href={`/podcast/${podcast.id}`} className="btn">Nghe</Link>
        <div className="text-xs text-zinc-500">{podcast.access_level}</div>
      </div>
    </article>
  )
}
