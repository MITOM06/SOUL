import './globals.css'
import React from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'Ebook & Podcast Demo',
  description: 'Demo platform for ebooks and podcasts — copy + customize',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="min-h-screen">
        <Header />
        <main className="pt-6 pb-20">
          <div className="container-max">{children}</div>
        </main>
        <Footer />
      </body>
    </html>
  )
}
