export default function SystemIntro() {
  return (
    <section id="system" className="relative py-32 md:py-44 px-6">
      <div className="max-w-screen-lg mx-auto">
        <div className="divider mb-16 reveal" />

        <p className="section-label mb-10 reveal reveal-d1">
          First Scroll — System Intro
        </p>

        <div className="space-y-8 max-w-2xl">
          <p className="font-inter text-white/50 text-lg md:text-xl leading-relaxed reveal reveal-d2">
            3 Versions of Love is not a brand.
          </p>

          <h2
            className="font-syne font-extrabold text-white leading-[1.02] reveal reveal-d3"
            style={{ fontSize: 'clamp(2.8rem, 7vw, 6rem)' }}
          >
            It is a system.
          </h2>

          <p className="font-syne text-xl md:text-2xl font-medium reveal reveal-d4"
            style={{ color: 'rgba(255,255,255,0.85)' }}>
            Developed to{' '}
            <span className="text-purple-mid font-bold">research.</span>{' '}
            <span className="text-purple-mid font-bold">learn.</span>{' '}
            <span className="text-purple-mid font-bold">evolve.</span>
          </p>

          <div className="pt-6 space-y-2 reveal reveal-d5">
            <p className="font-inter text-white/45 text-base md:text-lg">
              You are not the observer.
            </p>
            <p className="font-syne font-bold text-white text-xl md:text-2xl">
              You are the user.
            </p>
          </div>
        </div>

        <div className="divider mt-16 reveal reveal-d6" />
      </div>
    </section>
  )
}
