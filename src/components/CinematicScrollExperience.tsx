'use client'

import type { CSSProperties } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ClerkLoaded, ClerkLoading, Show } from '@clerk/nextjs'
import { BOTTLE_SCENE_SRC, products as fallbackProducts } from '@/lib/products'
import type { Product } from '@/lib/products'
import { formatGbp } from '@/lib/backend/format'
import EnvironmentPanel from '@/components/EnvironmentPanel'

const SCRUB_VIDEO_DESKTOP_SRC = '/assets/rotation/3love-rotation-scrub-1080p-v1.mp4'
const SCRUB_VIDEO_MOBILE_SRC = '/assets/rotation/3love-rotation-scrub-720p-v1.mp4'
const POSTER_SRC = '/assets/rotation/3love-rotation-cosmic-drift-4k-poster.jpg'
const CART_STORAGE_KEY = '3love-cart-v1'
/** Every refresh holds on the intro before the site is revealed. */
const INTRO_DURATION_MS = 6000
const SCRUB_FRAME_RATE = 24
const SCRUB_FRAME_INTERVAL_MS = 1000 / SCRUB_FRAME_RATE
const SCRUB_FRAME_EPSILON = 1 / (SCRUB_FRAME_RATE * 2)

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

/** Blank scroll panels between the entry and Phase 01. Three carry the ids the
 *  navigation links to, so those anchors still land in the right place. */
