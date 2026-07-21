import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/account', '/admin', '/api', '/login', '/create-account', '/forgot-password', '/reset-password', '/__clerk'],
    },
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, '') || 'http://localhost:3000'}/sitemap.xml`,
  }
}
