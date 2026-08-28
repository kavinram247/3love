import { SignIn } from '@clerk/nextjs'
import Link from 'next/link'

function safeRedirect(value?: string) {
  return value?.startsWith('/') && !value.startsWith('//') ? value : '/account'
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string; redirectTo?: string }>
}) {
  const params = await searchParams
  const redirectUrl = safeRedirect(params.redirect_url ?? params.redirectTo)

  return (
    <main id="main-content" className="commerce-shell auth-shell">
      <section className="commerce-panel auth-panel clerk-auth-panel">
        <p className="micro-label">3LOVE / CUSTOMER ACCESS</p>
        <div className="clerk-auth-intro">
          <h1>Welcome back</h1>
          <p>Enter your account for checkout, order history, and saved addresses.</p>
        </div>
        <SignIn
          oauthFlow="redirect"
          fallback={<div className="clerk-auth-loading" role="status"><span />Loading secure sign-in…</div>}
          fallbackRedirectUrl={redirectUrl}
          signUpFallbackRedirectUrl={redirectUrl}
          signUpUrl="/create-account"
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
