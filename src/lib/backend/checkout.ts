import 'server-only'

import { ObjectId, type ClientSession, type Filter, type WithId } from 'mongodb'
import type Stripe from 'stripe'
import { z } from 'zod'
import { findVariant } from './catalog'
import { collections, getMongoClient } from './db'
import { backendEnv, requireSiteUrl } from './env'
import { AppError } from './http'
import { getStripe } from './stripe'
import type { OrderDocument, ProductDocument, SafeUser } from './types'

export const checkoutItemSchema = z.object({
  variantId: z.string().min(1).max(120),
  quantity: z.number().int().min(1).max(9),
})

export const checkoutPayloadSchema = z.object({
  items: z.array(checkoutItemSchema).min(1).max(20),
  checkoutKey: z.uuid(),
  checkoutNote: z.string().trim().max(500).optional().nullable(),
})

export type CheckoutPayload = z.infer<typeof checkoutPayloadSchema>

function dedupeItems(items: CheckoutPayload['items']) {
  const quantities = new Map<string, number>()

  for (const item of items) {
    const quantity = (quantities.get(item.variantId) ?? 0) + item.quantity
    if (quantity > 9) throw new AppError('A maximum of 9 units is allowed per product.', 400, 'QUANTITY_LIMIT')
    quantities.set(item.variantId, quantity)
  }

  return [...quantities.entries()].map(([variantId, quantity]) => ({ variantId, quantity }))
}

async function loadProductsForItems(items: ReturnType<typeof dedupeItems>, session?: ClientSession) {
  const db = await collections()
  const products = await db.products
    .find(
      { status: 'ACTIVE', 'variants.id': { $in: items.map((item) => item.variantId) } },
      { session },
    )
    .toArray()
  const productByVariantId = new Map<string, WithId<ProductDocument>>()

  for (const product of products) {
    for (const variant of product.variants) {
      if (items.some((item) => item.variantId === variant.id)) productByVariantId.set(variant.id, product)
    }
  }

  return productByVariantId
}

function hasAvailableStockFilter(productId: ObjectId, variantId: string, quantity: number): Filter<ProductDocument> {
  return {
    _id: productId,
    status: 'ACTIVE',
    variants: { $elemMatch: { id: variantId, isActive: true } },
    $expr: {
      $gte: [
        {
          $let: {
            vars: {
              variant: {
                $arrayElemAt: [
                  { $filter: { input: '$variants', as: 'variant', cond: { $eq: ['$$variant.id', variantId] } } },
                  0,
                ],
              },
            },
            in: { $subtract: ['$$variant.stockOnHand', '$$variant.stockReserved'] },
          },
        },
        quantity,
      ],
    },
  }
}

async function findReusableSession(userId: string, checkoutKey: string) {
  const db = await collections()
  const existing = await db.orders.findOne({ userId, checkoutKey })
  if (!existing?.stripeSessionId || existing.status !== 'PENDING') return null

  const stripeSession = await getStripe().checkout.sessions.retrieve(existing.stripeSessionId)
  if (stripeSession.status === 'open' && stripeSession.url) return stripeSession
  if (stripeSession.status === 'expired') {
    await releaseOrderReservations(existing._id.toHexString())
    return null
  }
  if (stripeSession.status === 'complete') {
    throw new AppError('This checkout has already completed. Check your order history for its payment status.', 409, 'CHECKOUT_COMPLETED')
  }
  return null
}

async function ensureStripeCustomer(user: SafeUser) {
  const db = await collections()
  const stripe = getStripe()
  const profile = await db.users.findOne({ clerkUserId: user.id })
  if (!profile) throw new Error('The local Clerk customer profile is missing.')

  if (profile.stripeCustomerId) {
    await stripe.customers.update(profile.stripeCustomerId, {
      email: user.email,
      name: user.fullName ?? undefined,
      metadata: { clerkUserId: user.id },
    })
    return profile.stripeCustomerId
  }

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.fullName ?? undefined,
    metadata: { clerkUserId: user.id },
  }, { idempotencyKey: `clerk-customer/${user.id}` })

  await db.users.updateOne(
    { clerkUserId: user.id, $or: [{ stripeCustomerId: null }, { stripeCustomerId: { $exists: false } }] },
    { $set: { stripeCustomerId: customer.id, updatedAt: new Date() } },
  )
  const linked = await db.users.findOne({ clerkUserId: user.id })
  if (!linked?.stripeCustomerId) throw new Error('The Stripe customer could not be linked to the Clerk user.')
  return linked.stripeCustomerId
}

