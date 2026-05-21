export default function PhaseAroma() {
  return (
    <section
      className="relative min-h-screen flex flex-col justify-center py-32 px-6 overflow-hidden"
      style={{ background: '#000' }}
    >
      {/* Electric purple burst from center */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 50% 40% at 50% 50%, rgba(123,47,190,0.22) 0%, rgba(26,5,51,0.15) 40%, transparent 75%)',
        }}
      />

      {/* Horizontal scan lines (subtle) */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 4px)',
        }}
      />

      <div className="relative z-10 max-w-screen-lg mx-auto w-full">
        {/* Terminal badge */}
        <div className="mb-10 reveal">
          <span className="terminal-line">SYS:// INITIATING SEQUENCE</span>
        </div>

        <div className="phase-badge mb-8 reveal reveal-d1">
          Phase 1 — AROMA
        </div>

        {/* Main statement */}
        <h2
          className="font-syne font-extrabold text-white leading-[1.0] mb-14 max-w-3xl reveal reveal-d2"
          style={{
            fontSize: 'clamp(2.8rem, 7.5vw, 7rem)',
            textShadow: '0 0 40px rgba(123,47,190,0.4)',
          }}
        >
          Scent is the fastest path to memory.
        </h2>

        {/* Three statements */}
        <div className="space-y-5 max-w-lg">
          <div className="reveal reveal-d3 flex items-start gap-4">
            <div className="mt-1.5 w-px h-4 bg-purple-primary/60 flex-shrink-0" />
            <p className="font-inter text-white/50 text-base md:text-lg">
              No permission required.
            </p>
          </div>
          <div className="reveal reveal-d4 flex items-start gap-4">
            <div className="mt-1.5 w-px h-4 bg-purple-primary/60 flex-shrink-0" />
            <p className="font-inter text-white/50 text-base md:text-lg">
              No warning given.
            </p>
          </div>
          <div className="reveal reveal-d5 pt-4">
            <p className="font-syne font-bold text-white/80 text-lg md:text-xl">
              One inhale—
            </p>
            <p className="font-syne font-bold text-purple-light text-lg md:text-xl">
              and the system writes directly to you.
            </p>
          </div>
        </div>
      </div>

      {/* Corner decorations */}
      <div className="absolute top-10 right-10 opacity-20">
        <div className="flex flex-col gap-1">
          {[100, 60, 30].map((w, i) => (
            <div
              key={i}
              className="h-px bg-purple-mid"
              style={{ width: w }}
            />
          ))}
        </div>
      </div>
      <div className="absolute bottom-10 left-10 opacity-20">
        <div className="flex flex-col gap-1">
          {[30, 60, 100].map((w, i) => (
            <div
              key={i}
              className="h-px bg-purple-mid"
              style={{ width: w }}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
