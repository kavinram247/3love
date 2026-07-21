import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import type Stripe from 'stripe'
import { collections } from '@/lib/backend/db'
import { backendEnv, isMongoConfigured, isStripeConfigured } from '@/lib/backend/env'
import { getStripe } from '@/lib/backend/stripe'
import { markOrderPaid, releaseOrderReservations } from '@/lib/backend/checkout'

export const dynamic = 'force-dynamic'

function readShipping(session: Stripe.Checkout.Session) {
  const customer = session.customer_details
  const shipping = session.collected_information?.shipping_details
  const address = shipping?.address ?? customer?.address

  return {
    shippingName: shipping?.name ?? customer?.name ?? null,
    shippingLine1: address?.line1 ?? null,
    shippingLine2: address?.line2 ?? null,
    shippingCity: address?.city ?? null,
    shippingCounty: address?.state ?? null,
    shippingPostcode: address?.postal_code ?? null,
    shippingCountryCode: 'GB' as const,
    phone: customer?.phone ?? null,
    email: customer?.email ?? session.customer_email ?? null,
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId
  if (!orderId || !ObjectId.isValid(orderId) || session.client_reference_id !== orderId) {
    throw new Error('Stripe session is missing valid order metadata.')
  }

  const db = await collections()
  const order = await db.orders.findOne({ _id: new ObjectId(orderId), stripeSessionId: session.id })
  if (!order) throw new Error('Stripe session did not match an order.')
  if (!session.metadata?.clerkUserId || session.metadata.clerkUserId !== order.userId) {
    throw new Error('Stripe session customer metadata did not match the order owner.')
  }
  const stripeCustomerId = typeof session.customer === 'string' ? session.customer : session.customer?.id
  if (order.stripeCustomerId && stripeCustomerId !== order.stripeCustomerId) {
    throw new Error('Stripe session customer did not match the order customer.')
  }

  const shipping = readShipping(session)
  const updates: Record<string, string | null | Date> = {
    shippingName: shipping.shippingName,
    shippingLine1: shipping.shippingLine1,
    shippingLine2: shipping.shippingLine2,
    shippingCity: shipping.shippingCity,
    shippingCounty: shipping.shippingCounty,
    shippingPostcode: shipping.shippingPostcode,
    shippingCountryCode: shipping.shippingCountryCode,
    phone: shipping.phone,
    updatedAt: new Date(),
  }
  if (shipping.email) updates.email = shipping.email

  const updated = await db.orders.updateOne(
    { _id: new ObjectId(orderId), stripeSessionId: session.id },
    { $set: updates },
  )
  if (updated.matchedCount !== 1) throw new Error('Stripe session did not match a pending order.')

  await markOrderPaid(session)
}

async function handleCheckoutReleased(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId
  if (!orderId || !ObjectId.isValid(orderId)) throw new Error('Stripe session is missing valid order metadata.')
  const db = await collections()
  const order = await db.orders.findOne({ _id: new ObjectId(orderId), stripeSessionId: session.id })
  if (!order || session.metadata?.clerkUserId !== order.userId) {
    throw new Error('Stripe session did not match the pending order owner.')
  }
  await releaseOrderReservations(orderId)
}

async function handleRefund(refund: Stripe.Refund) {
  if (refund.status !== 'succeeded') return
  const paymentIntentId = typeof refund.payment_intent === 'string'
    ? refund.payment_intent
    : refund.payment_intent?.id
  const chargeId = typeof refund.charge === 'string' ? refund.charge : refund.charge?.id
  if (!paymentIntentId || !chargeId) {
    throw new Error('Stripe refund is missing its payment or charge reference.')
  }
  const orderId = refund.metadata?.orderId
  const db = await collections()
  const filter = orderId && ObjectId.isValid(orderId)
    ? { _id: new ObjectId(orderId), stripePaymentIntent: paymentIntentId }
    : { stripePaymentIntent: paymentIntentId }
  const order = await db.orders.findOne(filter)
  if (!order?._id) throw new Error('Stripe refund could not be matched to an order.')

  const charge = await getStripe().charges.retrieve(chargeId)
  const chargePaymentIntentId = typeof charge.payment_intent === 'string'
    ? charge.payment_intent
    : charge.payment_intent?.id
  if (chargePaymentIntentId !== paymentIntentId) {
    throw new Error('Stripe refund charge did not match the order payment.')
  }
  const status = charge.refunded || charge.amount_refunded >= charge.amount
    ? 'REFUNDED'
    : 'PARTIALLY_REFUNDED'
  const result = await db.orders.updateOne(
    { _id: order._id, stripePaymentIntent: paymentIntentId },
    {
      $set: {
        status,
        stripeRefundId: refund.id,
        refundedGbpPence: charge.amount_refunded,
        updatedAt: new Date(),
      },
    },
  )
  if (result.matchedCount !== 1) throw new Error('Stripe refund could not be matched to an order.')
}

async function processEvent(event: Stripe.Event) {
  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
    return
  }
  if (event.type === 'checkout.session.expired' || event.type === 'checkout.session.async_payment_failed') {
    await handleCheckoutReleased(event.data.object as Stripe.Checkout.Session)
    return
  }
  if (event.type === 'refund.updated') {
    await handleRefund(event.data.object as Stripe.Refund)
  }
}

