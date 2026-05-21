import type { Metadata } from 'next'
import { Cormorant_Garamond, Manrope, Syne } from 'next/font/google'
import './globals.css'
import './cinematic-panels.css'

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-syne',
  display: 'swap',
})

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-manrope',
  display: 'swap',
})

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
})

export const metadata: Metadata = {
  title: '3love — Memory Constants',
  description: '3 Versions of Love. A cinematic perfume system where scroll controls time, memory, and aroma.',
  icons: {
    icon: '/logo.jpg',
    shortcut: '/logo.jpg',
    apple: '/logo.jpg',
  },
  openGraph: {
    title: '3love — Memory Constants',
    description: 'Perfume as memory. Love as energy. Emotion as a cosmic object.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${syne.variable} ${manrope.variable} ${cormorant.variable}`}>
      <body>{children}</body>
    </html>
  )
}
