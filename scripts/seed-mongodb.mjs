import { randomUUID } from 'node:crypto'
import { ensureIndexes, withDb } from './mongodb-utils.mjs'

await withDb(async (db) => {
  await ensureIndexes(db)

  const now = new Date()
  const products = db.collection('products')

  await products.updateOne(
    { slug: 'eclat' },
    {
      $set: {
        slug: 'eclat',
        name: 'Éclat',
        concept: 'Self Love',
        phase: 'Phase I',
        quote: 'The love you give yourself echoes forever.',
        notes: ['Lavender Haze', 'Nu Absolute', 'White Musk'],
        description: 'The first physical artifact of Phase 01.',
        imageSrc: '/assets/rotation/3love-rotation-cosmic-drift-4k-poster.jpg',
        sceneSrc: '/assets/rotation/3love-rotation-cosmic-drift-4k-poster.jpg',
        accent: '176 122 255',
        status: 'ACTIVE',
        isFeatured: true,
        sortOrder: 1,
        updatedAt: now,
      },
      $setOnInsert: {
        variants: [{
          id: randomUUID(),
          sku: '3LOVE-ECLAT-50ML',
          name: '50ML',
          volume: '50ML',
          stripePriceId: null,
          priceGbpPence: 12000,
          currency: 'gbp',
          stockOnHand: 100,
          stockReserved: 0,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        }],
        createdAt: now,
      },
    },
    { upsert: true },
  )

  console.log('MongoDB seed complete: Éclat is ready.')
})
