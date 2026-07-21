import type { ObjectId } from 'mongodb'

export const productStatuses = ['DRAFT', 'ACTIVE', 'ARCHIVED'] as const
export const orderStatuses = [
  'PENDING',
  'PAID',
  'FULFILLING',
  'SHIPPED',
  'CANCELLED',
  'PARTIALLY_REFUNDED',
  'REFUNDED',
] as const
export const reservationStatuses = ['HELD', 'CONSUMED', 'RELEASED'] as const
export const cartStatuses = ['ACTIVE', 'CHECKED_OUT', 'ABANDONED'] as const
export const paymentEventStatuses = ['PROCESSING', 'PROCESSED', 'FAILED'] as const

export type ProductStatus = (typeof productStatuses)[number]
export type OrderStatus = (typeof orderStatuses)[number]
export type ReservationStatus = (typeof reservationStatuses)[number]
export type CartStatus = (typeof cartStatuses)[number]
export type PaymentEventStatus = (typeof paymentEventStatuses)[number]
export type UserRole = 'customer' | 'admin'

export type UserDocument = {
  _id?: ObjectId
  clerkUserId: string
  email: string
  fullName: string | null
  phone?: string | null
  role: UserRole
  stripeCustomerId?: string | null
  emailVerifiedAt?: Date | null
  deletedAt?: Date | null
  lastSyncedAt: Date
  createdAt: Date
  updatedAt: Date
}

export type AddressDocument = {
  _id?: ObjectId
  userId: string
  label?: string | null
  fullName: string
  line1: string
  line2?: string | null
  city: string
  county?: string | null
  postcode: string
  countryCode: 'GB'
  phone?: string | null
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

export type ProductVariantDocument = {
  id: string
  sku: string
  name: string
  volume: string
  stripePriceId?: string | null
  priceGbpPence: number
  currency: 'gbp'
  stockOnHand: number
  stockReserved: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export type ProductDocument = {
  _id?: ObjectId
  slug: string
  name: string
  concept: string
  phase: string
  quote: string
  notes: string[]
  description?: string | null
  imageSrc: string
  sceneSrc: string
  accent: string
  status: ProductStatus
  isFeatured: boolean
  sortOrder: number
  variants: ProductVariantDocument[]
  createdAt: Date
  updatedAt: Date
}

export type CartDocument = {
  _id?: ObjectId
  userId: string
  status: CartStatus
  items: Array<{
    productId: ObjectId
    variantId: string
    quantity: number
  }>
  createdAt: Date
  updatedAt: Date
}

export type OrderItemDocument = {
  productId: ObjectId
  variantId: string
  productName: string
  variantName: string
  sku: string
  quantity: number
  unitGbpPence: number
  totalGbpPence: number
}

export type OrderDocument = {
  _id?: ObjectId
  userId: string
  status: OrderStatus
  email: string
  currency: 'gbp'
  subtotalGbpPence: number
  taxGbpPence: number
  shippingGbpPence: number
  totalGbpPence: number
  stripeSessionId?: string | null
  stripePaymentIntent?: string | null
  stripeCustomerId?: string | null
  stripeRefundId?: string | null
  refundedGbpPence?: number
  checkoutKey?: string | null
  shippingName?: string | null
  shippingLine1?: string | null
  shippingLine2?: string | null
  shippingCity?: string | null
  shippingCounty?: string | null
  shippingPostcode?: string | null
  shippingCountryCode: 'GB'
  phone?: string | null
  checkoutNote?: string | null
  items: OrderItemDocument[]
  createdAt: Date
  updatedAt: Date
}

export type InventoryReservationDocument = {
  _id?: ObjectId
  productId: ObjectId
  variantId: string
  orderId: ObjectId
  quantity: number
  status: ReservationStatus
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
}

export type PaymentEventDocument = {
  _id?: ObjectId
  stripeEventId: string
  eventType: string
  objectId?: string | null
  status: PaymentEventStatus
  attemptCount: number
  lastError?: string | null
  createdAt: Date
  updatedAt: Date
  processedAt?: Date | null
}

export type RateLimitDocument = {
  _id?: ObjectId
  key: string
  count: number
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
}

export type SafeUser = {
  id: string
  email: string
  fullName: string | null
  role: UserRole
  emailVerified: boolean
}
