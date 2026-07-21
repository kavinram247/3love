import { NextResponse } from 'next/server'
import { createCheckoutSession, checkoutPayloadSchema, releaseExpiredReservations } from '@/lib/backend/checkout'
import { getServerUser } from '@/lib/backend/auth'
import { isClerkConfigured, isMongoConfigured, isStripeConfigured } from '@/lib/backend/env'
import { errorResponse, readJsonBody } from '@/lib/backend/http'
import { enforceRateLimit } from '@/lib/backend/rate-limit'

export async function POST(request: Request) {
  if (!isMongoConfigured() || !isClerkConfigured() || !isStripeConfigured()) {
    return NextResponse.json(
      { error: 'Checkout is not configured yet. Add MongoDB, Clerk, and Stripe environment variables.' },
      { status: 503 },
    )
  }

  const user = await getServerUser()
  if (!user) {
    return NextResponse.json(
      { error: 'Login is required before checkout.', loginUrl: '/login?redirect_url=/%23buy' },
      { status: 401 },
    )
  }
  if (!user.emailVerified) {
    return NextResponse.json({ error: 'Verify your account email before checkout.' }, { status: 403 })
  }

  try {
    const parsed = checkoutPayloadSchema.safeParse(await readJsonBody(request))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Checkout payload is invalid.' }, { status: 400 })
    }
    await enforceRateLimit({
      scope: 'checkout',
      identity: user.id,
      limit: 12,
      windowSeconds: 15 * 60,
    })
    await releaseExpiredReservations().catch((error) => {
      console.error('Expired inventory reservations could not be released.', error)
    })
    const session = await createCheckoutSession(user, parsed.data)

    return NextResponse.json({ url: session.url })
  } catch (error) {
    return errorResponse(error, 'Checkout could not be started.')
  }
}
