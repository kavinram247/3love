import 'server-only'

import { MongoClient, type Collection, type Db } from 'mongodb'
import { backendEnv } from './env'
import type {
  AddressDocument,
  CartDocument,
  InventoryReservationDocument,
  OrderDocument,
  PaymentEventDocument,
  ProductDocument,
  RateLimitDocument,
  UserDocument,
} from './types'

type MongoGlobal = typeof globalThis & {
  mongoClientPromise?: Promise<MongoClient>
}

const mongoGlobal = globalThis as MongoGlobal

export async function getMongoClient() {
  if (!backendEnv.mongoUri) {
    throw new Error('MONGODB_URI is required for database access.')
  }

  if (!mongoGlobal.mongoClientPromise) {
    const client = new MongoClient(backendEnv.mongoUri, {
      maxPoolSize: 20,
      minPoolSize: process.env.NODE_ENV === 'production' ? 2 : 0,
      serverSelectionTimeoutMS: 5_000,
      connectTimeoutMS: 10_000,
      socketTimeoutMS: 20_000,
      appName: '3love-storefront',
    })
    mongoGlobal.mongoClientPromise = client.connect().catch(async (error) => {
      mongoGlobal.mongoClientPromise = undefined
      await client.close().catch(() => undefined)
      throw error
    })
  }

  return mongoGlobal.mongoClientPromise
}

export async function getDb(): Promise<Db> {
  const client = await getMongoClient()
  return client.db(backendEnv.mongoDbName)
}

export async function collections() {
  const db = await getDb()

  return {
    users: db.collection<UserDocument>('users'),
    addresses: db.collection<AddressDocument>('addresses'),
    products: db.collection<ProductDocument>('products'),
    carts: db.collection<CartDocument>('carts'),
    orders: db.collection<OrderDocument>('orders'),
    inventoryReservations: db.collection<InventoryReservationDocument>('inventory_reservations'),
    paymentEvents: db.collection<PaymentEventDocument>('payment_events'),
    rateLimits: db.collection<RateLimitDocument>('rate_limits'),
  }
}

export async function ensureMongoIndexes() {
  const db = await collections()
  await Promise.all([
    db.users.createIndex({ clerkUserId: 1 }, { unique: true }),
    db.users.createIndex({ email: 1 }, { unique: true }),
    db.users.createIndex(
      { stripeCustomerId: 1 },
      { unique: true, partialFilterExpression: { stripeCustomerId: { $type: 'string' } } },
    ),
    db.addresses.createIndex({ userId: 1, isDefault: -1, createdAt: -1 }),
    db.products.createIndex({ slug: 1 }, { unique: true }),
    db.products.createIndex({ status: 1, isFeatured: -1, sortOrder: 1 }),
    db.products.createIndex({ 'variants.id': 1 }),
    db.products.createIndex({ 'variants.sku': 1 }, { unique: true, sparse: true }),
    db.carts.createIndex(
      { userId: 1, status: 1 },
      { unique: true, partialFilterExpression: { status: 'ACTIVE' } },
    ),
    db.orders.createIndex({ userId: 1, status: 1, createdAt: -1 }),
    db.orders.createIndex({ stripeSessionId: 1 }, { unique: true, sparse: true }),
    db.orders.createIndex(
      { stripePaymentIntent: 1 },
      { unique: true, partialFilterExpression: { stripePaymentIntent: { $type: 'string' } } },
    ),
    db.orders.createIndex(
      { userId: 1, checkoutKey: 1 },
      { unique: true, partialFilterExpression: { checkoutKey: { $type: 'string' } } },
    ),
    db.inventoryReservations.createIndex({ variantId: 1, status: 1 }),
    db.inventoryReservations.createIndex({ orderId: 1 }),
    db.inventoryReservations.createIndex({ status: 1, expiresAt: 1 }),
    db.paymentEvents.createIndex({ stripeEventId: 1 }, { unique: true }),
    db.paymentEvents.createIndex({ status: 1, updatedAt: 1 }),
    db.rateLimits.createIndex({ key: 1 }, { unique: true }),
    db.rateLimits.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
  ] satisfies Array<Promise<string>>)
}

export type AppCollections = Awaited<ReturnType<typeof collections>>
export type AppCollection<T extends keyof AppCollections> = AppCollections[T] extends Collection<infer D> ? D : never
