import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { z } from 'zod'
import { getServerUser } from '@/lib/backend/auth'
import { collections } from '@/lib/backend/db'
import { isClerkConfigured, isMongoConfigured } from '@/lib/backend/env'
import { AppError, errorResponse, readJsonBody } from '@/lib/backend/http'
import { enforceRateLimit } from '@/lib/backend/rate-limit'

const cartPayloadSchema = z.object({
  items: z.array(z.object({
    variantId: z.string().min(1),
    quantity: z.number().int().min(1).max(9),
  })).max(20),
})

export async function GET() {
  if (!isMongoConfigured() || !isClerkConfigured()) {
    return NextResponse.json({ items: [], persistence: false })
  }

  const user = await getServerUser()
  if (!user) return NextResponse.json({ items: [] }, { status: 401 })

  const db = await collections()
  const cart = await db.carts.findOne({ userId: user.id, status: 'ACTIVE' })

  return NextResponse.json({
    items: cart?.items.map((item) => ({
      productId: item.productId.toHexString(),
      variantId: item.variantId,
      quantity: item.quantity,
    })) ?? [],
  })
}

export async function PUT(request: Request) {
  if (!isMongoConfigured() || !isClerkConfigured()) {
    return NextResponse.json({ ok: false, persistence: false })
  }

  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'Login is required.' }, { status: 401 })

  try {
    await enforceRateLimit({ scope: 'cart', identity: user.id, limit: 120, windowSeconds: 60 })
    const parsed = cartPayloadSchema.safeParse(await readJsonBody(request))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Cart payload is invalid.' }, { status: 400 })
    }

    const deduped = new Map<string, number>()
    for (const item of parsed.data.items) {
      const quantity = (deduped.get(item.variantId) ?? 0) + item.quantity
      if (quantity > 9) throw new AppError('A maximum of 9 units is allowed per product.', 400, 'QUANTITY_LIMIT')
      deduped.set(item.variantId, quantity)
    }

    const db = await collections()
    const products = await db.products
      .find({ status: 'ACTIVE', 'variants.id': { $in: [...deduped.keys()] } })
      .toArray()
    const variantToProduct = new Map<string, { productId: ObjectId; available: number }>()
    for (const product of products) {
      for (const variant of product.variants) {
        if (variant.isActive) {
          variantToProduct.set(variant.id, {
            productId: product._id,
            available: Math.max(variant.stockOnHand - variant.stockReserved, 0),
          })
        }
      }
    }

    const items = [...deduped.entries()].map(([variantId, quantity]) => {
      const variant = variantToProduct.get(variantId)
      if (!variant) throw new AppError('One or more cart items are unavailable.', 409, 'ITEM_UNAVAILABLE')
      if (quantity > variant.available) {
        throw new AppError(`Only ${variant.available} unit(s) are currently available.`, 409, 'INSUFFICIENT_STOCK')
      }
      return { productId: variant.productId, variantId, quantity }
    })

    const now = new Date()
    const userId = user.id
    await db.carts.updateOne(
      { userId, status: 'ACTIVE' },
      {
        $set: { items, updatedAt: now },
        $setOnInsert: { userId, status: 'ACTIVE', createdAt: now },
      },
      { upsert: true },
    )

    return NextResponse.json({ ok: true })
  } catch (error) {
    return errorResponse(error, 'Cart could not be saved.')
  }
}
