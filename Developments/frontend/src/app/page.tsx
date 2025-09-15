import React from 'react'
import BookCard from '@/components/BookCard'
import PodcastCard from '@/components/PodcastCard'
import { demoBooks } from '@/data/demoBooks'
import { demoPodcasts } from '@/data/demoPodcasts'

export default function HomePage() {
  return (
    <section className="space-y-8">
      {/* Hero */}
      <div className="card p-8 bg-gradient-to-r from-white to-slate-50">
        <div className="grid lg:grid-cols-2 gap-6 items-center">
          <div>
            <h1 className="text-4xl font-bold">Nền tảng đọc sách & Podcast — Demo</h1>
            <p className="mt-4 text-lg text-zinc-600">
              Demo UI/UX cho ebook + podcast: trình đọc (reader), trình phát audio, quản lý nội dung và trang chi tiết.
            </p>
            <div className="mt-6 flex gap-3">
              <a href="#books" className="btn">Xem sách</a>
              <a href="#podcasts" className="btn-ghost">Xem podcast</a>
            </div>
          </div>
          <div className="cover-placeholder cover-large rounded-xl">
            <div className="text-center px-6">
              <div className="mb-4 text-3xl text-zinc-400">Ảnh banner / video</div>
              <div className="text-sm text-zinc-500">Bạn có thể kéo thả media ở đây (placeholder)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Books */}
      <section id="books" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="section-title">Sách nổi bật</h2>
          <a className="text-sm text-brand-500" href="/library">Xem tất cả</a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {demoBooks.map((b) => <BookCard key={b.id} book={b} />)}
        </div>
      </section>

      {/* Podcasts */}
      <section id="podcasts" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="section-title">Podcast</h2>
          <a className="text-sm text-brand-500" href="/podcasts">Xem tất cả</a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {demoPodcasts.map((p) => <PodcastCard key={p.id} podcast={p} />)}
        </div>
      </section>
    </section>
  )
}
