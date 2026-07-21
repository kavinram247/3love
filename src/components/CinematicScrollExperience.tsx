'use client'

import type { CSSProperties } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ClerkLoaded, ClerkLoading, Show } from '@clerk/nextjs'
import { BOTTLE_SCENE_SRC, products as fallbackProducts } from '@/lib/products'
import type { Product } from '@/lib/products'
import { formatGbp } from '@/lib/backend/format'

const SCRUB_VIDEO_DESKTOP_SRC = '/assets/rotation/3love-rotation-scrub-1080p-v1.mp4'
const SCRUB_VIDEO_MOBILE_SRC = '/assets/rotation/3love-rotation-scrub-720p-v1.mp4'
const POSTER_SRC = '/assets/rotation/3love-rotation-cosmic-drift-4k-poster.jpg'
const CART_STORAGE_KEY = '3love-cart-v1'
const SCRUB_FRAME_RATE = 24
const SCRUB_FRAME_INTERVAL_MS = 1000 / SCRUB_FRAME_RATE
const SCRUB_FRAME_EPSILON = 1 / (SCRUB_FRAME_RATE * 2)
const SCRUB_SCROLL_SENSITIVITY = 1.14
const SCRUB_SMOOTHING_MS = 32
const SCRUB_MOBILE_SMOOTHING_MS = 40
const SCRUB_SETTLE_LIMIT_MS = 180

type CartItem = {
  productId: string
  quantity: number
}

type CartLine = CartItem & {
  product: Product
}

type CheckoutState = {
  isLoading: boolean
  error: string
}

type SystemScene = {
  id: string
  eyebrow: string
  index: string
  mood: 'system' | 'emotion' | 'experience' | 'memory'
  title: string
  body: string
  fragments: string[]
}

const systemScenes: SystemScene[] = [
  {
    id: 'system',
    eyebrow: 'PHASE_00 / THE SYSTEM',
    index: '00',
    mood: 'system',
    title: 'A system for emotional evolution.',
    body: 'Before fragrance, there is a framework: emotion, experience, memory. The site is the first proof of the philosophy.',
    fragments: ['Evolution', 'Innovation', 'Emotional engineering'],
  },
  {
    id: 'emotion',
    eyebrow: 'SECTION_01 / THE TRIGGER',
    index: '01',
    mood: 'emotion',
    title: 'Every connection begins as a feeling.',
    body: 'Attraction arrives before language. It flickers, pulls, and destabilizes the room.',
    fragments: ['Instinct', 'Tension', 'Curiosity'],
  },
  {
    id: 'experience',
    eyebrow: 'SECTION_02 / THE SEQUENCE',
    index: '02',
    mood: 'experience',
    title: 'Experience transforms emotion into memory.',
    body: 'Layer by layer, movement becomes intention. The system begins to orchestrate what the body already knows.',
    fragments: ['Texture', 'Diffusion', 'Sequence'],
  },
  {
    id: 'memory',
    eyebrow: 'SECTION_03 / THE IMPRINT',
    index: '03',
    mood: 'memory',
    title: 'Memory is what remains.',
    body: 'The motion fades. The signal softens. Something from the experience refuses to leave.',
    fragments: ['Reflection', 'Archive', 'Afterimage'],
  },
]

const philosophyInteractions = [
  {
    code: '01',
    label: 'Emotion',
    copy: 'The immediate trigger. Fast, instinctive, impossible to explain before it happens.',
  },
  {
    code: '02',
    label: 'Experience',
    copy: 'The orchestrated middle. Notes, texture, movement, and atmosphere begin to synchronise.',
  },
  {
    code: '03',
    label: 'Memory',
    copy: 'The lasting imprint. What stays after the movement has disappeared.',
  },
]

