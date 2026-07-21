import type { NextConfig } from 'next'

const securityHeaders = [
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
