'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Application route failed.', error)
  }, [error])

  return (
    <main id="main-content" className="commerce-shell auth-shell">
      <section className="commerce-panel auth-panel">
        <p className="micro-label">CONNECTION INTERRUPTED</p>
        <h1>We couldn&apos;t load this page</h1>
        <p>Try the request again. If it keeps failing, return to the storefront and continue from there.</p>
        <div className="commerce-actions">
          <button className="cinema-button" type="button" onClick={reset}><span>Try again</span><i>↗</i></button>
          <Link className="quiet-link" href="/">Return home</Link>
        </div>
      </section>
    </main>
  )
}
