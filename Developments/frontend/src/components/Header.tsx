'use client';
import Link from 'next/link'
import React from 'react'

export default function Header(){
  return (
    <header className="border-b bg-white sticky top-0 z-40">
      <div className="container-max flex items-center justify-between py-3">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[color:var(--brand-500)] rounded-lg flex items-center justify-center text-white font-bold">PAOB</div>
          <div className="hidden sm:block">
            <div className="font-semibold">Podcast And Online Book</div>
            <div className="text-xs text-zinc-500">Demo platform</div>
          </div>
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/library" className="text-sm text-zinc-700 hover:text-[color:var(--brand-500)]">Library</Link>
          <Link href="/podcasts" className="text-sm text-zinc-700 hover:text-[color:var(--brand-500)]">Podcasts</Link>
          <Link href="/auth/login" className="btn-ghost">Đăng nhập</Link>
        </nav>
      </div>
    </header>
  )
}
