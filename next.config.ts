import type { NextConfig } from 'next'

/**
 * Content-Security-Policy, deliberately Report-Only for now.
 *
 * It cannot break Clerk, Stripe or Google Fonts in this mode — violations are
 * only reported to the console. Watch the console on the storefront, the auth
 * pages and a full Stripe checkout; once it stays quiet, rename the header to
 * `Content-Security-Policy` to enforce it.
 *
 * 'unsafe-eval' is required by the Next.js dev server only, so it is dropped
 * from production builds below.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'production' ? '' : " 'unsafe-eval'"} https://*.clerk.accounts.dev https://*.clerk.com https://js.stripe.com https://challenges.cloudflare.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://img.clerk.com https://*.clerk.com",
  "media-src 'self' blob:",
  "connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://api.stripe.com",
  "frame-src https://js.stripe.com https://hooks.stripe.com https://challenges.cloudflare.com",
  "worker-src 'self' blob:",
  "form-action 'self' https://checkout.stripe.com",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy-Report-Only', value: contentSecurityPolicy },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(self)' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  ...(process.env.NODE_ENV === 'production'
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]
    : []),
]

const immutableVideoHeaders = [
  { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
]

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  async headers() {
    return [
      {
        source: '/assets/rotation/3love-rotation-scrub-1080p-v1.mp4',
        headers: immutableVideoHeaders,
      },
      {
        source: '/assets/rotation/3love-rotation-scrub-720p-v1.mp4',
        headers: immutableVideoHeaders,
      },
      { source: '/(.*)', headers: securityHeaders },
    ]
  },
}

export default nextConfig
