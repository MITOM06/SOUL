import React from 'react'
import { demoBooks } from '@/data/demoBooks'
import AudioPlayer from '@/components/AudioPlayer'

interface Props { params: { id: string } }

export default function BookDetail({ params }: Props) {
  const id = Number(params.id)
  const book = demoBooks.find(b => b.id === id)
  if (!book) return <div className="py-20">Không tìm thấy sách</div>

  return (
    <section className="grid lg:grid-cols-3 gap-6">
      <div className="card p-4">
        {book.cover ? <img src={book.cover} alt={book.title} /> : <div className="cover-placeholder h-72" />}
        <div className="mt-4">
          <div className="text-xl font-semibold">{book.title}</div>
          <div className="meta mt-1">{book.author} • {book.category}</div>
          <div className="mt-3">
            <a className="btn">Mở Reader</a>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-4">
        <div className="card p-6">
          <h2 className="text-lg font-semibold">Mô tả</h2>
          <p className="mt-3 text-zinc-700">{book.description}</p>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold">Đoạn trích (Preview)</h3>
          <pre className="mt-3 whitespace-pre-wrap text-sm text-zinc-700">{book.content_preview}</pre>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold">Tài nguyên</h3>
          <p className="mt-2 text-sm text-zinc-600">Ảnh/Video/Audio: để trống trong demo — bạn có thể upload qua admin.</p>
          <AudioPlayer title={book.title} src={undefined} />
        </div>
      </div>
    </section>
  )
}
