'use client'

import type { CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'
import { formatGbp } from '@/lib/backend/format'
import { getFragranceProfile } from '@/lib/fragranceProfiles'
import type { Product } from '@/lib/products'

type EnvironmentPanelProps = {
  products: Product[]
  onAddToCart: (productId: string) => void
}

export default function EnvironmentPanel({ products, onAddToCart }: EnvironmentPanelProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const addButtonRef = useRef<HTMLButtonElement | null>(null)

  const hasActive = products.some((product) => product.id === activeId)

  // Leaving an environment is always available from the keyboard.
  useEffect(() => {
    if (!hasActive) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveId(null)
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [hasActive])

  // Entering an environment moves focus to the action it reveals.
  useEffect(() => {
    if (!hasActive) return
    const frame = requestAnimationFrame(() => addButtonRef.current?.focus())
    return () => cancelAnimationFrame(frame)
  }, [hasActive, activeId])

  return (
    <article id="compositions" className="story-panel environment-panel-section" data-reveal>
      <div className="environment-heading">
        <p className="micro-label">PHASE_01 / THE ENVIRONMENTS</p>
        <h2>Three worlds. Three compositions.</h2>
        <p>
          Each fragrance was built inside a place. Enter one to meet the
          composition that lives there.
        </p>
      </div>

      {/* #buy is the nav target and Stripe's cancel_url destination. */}
      <div id="buy" className="environment-rail" role="group" aria-label="Fragrance environments">
        {products.map((product) => {
          const isActive = product.id === activeId
          const isDimmed = hasActive && !isActive
          const soldOut = product.availableStock <= 0
          const profile = getFragranceProfile(product.slug)

          return (
            <section
              key={product.id}
              className={`environment-card ${isActive ? 'is-active' : ''} ${isDimmed ? 'is-dimmed' : ''}`}
              data-env={product.slug}
              aria-label={product.name}
              style={{ '--accent-rgb': product.accent } as CSSProperties}
            >
              {/* The photograph layers over a per-environment gradient, so the
                  panel still reads correctly before the art is in place. */}
              <div
                className="environment-art"
                style={{ backgroundImage: `url("${product.sceneSrc}")` }}
                aria-hidden="true"
              />
              <div className="environment-veil" aria-hidden="true" />

              <div className="environment-body">
                <p className="micro-label">{product.concept}</p>
                <h3>
                  {product.name}
                  {profile?.timeMark ? <span className="environment-timemark"> — {profile.timeMark}</span> : null}
                </h3>
                {profile ? <p className="environment-concentration">{profile.concentration}</p> : null}
                {!isActive ? <p className="environment-quote">{product.quote}</p> : null}

                {isActive ? (
                  <div className="environment-detail">
                    {profile ? (
                      <div className="environment-copy">
                        <p className="environment-lede">{profile.lede}</p>
                        <p>{profile.body}</p>
                        <p>
                          {profile.composition.map((segment, index) => (
                            segment.strong
                              ? <strong key={index}>{segment.text}</strong>
                              : <span key={index}>{segment.text}</span>
                          ))}
                        </p>
                        <p className="environment-collaboration">{profile.collaboration}</p>
                      </div>
                    ) : null}

                    <p className="micro-label environment-notes-label">Notes</p>
                    <div className="environment-notes">
                      {(profile?.notes ?? product.notes).map((note) => <em key={note}>{note}</em>)}
                    </div>

                    {profile ? <p className="environment-signature">{profile.signature}</p> : null}

                    <div className="environment-meta">
                      <span>{product.volume}</span>
                      <strong>{formatGbp(product.priceGbpPence)}</strong>
                    </div>
                    <button
                      ref={addButtonRef}
                      className="cart-add-button environment-add-button"
                      type="button"
                      onClick={() => onAddToCart(product.id)}
                      disabled={soldOut}
                    >
                      <span>{soldOut ? 'Currently unavailable' : 'Add to cart'}</span>
                      <i>+</i>
                    </button>
                    <button
                      className="quiet-link environment-leave"
                      type="button"
                      onClick={() => setActiveId(null)}
                    >
                      Leave this environment
                    </button>
                  </div>
                ) : (
                  <button
                    className="environment-enter"
                    type="button"
                    onClick={() => setActiveId(product.id)}
                  >
                    <span>Enter {product.name}</span>
                    <i>↗</i>
                  </button>
                )}
              </div>
            </section>
          )
        })}
      </div>
    </article>
  )
}