const noteStack = [
  { tier: 'Top', label: 'Trigger', copy: 'The first version: volatile, immediate, and emotionally charged.', examples: 'Bergamot, Citrus, Ozone' },
  { tier: 'Heart', label: 'Sequence', copy: 'The experience layer: the identity of the composition as the first signal evolves.', examples: 'Rose, Jasmine, Iris' },
  { tier: 'Base', label: 'Imprint', copy: 'The memory anchor: warm, slow, and designed to remain.', examples: 'Oud, Sandalwood, Ambergris' },
]

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function sanitizeCartItems(value: unknown, productLookup: Map<string, Product>): CartItem[] {
  if (!Array.isArray(value)) return []

  return value.reduce<CartItem[]>((items, item) => {
    if (!item || typeof item !== 'object') return items

    const candidate = item as Partial<CartItem>
    if (typeof candidate.productId !== 'string' || !productLookup.has(candidate.productId)) return items

    const product = productLookup.get(candidate.productId)
    if (!product || product.availableStock <= 0) return items
    const quantity = clamp(Math.trunc(Number(candidate.quantity) || 1), 1, Math.min(9, product.availableStock))
    const existing = items.find((cartItem) => cartItem.productId === candidate.productId)

    if (existing) {
      existing.quantity = clamp(existing.quantity + quantity, 1, Math.min(9, product.availableStock))
      return items
    }

    return [...items, { productId: candidate.productId, quantity }]
  }, [])
}

function videoTimeForProgress(progress: number, duration: number) {
  const safeDuration = Math.max(duration - (1 / SCRUB_FRAME_RATE), 0)
  const exactTime = clamp(progress * safeDuration, 0, safeDuration)
  return clamp(Math.round(exactTime * SCRUB_FRAME_RATE) / SCRUB_FRAME_RATE, 0, safeDuration)
}