export async function createCheckoutSession(user: SafeUser, payload: CheckoutPayload) {
  // Validated up front so a misconfigured deployment fails before it reserves
  // stock, rather than after the customer has paid.
  const siteUrl = requireSiteUrl()
  const db = await collections()
  const stripe = getStripe()
  const userId = user.id
  const reusable = await findReusableSession(userId, payload.checkoutKey)
  if (reusable) return reusable

  const stripeCustomerId = await ensureStripeCustomer(user)

  const items = dedupeItems(payload.items)
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 35 * 60 * 1000)
  const orderId = new ObjectId()
  let orderItems: OrderDocument['items'] = []
  let subtotalGbpPence = 0
  const client = await getMongoClient()

  try {
    await client.withSession(async (session) => {
      await session.withTransaction(async () => {
        const productByVariantId = await loadProductsForItems(items, session)
        subtotalGbpPence = 0
        orderItems = items.map((item) => {
          const product = productByVariantId.get(item.variantId)
          const variant = product ? findVariant(product, item.variantId) : null

          if (!product?._id || !variant?.isActive || product.status !== 'ACTIVE') {
            throw new AppError('One or more cart items are no longer available.', 409, 'ITEM_UNAVAILABLE')
          }

          const stockAvailable = variant.stockOnHand - variant.stockReserved
          if (stockAvailable < item.quantity) {
            throw new AppError(`${product.name} has only ${Math.max(stockAvailable, 0)} available.`, 409, 'INSUFFICIENT_STOCK')
          }

          subtotalGbpPence += variant.priceGbpPence * item.quantity
          return {
            productId: product._id,
            variantId: variant.id,
            productName: product.name,
            variantName: variant.name,
            sku: variant.sku,
            quantity: item.quantity,
            unitGbpPence: variant.priceGbpPence,
            totalGbpPence: variant.priceGbpPence * item.quantity,
          }
        })

        for (const item of orderItems) {
          const reserved = await db.products.updateOne(
            hasAvailableStockFilter(item.productId, item.variantId, item.quantity),
            {
              $inc: { 'variants.$[variant].stockReserved': item.quantity },
              $set: { 'variants.$[variant].updatedAt': now, updatedAt: now },
            },
            { session, arrayFilters: [{ 'variant.id': item.variantId }] },
          )
          if (reserved.modifiedCount !== 1) {
            throw new AppError(`${item.productName} no longer has enough stock.`, 409, 'INSUFFICIENT_STOCK')
          }
        }

        const shippingGbpPence = backendEnv.stripeShippingRateId ? 0 : backendEnv.shippingGbpPence
        await db.orders.insertOne({
          _id: orderId,
          userId,
          stripeCustomerId,
          status: 'PENDING',
          email: user.email,
          currency: 'gbp',
          subtotalGbpPence,
          taxGbpPence: 0,
          shippingGbpPence,
          totalGbpPence: subtotalGbpPence + shippingGbpPence,
          shippingCountryCode: 'GB',
          checkoutKey: payload.checkoutKey,
          checkoutNote: payload.checkoutNote || null,
          items: orderItems,
          createdAt: now,
          updatedAt: now,
        }, { session })

        await db.inventoryReservations.insertMany(orderItems.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          orderId,
          quantity: item.quantity,
          status: 'HELD' as const,
          expiresAt,
          createdAt: now,
          updatedAt: now,
        })), { session })
      }, {
        readConcern: { level: 'snapshot' },
        writeConcern: { w: 'majority' },
      })
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      const session = await findReusableSession(userId, payload.checkoutKey)
      if (session) return session
      const existing = await db.orders.findOne({ userId, checkoutKey: payload.checkoutKey })
      if (existing?.status === 'PENDING') {
        throw new AppError('This checkout is already being prepared. Try again in a moment.', 409, 'CHECKOUT_IN_PROGRESS')
      }
      throw new AppError('This checkout attempt has already been used. Refresh your cart and try again.', 409, 'CHECKOUT_REUSED')
    }
    throw error
  }

  let stripeSession: Stripe.Checkout.Session | null = null
  try {
    const shippingOptions: Stripe.Checkout.SessionCreateParams.ShippingOption[] = backendEnv.stripeShippingRateId
      ? [{ shipping_rate: backendEnv.stripeShippingRateId }]
      : [{
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: backendEnv.shippingGbpPence, currency: 'gbp' },
            display_name: backendEnv.shippingGbpPence > 0 ? 'UK standard delivery' : 'Free UK delivery',
          },
        }]

    stripeSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      client_reference_id: orderId.toHexString(),
      customer: stripeCustomerId,
      customer_update: { address: 'auto', name: 'auto', shipping: 'auto' },
      billing_address_collection: 'auto',
      phone_number_collection: { enabled: true },
      shipping_address_collection: { allowed_countries: ['GB'] },
      shipping_options: shippingOptions,
      automatic_tax: { enabled: backendEnv.stripeAutomaticTaxEnabled },
      expires_at: Math.floor(expiresAt.getTime() / 1000),
      line_items: orderItems.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: 'gbp',
          unit_amount: item.unitGbpPence,
          product_data: {
            name: `${item.productName} / ${item.variantName}`,
            metadata: { sku: item.sku, variantId: item.variantId },
          },
        },
      })),
      metadata: { orderId: orderId.toHexString(), clerkUserId: user.id },
      payment_intent_data: {
        description: `3love order ${orderId.toHexString()}`,
        metadata: { orderId: orderId.toHexString(), clerkUserId: user.id },
      },
      success_url: `${siteUrl}/account/orders?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/?checkout=cancelled#buy`,
    }, { idempotencyKey: `checkout/${orderId.toHexString()}` })

    const linked = await db.orders.updateOne(
      { _id: orderId, status: 'PENDING' },
      { $set: { stripeSessionId: stripeSession.id, updatedAt: new Date() } },
    )
    if (linked.modifiedCount !== 1) throw new Error('Stripe Checkout could not be linked to the pending order.')
    return stripeSession
  } catch (error) {
    if (stripeSession?.id && stripeSession.status === 'open') {
      await stripe.checkout.sessions.expire(stripeSession.id).catch(() => undefined)
    }
    await releaseOrderReservations(orderId.toHexString())
    throw error
  }
}

