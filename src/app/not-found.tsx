import Link from 'next/link'

export default function NotFound() {
  return (
    <main id="main-content" className="commerce-shell auth-shell">
      <section className="commerce-panel auth-panel not-found-panel">
        <p className="micro-label">404 / SIGNAL LOST</p>
        <h1>Page not found</h1>
        <p>The address does not point to an active part of the 3love experience.</p>
        <div className="commerce-actions">
          <Link className="cinema-button" href="/"><span>Return home</span><i>↗</i></Link>
          <Link className="quiet-link" href="/account">Open account</Link>
        </div>
      </section>
    </main>
  )
}
