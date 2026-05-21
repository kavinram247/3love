'use client'

import Image from 'next/image'
import type { CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'

const BACKGROUND_VIDEO_SRC = '/assets/rotation/3love-rotation-cosmic-drift-4k-ai.mp4'
const POSTER_SRC = '/assets/rotation/3love-rotation-cosmic-drift-4k-poster.jpg'

const phases = [
  { numeral: 'I', title: 'Learn to love yourself.', label: 'Self Love' },
  { numeral: 'II', title: 'Learn to love all.', label: 'Love For Others' },
  { numeral: 'III', title: 'Learn to love your purpose.', label: 'Love For Passion' },
]

const products = [
  {
    id: 'eclat',
    name: 'Éclat',
    concept: 'Self Love',
    phase: 'Phase I',
    quote: 'The love you give yourself echoes forever.',
    notes: ['Lavender Haze', 'Nu Absolute', 'White Musk'],
    price: '₹4,800',
    accent: '176 122 255',
  },
  {
    id: 'lumiere',
    name: 'Lumière',
    concept: 'Love For Others',
    phase: 'Phase II',
    quote: 'Love is the light we leave behind.',
    notes: ['Blood Orange', 'Damascus Rose', 'Amber Star'],
    price: '₹3,600',
    accent: '255 150 76',
  },
  {
    id: 'ardeur',
    name: 'Ardeur',
    concept: 'Love For Passion',
    phase: 'Phase III',
    quote: 'Passion is the only rebellion worth pursuing.',
    notes: ['Black Pepper', 'Metallic Rose', 'Velour Oud'],
    price: '₹5,200',
    accent: '224 72 126',
  },
]

const noteStack = [
  { tier: 'Top', label: 'Opening', copy: 'Volatile, immediate, gone within minutes.', examples: 'Bergamot, Citrus, Ozone' },
  { tier: 'Heart', label: 'Character', copy: 'The identity of the composition as the first signal fades.', examples: 'Rose, Jasmine, Iris' },
  { tier: 'Base', label: 'Permanence', copy: 'What remains. The memory anchor.', examples: 'Oud, Sandalwood, Ambergris' },
]

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function syncVideoFrame(video: HTMLVideoElement, progress: number, duration: number) {
  if (!duration || Number.isNaN(duration)) return

  const safeDuration = Math.max(duration - 0.035, 0)
  const nextTime = clamp(progress * safeDuration, 0.02, safeDuration)

  if (Math.abs(video.currentTime - nextTime) > 0.01) {
    video.currentTime = nextTime
  }
}

export default function CinematicScrollExperience() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const stopTimerRef = useRef<number | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const section = sectionRef.current
    const video = videoRef.current
    if (!section || !video) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const root = document.documentElement
    const state = {
      current: 0,
      target: 0,
      duration: 0,
      velocity: 0,
      lastY: window.scrollY,
      lastTime: performance.now(),
      lastInput: performance.now(),
      active: false,
    }

    const measureProgress = () => {
      const rect = section.getBoundingClientRect()
      const range = Math.max(rect.height - window.innerHeight, 1)
      state.target = clamp(-rect.top / range, 0, 1)
      root.style.setProperty('--film-target', state.target.toFixed(4))
    }

    const writeFrame = () => {
      syncVideoFrame(video, state.current, state.duration)
      root.style.setProperty('--film-progress', state.current.toFixed(4))
      root.style.setProperty('--film-velocity', Math.min(Math.abs(state.velocity) / 2200, 1).toFixed(4))
    }

    const freeze = () => {
      state.current = state.target
      state.velocity = 0
      state.active = false
      video.pause()
      writeFrame()

      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }

    const render = (now: number) => {
      if (!state.active && !reduceMotion.matches) {
        rafRef.current = null
        return
      }

      const timeSinceInput = now - state.lastInput
      const speed = clamp(Math.abs(state.velocity) / 2200, 0, 1)

      if (reduceMotion.matches || timeSinceInput > 82) {
        state.current = state.target
      } else {
        const response = 0.18 + speed * 0.36
        state.current += (state.target - state.current) * response
      }

      if (Math.abs(state.target - state.current) < 0.0006) {
        state.current = state.target
      }

      video.pause()
      writeFrame()

      if (timeSinceInput > 82 && Math.abs(state.target - state.current) < 0.0006) {
        freeze()
        return
      }

      rafRef.current = requestAnimationFrame(render)
    }

    const startLoop = () => {
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(render)
      }
    }

    const onScroll = () => {
      if (reduceMotion.matches) return

      const now = performance.now()
      const y = window.scrollY
      const dt = Math.max(now - state.lastTime, 16)
      state.velocity = ((y - state.lastY) / dt) * 1000
      state.lastY = y
      state.lastTime = now
      state.lastInput = now
      state.active = true
      measureProgress()
      startLoop()

      if (stopTimerRef.current !== null) window.clearTimeout(stopTimerRef.current)
      stopTimerRef.current = window.setTimeout(freeze, 86)
    }

    const onMetadata = () => {
      state.duration = video.duration || 0
      video.pause()
      measureProgress()
      state.current = state.target
      writeFrame()
      setIsReady(true)
    }

    const onResize = () => {
      measureProgress()
      freeze()
    }

    video.pause()
    video.preload = 'auto'
    video.addEventListener('loadedmetadata', onMetadata)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize, { passive: true })

    if (video.readyState >= 1) onMetadata()
    else video.load()

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('is-visible')
        })
      },
      { threshold: 0.18, rootMargin: '0px 0px -8% 0px' },
    )

    document.querySelectorAll('[data-reveal]').forEach((node) => revealObserver.observe(node))

    const hashTimer = window.setTimeout(() => {
      if (!window.location.hash) return
      const target = document.querySelector(window.location.hash)
      if (!(target instanceof HTMLElement)) return
      target.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'auto' })
      measureProgress()
      freeze()
    }, 140)

    return () => {
      video.removeEventListener('loadedmetadata', onMetadata)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      revealObserver.disconnect()
      window.clearTimeout(hashTimer)
      if (stopTimerRef.current !== null) window.clearTimeout(stopTimerRef.current)
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <main className="cinematic-site">
      <section ref={sectionRef} id="hero" className="film-scroll" aria-label="3love cinematic scroll experience">
        <div className="film-stage" aria-hidden="true">
          <video
            ref={videoRef}
            className="film-video"
            poster={POSTER_SRC}
            muted
            playsInline
            preload="auto"
          >
            <source src={BACKGROUND_VIDEO_SRC} type="video/mp4" />
          </video>
          <div className="film-floor" />
          <div className="film-grade" />
          <div className="film-depth film-depth-left" />
          <div className="film-depth film-depth-right" />
          <div className="film-progress-line">
            <span />
          </div>
        </div>

        <div className={`cinema-loader ${isReady ? 'is-loaded' : ''}`} aria-hidden="true">
          <div className="loader-mark">
            <img src="/logo.jpg" alt="" width={112} height={46} />
          </div>
          <p>Initializing memory system</p>
        </div>

        <nav className="cinema-nav" aria-label="Primary navigation">
          <a href="#hero" className="brand-lockup" aria-label="3love home">
            <img src="/logo.jpg" alt="3love" width={92} height={38} />
          </a>
          <div className="nav-links">
            <a href="#system">System</a>
            <a href="#experience">Experience</a>
            <a href="#compositions">Compositions</a>
            <a href="#enter">Enter</a>
          </div>
          <div className="time-hud">
            <span>Scroll controls time</span>
            <i />
          </div>
        </nav>

        <div className="story-rail">
          <article className="story-panel hero-panel" data-reveal>
            <p className="micro-label">3V-L0V3 / Memory Constants</p>
            <h1>
              3 Versions
              <span>of Love</span>
            </h1>
            <p className="hero-copy">
              Perfume as memory. Love as energy. Emotion as a cosmic object.
            </p>
            <a className="cinema-button" href="#system">
              <span>Begin the system</span>
              <i>↓</i>
            </a>
          </article>

          <article id="system" className="story-panel split-panel align-right" data-reveal>
            <div className="scene-index">01</div>
            <div className="copy-block">
              <p className="micro-label">First Scroll / System Intro</p>
              <h2>Not a brand. A system.</h2>
              <p>
                Developed to research, learn, and evolve. You are not the observer.
                You are the user.
              </p>
            </div>
          </article>

          <article className="story-panel phase-panel" data-reveal>
            <div className="copy-block narrow">
              <p className="micro-label">Second Scroll / User Transformation</p>
              <h2>User evolves through three versions.</h2>
            </div>
            <div className="phase-stack">
              {phases.map((phase) => (
                <div key={phase.numeral} className="phase-line">
                  <span>{phase.numeral}</span>
                  <div>
                    <small>{phase.label}</small>
                    <strong>{phase.title}</strong>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="story-panel split-panel" data-reveal>
            <div className="scene-index">03</div>
            <div className="copy-block">
              <p className="micro-label">Phase 1 / Aroma</p>
              <h2>Scent is the fastest path to memory.</h2>
              <p>
                No permission required. No warning given. One inhale, and the
                system writes directly to you.
              </p>
            </div>
          </article>

          <article className="story-panel memory-panel" data-reveal>
            <p className="micro-label">Fourth Scroll / Memory Constants</p>
            <h2>
              Memory
              <span>Constants.</span>
            </h2>
            <p>Controlled sensory anchors designed to lock moments into permanence.</p>
          </article>

          <article id="compositions" className="story-panel product-panel" data-reveal>
            <div className="product-heading">
              <p className="micro-label">Fifth Scroll / Fragrance Philosophy</p>
              <h2>These are compositions.</h2>
              <p>Constructed from high-grade aromatic materials sourced by Kaz.</p>
            </div>
            <div className="product-grid">
              {products.map((product) => (
                <a
                  key={product.id}
                  className="scent-card"
                  href="#enter"
                  style={{ '--accent-rgb': product.accent } as CSSProperties}
                >
                  <div className="bottle-glyph">
                    <span />
                    <i />
                  </div>
                  <p>{product.phase} / {product.concept}</p>
                  <h3>{product.name}</h3>
                  <small>{product.quote}</small>
                  <div className="note-row">
                    {product.notes.map((note) => <em key={note}>{note}</em>)}
                  </div>
                  <strong>{product.price}</strong>
                </a>
              ))}
            </div>
          </article>

          <article className="story-panel orchestration-panel" data-reveal>
            <div className="copy-block">
              <p className="micro-label">Sixth Scroll / Brand Differentiation</p>
              <h2>We orchestrate.</h2>
              <p>
                Like a conductor shaping sound, each note is placed with intention,
                timing, and sequence.
              </p>
            </div>
            <div className="note-stack">
              {noteStack.map((note, index) => (
                <div key={note.tier} className="note-line">
                  <span>0{index + 1}</span>
                  <div>
                    <p>{note.tier} <small>{note.label}</small></p>
                    <strong>{note.copy}</strong>
                    <em>{note.examples}</em>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article id="experience" className="story-panel media-panel" data-reveal>
            <div className="film-frames">
              <figure>
                <Image src="/assets/rotation/start-1280x720.png" alt="3love bottle start frame" width={640} height={360} />
                <figcaption>Start frame</figcaption>
              </figure>
              <figure>
                <Image src="/assets/rotation/end-1280x720.png" alt="3love bottle end frame" width={640} height={360} />
                <figcaption>End frame</figcaption>
              </figure>
            </div>
            <div className="copy-block">
              <p className="micro-label">Seventh Scroll / Cinematic Experience</p>
              <h2>Aroma in rotation.</h2>
              <p>
                The bottle turns while the cosmic field responds independently:
                object, scent, and memory becoming one living signal.
              </p>
            </div>
          </article>

          <article id="enter" className="story-panel final-panel" data-reveal>
            <p className="micro-label">Final Scroll / Call to Entry</p>
            <h2>
              They will belong to
              <span>this moment.</span>
            </h2>
            <p>To you.</p>
            <div className="final-actions">
              <a className="cinema-button" href="#compositions">
                <span>Explore compositions</span>
                <i>↗</i>
              </a>
              <a className="quiet-link" href="#hero">Return to opening frame</a>
            </div>
            <footer>
              <span>3 Versions of Love</span>
              <span>Memory Constants</span>
              <span>© 2026</span>
            </footer>
          </article>
        </div>
      </section>
    </main>
  )
}