export async function releaseOrderReservations(orderId: string) {
  if (!ObjectId.isValid(orderId)) return

  const db = await collections()
  const client = await getMongoClient()
  const parsedOrderId = new ObjectId(orderId)
  await client.withSession(async (session) => {
    await session.withTransaction(async () => {
      const reservations = await db.inventoryReservations
        .find({ orderId: parsedOrderId, status: 'HELD' }, { session })
        .toArray()

      for (const reservation of reservations) {
        const released = await db.products.updateOne(
          { _id: reservation.productId, variants: { $elemMatch: { id: reservation.variantId, stockReserved: { $gte: reservation.quantity } } } },
          {
            $inc: { 'variants.$[variant].stockReserved': -reservation.quantity },
            $set: { 'variants.$[variant].updatedAt': new Date(), updatedAt: new Date() },
          },
          { session, arrayFilters: [{ 'variant.id': reservation.variantId }] },
        )
        if (released.modifiedCount !== 1) {
          throw new Error(`Inventory reservation ${reservation._id.toHexString()} could not be released.`)
        }
      }

      await db.inventoryReservations.updateMany(
        { orderId: parsedOrderId, status: 'HELD' },
        { $set: { status: 'RELEASED', updatedAt: new Date() } },
        { session },
      )
      await db.orders.updateOne(
        { _id: parsedOrderId, status: 'PENDING' },
        { $set: { status: 'CANCELLED', updatedAt: new Date() } },
        { session },
      )
    })
  })
}

