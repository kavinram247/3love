import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Cormorant_Garamond, Manrope, Syne } from 'next/font/google'
import './globals.css'
import './cinematic-panels.css'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, '') || 'http://localhost:3000'

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
  metadataBase: new URL(siteUrl),
  title: {
    default: '3love — Memory Constants',
    template: '%s — 3love',
  },
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
    siteName: '3love',
    images: [{ url: '/assets/rotation/3love-rotation-cosmic-drift-4k-poster.jpg', width: 1920, height: 1080, alt: '3love Phase I fragrance' }],
  },
  twitter: { card: 'summary_large_image' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${syne.variable} ${manrope.variable} ${cormorant.variable}`}>
      <body>
        <ClerkProvider
          // Off by choice: it is the one thing that trips the CSP, and it sends
          // usage data to a third party we have no reason to feed.
          telemetry={false}
          appearance={{
            variables: {
              colorPrimary: '#b78af5',
              colorBackground: '#0b0710',
              colorForeground: '#f7f1ff',
              colorMutedForeground: '#a99cb7',
              colorInput: '#120d18',
              colorInputForeground: '#f7f1ff',
              borderRadius: '0.9rem',
              fontFamily: 'var(--font-manrope)',
            },
          }}
        >
          <a className="skip-link" href="#main-content">Skip to main content</a>
          {children}
        </ClerkProvider>
      </body>
    </html>
  )
}
