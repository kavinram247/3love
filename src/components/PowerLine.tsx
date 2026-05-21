export default function PowerLine() {
  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center px-6 py-32 overflow-hidden text-center"
    >
      {/* Strong purple radial at center */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(123,47,190,0.2) 0%, rgba(26,5,51,0.1) 40%, transparent 72%)',
        }}
      />

      {/* Decorative lines */}
      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 pointer-events-none">
        <div
          className="w-full h-px"
          style={{
            background: 'linear-gradient(to right, transparent, rgba(123,47,190,0.15) 30%, rgba(123,47,190,0.15) 70%, transparent)',
          }}
        />
      </div>

      <div className="relative z-10 max-w-screen-md mx-auto">
        <p className="section-label mb-14 reveal">
          Eighth Scroll — Core Idea
        </p>

        <div className="space-y-6 reveal reveal-d1">
          <p
            className="font-syne font-extrabold text-white/60 leading-tight"
            style={{ fontSize: 'clamp(1.8rem, 4.5vw, 3.5rem)' }}
          >
            When you encounter these notes again—
          </p>
          <p
            className="font-inter text-white/30 text-lg md:text-xl"
          >
            anywhere— at any time—
          </p>
        </div>

        <div className="my-12 w-px h-16 bg-purple-primary/40 mx-auto reveal reveal-d2" />

        <div className="space-y-3 reveal reveal-d3">
          <p
            className="font-syne font-semibold text-white/60 leading-tight"
            style={{ fontSize: 'clamp(1.4rem, 3.5vw, 2.5rem)' }}
          >
            They will not belong to the world.
          </p>
          <p
            className="font-syne font-bold text-white/85 leading-tight"
            style={{ fontSize: 'clamp(1.6rem, 4vw, 3rem)' }}
          >
            They will belong to{' '}
            <span className="text-purple-light">this moment.</span>
          </p>
        </div>

        <div className="mt-14 reveal reveal-d4">
          <p
            className="font-syne font-extrabold text-white leading-none"
            style={{
              fontSize: 'clamp(5rem, 16vw, 13rem)',
              textShadow: '0 0 80px rgba(123,47,190,0.7), 0 0 160px rgba(123,47,190,0.3)',
              letterSpacing: '-0.02em',
            }}
          >
            To you.
          </p>
        </div>
      </div>
    </section>
  )
}