export async function releaseExpiredReservations(limit = 50) {
  const db = await collections()
  const expired = await db.inventoryReservations
    .find({ status: 'HELD', expiresAt: { $lte: new Date() } })
    .sort({ expiresAt: 1 })
    .limit(limit)
    .project({ orderId: 1 })
    .toArray()
  const orderIds = [...new Set(expired.map((item) => item.orderId.toHexString()))]
  for (const orderId of orderIds) await releaseOrderReservations(orderId)
}

export async function markOrderPaid(stripeSession: Stripe.Checkout.Session) {
  if (stripeSession.payment_status !== 'paid' && stripeSession.payment_status !== 'no_payment_required') {
    return null
  }
  if (stripeSession.currency !== 'gbp') {
    throw new AppError('Stripe returned an unexpected currency.', 409, 'CURRENCY_MISMATCH')
  }

  const db = await collections()
  const client = await getMongoClient()
  let paidOrder: WithId<OrderDocument> | null = null

  await client.withSession(async (session) => {
    await session.withTransaction(async () => {
      const order = await db.orders.findOne({ stripeSessionId: stripeSession.id }, { session })
      if (!order?._id) throw new AppError('Stripe order could not be matched.', 409, 'ORDER_NOT_FOUND')
      if (['PAID', 'FULFILLING', 'SHIPPED', 'PARTIALLY_REFUNDED', 'REFUNDED'].includes(order.status)) {
        paidOrder = order
        return
      }
      if (order.status !== 'PENDING') {
        throw new AppError('Order is no longer awaiting payment.', 409, 'ORDER_NOT_PENDING')
      }

      const reservations = await db.inventoryReservations
        .find({ orderId: order._id, status: 'HELD' }, { session })
        .toArray()
      if (reservations.length !== order.items.length) {
        throw new AppError('The inventory reservation is incomplete.', 409, 'RESERVATION_INCOMPLETE')
      }

      for (const reservation of reservations) {
        const consumed = await db.products.updateOne(
          {
            _id: reservation.productId,
            variants: { $elemMatch: {
              id: reservation.variantId,
              stockOnHand: { $gte: reservation.quantity },
              stockReserved: { $gte: reservation.quantity },
            } },
          },
          {
            $inc: {
              'variants.$[variant].stockOnHand': -reservation.quantity,
              'variants.$[variant].stockReserved': -reservation.quantity,
            },
            $set: { 'variants.$[variant].updatedAt': new Date(), updatedAt: new Date() },
          },
          { session, arrayFilters: [{ 'variant.id': reservation.variantId }] },
        )
        if (consumed.modifiedCount !== 1) {
          throw new AppError('Inventory could not be consumed for the paid order.', 409, 'INVENTORY_CONFLICT')
        }
      }

      const subtotal = stripeSession.amount_subtotal ?? order.subtotalGbpPence
      const tax = stripeSession.total_details?.amount_tax ?? 0
      const shipping = stripeSession.total_details?.amount_shipping ?? 0
      const total = stripeSession.amount_total ?? subtotal + tax + shipping
      const paymentIntentId = typeof stripeSession.payment_intent === 'string'
        ? stripeSession.payment_intent
        : stripeSession.payment_intent?.id ?? null

      await db.inventoryReservations.updateMany(
        { orderId: order._id, status: 'HELD' },
        { $set: { status: 'CONSUMED', updatedAt: new Date() } },
        { session },
      )
      await db.orders.updateOne(
        { _id: order._id, status: 'PENDING' },
        { $set: {
          status: 'PAID',
          stripePaymentIntent: paymentIntentId,
          subtotalGbpPence: subtotal,
          taxGbpPence: tax,
          shippingGbpPence: shipping,
          totalGbpPence: total,
          updatedAt: new Date(),
        } },
        { session },
      )
      await db.carts.updateMany(
        { userId: order.userId, status: 'ACTIVE' },
        { $set: { status: 'CHECKED_OUT', updatedAt: new Date() } },
        { session },
      )
      paidOrder = await db.orders.findOne({ _id: order._id }, { session })
    })
  })

  return paidOrder
}
