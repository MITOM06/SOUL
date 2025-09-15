'use client'
import React, { useRef, useState, useEffect } from 'react'

export default function AudioPlayer({ src, title }: { src?: string; title?: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(()=>{
    const a = audioRef.current
    if(!a) return
    const onTime = ()=> setTime(a.currentTime)
    const onLoaded = ()=> setDuration(a.duration || 0)
    a.addEventListener('timeupdate', onTime)
    a.addEventListener('loadedmetadata', onLoaded)
    return ()=> {
      a.removeEventListener('timeupdate', onTime)
      a.removeEventListener('loadedmetadata', onLoaded)
    }
  },[])

  const toggle = ()=>{
    const a = audioRef.current
    if(!a) return
    if(playing){ a.pause(); setPlaying(false) }
    else { a.play(); setPlaying(true) }
  }

  return (
    <div className="card p-4 flex items-center gap-4">
      <div className="w-14 h-14 rounded-md cover-placeholder flex-shrink-0" />
      <div className="flex-1">
        <div className="font-semibold">{title || 'Unknown'}</div>
        <div className="text-xs text-zinc-500">Audio player demo</div>
        <div className="mt-3 flex items-center gap-3">
          <button onClick={toggle} className="btn-ghost">{playing ? 'Pause' : 'Play'}</button>
          <div className="text-xs text-zinc-500">{Math.floor(time)} / {Math.floor(duration)}</div>
        </div>
      </div>
      <audio ref={audioRef} src={src} preload="metadata" />
    </div>
  )
}
