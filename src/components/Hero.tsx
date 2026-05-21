'use client'

import { useState } from 'react'

// ── Deterministic star positions (seeded, no hydration issues) ────────────
function makeStars(n: number) {
  let s = 1664525
  const rnd = () => { s = (Math.imul(s, 1664525) + 1013904223) | 0; return (s >>> 0) / 4294967296 }
  return Array.from({ length: n }, () => ({
    x: rnd() * 100, y: rnd() * 100,
    o: 0.12 + rnd() * 0.5,
    r: rnd() > 0.88 ? 1.5 : 0.8,
  }))
}
const STARS = makeStars(80)

// ── Product data ──────────────────────────────────────────────────────────
const PRODUCTS = [
  {
    id: 'eclat',
    name: 'Éclat',
    concept: 'Self Love',
    phase: 'Phase I',
    description:
      'A fragrance born from the quiet moments of solitude — the first breath after meditation, moonlight on still water, the gentle weight of a cashmere shawl on bare shoulders. Éclat is the scent of becoming whole.',
    quote: 'The love you give yourself echoes forever.',
    notes: {
      top:   ['Lavender Haze', 'Bergamot', 'Silver Birch'],
      heart: ['Nu Absolute', 'Violet Leaf', 'Moonstone Accord'],
      base:  ['White Musk', 'Sandalwood Milk', 'Crystal Amber'],
    },
    bodyGrad:  'linear-gradient(170deg, rgba(180,120,255,0.88) 0%, rgba(75,10,115,0.96) 48%, rgba(6,0,16,1) 100%)',
    labelGlow: 'rgba(157,78,221,0.7)',
    capGrad:   'linear-gradient(180deg, #4a2060 0%, #2a0f38 100%)',
    orbColor:  'rgba(123, 47, 190, 0.22)',
    glowHex:   '#9D4EDD',
    price:     '₹4,800',
  },
  {
    id: 'lumiere',
    name: 'Lumière',
    concept: 'Love For Others',
    phase: 'Phase II',
    description:
      'Captured in the golden hour — when sunlight turns everything it touches to honey. Lumière is the warmth of an embrace, the perfume left on a letter, the scent memory of someone who changed your world.',
    quote: 'Love is the light we leave behind.',
    notes: {
      top:   ['Blood Orange', 'Saffron', 'Pink Pepper'],
      heart: ['Damascus Rose', 'Oud', 'Honeydew'],
      base:  ['Amber Star', 'Iris Tobacco', 'Birch Musk'],
    },
    bodyGrad:  'linear-gradient(170deg, rgba(255,160,55,0.88) 0%, rgba(155,55,5,0.94) 48%, rgba(14,3,0,1) 100%)',
    labelGlow: 'rgba(255,140,40,0.7)',
    capGrad:   'linear-gradient(180deg, #5c2e00 0%, #331800 100%)',
    orbColor:  'rgba(210, 110, 20, 0.18)',
    glowHex:   '#FF8C2E',
    price:     '₹3,600',
  },
  {
    id: 'ardeur',
    name: 'Ardeur',
    concept: 'Love For Passion',
    phase: 'Phase III',
    description:
      'Forged in the electric space between obsession and ambition — where midnight rehearsals blur into dawn, where every creation is a love letter to the impossible. Ardeur is the scent of burning conviction.',
    quote: 'Passion is the only rebellion worth pursuing.',
    notes: {
      top:   ['Black Pepper', 'Cedar', 'Black Tobacco'],
      heart: ['Black Currant', 'Metallic Rose'],
      base:  ['Dark Patchouli', 'Velour Oud', 'Magnolia Amber'],
    },
    bodyGrad:  'linear-gradient(170deg, rgba(220,55,115,0.88) 0%, rgba(110,8,45,0.95) 48%, rgba(10,0,6,1) 100%)',
    labelGlow: 'rgba(210,48,100,0.7)',
    capGrad:   'linear-gradient(180deg, #3d0018 0%, #1f000c 100%)',
    orbColor:  'rgba(170, 25, 70, 0.18)',
    glowHex:   '#E0306A',
    price:     '₹5,200',
  },
]

