import 'server-only'

const read = (key: string) => process.env[key]?.trim() ?? ''

function readNonNegativeInteger(key: string, fallback: number) {
  const raw = read(key)
  if (!raw) return fallback
  const value = Number(raw)
  return Number.isSafeInteger(value) && value >= 0 ? value : fallback
}

function readBoolean(key: string, fallback = false) {
  const raw = read(key).toLowerCase()
  if (!raw) return fallback
  return raw === 'true' || raw === '1' || raw === 'yes'
}

function normalizeSiteUrl(value: string) {
  return value.replace(/\/+$/, '')
}

export const backendEnv = {
  mongoUri: read('MONGODB_URI'),
  mongoDbName: read('MONGODB_DB_NAME') || '3love',
  siteUrl: normalizeSiteUrl(read('NEXT_PUBLIC_SITE_URL') || 'http://localhost:3000'),
  clerkPublishableKey: read('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'),
  clerkSecretKey: read('CLERK_SECRET_KEY'),
  clerkWebhookSigningSecret: read('CLERK_WEBHOOK_SIGNING_SECRET'),
  rateLimitSecret: read('RATE_LIMIT_SECRET'),
  adminEmails: read('ADMIN_EMAILS')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
  stripeSecretKey: read('STRIPE_SECRET_KEY'),
  stripeWebhookSecret: read('STRIPE_WEBHOOK_SECRET'),
  stripeAutomaticTaxEnabled: readBoolean('STRIPE_AUTOMATIC_TAX_ENABLED'),
  stripeShippingRateId: read('STRIPE_SHIPPING_RATE_ID'),
  shippingGbpPence: readNonNegativeInteger('SHIPPING_GBP_PENCE', 0),
}

/**
 * The site URL builds Stripe's success_url and cancel_url. In production a
 * missing NEXT_PUBLIC_SITE_URL would silently fall back to localhost and send
 * paying customers nowhere, so refuse to build checkout URLs from it instead.
 */
export function requireSiteUrl() {
  const value = backendEnv.siteUrl
  if (process.env.NODE_ENV === 'production' && !value.startsWith('https://')) {
    throw new Error(
      'NEXT_PUBLIC_SITE_URL must be set to the public https:// origin in production.',
    )
  }
  return value
}

export function requireBackendEnv(key: keyof typeof backendEnv) {
  const value = backendEnv[key]
  if (!value) throw new Error(`Missing required environment variable for ${key}`)
  return value
}

export function isMongoConfigured() {
  return Boolean(backendEnv.mongoUri)
}

export function isStripeConfigured() {
  return Boolean(backendEnv.stripeSecretKey)
}

export function isClerkConfigured() {
  return Boolean(backendEnv.clerkPublishableKey && backendEnv.clerkSecretKey)
}

export function configurationIssues() {
  const issues: string[] = []
  if (!backendEnv.mongoUri) issues.push('MONGODB_URI')
  if (!backendEnv.clerkPublishableKey) issues.push('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY')
  if (!backendEnv.clerkSecretKey) issues.push('CLERK_SECRET_KEY')
  if (!backendEnv.clerkWebhookSigningSecret) issues.push('CLERK_WEBHOOK_SIGNING_SECRET')
  if (backendEnv.rateLimitSecret.length < 32) issues.push('RATE_LIMIT_SECRET (minimum 32 characters)')
  if (!backendEnv.stripeSecretKey) issues.push('STRIPE_SECRET_KEY')
  if (!backendEnv.stripeWebhookSecret) issues.push('STRIPE_WEBHOOK_SECRET')
  if (backendEnv.adminEmails.length === 0) issues.push('ADMIN_EMAILS')
  if (!backendEnv.siteUrl.startsWith('https://') && process.env.NODE_ENV === 'production') {
    issues.push('NEXT_PUBLIC_SITE_URL (must use HTTPS in production)')
  }
  return issues
}
