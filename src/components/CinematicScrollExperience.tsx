'use client'

import Image from 'next/image'
import type { CSSProperties, FormEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import CompositionModel from './CompositionModel'

const BACKGROUND_VIDEO_SRC = '/assets/rotation/3love-rotation-cosmic-drift-4k-ai.mp4'
const POSTER_SRC = '/assets/rotation/3love-rotation-cosmic-drift-4k-poster.jpg'
const CART_STORAGE_KEY = '3love-private-cart-v1'

type Product = {
  id: string
  name: string
  concept: string
  phase: string
  quote: string
  notes: string[]
  volume: string
  stockLabel: string
  mediaKey: string
  accent: string
}

type CartItem = {
  productId: string
  quantity: number
}

type CartLine = CartItem & {
  product: Product
}

type QuoteForm = {
  name: string
  email: string
  country: string
  postcode: string
  message: string
}

const emptyQuoteForm: QuoteForm = {
  name: '',
  email: '',
  country: '',
  postcode: '',
  message: '',
}

const phases = [
  { numeral: 'I', title: 'Learn to love yourself.', label: 'Self Love' },
  { numeral: 'II', title: 'Learn to love all.', label: 'Love For Others' },
  { numeral: 'III', title: 'Learn to love your purpose.', label: 'Love For Passion' },
]

const products: Product[] = [
  {
    id: 'eclat',
    name: 'Éclat',
    concept: 'Self Love',
    phase: 'Phase I',
    quote: 'The love you give yourself echoes forever.',
    notes: ['Lavender Haze', 'Nu Absolute', 'White Musk'],
    volume: '50ML',
    stockLabel: 'Private allocation',
    mediaKey: 'object-01',
    accent: '176 122 255',
  },
  {
    id: 'lumiere',
    name: 'Lumière',
    concept: 'Love For Others',
    phase: 'Phase II',
    quote: 'Love is the light we leave behind.',
    notes: ['Blood Orange', 'Damascus Rose', 'Amber Star'],
    volume: '50ML',
    stockLabel: 'Studio reserve',
    mediaKey: 'object-02',
    accent: '255 150 76',
  },
  {
    id: 'ardeur',
    name: 'Ardeur',
    concept: 'Love For Passion',
    phase: 'Phase III',
    quote: 'Passion is the only rebellion worth pursuing.',
    notes: ['Black Pepper', 'Metallic Rose', 'Velour Oud'],
    volume: '50ML',
    stockLabel: 'Limited request',
    mediaKey: 'object-03',
    accent: '224 72 126',
  },
]

const productLookup = new Map(products.map((product) => [product.id, product]))

const noteStack = [
  { tier: 'Top', label: 'Opening', copy: 'Volatile, immediate, gone within minutes.', examples: 'Bergamot, Citrus, Ozone' },
  { tier: 'Heart', label: 'Character', copy: 'The identity of the composition as the first signal fades.', examples: 'Rose, Jasmine, Iris' },
  { tier: 'Base', label: 'Permanence', copy: 'What remains. The memory anchor.', examples: 'Oud, Sandalwood, Ambergris' },
]

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function sanitizeCartItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return []

  return value.reduce<CartItem[]>((items, item) => {
    if (!item || typeof item !== 'object') return items

    const candidate = item as Partial<CartItem>
    if (typeof candidate.productId !== 'string' || !productLookup.has(candidate.productId)) return items

    const quantity = clamp(Math.trunc(Number(candidate.quantity) || 1), 1, 9)
    const existing = items.find((cartItem) => cartItem.productId === candidate.productId)

    if (existing) {
      existing.quantity = clamp(existing.quantity + quantity, 1, 9)
      return items
    }

    return [...items, { productId: candidate.productId, quantity }]
  }, [])
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
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [quoteForm, setQuoteForm] = useState<QuoteForm>(emptyQuoteForm)
  const [isQuoteSent, setIsQuoteSent] = useState(false)
  const [hasLoadedCart, setHasLoadedCart] = useState(false)

  const cartLines = useMemo<CartLine[]>(
    () => cartItems.flatMap((item) => {
      const product = productLookup.get(item.productId)
      return product ? [{ ...item, product }] : []
    }),
    [cartItems],
  )

  const cartCount = useMemo(
    () => cartItems.reduce((total, item) => total + item.quantity, 0),
    [cartItems],
  )

  const addProductToCart = (productId: string) => {
    setCartItems((items) => {
      const exists = items.some((item) => item.productId === productId)
      if (!exists) return [...items, { productId, quantity: 1 }]

      return items.map((item) => (
        item.productId === productId
          ? { ...item, quantity: clamp(item.quantity + 1, 1, 9) }
          : item
      ))
    })
    setIsQuoteSent(false)
    setIsCartOpen(true)
  }

  const changeCartQuantity = (productId: string, delta: number) => {
    setCartItems((items) => items.flatMap((item) => {
      if (item.productId !== productId) return [item]

      const quantity = clamp(item.quantity + delta, 0, 9)
      return quantity > 0 ? [{ ...item, quantity }] : []
    }))
    setIsQuoteSent(false)
  }

  const removeCartItem = (productId: string) => {
    setCartItems((items) => items.filter((item) => item.productId !== productId))
    setIsQuoteSent(false)
  }

  const updateQuoteField = (field: keyof QuoteForm, value: string) => {
    setQuoteForm((form) => ({ ...form, [field]: value }))
    setIsQuoteSent(false)
  }

  const handleQuoteSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (cartLines.length === 0) return
    setIsQuoteSent(true)
  }

  const returnToCompositions = () => {
    setIsCartOpen(false)
    window.setTimeout(() => {
      document.getElementById('compositions')?.scrollIntoView({ block: 'start', inline: 'nearest' })
    }, 120)
  }

  useEffect(() => {
    try {
      const storedCart = window.localStorage.getItem(CART_STORAGE_KEY)
      if (storedCart) setCartItems(sanitizeCartItems(JSON.parse(storedCart)))
    } catch {
      window.localStorage.removeItem(CART_STORAGE_KEY)
    } finally {
      setHasLoadedCart(true)
    }
  }, [])

  useEffect(() => {
    if (!hasLoadedCart) return

    try {
      if (cartItems.length > 0) {
        window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems))
      } else {
        window.localStorage.removeItem(CART_STORAGE_KEY)
      }
    } catch {
      // Storage can fail in private contexts; the cart still works for the active session.
    }
  }, [cartItems, hasLoadedCart])

  useEffect(() => {
    if (!isCartOpen) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsCartOpen(false)
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [isCartOpen])

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
          <div className="nav-actions">
            <button
              className="cart-pill"
              type="button"
              onClick={() => setIsCartOpen(true)}
              aria-label={`Open private cart with ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}
            >
              <span>Cart</span>
              <i>{cartCount}</i>
            </button>
            <div className="time-hud">
              <span>Scroll controls time</span>
              <i />
            </div>
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
              {products.map((product, index) => (
                <article
                  key={product.id}
                  className="scent-card"
                  style={{ '--accent-rgb': product.accent } as CSSProperties}
                >
                  <CompositionModel
                    accent={product.accent}
                    index={index}
                    label={product.mediaKey}
                    name={product.name}
                  />
                  <p>{product.phase} / {product.concept}</p>
                  <h3>{product.name}</h3>
                  <small>{product.quote}</small>
                  <div className="note-row">
                    {product.notes.map((note) => <em key={note}>{note}</em>)}
                  </div>
                  <div className="scent-meta">
                    <strong>{product.volume}</strong>
                    <span>{product.stockLabel}</span>
                  </div>
                  <button
                    className="cart-add-button"
                    type="button"
                    onClick={() => addProductToCart(product.id)}
                  >
                    <span>Add to private cart</span>
                    <i>+</i>
                  </button>
                </article>
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
              <button className="cinema-button" type="button" onClick={() => setIsCartOpen(true)}>
                <span>Open private cart</span>
                <i>↗</i>
              </button>
              <a className="quiet-link" href="#compositions">Explore compositions</a>
            </div>
            <footer>
              <span>3 Versions of Love</span>
              <span>Memory Constants</span>
              <span>© 2026</span>
            </footer>
          </article>
        </div>
      </section>

      <div
        className={`cart-backdrop ${isCartOpen ? 'is-open' : ''}`}
        aria-hidden="true"
        onClick={() => setIsCartOpen(false)}
      />

      <aside
        className={`cart-drawer ${isCartOpen ? 'is-open' : ''}`}
        aria-hidden={!isCartOpen}
        aria-label="Private order cart"
      >
        <div className="cart-drawer-shell">
          <header className="cart-header">
            <div>
              <p className="micro-label">Private Order</p>
              <h2>Cart review</h2>
            </div>
            <button className="cart-close" type="button" onClick={() => setIsCartOpen(false)} aria-label="Close cart">
              ×
            </button>
          </header>

          <div className="cart-body">
            {cartLines.length === 0 ? (
              <div className="cart-empty">
                <p>Nothing held yet.</p>
                <button className="cinema-button" type="button" onClick={returnToCompositions}>
                  <span>Choose a composition</span>
                  <i>↓</i>
                </button>
              </div>
            ) : (
              <>
                <div className="cart-lines">
                  {cartLines.map(({ product, quantity }) => (
                    <div
                      key={product.id}
                      className="cart-line"
                      style={{ '--accent-rgb': product.accent } as CSSProperties}
                    >
                      <div className="cart-line-head">
                        <div>
                          <span>{product.phase}</span>
                          <strong>{product.name}</strong>
                        </div>
                        <button type="button" onClick={() => removeCartItem(product.id)}>
                          Remove
                        </button>
                      </div>
                      <p>{product.concept} / {product.volume} / {product.stockLabel}</p>
                      <em>{product.notes.join(' / ')}</em>
                      <div className="quantity-control" aria-label={`${product.name} quantity`}>
                        <button type="button" onClick={() => changeCartQuantity(product.id, -1)} aria-label={`Remove one ${product.name}`}>
                          -
                        </button>
                        <span>{quantity}</span>
                        <button type="button" onClick={() => changeCartQuantity(product.id, 1)} aria-label={`Add one ${product.name}`}>
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="shipping-note">
                  <span>Global quote</span>
                  <p>International availability, shipping, duties, and handling are confirmed before payment.</p>
                </div>

                <form className="quote-form" onSubmit={handleQuoteSubmit}>
                  <div className="quote-form-grid">
                    <label>
                      <span>Name</span>
                      <input
                        value={quoteForm.name}
                        onChange={(event) => updateQuoteField('name', event.target.value)}
                        autoComplete="name"
                        required
                      />
                    </label>
                    <label>
                      <span>Email</span>
                      <input
                        type="email"
                        value={quoteForm.email}
                        onChange={(event) => updateQuoteField('email', event.target.value)}
                        autoComplete="email"
                        required
                      />
                    </label>
                    <label>
                      <span>Country</span>
                      <input
                        value={quoteForm.country}
                        onChange={(event) => updateQuoteField('country', event.target.value)}
                        autoComplete="country-name"
                        required
                      />
                    </label>
                    <label>
                      <span>Postcode / ZIP</span>
                      <input
                        value={quoteForm.postcode}
                        onChange={(event) => updateQuoteField('postcode', event.target.value)}
                        autoComplete="postal-code"
                        required
                      />
                    </label>
                  </div>
                  <label className="quote-message">
                    <span>Message</span>
                    <textarea
                      value={quoteForm.message}
                      onChange={(event) => updateQuoteField('message', event.target.value)}
                      rows={4}
                    />
                  </label>
                  <button className="cinema-button cart-submit" type="submit">
                    <span>Request private order</span>
                    <i>↗</i>
                  </button>
                  {isQuoteSent && (
                    <p className="quote-confirmation" role="status">
                      Request staged locally. Payment, availability, shipping, and duties will be confirmed before anything is charged.
                    </p>
                  )}
                </form>
              </>
            )}
          </div>
        </div>
      </aside>
    </main>
  )
}
