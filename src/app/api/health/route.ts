import { NextResponse } from 'next/server'
import { getDb } from '@/lib/backend/db'
import { backendEnv, configurationIssues, isClerkConfigured, isMongoConfigured, isStripeConfigured } from '@/lib/backend/env'

export const dynamic = 'force-dynamic'

export async function GET() {
  const startedAt = Date.now()
  const issues = configurationIssues()
  let database = false

  if (isMongoConfigured()) {
    try {
      await (await getDb()).command({ ping: 1 })
      database = true
    } catch (error) {
      console.error('Health check database ping failed.', error)
    }
  }

  const healthy = database && issues.length === 0
  return NextResponse.json({
    status: healthy ? 'ok' : 'degraded',
    services: {
      database,
      clerk: isClerkConfigured() && Boolean(backendEnv.clerkWebhookSigningSecret),
      stripe: isStripeConfigured(),
    },
    configuration: issues.length === 0 ? 'complete' : 'incomplete',
    responseTimeMs: Date.now() - startedAt,
  }, {
    status: healthy ? 200 : 503,
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  })
}
