export default function CallToEntry() {
  return (
    <section
      id="enter"
      className="relative py-36 md:py-52 px-6 overflow-hidden"
      style={{
        background: 'linear-gradient(to bottom, #000 0%, #080011 40%, #0d0119 60%, #000 100%)',
      }}
    >
      {/* Glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(123,47,190,0.18) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 max-w-screen-lg mx-auto">
        <div className="divider mb-16 reveal" />

        <p className="section-label mb-10 reveal reveal-d1">
          Final Scroll — Call to Entry
        </p>

        <div className="max-w-xl">
          <h2
            className="font-syne font-extrabold text-white leading-tight mb-6 reveal reveal-d2"
            style={{ fontSize: 'clamp(2rem, 5vw, 4.2rem)' }}
          >
            You are now inside the system.
          </h2>

          <p className="font-inter text-white/40 text-base md:text-lg leading-relaxed mb-14 reveal reveal-d3">
            Proceed to experience{' '}
            <span className="text-purple-light font-semibold">Memory Constants.</span>
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 reveal reveal-d4">
            <a href="#compositions" className="btn-outline">
              Explore Compositions
            </a>
            <a
              href="#"
              className="font-syne text-[11px] font-semibold tracking-[0.22em] uppercase text-white/30 hover:text-white/60 transition-colors duration-300 flex items-center justify-center gap-2 px-6"
            >
              Learn the System →
            </a>
          </div>
        </div>

        {/* Bottom stat row */}
        <div className="mt-24 pt-10 border-t border-white/[0.05] grid grid-cols-2 md:grid-cols-4 gap-8 reveal reveal-d5">
          {[
            { value: '3', label: 'Versions' },
            { value: 'I', label: 'Phase Active' },
            { value: 'Kaz', label: 'Source' },
            { value: '∞', label: 'Memory' },
          ].map((s) => (
            <div key={s.label}>
              <p
                className="font-syne font-extrabold text-purple-mid mb-1"
                style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}
              >
                {s.value}
              </p>
              <p className="font-syne text-[10px] tracking-[0.22em] uppercase text-white/25">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        <div className="divider mt-16 reveal" />
      </div>
    </section>
  )
}