const filmSpacers: Array<string | null> = [
  'system',
  'emotion',
  'experience',
  'memory',
  null,
  null,
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
  const serverCartReadRef = useRef(false)
  const isInitialCartSyncRef = useRef(true)
  const [isReady, setIsReady] = useState(false)
  const [introComplete, setIntroComplete] = useState(false)
  const [introHoldMs, setIntroHoldMs] = useState(INTRO_DURATION_MS)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
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

  // The intro gate holds for a fixed beat on every load, and locks the page
  // behind it so the site is not scrolled while it is still covered.
  useEffect(() => {
    // Measured from navigation start, not from mount, so the hold is the same
    // length whatever hydration cost — and never compounds on a slow load.
    const elapsed = performance.now()
    const remaining = Math.max(INTRO_DURATION_MS - elapsed, 0)
    setIntroHoldMs(remaining)
    const timer = window.setTimeout(() => setIntroComplete(true), remaining)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (introComplete) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [introComplete])

  // Escape closes the mobile menu, matching the cart drawer.
  useEffect(() => {
    if (!isMenuOpen) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMenuOpen(false)
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [isMenuOpen])

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
        // Only once the server cart has actually been read is it safe to write
        // back over it. Otherwise a failed read would persist an empty local
        // cart and destroy what the customer had saved.
        serverCartReadRef.current = true
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

    // Never write back a cart we could not first read — see serverCartReadRef.
    if (!serverCartReadRef.current) return

    // The first pass after loading is the state we just synced, so writing it
    // back would only put an empty cart on the server for every visitor.
    if (isInitialCartSyncRef.current) {
      isInitialCartSyncRef.current = false
      return
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
    const focusFrame = requestAnimationFrame(() => cartCloseRef.current?.focus())

    // The skip link is rendered by the layout, outside the sections marked
    // inert above, so it would otherwise stay tabbable from inside the dialog.
    const skipLink = document.querySelector('.skip-link')
    skipLink?.setAttribute('inert', '')

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
      cancelAnimationFrame(focusFrame)
      skipLink?.removeAttribute('inert')
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [isCartOpen])

  useEffect(() => {
    const section = sectionRef.current
    const video = videoRef.current
    if (!section || !video) return

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
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight
      const range = Math.max(rect.height - viewportHeight, 1)
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
        seekTo(videoTimeForProgress(state.current, duration), now, forceVideo)
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
      state.current = state.target
      if (timeSinceInput > 96) state.velocity = 0
      writeFrame(now, timeSinceInput > 96)

      if (timeSinceInput > 96) {
        freeze(now)
        return
      }

      rafRef.current = requestAnimationFrame(render)
    }

    const startLoop = () => {
      if (rafRef.current === null) {
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
      seekTo(queuedTime, performance.now(), true)
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
    window.visualViewport?.addEventListener('resize', onResize, { passive: true })
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
      window.visualViewport?.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onWake)
      reduceMotion.removeEventListener('change', onMotionPreferenceChange)
      revealObserver.disconnect()
      window.clearTimeout(hashTimer)
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <main id="main-content" className="cinematic-site">
      <div
        className={`intro-gate ${introComplete ? 'is-complete' : ''}`}
        style={{ '--intro-duration': `${introHoldMs}ms` } as CSSProperties}
        role="status"
        aria-live="polite"
      >
        <div className="intro-gate-inner">
          <Image src="/logo.jpg" alt="" width={132} height={54} priority />
          <p className="micro-label">3V-L0V3 / SYSTEM ENGAGED</p>
          <div className="intro-progress" aria-hidden="true"><span /></div>
          <p className="intro-status">Initializing memory system</p>
        </div>
      </div>

      <section id="brand" className="brand-gateway" aria-label="3love brand philosophy" data-reveal inert={isCartOpen ? true : undefined}>
        <div className="brand-cosmos" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="brand-gateway-copy">
          <p className="micro-label">3V-L0V3 / SYSTEM ENGAGED</p>
          <h1>A fragrance house for emotional memory.</h1>
          <p>
            Emotion becomes experience. Experience becomes memory.
          </p>
          <div className="brand-gateway-actions">
            <a className="quiet-link" href="#phase-01">View Phase 01</a>
          </div>
        </div>
        <div className="brand-principles" aria-label="3love brand framework">
          <article>
            <span>01</span>
            <strong>Emotion</strong>
            <p>
              Begins somewhere within us.<br />
              Long before we understand why.<br />
              Some feelings find their words. Others never need to.
            </p>
          </article>
          <article>
            <span>02</span>
            <strong>Experience</strong>
            <p>
              We pass through life as it passes through us.<br />
              Every encounter leaves something behind.<br />
              We are never quite who we were before.
            </p>
          </article>
          <article>
            <span>03</span>
            <strong>Memory</strong>
            <p>
              Some moments pass. Some stay with us.<br />
              Time changes the details, but rarely the feeling.<br />
              Perhaps remembering is simply how we carry what remains.
            </p>
          </article>
        </div>
      </section>

      <section ref={sectionRef} id="hero" className="film-scroll" aria-label="3love cinematic scroll experience" inert={isCartOpen ? true : undefined}>
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
          <div className="film-pulse" />
          <div className="film-sheen" />
          <div className="film-particles film-particles-dust" />
          <div className="film-particles film-particles-stars" />
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

        <nav className={`cinema-nav ${isMenuOpen ? 'is-menu-open' : ''}`} aria-label="Primary navigation">
          <a href="#brand" className="brand-lockup" aria-label="3love home">
            <Image src="/logo.jpg" alt="3love" width={92} height={38} priority />
          </a>
          <button
            className="nav-menu-toggle"
            type="button"
            aria-expanded={isMenuOpen}
            aria-controls="primary-nav-links"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            <span />
            <span />
          </button>
          <div id="primary-nav-links" className="nav-links" onClick={() => setIsMenuOpen(false)}>
            <a href="#brand">Brand</a>
            <a href="#system">System</a>
            <a href="#experience">Experience</a>
            <a href="#memory">Memory</a>
            <a href="#phase-01">Phase 01</a>
            <a href="#buy" className="nav-buy-link">Buy</a>
            <ClerkLoading><Link href="/login">Sign in</Link></ClerkLoading>
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
            <div className="time-hud">
              <span>Scroll controls time</span>
              <i />
            </div>
          </div>
        </nav>

        <div className="story-rail">
          <article className="story-panel hero-panel entry-panel" data-reveal>
            <p className="micro-label">3V-L0V3 / ENTRY</p>
            <h2>
              3 Versions
              <span>of Love</span>
            </h2>
            <p className="hero-copy">
              A system that engineers emotional memory through evolving experiences.
            </p>
            <a className="cinema-button" href="#system">
              <span>Begin the system</span>
              <i>↓</i>
            </a>
          </article>

          {/* The film runs uninterrupted through here: empty viewport-heights so the
              bottle rotates on its own as you scroll. The ids are kept so the nav
              anchors and the hero's "Begin the system" link still land. */}
          {filmSpacers.map((id, index) => (
            <div
              key={id ?? `film-spacer-${index}`}
              id={id ?? undefined}
              className="story-spacer"
              aria-hidden="true"
            />
          ))}

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
                Three compositions share one vessel. The image stays physical,
                clear, and cinematic.
              </p>
            </div>

            <div className="artifact-screen" aria-label={`${featuredProduct.name} artifact preview`}>
              <div className="artifact-screen-chrome" aria-hidden="true">
                <span>the vessel</span>
                <i />
                <span>{featuredProduct.phase}</span>
              </div>
              <div className="artifact-image-stage">
                {/* Unoptimized on purpose: this is the same file the video
                    poster and the gateway background already load, so serving
                    it raw reuses that download instead of fetching a second,
                    re-encoded copy at up to 3840px wide. */}
                <Image src={BOTTLE_SCENE_SRC} alt="" aria-hidden="true" fill sizes="(max-width: 900px) 100vw, 86vw" unoptimized />
              </div>
              <div className="artifact-spec">
                <p>{featuredProduct.phase} / Three compositions</p>
                <h3>One vessel.</h3>
                <span>Every composition arrives in the same form. What changes is the world it came from.</span>
                <div className="artifact-note-row">
                  {activeProducts.map((product) => <em key={product.id}>{product.name}</em>)}
                </div>
                <a className="cinema-button artifact-add-button" href="#compositions">
                  <span>Choose your environment</span>
                  <i>↗</i>
                </a>
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
              {noteStack.map((note) => (
                <div key={note.tier} className="note-line">
                  <div>
                    <p>{note.tier} <small>{note.label}</small></p>
                    <strong>{note.copy}</strong>
                    <em>{note.examples}</em>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <EnvironmentPanel products={activeProducts} onAddToCart={addProductToCart} />

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
