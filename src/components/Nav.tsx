'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

const links = [
  { label: 'System', href: '#system' },
  { label: 'Experience', href: '#experience' },
  { label: 'Compositions', href: '#compositions' },
]

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-black/85 backdrop-blur-xl border-b border-white/[0.04]'
          : 'bg-transparent'
      }`}
    >
      <nav className="max-w-screen-xl mx-auto px-6 md:px-12 h-[60px] flex items-center justify-between">
        <a href="#hero" className="flex items-center gap-2.5 group">
          <Image
            src="/logo.jpg"
            alt="3love"
            width={36}
            height={36}
            className="object-contain"
            priority
          />
          <span className="font-syne font-bold text-white text-[11px] tracking-[0.3em] uppercase opacity-90 group-hover:opacity-100 transition-opacity hidden sm:block">
            3love
          </span>
        </a>

        <div className="flex items-center gap-6 md:gap-8">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="hidden md:block font-syne text-[10px] font-600 tracking-[0.25em] uppercase text-white/40 hover:text-white/90 transition-colors duration-300"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#enter"
            className="font-syne text-[10px] font-semibold tracking-[0.22em] uppercase text-purple-light border border-purple-primary/50 px-4 py-1.5 hover:border-purple-mid hover:text-purple-pale hover:shadow-[0_0_20px_rgba(123,47,190,0.25)] transition-all duration-300"
          >
            Enter
          </a>
        </div>
      </nav>
    </header>
  )
}
