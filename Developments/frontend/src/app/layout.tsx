import './globals.css'
import React from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Providers from './Providers'

export const metadata = {
  title: 'Ebook & Podcast Demo',
  description: 'Demo platform for ebooks and podcasts — copy + customize',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <Providers>
          <Header />
          <main className="pt-6 pb-20 neon-main">
            <div className="container-max">
              {children}
            </div>
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
