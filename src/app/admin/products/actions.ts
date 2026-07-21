'use server'

import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { ObjectId } from 'mongodb'
import { requireAdmin } from '@/lib/backend/auth'
import { collections } from '@/lib/backend/db'
import { productStatuses, type ProductStatus } from '@/lib/backend/types'

function readField(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

function readNotes(value: string) {
  return value.split(/\n|,/).map((note) => note.trim()).filter(Boolean)
}

function readStatus(value: string) {
  return productStatuses.includes(value as ProductStatus) ? value as ProductStatus : 'DRAFT'
}

function readPence(value: string) {
  const numeric = Number(value.replace(/[£,\s]/g, ''))
  return Number.isFinite(numeric) && numeric > 0 ? Math.round(numeric * 100) : null
}

function readInteger(value: string, minimum = 0) {
  const numeric = Number(value)
  return Number.isSafeInteger(numeric) && numeric >= minimum ? numeric : null
}

function validStripePriceId(value: string) {
  return !value || /^price_[A-Za-z0-9]+$/.test(value)
}

function validAccent(value: string) {
  const channels = value.split(/\s+/).map(Number)
  return channels.length === 3 && channels.every((channel) => Number.isInteger(channel) && channel >= 0 && channel <= 255)
}

function validAssetUrl(value: string) {
  if (value.startsWith('/') && !value.startsWith('//')) return true
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

function validRequiredText(value: string, max: number) {
  return value.length > 0 && value.length <= max
}

export async function createProduct(formData: FormData) {
  await requireAdmin('/admin/products')

  const name = readField(formData, 'name')
  const slug = readField(formData, 'slug').toLowerCase()
  const sku = readField(formData, 'sku')
  const priceGbpPence = readPence(readField(formData, 'priceGbp'))
  const stockOnHand = readInteger(readField(formData, 'stockOnHand'))
  const sortOrder = readInteger(readField(formData, 'sortOrder'))
  const accent = readField(formData, 'accent') || '176 122 255'
  const stripePriceId = readField(formData, 'stripePriceId')
  const concept = readField(formData, 'concept')
  const phase = readField(formData, 'phase')
  const quote = readField(formData, 'quote')
  const imageSrc = readField(formData, 'imageSrc') || '/assets/rotation/3love-rotation-cosmic-drift-4k-poster.jpg'
  const sceneSrc = readField(formData, 'sceneSrc') || '/assets/rotation/3love-rotation-cosmic-drift-4k-poster.jpg'

  if (
    !name || name.length > 120 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !sku || sku.length > 80
    || priceGbpPence === null || stockOnHand === null || sortOrder === null
    || !validAccent(accent) || !validStripePriceId(stripePriceId)
    || !validRequiredText(concept, 120) || !validRequiredText(phase, 80) || !validRequiredText(quote, 300)
    || !validAssetUrl(imageSrc) || !validAssetUrl(sceneSrc)
  ) redirect('/admin/products?result=invalid')

  const now = new Date()
  const db = await collections()
  const isFeatured = formData.get('isFeatured') === 'on'
  if (isFeatured) await db.products.updateMany({ isFeatured: true }, { $set: { isFeatured: false, updatedAt: now } })
  try {
    await db.products.insertOne({
      slug,
      name,
    concept,
    phase,
    quote,
    notes: readNotes(readField(formData, 'notes')),
    description: readField(formData, 'description') || null,
    imageSrc,
    sceneSrc,
    accent,
    status: readStatus(readField(formData, 'status')),
    isFeatured,
    sortOrder,
    variants: [{
      id: randomUUID(),
      sku,
      name: readField(formData, 'variantName') || readField(formData, 'volume') || '50ML',
      volume: readField(formData, 'volume') || '50ML',
      stripePriceId: stripePriceId || null,
      priceGbpPence,
      currency: 'gbp',
      stockOnHand,
      stockReserved: 0,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    }],
    createdAt: now,
    updatedAt: now,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      redirect('/admin/products?result=duplicate')
    }
    throw error
  }

  revalidatePath('/')
  revalidatePath('/admin/products')
  redirect('/admin/products?result=created')
}

export async function updateProduct(formData: FormData) {
  await requireAdmin('/admin/products')

  const productId = readField(formData, 'productId')
  const variantId = readField(formData, 'variantId')
  if (!productId || !variantId || !ObjectId.isValid(productId)) return

  const name = readField(formData, 'name')
  const priceGbpPence = readPence(readField(formData, 'priceGbp'))
  const stockOnHand = readInteger(readField(formData, 'stockOnHand'))
  const sortOrder = readInteger(readField(formData, 'sortOrder'))
  const stripePriceId = readField(formData, 'stripePriceId')
  const accent = readField(formData, 'accent')
  const concept = readField(formData, 'concept')
  const phase = readField(formData, 'phase')
  const quote = readField(formData, 'quote')
  const imageSrc = readField(formData, 'imageSrc')
  const sceneSrc = readField(formData, 'sceneSrc')
  if (
    !name || name.length > 120 || priceGbpPence === null || stockOnHand === null || sortOrder === null
    || !validStripePriceId(stripePriceId) || !validAccent(accent)
    || !validRequiredText(concept, 120) || !validRequiredText(phase, 80) || !validRequiredText(quote, 300)
    || !validAssetUrl(imageSrc) || !validAssetUrl(sceneSrc)
  ) redirect('/admin/products?result=invalid')

  const now = new Date()
  const db = await collections()
  const isFeatured = formData.get('isFeatured') === 'on'
  if (isFeatured) {
    await db.products.updateMany(
      { _id: { $ne: new ObjectId(productId) }, isFeatured: true },
      { $set: { isFeatured: false, updatedAt: now } },
    )
  }
  const updated = await db.products.updateOne(
    { _id: new ObjectId(productId), variants: { $elemMatch: { id: variantId, stockReserved: { $lte: stockOnHand } } } },
    {
      $set: {
      name,
      concept,
      phase,
      quote,
      notes: readNotes(readField(formData, 'notes')),
      description: readField(formData, 'description') || null,
      imageSrc,
      sceneSrc,
      accent,
      status: readStatus(readField(formData, 'status')),
      isFeatured,
      sortOrder,
      updatedAt: now,
      'variants.$.name': readField(formData, 'variantName'),
      'variants.$.volume': readField(formData, 'volume'),
      'variants.$.stripePriceId': stripePriceId || null,
      'variants.$.priceGbpPence': priceGbpPence,
      'variants.$.stockOnHand': stockOnHand,
      'variants.$.isActive': formData.get('variantActive') === 'on',
      'variants.$.updatedAt': now,
      },
    },
  )
  if (updated.modifiedCount !== 1) redirect('/admin/products?result=stock-conflict')

  revalidatePath('/')
  revalidatePath('/admin/products')
  redirect('/admin/products?result=updated')
}
