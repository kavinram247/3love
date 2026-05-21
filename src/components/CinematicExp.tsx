export default function CinematicExp() {
  return (
    <section
      id="experience"
      className="relative py-36 md:py-52 px-6 overflow-hidden"
      style={{
        background: 'linear-gradient(to bottom, #000 0%, #080011 50%, #000 100%)',
      }}
    >
      {/* Centered glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 90% 70% at 50% 50%, rgba(123,47,190,0.1) 0%, transparent 65%)',
        }}
      />

      <div className="relative z-10 max-w-screen-lg mx-auto">
        <p className="section-label mb-10 reveal">
          Seventh Scroll — Cinematic Experience
        </p>

        <p className="font-inter text-white/40 text-lg md:text-xl mb-6 reveal reveal-d1">
          The result:
        </p>

        <h2
          className="font-syne font-extrabold text-white leading-tight mb-12 reveal reveal-d2"
          style={{
            fontSize: 'clamp(2.5rem, 7vw, 6.5rem)',
            textShadow: '0 0 60px rgba(123,47,190,0.35)',
          }}
        >
          A cinematic
          <br />
          <span className="text-purple-mid">aroma experience.</span>
        </h2>

        <div className="relative my-14 md:my-20 reveal reveal-d3">
          <div className="absolute -inset-10 pointer-events-none bg-purple-primary/20 blur-[90px] opacity-50" />
          <div className="relative overflow-hidden border border-purple-primary/25 bg-white/[0.025] p-2 shadow-[0_0_80px_rgba(123,47,190,0.16)]">
            <div className="relative overflow-hidden bg-black">
              <video
                className="w-full aspect-video object-cover"
                src="/assets/rotation/3love-rotation.mp4"
                poster="/assets/rotation/start-1280x720.png"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
              />
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_48%,rgba(0,0,0,0.54)_100%)]" />
              <div className="absolute left-5 top-5 md:left-7 md:top-7 flex items-center gap-3">
                <span className="sparkle" />
                <span className="font-syne text-[8px] md:text-[9px] tracking-[0.28em] uppercase text-purple-pale/70">
                  Memory in motion
                </span>
              </div>
            </div>
          </div>
          <p className="mt-5 max-w-xl font-inter text-sm md:text-base leading-relaxed text-white/36">
            The bottle turns through the same cosmic field: object, scent, and memory rotating into one fixed signal.
          </p>
        </div>

        {/* Statement grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-2xl mt-16">
          <div className="space-y-3 reveal reveal-d3">
            <div className="w-8 h-px bg-purple-primary/60 mb-4" />
            <p className="font-syne font-semibold text-white/80 text-base">
              Not just a scent—
            </p>
            <p className="font-syne font-bold text-purple-light text-xl">
              but a trigger.
            </p>
          </div>

          <div className="space-y-2 reveal reveal-d4">
            <div className="w-8 h-px bg-purple-primary/60 mb-4" />
            <p className="font-inter text-white/35 text-base">
              Fragments of memory surface.
            </p>
            <p className="font-inter text-white/35 text-base">
              Moments you forgot existed.
            </p>
            <p className="font-inter text-white/35 text-base">
              Feelings you cannot explain.
            </p>
          </div>

          <div className="md:col-span-2 pt-8 border-t border-white/[0.06] reveal reveal-d5">
            <div className="flex items-center gap-6">
              <span className="sparkle flex-shrink-0" style={{ width: 10, height: 10 }} />
              <p className="font-syne font-bold text-white/70 text-xl md:text-2xl tracking-wide">
                Not random.{' '}
                <span className="text-purple-mid">Designed.</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