async function claimEvent(event: Stripe.Event) {
  const db = await collections()
  const now = new Date()
  const eventObject = event.data.object as unknown as { id?: unknown }
  try {
    await db.paymentEvents.insertOne({
      stripeEventId: event.id,
      eventType: event.type,
      objectId: typeof eventObject.id === 'string' ? eventObject.id : null,
      status: 'PROCESSING',
      attemptCount: 1,
      lastError: null,
      createdAt: now,
      updatedAt: now,
      processedAt: null,
    })
    return 'CLAIMED' as const
  } catch (error) {
    if (!error || typeof error !== 'object' || !('code' in error) || error.code !== 11000) throw error
  }

  const existing = await db.paymentEvents.findOne({ stripeEventId: event.id })
  if (existing?.status === 'PROCESSED') return 'PROCESSED' as const
  const staleBefore = new Date(Date.now() - 5 * 60 * 1000)
  const reclaimed = await db.paymentEvents.updateOne(
    {
      stripeEventId: event.id,
      $or: [
        { status: 'FAILED' },
        { status: { $exists: false } },
        { status: 'PROCESSING', updatedAt: { $lte: staleBefore } },
      ],
    },
    {
      $set: { status: 'PROCESSING', lastError: null, updatedAt: now },
      $inc: { attemptCount: 1 },
    },
  )
  return reclaimed.modifiedCount === 1 ? 'CLAIMED' as const : 'PROCESSING' as const
}

export async function POST(request: Request) {
  if (!isMongoConfigured() || !isStripeConfigured() || !backendEnv.stripeWebhookSecret) {
    return NextResponse.json({ error: 'Stripe webhook is not configured.' }, { status: 503 })
  }

  const signature = request.headers.get('stripe-signature')
  if (!signature) return NextResponse.json({ error: 'Missing Stripe signature.' }, { status: 400 })

  const rawBody = await request.text()
  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, backendEnv.stripeWebhookSecret)
  } catch {
    return NextResponse.json({ error: 'Invalid Stripe signature.' }, { status: 400 })
  }

  const claim = await claimEvent(event)
  if (claim === 'PROCESSED') return NextResponse.json({ received: true, duplicate: true })
  if (claim === 'PROCESSING') {
    return NextResponse.json({ error: 'Event is already processing.' }, { status: 409 })
  }

  const db = await collections()
  try {
    await processEvent(event)
    await db.paymentEvents.updateOne(
      { stripeEventId: event.id, status: 'PROCESSING' },
      { $set: { status: 'PROCESSED', processedAt: new Date(), updatedAt: new Date(), lastError: null } },
    )
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error(`Stripe webhook ${event.id} failed.`, error)
    await db.paymentEvents.updateOne(
      { stripeEventId: event.id },
      { $set: {
        status: 'FAILED',
        lastError: error instanceof Error ? error.message.slice(0, 500) : 'Unknown processing error',
        updatedAt: new Date(),
      } },
    )
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 })
  }
}
