import 'dotenv/config'
import { MongoClient } from 'mongodb'

export async function withDb(callback) {
  const uri = process.env.MONGODB_URI
  const dbName = process.env.MONGODB_DB_NAME || '3love'

  if (!uri) throw new Error('MONGODB_URI is required.')

  const client = new MongoClient(uri)
  await client.connect()

  try {
    return await callback(client.db(dbName))
  } finally {
    await client.close()
  }
}

export async function ensureIndexes(db) {
  await Promise.all([
    db.collection('users').createIndex({ clerkUserId: 1 }, { unique: true }),
    db.collection('users').createIndex({ email: 1 }, { unique: true }),
    db.collection('users').createIndex(
      { stripeCustomerId: 1 },
      { unique: true, partialFilterExpression: { stripeCustomerId: { $type: 'string' } } },
    ),
    db.collection('addresses').createIndex({ userId: 1, isDefault: -1, createdAt: -1 }),
    db.collection('products').createIndex({ slug: 1 }, { unique: true }),
    db.collection('products').createIndex({ status: 1, isFeatured: -1, sortOrder: 1 }),
    db.collection('products').createIndex({ 'variants.id': 1 }),
    db.collection('products').createIndex({ 'variants.sku': 1 }, { unique: true, sparse: true }),
    db.collection('carts').createIndex(
      { userId: 1, status: 1 },
      { unique: true, partialFilterExpression: { status: 'ACTIVE' } },
    ),
    db.collection('orders').createIndex({ userId: 1, status: 1, createdAt: -1 }),
    db.collection('orders').createIndex({ stripeSessionId: 1 }, { unique: true, sparse: true }),
    db.collection('orders').createIndex(
      { stripePaymentIntent: 1 },
      { unique: true, partialFilterExpression: { stripePaymentIntent: { $type: 'string' } } },
    ),
    db.collection('orders').createIndex(
      { userId: 1, checkoutKey: 1 },
      { unique: true, partialFilterExpression: { checkoutKey: { $type: 'string' } } },
    ),
    db.collection('inventory_reservations').createIndex({ variantId: 1, status: 1 }),
    db.collection('inventory_reservations').createIndex({ orderId: 1 }),
    db.collection('inventory_reservations').createIndex({ status: 1, expiresAt: 1 }),
    db.collection('payment_events').createIndex({ stripeEventId: 1 }, { unique: true }),
    db.collection('payment_events').createIndex({ status: 1, updatedAt: 1 }),
    db.collection('rate_limits').createIndex({ key: 1 }, { unique: true }),
    db.collection('rate_limits').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
  ])
}
