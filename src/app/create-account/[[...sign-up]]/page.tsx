import { SignUp } from '@clerk/nextjs'
import Link from 'next/link'

function safeRedirect(value?: string) {
  return value?.startsWith('/') && !value.startsWith('//') ? value : '/account'
}

export default async function CreateAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string }>
}) {
  const params = await searchParams
  const redirectUrl = safeRedirect(params.redirect_url)

  return (
    <main id="main-content" className="commerce-shell auth-shell">
      <section className="commerce-panel auth-panel clerk-auth-panel">
        <p className="micro-label">3LOVE / CREATE ACCOUNT</p>
        <div className="clerk-auth-intro">
          <h1>Begin your account</h1>
          <p>Save addresses, track orders, and enter secure Stripe Checkout faster.</p>
        </div>
        <SignUp
          oauthFlow="redirect"
          fallback={<div className="clerk-auth-loading" role="status"><span />Loading secure account creation…</div>}
          fallbackRedirectUrl={redirectUrl}
          signInFallbackRedirectUrl={redirectUrl}
          signInUrl="/login"
          appearance={{
            elements: {
              rootBox: 'clerk-auth-root',
              cardBox: 'clerk-auth-card-box',
              card: 'clerk-auth-card',
              // The page already carries its own heading above the widget.
              header: 'clerk-auth-hidden-header',
            },
          }}
        />
        <div className="commerce-links clerk-auth-links">
          <Link href="/">Return to experience</Link>
        </div>
      </section>
    </main>
  )
}
