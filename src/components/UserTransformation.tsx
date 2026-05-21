const phases = [
  {
    num: 'I',
    line: 'Learn to love yourself.',
    label: 'Phase One',
  },
  {
    num: 'II',
    line: 'Learn to love all.',
    label: 'Phase Two',
  },
  {
    num: 'III',
    line: 'Learn to love your purpose.',
    label: 'Phase Three',
  },
]

export default function UserTransformation() {
  return (
    <section className="relative py-32 md:py-44 px-6 overflow-hidden">
      {/* Subtle side glow */}
      <div
        className="absolute left-0 top-1/2 -translate-y-1/2 w-64 h-96 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at left, rgba(123,47,190,0.1) 0%, transparent 70%)',
        }}
      />

      <div className="max-w-screen-lg mx-auto">
        <p className="section-label mb-6 reveal">
          Second Scroll — User Transformation
        </p>

        <h2
          className="font-syne font-extrabold text-white leading-tight mb-16 max-w-xl reveal reveal-d1"
          style={{ fontSize: 'clamp(1.8rem, 4vw, 3.2rem)' }}
        >
          User will evolve through{' '}
          <span className="text-purple-mid">3 Versions.</span>
        </h2>

        {/* Phase rows */}
        <div className="space-y-0">
          {phases.map((p, i) => (
            <div
              key={p.num}
              className={`reveal reveal-d${i + 2} group border-t border-white/[0.06] py-8 md:py-10 flex items-center gap-6 md:gap-10`}
            >
              {/* Phase number */}
              <div
                className="font-syne font-bold text-purple-primary/30 group-hover:text-purple-primary/60 transition-colors duration-500 flex-shrink-0"
                style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', minWidth: 60 }}
              >
                {p.num}
              </div>

              {/* Content */}
              <div className="flex-1">
                <p className="font-syne text-[10px] tracking-[0.25em] uppercase text-white/30 mb-2">
                  {p.label}
                </p>
                <p
                  className="font-syne font-bold text-white group-hover:text-purple-pale transition-colors duration-500"
                  style={{ fontSize: 'clamp(1.3rem, 3vw, 2.2rem)' }}
                >
                  {p.line}
                </p>
              </div>

              {/* Arrow */}
              <div className="flex-shrink-0 text-purple-primary/20 group-hover:text-purple-mid/60 transition-colors duration-500 text-2xl">
                →
              </div>
            </div>
          ))}
          <div className="border-t border-white/[0.06]" />
        </div>

        {/* Closing copy */}
        <div className="mt-16 max-w-lg space-y-1 reveal reveal-d5">
          <p className="font-inter text-white/35 text-base leading-relaxed">
            Each phase is not taught.
          </p>
          <p className="font-inter text-white/35 text-base">It is experienced.</p>
          <p className="font-syne font-semibold text-white/70 text-base tracking-wide">
            Encoded. Remembered.
          </p>
        </div>
      </div>
    </section>
  )
}