// ── Bottle visual ─────────────────────────────────────────────────────────
function Bottle({
  product,
  scale = 1,
  floating = false,
}: {
  product: (typeof PRODUCTS)[0]
  scale?: number
  floating?: boolean
}) {
  const W = Math.round(68 * scale)
  const H = Math.round(188 * scale)
  const capW = Math.round(40 * scale)
  const capH = Math.round(14 * scale)
  const neckW = Math.round(22 * scale)
  const neckH = Math.round(16 * scale)
  const labelH = Math.round(62 * scale)
  const fs = Math.round(7 * scale)
  const nameFs = Math.round(8 * scale)

  return (
    <div
      className={floating ? 'animate-float' : ''}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      {/* Cap */}
      <div
        style={{
          width: capW,
          height: capH,
          background: product.capGrad,
          borderRadius: `${2 * scale}px ${2 * scale}px 0 0`,
          backgroundImage: `${product.capGrad}, repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) ${Math.max(2,Math.round(3*scale))}px, transparent ${Math.max(2,Math.round(3*scale))}px, transparent ${Math.round(7*scale)}px)`,
        }}
      />
      {/* Neck */}
      <div style={{ width: neckW, height: neckH, background: product.capGrad }} />
      {/* Body */}
      <div
        style={{
          width: W,
          height: H,
          background: product.bodyGrad,
          borderRadius: `0 0 ${4 * scale}px ${4 * scale}px`,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: `inset 0 0 ${30 * scale}px ${product.labelGlow}, 0 0 ${40 * scale}px ${product.orbColor.replace('0.22', '0.5').replace('0.18', '0.4')}`,
        }}
      >
        {/* Shine */}
        <div style={{
          position: 'absolute', top: 0, left: Math.round(6 * scale),
          width: Math.round(5 * scale), height: Math.round(90 * scale),
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.22), transparent)',
          borderRadius: 99,
        }} />
        {/* Label area */}
        <div style={{
          position: 'absolute',
          bottom: Math.round(14 * scale),
          left: Math.round(8 * scale),
          right: Math.round(8 * scale),
          height: labelH,
          border: `1px solid rgba(255,255,255,0.12)`,
          background: 'rgba(0,0,0,0.4)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: Math.round(2 * scale),
          padding: `${Math.round(4 * scale)}px`,
        }}>
          <span style={{ fontFamily: 'var(--font-syne)', fontSize: fs, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.35)', lineHeight: 1 }}>○</span>
          <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: fs, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.5)', lineHeight: 1 }}>3V</span>
          <span style={{ fontFamily: 'var(--font-syne)', fontSize: fs - 1, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)', lineHeight: 1 }}>LOVE</span>
          <span style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 500, fontSize: nameFs, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.7)', lineHeight: 1, marginTop: Math.round(2 * scale) }}>
            {product.name.toUpperCase()}
          </span>
        </div>
      </div>
      {/* Ground glow */}
      <div style={{
        width: Math.round(80 * scale),
        height: Math.round(8 * scale),
        background: product.labelGlow,
        filter: `blur(${8 * scale}px)`,
        opacity: 0.5,
        marginTop: Math.round(2 * scale),
      }} />
    </div>
  )
}

