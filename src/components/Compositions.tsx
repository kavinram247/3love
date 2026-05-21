const products = [
  {
    id: 'eclat',
    name: 'Éclat',
    phase: 'Phase I',
    concept: 'Self Love',
    tagline: 'The love you give yourself echoes forever.',
    notes: ['Lavender Haze', 'Nu Absolute', 'White Musk'],
    price: '4,800',
    gradient: 'linear-gradient(160deg, rgba(180,120,255,0.85) 0%, rgba(70,10,110,0.96) 55%, rgba(6,0,16,1) 100%)',
    shine: 'rgba(157,78,221,0.55)',
    glow: '#9D4EDD',
  },
  {
    id: 'lumiere',
    name: 'Lumière',
    phase: 'Phase II',
    concept: 'Love For Others',
    tagline: 'Love is the light we leave behind.',
    notes: ['Blood Orange', 'Damascus Rose', 'Amber Star'],
    price: '3,600',
    gradient: 'linear-gradient(160deg, rgba(255,155,50,0.85) 0%, rgba(150,50,5,0.94) 55%, rgba(14,3,0,1) 100%)',
    shine: 'rgba(255,140,40,0.55)',
    glow: '#FF8C2E',
  },
  {
    id: 'ardeur',
    name: 'Ardeur',
    phase: 'Phase III',
    concept: 'Love For Passion',
    tagline: 'Passion is the only rebellion worth pursuing.',
    notes: ['Black Pepper', 'Metallic Rose', 'Velour Oud'],
    price: '5,200',
    gradient: 'linear-gradient(160deg, rgba(210,50,110,0.85) 0%, rgba(105,8,40,0.95) 55%, rgba(10,0,6,1) 100%)',
    shine: 'rgba(210,48,100,0.55)',
    glow: '#E0306A',
  },
]

export default function Compositions() {
  return (
    <section id="compositions" className="relative py-32 md:py-44 px-6">
      <div className="max-w-screen-xl mx-auto">
        <div className="divider mb-16 reveal" />

        <div className="mb-6 reveal reveal-d1">
          <p className="section-label">Fifth Scroll — Fragrance Philosophy</p>
        </div>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
          <div>
            <p className="font-inter text-white/45 text-lg md:text-xl reveal reveal-d2">
              These are not fragrances.
            </p>
            <h2
              className="font-cormorant font-light text-white reveal reveal-d3"
              style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}
            >
              They are{' '}
              <span className="font-semibold italic" style={{ color: '#9D4EDD' }}>compositions.</span>
            </h2>
          </div>
          <p className="font-inter text-white/28 text-sm max-w-xs leading-relaxed reveal reveal-d4">
            Constructed using the purest fragrance oils sourced by Kaz, a specialist in high-grade aromatic materials.
          </p>
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {products.map((p, i) => (
            <div key={p.id} className={`product-card reveal reveal-d${i + 1} p-7 md:p-8 flex flex-col`}>

              {/* Bottle visual */}
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <div className="mx-auto rounded-sm mb-0" style={{ width: 32, height: 12, background: p.shine }} />
                  <div className="mx-auto" style={{ width: 20, height: 16, background: p.gradient }} />
                  <div
                    className="mx-auto rounded-b-xl relative overflow-hidden"
                    style={{
                      width: 60, height: 150,
                      background: p.gradient,
                      boxShadow: `inset 0 0 30px ${p.shine}, 0 0 30px ${p.shine.replace('0.55', '0.3')}`,
                    }}
                  >
                    <div className="absolute top-3 left-2 rounded-full" style={{ width: 5, height: 55, background: `linear-gradient(to bottom, rgba(255,255,255,0.28), transparent)` }} />
                    <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-0.5">
                      <span className="font-syne font-bold text-[6px] tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.22)' }}>3V</span>
                      <span className="font-syne text-[6px] tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.15)' }}>LOVE</span>
                    </div>
                  </div>
                  <div className="mx-auto rounded-full mt-1" style={{ width: 70, height: 8, background: p.shine, filter: 'blur(8px)', opacity: 0.5 }} />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 flex flex-col">
                <p className="font-syne text-[9px] tracking-[0.25em] uppercase mb-1" style={{ color: p.glow + 'aa' }}>
                  {p.phase} — {p.concept}
                </p>
                <h3
                  className="font-cormorant font-light text-white leading-tight mb-1"
                  style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)' }}
                >
                  {p.name}
                </h3>
                <p className="font-inter text-white/30 text-xs italic mb-5 leading-relaxed">{p.tagline}</p>

                {/* Signature notes */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {p.notes.map((n) => (
                    <span key={n} className="note-tag">{n}</span>
                  ))}
                </div>

                {/* Price + CTA */}
                <div className="mt-auto flex items-center justify-between pt-5 border-t border-white/[0.06]">
                  <span className="font-syne font-bold text-white/60 text-sm">₹ {p.price}</span>
                  <a
                    href="#enter"
                    className="font-syne text-[10px] font-semibold tracking-[0.2em] uppercase hover:text-purple-pale transition-colors duration-300 flex items-center gap-1.5"
                    style={{ color: p.glow }}
                  >
                    Discover <span className="text-xs">→</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="divider mt-16 reveal" />
      </div>
    </section>
  )
}
