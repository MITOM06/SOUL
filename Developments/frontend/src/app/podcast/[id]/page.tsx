'use client';

import React, { useEffect, useState } from 'react'
import { demoPodcasts } from '@/data/demoPodcasts'
import AudioPlayer from '@/components/AudioPlayer'
import { favouritesAPI } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
type PodcastDetailProps = {
  params: { id: string }
}

export default function PodcastDetail({ params }: PodcastDetailProps) {
  const id = Number(params.id)
  const p = demoPodcasts.find(x => x.id === id)
  if (!p) return <div className="py-20">Podcast not found</div>

  const { user } = useAuth();
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const fav = await favouritesAPI.listMine();
        const items = fav.data?.data?.books || fav.data?.data?.items || [];
        const items2 = fav.data?.data?.podcasts || [];
        const merged = [...items, ...items2];
        if (merged.some((x: any) => Number(x.id) === Number(id))) setIsFav(true);
      } catch {}
    })();
  }, [id]);

  const toggleFavourite = async () => {
    if (!user) {
      toast.error('Bạn cần đăng nhập');
      return;
    }
    try {
      if (isFav) {
        await favouritesAPI.remove(id);
        setIsFav(false);
        toast.success('Đã xoá khỏi yêu thích');
      } else {
        await favouritesAPI.add(id);
        setIsFav(true);
        toast.success('Đã thêm vào yêu thích');
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Thao tác thất bại');
    }
  };

  return (
    <section className="grid lg:grid-cols-3 gap-6">
      <div className="card p-4">
        {p.cover ? <img src={p.cover} alt={p.title} /> : <div className="cover-placeholder h-72" />}
        <div className="mt-4">
          <div className="text-xl font-semibold">{p.title}</div>
          <div className="meta mt-1">{p.host} • {p.category}</div>
          <div className="mt-3 flex items-center gap-2">
            <a className="btn">Subscribe</a>
            <button onClick={toggleFavourite} className={`px-4 py-2 rounded text-white ${isFav ? 'bg-red-600 hover:bg-red-700' : 'bg-rose-500 hover:bg-rose-600'}`}>
              {isFav ? 'Bỏ yêu thích' : 'Thêm yêu thích'}
            </button>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-4">
        <div className="card p-6">
          <h2 className="text-lg font-semibold">Description</h2>
          <p className="mt-3 text-zinc-700">{p.description}</p>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold">Listen</h3>
          <AudioPlayer title={p.title} src={p.audio_url} />
        </div>
      </div>
    </section>
  )
}