const notes = [
  {
    tier: 'Top',
    label: 'Opening',
    description: 'The first impression. Volatile, immediate — disappears within minutes.',
    examples: 'Bergamot · Citrus · Ozone',
    size: 'small',
    opacity: 0.45,
  },
  {
    tier: 'Heart',
    label: 'Character',
    description: 'The identity of the composition. Emerges as the top fades.',
    examples: 'Rose · Jasmine · Iris',
    size: 'medium',
    opacity: 0.7,
  },
  {
    tier: 'Base',
    label: 'Permanence',
    description: 'What remains. The memory anchor. Lingers for hours.',
    examples: 'Oud · Sandalwood · Ambergris',
    size: 'large',
    opacity: 1,
  },
]

export default function Orchestrate() {
  return (
    <section className="relative py-32 md:py-44 px-6 overflow-hidden">
      {/* Right glow */}
      <div
        className="absolute right-0 top-1/2 -translate-y-1/2 w-80 h-80 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at right, rgba(123,47,190,0.1) 0%, transparent 70%)',
        }}
      />

      <div className="max-w-screen-xl mx-auto">
        <p className="section-label mb-10 reveal">
          Sixth Scroll — Brand Differentiation
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24 items-start">
          {/* Left: copy */}
          <div>
            <p className="font-inter text-white/40 text-lg md:text-xl mb-4 reveal reveal-d1">
              At 3V–L0V3, we do not blend.
            </p>
            <h2
              className="font-syne font-extrabold text-white leading-tight mb-10 reveal reveal-d2"
              style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)' }}
            >
              We{' '}
              <span className="text-purple-mid">orchestrate.</span>
            </h2>

            <div className="space-y-5 max-w-sm">
              <p className="font-inter text-white/40 text-base leading-relaxed reveal reveal-d3">
                Like a conductor shaping sound, each note is placed with intention, timing, and sequence.
              </p>
              <div className="pt-2 space-y-1 reveal reveal-d4">
                <p className="font-syne font-semibold text-white/80 text-base">
                  Simple in structure.
                </p>
                <p className="font-syne font-bold text-purple-light text-base">
                  Complex in outcome.
                </p>
              </div>
            </div>
          </div>

          {/* Right: notes diagram */}
          <div className="space-y-0 reveal reveal-d3">
            {notes.map((n, i) => (
              <div
                key={n.tier}
                className="group border-t border-white/[0.06] py-6 flex items-center gap-5 hover:bg-white/[0.015] transition-colors duration-300 px-3 -mx-3"
              >
                {/* Dot indicator */}
                <div
                  className="flex-shrink-0 rounded-full transition-all duration-500 group-hover:scale-125"
                  style={{
                    width: n.size === 'small' ? 8 : n.size === 'medium' ? 12 : 18,
                    height: n.size === 'small' ? 8 : n.size === 'medium' ? 12 : 18,
                    background: `rgba(157,78,221,${n.opacity})`,
                    boxShadow: `0 0 ${n.size === 'large' ? 20 : 10}px rgba(123,47,190,${n.opacity * 0.6})`,
                  }}
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-3 mb-1">
                    <span className="font-syne font-bold text-white text-sm">
                      {n.tier}
                    </span>
                    <span className="font-syne text-[9px] tracking-[0.2em] uppercase text-white/25">
                      {n.label}
                    </span>
                  </div>
                  <p className="font-inter text-white/30 text-xs leading-relaxed">
                    {n.description}
                  </p>
                  <p className="font-syne text-[10px] tracking-[0.15em] text-purple-primary/60 mt-1.5">
                    {n.examples}
                  </p>
                </div>

                {/* Number */}
                <div
                  className="font-syne font-bold text-4xl text-white/[0.04] flex-shrink-0"
                >
                  0{i + 1}
                </div>
              </div>
            ))}
            <div className="border-t border-white/[0.06]" />

            <p className="font-syne font-semibold text-white/50 text-sm pt-6 tracking-wide">
              Top. Heart. Base.{' '}
              <span className="text-purple-mid">Not layered — programmed.</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
