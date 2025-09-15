import React from 'react'
import { demoPodcasts } from '@/data/demoPodcasts'
import AudioPlayer from '@/components/AudioPlayer'

interface Props { params: { id: string } }

export default function PodcastDetail({ params }: Props) {
  const id = Number(params.id)
  const p = demoPodcasts.find(x => x.id === id)
  if (!p) return <div className="py-20">Không tìm thấy podcast</div>

  return (
    <section className="grid lg:grid-cols-3 gap-6">
      <div className="card p-4">
        {p.cover ? <img src={p.cover} alt={p.title} /> : <div className="cover-placeholder h-72" />}
        <div className="mt-4">
          <div className="text-xl font-semibold">{p.title}</div>
          <div className="meta mt-1">{p.host} • {p.category}</div>
          <div className="mt-3">
            <a className="btn">Subscribe</a>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-4">
        <div className="card p-6">
          <h2 className="text-lg font-semibold">Mô tả</h2>
          <p className="mt-3 text-zinc-700">{p.description}</p>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold">Nghe tập</h3>
          <AudioPlayer title={p.title} src={p.audio_url} />
        </div>
      </div>
    </section>
  )
}