// ── Scent Architecture table ──────────────────────────────────────────────
function ScentTable({ notes }: { notes: (typeof PRODUCTS)[0]['notes'] }) {
  return (
    <div>
      <p className="font-syne text-[9px] tracking-[0.3em] uppercase text-white/30 mb-3">
        Scent Architecture
      </p>
      <div className="grid grid-cols-3 gap-4">
        {(['top', 'heart', 'base'] as const).map((tier) => (
          <div key={tier}>
            <p className="font-syne text-[9px] tracking-[0.2em] uppercase text-white/40 mb-2">{tier}</p>
            <div className="space-y-1">
              {notes[tier].map((n) => (
                <p key={n} className="font-inter text-[11px] text-white/55 leading-snug">{n}</p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Hero ─────────────────────────────────────────────────────────────
export default function Hero() {
  const [selected, setSelected] = useState<number | null>(null)
  const [leaving, setLeaving] = useState(false)

  const p = selected !== null ? PRODUCTS[selected] : null

  function handleSelect(i: number) { setSelected(i) }

  function handleBack() {
    setLeaving(true)
    setTimeout(() => { setSelected(null); setLeaving(false) }, 50)
  }

  const nebulaColor = p ? p.orbColor.replace(/[\d.]+\)$/, '0.18)') : 'rgba(123,47,190,0.14)'

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black"
    >
      {/* ── Stars ── */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {STARS.map((star, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.r * 2,
              height: star.r * 2,
              opacity: star.o,
            }}
          />
        ))}
      </div>

      {/* ── Nebula / ambient glow — shifts color on selection ── */}
      <div
        className="absolute inset-0 pointer-events-none z-0 transition-all duration-1000"
        style={{
          background: `radial-gradient(ellipse 65% 55% at 50% 58%, ${nebulaColor} 0%, transparent 72%)`,
        }}
      />

      {/* ══════════════════════════════════════════════════════
          GALLERY VIEW
      ══════════════════════════════════════════════════════ */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center z-10"
        style={{
          opacity: selected === null ? 1 : 0,
          pointerEvents: selected === null ? 'auto' : 'none',
          transition: 'opacity 0.5s ease',
        }}
      >
        {/* Logo */}
        <div className="hero-item-1 mb-10">
          <img src="/logo.jpg" alt="3love" className="h-10 object-contain" />
        </div>

        {/* Three Bottles */}
        <div className="hero-item-2 flex items-end justify-center gap-6 md:gap-10 mb-8">
          {PRODUCTS.map((prod, i) => {
            const isCenter = i === 1
            return (
              <button
                key={prod.id}
                onClick={() => handleSelect(i)}
                className="group relative focus:outline-none cursor-pointer"
                style={{
                  transform: isCenter ? 'translateY(-12px)' : 'translateY(0)',
                  transition: 'transform 0.4s ease',
                }}
              >
                {/* Hover glow ring */}
                <div
                  className="absolute inset-0 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    boxShadow: `0 0 40px ${prod.glowHex}55`,
                    margin: -12,
                  }}
                />
                <div className="group-hover:scale-105 transition-transform duration-400" style={{ transformOrigin: 'bottom center' }}>
                  <Bottle product={prod} scale={isCenter ? 1.08 : 0.88} floating={isCenter} />
                </div>
              </button>
            )
          })}
        </div>

        {/* Title */}
        <div className="hero-item-3 text-center">
          <h1
            className="font-cormorant font-light text-white leading-[1.0]"
            style={{ fontSize: 'clamp(3rem, 7vw, 6rem)', letterSpacing: '-0.01em' }}
          >
            3 Versions
          </h1>
          <h1
            className="font-cormorant font-semibold text-white leading-[1.0]"
            style={{ fontSize: 'clamp(3rem, 7vw, 6rem)', letterSpacing: '-0.01em' }}
          >
            of Love
          </h1>
        </div>

        {/* Subtitle */}
        <div className="hero-item-4 mt-5 text-center space-y-3">
          <p className="font-syne text-[9px] md:text-[10px] tracking-[0.28em] uppercase text-white/28">
            Perfume as Memory&nbsp; · &nbsp;Love as Energy&nbsp; · &nbsp;Emotion as a Cosmic Object
          </p>
          <p className="font-inter text-[11px] text-white/30 tracking-wider">
            Click a bottle to explore
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          DETAIL VIEW
      ══════════════════════════════════════════════════════ */}
      {p && (
        <div
          className="absolute inset-0 z-20 flex items-center"
          style={{
            opacity: selected !== null && !leaving ? 1 : 0,
            transition: 'opacity 0.6s cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          {/* Back button */}
          <button
            onClick={handleBack}
            className="absolute top-20 left-6 md:left-12 font-syne text-[10px] tracking-[0.22em] uppercase text-white/40 hover:text-white/80 transition-colors duration-300 flex items-center gap-2 z-30"
          >
            ← Back
          </button>

          {/* Large orb behind bottle */}
          <div
            className="absolute left-0 md:left-[5%] lg:left-[10%] top-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              width: 'min(420px, 55vw)',
              height: 'min(420px, 55vw)',
              borderRadius: '50%',
              background: p.orbColor,
              filter: 'blur(60px)',
            }}
          />

          {/* Two-column layout */}
          <div className="w-full flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 px-6 md:px-12 lg:px-20">
            {/* Left: bottle */}
            <div
              className="flex-shrink-0 flex items-center justify-center"
              style={{
                transform: selected !== null && !leaving ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
                transition: 'transform 0.7s cubic-bezier(0.16,1,0.3,1)',
              }}
            >
              <Bottle product={p} scale={1.6} />
            </div>

            {/* Right: product info */}
            <div
              className="flex-1 max-w-md"
              style={{
                transform: selected !== null && !leaving ? 'translateX(0)' : 'translateX(30px)',
                opacity: selected !== null && !leaving ? 1 : 0,
                transition: 'transform 0.7s 0.1s cubic-bezier(0.16,1,0.3,1), opacity 0.7s 0.1s ease',
              }}
            >
              <p className="font-syne text-[9px] tracking-[0.3em] uppercase mb-3" style={{ color: p.glowHex }}>
                {p.phase} — {p.concept}
              </p>

              <h2
                className="font-cormorant font-light text-white leading-none mb-1"
                style={{ fontSize: 'clamp(3rem, 6vw, 5.5rem)' }}
              >
                {p.name}
              </h2>

              <p className="font-syne text-[10px] tracking-[0.3em] uppercase text-white/25 mb-7">
                {p.concept}
              </p>

              <p className="font-inter text-white/50 text-sm md:text-[13px] leading-relaxed mb-8 max-w-sm">
                {p.description}
              </p>

              <div className="mb-7 pb-7 border-b border-white/[0.07]">
                <ScentTable notes={p.notes} />
              </div>

              <p className="font-cormorant italic text-white/45 text-base md:text-lg leading-relaxed mb-8">
                &ldquo;{p.quote}&rdquo;
              </p>

              <div className="flex items-center gap-5">
                <span className="font-syne font-bold text-white/60 text-sm">{p.price}</span>
                <a
                  href="#enter"
                  className="btn-outline"
                  style={{ padding: '10px 28px', fontSize: 10 }}
                >
                  Experience {p.name}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scroll indicator (gallery state only) */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10"
        style={{ opacity: selected === null ? 1 : 0, transition: 'opacity 0.4s ease' }}
      >
        <span className="font-syne text-[8px] tracking-[0.3em] uppercase text-white/20">Scroll</span>
        <div className="w-px h-8 animate-scroll-line" style={{ background: 'linear-gradient(to bottom, rgba(123,47,190,0.6), transparent)' }} />
      </div>
    </section>
  )
}