export default function CinematicScrollExperience({
  storefrontProducts = fallbackProducts,
}: {
  storefrontProducts?: Product[]
}) {
  const activeProducts = storefrontProducts.length > 0 ? storefrontProducts : fallbackProducts
  const featuredProduct = activeProducts[0] ?? fallbackProducts[0]
  const productLookup = useMemo(() => new Map(activeProducts.map((product) => [product.id, product])), [activeProducts])
  const sectionRef = useRef<HTMLElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const checkoutKeyRef = useRef<string | null>(null)
  const cartCloseRef = useRef<HTMLButtonElement | null>(null)
  const cartDrawerRef = useRef<HTMLElement | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [checkoutNote, setCheckoutNote] = useState('')
  const [hasLoadedCart, setHasLoadedCart] = useState(false)
  const [checkoutState, setCheckoutState] = useState<CheckoutState>({ isLoading: false, error: '' })

  const cartLines = useMemo<CartLine[]>(
    () => cartItems.flatMap((item) => {
      const product = productLookup.get(item.productId)
      return product ? [{ ...item, product }] : []
    }),
    [cartItems, productLookup],
  )

  const cartCount = useMemo(
    () => cartItems.reduce((total, item) => total + item.quantity, 0),
    [cartItems],
  )

  const cartSubtotal = useMemo(
    () => cartLines.reduce((total, line) => total + line.product.priceGbpPence * line.quantity, 0),
    [cartLines],
  )

  const addProductToCart = (productId: string) => {
    const product = productLookup.get(productId)
    if (!product || product.availableStock <= 0) return
    setCartItems((items) => {
      const exists = items.some((item) => item.productId === productId)
      if (!exists) return [...items, { productId, quantity: 1 }]

      return items.map((item) => (
        item.productId === productId
          ? { ...item, quantity: clamp(item.quantity + 1, 1, Math.min(9, product.availableStock)) }
          : item
      ))
    })
    setCheckoutState({ isLoading: false, error: '' })
    setIsCartOpen(true)
  }

  const changeCartQuantity = (productId: string, delta: number) => {
    setCartItems((items) => items.flatMap((item) => {
      if (item.productId !== productId) return [item]

      const product = productLookup.get(productId)
      const quantity = clamp(item.quantity + delta, 0, Math.min(9, product?.availableStock ?? 9))
      return quantity > 0 ? [{ ...item, quantity }] : []
    }))
    setCheckoutState({ isLoading: false, error: '' })
  }

  const removeCartItem = (productId: string) => {
    setCartItems((items) => items.filter((item) => item.productId !== productId))
    setCheckoutState({ isLoading: false, error: '' })
  }

  const startCheckout = async () => {
    if (cartLines.length === 0 || checkoutState.isLoading) return

    setCheckoutState({ isLoading: true, error: '' })
    checkoutKeyRef.current ??= window.crypto.randomUUID()

    try {
      const response = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartLines.map(({ product, quantity }) => ({
            variantId: product.variantId,
            quantity,
          })),
          checkoutKey: checkoutKeyRef.current,
          checkoutNote,
        }),
      })

      const payload = await response.json().catch(() => ({})) as { url?: string; error?: string; loginUrl?: string; code?: string }

      if (response.status === 401 && payload.loginUrl) {
        window.location.href = payload.loginUrl
        return
      }

      if (!response.ok || !payload.url) {
        if (payload.code === 'CHECKOUT_REUSED') checkoutKeyRef.current = null
        throw new Error(payload.error || 'Checkout could not be started.')
      }

      window.location.href = payload.url
    } catch (error) {
      setCheckoutState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Checkout could not be started.',
      })
    }
  }

  const returnToCompositions = () => {
    setIsCartOpen(false)
    window.setTimeout(() => {
      document.getElementById('compositions')?.scrollIntoView({ block: 'start', inline: 'nearest' })
    }, 120)
  }

  useEffect(() => {
    let isCancelled = false
    let localItems: CartItem[] = []

    try {
      const storedCart = window.localStorage.getItem(CART_STORAGE_KEY)
      if (storedCart) localItems = sanitizeCartItems(JSON.parse(storedCart), productLookup)
      setCartItems(localItems)
    } catch {
      window.localStorage.removeItem(CART_STORAGE_KEY)
    }

    fetch('/api/cart')
      .then(async (response) => {
        if (!response.ok) return null
        return response.json() as Promise<{ items?: CartItem[] }>
      })
      .then((payload) => {
        if (isCancelled) return
        const remoteItems = sanitizeCartItems(payload?.items, productLookup)
        setCartItems(remoteItems.length > 0 ? remoteItems : localItems)
      })
      .catch(() => {
        // Anonymous and unconfigured sessions keep using local cart storage.
      })
      .finally(() => {
        if (!isCancelled) setHasLoadedCart(true)
      })

    return () => {
      isCancelled = true
    }
  }, [productLookup])

  useEffect(() => {
    if (!hasLoadedCart) return

    try {
      if (cartItems.length > 0) {
        window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems))
      } else {
        window.localStorage.removeItem(CART_STORAGE_KEY)
      }
    } catch {
      // Storage can fail in restricted browser contexts; the cart still works for the active session.
    }

    fetch('/api/cart', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cartLines.map(({ product, quantity }) => ({
          variantId: product.variantId,
          quantity,
        })),
      }),
    }).catch(() => {
      // Server cart persistence is best-effort until the user is logged in and MongoDB is configured.
    })
  }, [cartItems, cartLines, hasLoadedCart])

  useEffect(() => {
    if (!isCartOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    cartCloseRef.current?.focus()

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsCartOpen(false)
      if (event.key !== 'Tab') return

      const focusable = cartDrawerRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [isCartOpen])

  useEffect(() => {
    const section = sectionRef.current
    const video = videoRef.current
    const stage = section?.querySelector<HTMLElement>('.film-stage')
    if (!section || !stage || !video) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const mobileViewport = window.matchMedia('(max-width: 767px)')
    const state = {
      current: 0,
      target: 0,
      duration: 0,
      velocity: 0,
      lastY: window.scrollY,
      lastTime: performance.now(),
      lastInput: performance.now(),
      lastRenderAt: performance.now(),
      lastSeekAt: 0,
      queuedTime: null as number | null,
      active: false,
      ready: false,
    }

    const readDuration = () => {
      const duration = video.duration
      return Number.isFinite(duration) && duration > 0 ? duration : state.duration
    }

    const measureProgress = () => {
      const rect = section.getBoundingClientRect()
      const range = Math.max(section.offsetHeight - stage.offsetHeight, 1)
      state.target = clamp(-rect.top / range, 0, 1)
      section.style.setProperty('--film-target', state.target.toFixed(4))
    }

    const seekTo = (nextTime: number, now: number, force = false) => {
      if (!state.ready || !Number.isFinite(nextTime)) return
      if (Math.abs(video.currentTime - nextTime) <= SCRUB_FRAME_EPSILON) {
        state.queuedTime = null
        return
      }

      if (video.seeking || (!force && now - state.lastSeekAt < SCRUB_FRAME_INTERVAL_MS)) {
        state.queuedTime = nextTime
        return
      }

      state.queuedTime = null
      state.lastSeekAt = now
      try {
        video.currentTime = nextTime
      } catch {
        state.queuedTime = nextTime
      }
    }

    const writeFrame = (now: number, forceVideo = false) => {
      section.style.setProperty('--film-progress', state.current.toFixed(4))
      section.style.setProperty('--film-velocity', Math.min(Math.abs(state.velocity) / 2200, 1).toFixed(4))

      const duration = readDuration()
      if (state.ready && Number.isFinite(duration) && duration > 0) {
        const videoProgress = clamp(state.current * SCRUB_SCROLL_SENSITIVITY, 0, 1)
        seekTo(videoTimeForProgress(videoProgress, duration), now, forceVideo)
      }
    }

    const freeze = (now = performance.now()) => {
      state.current = state.target
      state.velocity = 0
      state.active = false
      writeFrame(now, true)

      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }

    const render = (now: number) => {
      if (!state.active || reduceMotion.matches) {
        rafRef.current = null
        return
      }

      const timeSinceInput = now - state.lastInput
      const elapsed = Math.min(Math.max(now - state.lastRenderAt, 0), 50)
      const smoothingMs = mobileViewport.matches ? SCRUB_MOBILE_SMOOTHING_MS : SCRUB_SMOOTHING_MS
      const smoothing = 1 - Math.exp(-elapsed / smoothingMs)
      state.current += (state.target - state.current) * smoothing
      state.lastRenderAt = now
      if (timeSinceInput > 96) state.velocity = 0

      const duration = readDuration()
      const settleThreshold = duration > 0
        ? 1 / (SCRUB_FRAME_RATE * duration * 2)
        : 0.001
      const isSettled = Math.abs(state.target - state.current) <= settleThreshold

      if (isSettled || timeSinceInput >= SCRUB_SETTLE_LIMIT_MS) {
        freeze(now)
        return
      }

      writeFrame(now)
      rafRef.current = requestAnimationFrame(render)
    }

    const startLoop = () => {
      if (rafRef.current === null) {
        state.lastRenderAt = performance.now()
        rafRef.current = requestAnimationFrame(render)
      }
    }

    const syncNow = (activate = true) => {
      const now = performance.now()
      measureProgress()
      if (activate && !reduceMotion.matches) {
        state.active = true
        state.lastInput = now
        startLoop()
        return
      }

      state.current = state.target
      state.velocity = 0
      writeFrame(now, true)
    }

    const onScroll = () => {
      const now = performance.now()
      const y = window.scrollY
      const dt = Math.max(now - state.lastTime, 16)
      state.velocity = ((y - state.lastY) / dt) * 1000
      state.lastY = y
      state.lastTime = now
      state.lastInput = now
      measureProgress()

      if (reduceMotion.matches) {
        state.current = state.target
        state.velocity = 0
        writeFrame(now)
        return
      }

      state.active = true
      startLoop()
    }

    const onVideoMetadata = () => {
      state.duration = readDuration()
      state.ready = state.duration > 0 || video.readyState >= 1
      video.pause()
      syncNow(false)
      setIsReady(true)
    }

    const onVideoError = () => {
      state.ready = false
      state.queuedTime = null
      setIsReady(true)
    }

    const onSeeked = () => {
      const queuedTime = state.queuedTime
      if (queuedTime === null || Math.abs(video.currentTime - queuedTime) <= SCRUB_FRAME_EPSILON) {
        state.queuedTime = null
        return
      }

      state.queuedTime = null
      seekTo(queuedTime, performance.now(), !state.active)
    }

    const onResize = () => {
      measureProgress()
      freeze()
    }

    const onWake = () => {
      state.lastY = window.scrollY
      state.lastTime = performance.now()
      state.duration = readDuration()
      state.ready = state.ready || video.readyState >= 1
      syncNow(false)
    }

    const selectedVideoSource = mobileViewport.matches ? SCRUB_VIDEO_MOBILE_SRC : SCRUB_VIDEO_DESKTOP_SRC
    const loadVideo = () => {
      state.ready = false
      state.duration = 0
      state.queuedTime = null
      video.pause()
      video.src = selectedVideoSource
      video.preload = 'auto'
      video.load()
    }

    const unloadVideo = () => {
      state.ready = false
      state.duration = 0
      state.queuedTime = null
      video.pause()
      video.removeAttribute('src')
      video.preload = 'none'
      video.load()
      syncNow(false)
      setIsReady(true)
    }

    const onMotionPreferenceChange = () => {
      if (reduceMotion.matches) {
        unloadVideo()
      } else {
        setIsReady(false)
        loadVideo()
      }
    }

    video.pause()
    video.preload = 'none'
    video.addEventListener('loadedmetadata', onVideoMetadata)
    video.addEventListener('error', onVideoError)
    video.addEventListener('seeked', onSeeked)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize, { passive: true })
    window.addEventListener('orientationchange', onResize, { passive: true })
    window.addEventListener('pageshow', onWake, { passive: true })
    window.addEventListener('focus', onWake, { passive: true })
    window.addEventListener('hashchange', onWake, { passive: true })
    document.addEventListener('visibilitychange', onWake)
    reduceMotion.addEventListener('change', onMotionPreferenceChange)

    if (reduceMotion.matches) unloadVideo()
    else loadVideo()

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
      onWake()
    }, 140)

    return () => {
      video.removeEventListener('loadedmetadata', onVideoMetadata)
      video.removeEventListener('error', onVideoError)
      video.removeEventListener('seeked', onSeeked)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)
      window.removeEventListener('pageshow', onWake)
      window.removeEventListener('focus', onWake)
      window.removeEventListener('hashchange', onWake)
      document.removeEventListener('visibilitychange', onWake)
      reduceMotion.removeEventListener('change', onMotionPreferenceChange)
      revealObserver.disconnect()
      window.clearTimeout(hashTimer)
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <main id="main-content" className="cinematic-site">
      <section id="brand" className="brand-gateway" aria-label="3love brand philosophy" data-reveal>
        <div className="brand-cosmos" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="brand-gateway-copy">
          <p className="micro-label">3LOVE / BRAND SYSTEM</p>
          <h1>A fragrance house for emotional memory.</h1>
          <p>
            Emotion becomes experience. Experience becomes memory.
          </p>
          <div className="brand-gateway-actions">
            <a className="cinema-button" href="#hero">
              <span>Enter the scroll film</span>
              <i>↓</i>
            </a>
            <a className="quiet-link" href="#phase-01">View Phase 01</a>
          </div>
        </div>
        <div className="brand-principles" aria-label="3love brand framework">
          <article>
            <span>01</span>
            <strong>Emotion</strong>
            <p>The trigger before language. A first pull, felt before it is understood.</p>
          </article>
          <article>
            <span>02</span>
            <strong>Experience</strong>
            <p>The sequence that gives the feeling structure, rhythm, and atmosphere.</p>
          </article>
          <article>
            <span>03</span>
            <strong>Memory</strong>
            <p>The imprint that remains after the scene has disappeared.</p>
          </article>
        </div>
      </section>

      <section ref={sectionRef} id="hero" className="film-scroll" aria-label="3love cinematic scroll experience">
        <div className="film-stage" aria-hidden="true">
          <video
            ref={videoRef}
            className="film-video"
            poster={POSTER_SRC}
            muted
            playsInline
            preload="none"
          />
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
            <Image src="/logo.jpg" alt="" width={112} height={46} priority />
          </div>
          <p>Initializing memory system</p>
        </div>

        <nav className="cinema-nav" aria-label="Primary navigation">
          <a href="#brand" className="brand-lockup" aria-label="3love home">
            <Image src="/logo.jpg" alt="3love" width={92} height={38} priority />
          </a>
          <div className="nav-links">
            <a href="#brand">Brand</a>
            <a href="#system">System</a>
            <a href="#experience">Experience</a>
            <a href="#memory">Memory</a>
            <a href="#phase-01">Phase 01</a>
            <a href="#buy" className="nav-buy-link">Buy</a>
            <ClerkLoading><Link href="/login">Account</Link></ClerkLoading>
            <ClerkLoaded>
              <Show when="signed-in" fallback={<Link href="/login">Sign in</Link>}>
                <Link href="/account">Account</Link>
              </Show>
            </ClerkLoaded>
          </div>
          <div className="nav-actions">
            <div className="cart-trigger">
              <button
                className="cart-pill"
                type="button"
                onClick={() => setIsCartOpen(true)}
                aria-label={`Open cart with ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}
              >
                <span>Cart</span>
                <i>{cartCount}</i>
              </button>
              <div className="cart-peek" aria-hidden="true">
                <p className="micro-label">Cart preview</p>
                {cartLines.length === 0 ? (
                  <div className="cart-peek-empty">
                    <strong>No compositions selected.</strong>
                    <span>Hover reveals the cart. Click to open checkout.</span>
                  </div>
                ) : (
                  <>
                    <div className="cart-peek-lines">
                      {cartLines.slice(0, 2).map(({ product, quantity }) => (
                        <div key={product.id}>
                          <span>{quantity} x {product.phase}</span>
                          <strong>{product.name}</strong>
                          <em>{product.concept}</em>
                        </div>
                      ))}
                    </div>
                    <span className="cart-peek-total">
                      {cartCount} {cartCount === 1 ? 'artifact' : 'artifacts'} staged for checkout
                    </span>
                  </>
                )}
              </div>
            </div>
            <button
              className="sound-pill"
              type="button"
              disabled
              title="Ambient sound asset pending"
              aria-label="Ambient sound pending"
            >
              Sound
            </button>
            <div className="time-hud">
              <span>Scroll controls time</span>
              <i />
            </div>
          </div>
        </nav>

        <div className="story-rail">
          <article className="story-panel hero-panel entry-panel" data-reveal>
            <div className="entry-field" aria-hidden="true">
              <span>emotion</span>
              <span>experience</span>
              <span>memory</span>
            </div>
            <p className="micro-label">3V-L0V3 / ENTRY</p>
            <h1>
              3 Versions
              <span>of Love</span>
            </h1>
            <p className="hero-copy">
              A system that engineers emotional memory through evolving experiences.
            </p>
            <a className="cinema-button" href="#system">
              <span>Begin the system</span>
              <i>↓</i>
            </a>
          </article>

          {systemScenes.map((scene) => (
            <article
              key={scene.id}
              id={scene.id}
              className={`story-panel system-scene scene-${scene.mood}`}
              data-reveal
            >
              <div className="scene-index">{scene.index}</div>
              <div className="copy-block">
                <p className="micro-label">{scene.eyebrow}</p>
                <h2>{scene.title}</h2>
                <p>{scene.body}</p>
              </div>
              <div className="scene-field" aria-hidden="true">
                {scene.fragments.map((fragment, index) => (
                  <span key={fragment} style={{ '--fragment-index': index } as CSSProperties}>
                    {fragment}
                  </span>
                ))}
                <i />
              </div>
            </article>
          ))}

          <article className="story-panel transition-panel sync-panel" data-reveal>
            <div className="transition-copy">
              <p className="micro-label">TRANSITION / ALIGNMENT</p>
              <h2>The signal begins to align.</h2>
              <p>Particles slow. Reflections sharpen. The system stops feeling abstract and starts becoming structure.</p>
            </div>
          </article>

          <article className="story-panel transition-panel fade-panel" data-reveal>
            <div className="transition-copy">
              <p className="micro-label">MEMORY / COLLAPSE</p>
              <h2>What disappears becomes the imprint.</h2>
              <p>The dream thins out. The abstract field condenses into a physical signal.</p>
            </div>
          </article>

          <article id="phase-01" className="story-panel phase-one-panel" data-reveal>
            <p className="micro-label">MEMORY → PRODUCT</p>
            <h2>
              <span>PHASE_01</span>
              THE DANCE OF DIFFUSION
            </h2>
            <p>
              The system becomes tangible: a fragrance built to move through emotion,
              experience, and memory before it ever becomes a product.
            </p>
            <div className="phase-one-codes" aria-label="Phase 01 interaction sequence">
              {philosophyInteractions.map((item) => (
                <div key={item.code}>
                  <span>{item.code}</span>
                  <strong>{item.label}</strong>
                  <small>{item.copy}</small>
                </div>
              ))}
            </div>
          </article>

          <article
            id="artifact-theater"
            className="story-panel artifact-theater-panel"
            data-reveal
            style={{ '--accent-rgb': featuredProduct.accent } as CSSProperties}
          >
            <div className="artifact-theater-heading">
              <p className="micro-label">PHASE_01 / CLOSER LOOK</p>
              <h2>The first artifact.</h2>
              <p>
                One composition holds the system. The image stays physical,
                clear, and cinematic.
              </p>
            </div>

            <div className="artifact-screen" aria-label={`${featuredProduct.name} artifact preview`}>
              <div className="artifact-screen-chrome" aria-hidden="true">
                <span>single artifact</span>
                <i />
                <span>{featuredProduct.phase}</span>
              </div>
              <div className="artifact-image-stage">
                <Image src={BOTTLE_SCENE_SRC} alt="" aria-hidden="true" fill sizes="(max-width: 900px) 100vw, 86vw" />
              </div>
              <div className="artifact-spec">
                <p>{featuredProduct.phase} / {featuredProduct.concept}</p>
                <h3>{featuredProduct.name}</h3>
                <span>{featuredProduct.quote}</span>
                <div className="artifact-note-row">
                  {featuredProduct.notes.map((note) => <em key={note}>{note}</em>)}
                </div>
                <button
                  className="cart-add-button artifact-add-button"
                  type="button"
                  onClick={() => addProductToCart(featuredProduct.id)}
                  disabled={featuredProduct.availableStock <= 0}
                >
                  <span>{featuredProduct.availableStock > 0 ? `${formatGbp(featuredProduct.priceGbpPence)} · Add to cart` : 'Currently unavailable'}</span>
                  <i>+</i>
                </button>
              </div>
            </div>

            <div className="artifact-controls single-artifact-controls" aria-label="Artifact details">
              <div className="artifact-proof">
                <span>{featuredProduct.volume}</span>
                <strong>{featuredProduct.stockLabel}</strong>
              </div>
              <a className="quiet-link" href="#compositions">Enter compositions</a>
            </div>
          </article>

          <article className="story-panel orchestration-panel philosophy-panel" data-reveal>
            <div className="copy-block">
              <p className="micro-label">PHASE_01 / FRAGRANCE PHILOSOPHY</p>
              <h2>The fragrance works in three interactions.</h2>
              <p>
                Like a conductor shaping sound, each layer is placed with intention,
                sequence, and emotional weight.
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

          <article id="compositions" className="story-panel product-panel" data-reveal>
            <div className="product-heading">
              <p className="micro-label">PHASE_01 / SINGLE PRODUCT</p>
              <h2>The first physical outcome.</h2>
              <p>
                Each active composition is priced from the live catalog and checked
                against available inventory before Stripe opens.
              </p>
            </div>
            <div className="product-grid product-grid-single">
              {activeProducts.map((product) => (
                <article
                  key={product.id}
                  className="scent-card"
                  style={{ '--accent-rgb': product.accent } as CSSProperties}
                >
                  <div id="buy" className="product-buy-plate" aria-label={`${product.name} purchase`}>
                    <span>Now available</span>
                    <strong>{product.name} / {product.volume} / {formatGbp(product.priceGbpPence)}</strong>
                    <button
                      className="cart-add-button product-add-button"
                      type="button"
                      onClick={() => addProductToCart(product.id)}
                      disabled={product.availableStock <= 0}
                    >
                      <span>{product.availableStock > 0 ? 'Add to cart' : 'Unavailable'}</span>
                      <i>+</i>
                    </button>
                  </div>
                  <div className="scent-content">
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
                  </div>
                </article>
              ))}
            </div>
          </article>

          <article id="enter" className="story-panel final-panel" data-reveal>
            <p className="micro-label">FINAL / ENTER PHASE_01</p>
            <h2>
              Now enter
              <span>the artifact.</span>
            </h2>
            <p>The system has become scent.</p>
            <div className="final-actions">
              <button className="cinema-button" type="button" onClick={() => setIsCartOpen(true)}>
                <span>Open cart</span>
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
        ref={cartDrawerRef}
        className={`cart-drawer ${isCartOpen ? 'is-open' : ''}`}
        aria-hidden={!isCartOpen}
        aria-label="Checkout cart"
        aria-modal="true"
        role="dialog"
        inert={!isCartOpen ? true : undefined}
      >
        <div className="cart-drawer-shell">
          <header className="cart-header">
            <div>
              <p className="micro-label">Secure checkout</p>
              <h2>Cart</h2>
            </div>
            <button ref={cartCloseRef} className="cart-close" type="button" onClick={() => setIsCartOpen(false)} aria-label="Close cart">
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
                      <strong className="cart-line-price">{formatGbp(product.priceGbpPence * quantity)}</strong>
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

                <div className="checkout-panel">
                  <div className="checkout-summary">
                    <p className="micro-label">Stripe checkout</p>
                    <h3>Secure payment with Stripe.</h3>
                    <p>
                      We validate current pricing and reserve inventory before sending
                      you to Stripe&apos;s hosted checkout. Card details never touch our server.
                    </p>
                    <div className="checkout-count">
                      <span>Items</span>
                      <strong>{cartCount}</strong>
                    </div>
                    <div className="checkout-count checkout-total">
                      <span>Subtotal</span>
                      <strong>{formatGbp(cartSubtotal)}</strong>
                    </div>
                    <button className="stripe-button" type="button" onClick={startCheckout} disabled={checkoutState.isLoading}>
                      {checkoutState.isLoading ? 'Preparing secure checkout…' : 'Pay securely with Stripe'}
                    </button>
                    {checkoutState.error && (
                      <p className="quote-confirmation" role="alert">{checkoutState.error}</p>
                    )}
                  </div>

                  <div className="shipping-note">
                    <span>UK delivery</span>
                    <p>Shipping and any configured taxes are shown for review in Stripe before payment.</p>
                  </div>

                  <label className="checkout-note">
                    <span>Order note <em>optional</em></span>
                    <textarea
                      value={checkoutNote}
                      onChange={(event) => setCheckoutNote(event.target.value)}
                      maxLength={500}
                      rows={3}
                      placeholder="Delivery instructions or a short note"
                    />
                    <small>{checkoutNote.length}/500</small>
                  </label>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>
    </main>
  )
}
