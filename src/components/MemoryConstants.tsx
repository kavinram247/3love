export default function MemoryConstants() {
  return (
    <section
      className="relative py-36 md:py-52 px-6 overflow-hidden"
      style={{
        background: 'linear-gradient(to bottom, #000 0%, #0d0119 50%, #000 100%)',
      }}
    >
      {/* Center glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(123,47,190,0.12) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 max-w-screen-lg mx-auto">
        <p className="section-label mb-10 reveal">
          Third Scroll — System Purpose
        </p>

        {/* Opening statements */}
        <div className="mb-16 space-y-6 max-w-xl">
          <p className="font-inter text-white/50 text-lg md:text-xl reveal reveal-d1">
            We study what remains.
          </p>
          <div className="space-y-1 reveal reveal-d2">
            <p className="font-inter text-white/35 text-base">Moments fade.</p>
            <p className="font-inter text-white/35 text-base">Memories distort.</p>
            <p className="font-inter text-white/35 text-base">Emotion fragments.</p>
          </div>
          <p className="font-syne font-semibold text-white/70 text-lg md:text-xl reveal reveal-d3">
            So we engineer constants.
          </p>
        </div>

        {/* Big headline */}
        <div className="reveal reveal-d4">
          <h2
            className="font-syne font-extrabold leading-none text-white"
            style={{
              fontSize: 'clamp(3.5rem, 10vw, 9rem)',
              textShadow: '0 0 60px rgba(123,47,190,0.5), 0 0 120px rgba(123,47,190,0.2)',
            }}
          >
            Memory
          </h2>
          <h2
            className="font-syne font-extrabold leading-none text-purple-mid"
            style={{
              fontSize: 'clamp(3.5rem, 10vw, 9rem)',
              textShadow: '0 0 60px rgba(157,78,221,0.6), 0 0 120px rgba(157,78,221,0.25)',
            }}
          >
            Constants.
          </h2>
        </div>

        {/* Supporting copy */}
        <div className="mt-14 max-w-md reveal reveal-d5">
          <p className="font-inter text-white/40 text-base md:text-lg leading-relaxed">
            Controlled sensory anchors designed to lock moments into permanence.
          </p>
        </div>
      </div>
    </section>
  )
}
