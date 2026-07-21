import 'server-only'

import type { ObjectId, WithId } from 'mongodb'
import { collections } from './db'
import { isMongoConfigured } from './env'
import type { ProductDocument, ProductVariantDocument } from './types'
import { products as fallbackProducts } from '@/lib/products'
import type { Product } from '@/lib/products'

function availableStock(variant: ProductVariantDocument) {
  return Math.max(variant.stockOnHand - variant.stockReserved, 0)
}

export function mapStorefrontProduct(product: WithId<ProductDocument>, variant = product.variants.find((item) => item.isActive)): Product | null {
  if (!variant) return null

  const stock = availableStock(variant)

  return {
    id: product._id.toHexString(),
    slug: product.slug,
    name: product.name,
    concept: product.concept,
    phase: product.phase,
    quote: product.quote,
    notes: product.notes,
    description: product.description ?? null,
    volume: variant.volume,
    stockLabel: stock > 0 ? 'Ships after order' : 'Currently unavailable',
    imageSrc: product.imageSrc,
    sceneSrc: product.sceneSrc,
    accent: product.accent,
    variantId: variant.id,
    sku: variant.sku,
    priceGbpPence: variant.priceGbpPence,
    currency: variant.currency,
    availableStock: stock,
    stripePriceId: variant.stripePriceId ?? undefined,
  }
}

export async function getStorefrontProducts(): Promise<Product[]> {
  if (!isMongoConfigured()) return fallbackProducts

  try {
    const db = await collections()
    const rows = await db.products
      .find({ status: 'ACTIVE', 'variants.isActive': true })
      .sort({ isFeatured: -1, sortOrder: 1, createdAt: 1 })
      .toArray()

    const mapped = rows.flatMap((product) => {
      const storefrontProduct = mapStorefrontProduct(product)
      return storefrontProduct ? [storefrontProduct] : []
    })

    return mapped.length > 0 ? mapped : fallbackProducts
  } catch (error) {
    console.error('Falling back to static catalog:', error)
    return fallbackProducts
  }
}

export async function getAdminCatalog() {
  const db = await collections()
  return db.products.find({}).sort({ isFeatured: -1, sortOrder: 1, createdAt: -1 }).toArray()
}

export function findVariant(product: ProductDocument, variantId: string) {
  return product.variants.find((variant) => variant.id === variantId)
}

export async function getProductByVariantId(variantId: string) {
  const db = await collections()
  return db.products.findOne({ 'variants.id': variantId })
}

export async function decrementVariantReservation(productId: ObjectId, variantId: string, quantity: number) {
  const db = await collections()
  await db.products.updateOne(
    { _id: productId, 'variants.id': variantId },
    {
      $inc: {
        'variants.$.stockReserved': -quantity,
      },
      $set: {
        'variants.$.updatedAt': new Date(),
      },
    },
  )
}
