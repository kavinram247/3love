import { ensureIndexes, withDb } from './mongodb-utils.mjs'

const ENVIRONMENT_IMAGE_BASE = '/assets/environments'
const BOTTLE_POSTER = '/assets/rotation/3love-rotation-cosmic-drift-4k-poster.jpg'

/** Keep these aligned with src/lib/products.ts so the static fallback and the
 *  database agree on slugs, SKUs and variant ids. */
const catalogue = [
  {
    slug: 'stars-in-sanremo',
    name: 'Stars in Sanremo',
    concept: 'Emotion',
    phase: 'Phase I',
    quote: 'Flowers fade. Some nights remain.',
    notes: ['Hibiscus', 'Rose', 'Soft Florals', 'Amber', 'Tonka', 'Vanilla', 'Musk'],
    description: 'A night on the Ligurian coast: salt air, lantern light, the sea holding the moon.',
    accent: '150 132 224',
    sortOrder: 1,
    isFeatured: true,
    variantId: 'stars-in-sanremo-50ml',
    sku: '3LOVE-SANREMO-50ML',
  },
  {
    slug: 'garden-of-eve',
    name: 'Garden of Eve',
    concept: 'Experience',
    phase: 'Phase I',
    quote: 'Made to be experienced. Made to remain.',
    notes: ['Citrus', 'Floral', 'Rosewood', 'Sandalwood', 'Amber', 'Tonka', 'Vanilla', 'Musk'],
    description: 'A garden at dusk, heavy with wisteria and rose, before anything has been decided.',
    accent: '206 132 188',
    sortOrder: 2,
    isFeatured: false,
    variantId: 'garden-of-eve-50ml',
    sku: '3LOVE-EVE-50ML',
  },
  {
    slug: 'mediterranean-breeze',
    name: 'Mediterranean Breeze',
    concept: 'Memory',
    phase: 'Phase I',
    quote: 'Golden hour, made to remain.',
    notes: ['Citrus', 'Warm Spice', 'Cognac', 'Cinnamon', 'Woods', 'Oud', 'Amber', 'Musk'],
    description: 'A cliff road above the water at golden hour: citrus groves, warm stone, open sea.',
    accent: '230 170 84',
    sortOrder: 3,
    isFeatured: false,
    variantId: 'mediterranean-breeze-50ml',
    sku: '3LOVE-MEDITERRANEAN-50ML',
  },
]

await withDb(async (db) => {
  await ensureIndexes(db)

  const now = new Date()
  const products = db.collection('products')

  for (const item of catalogue) {
    await products.updateOne(
      { slug: item.slug },
      {
        $set: {
          slug: item.slug,
          name: item.name,
          concept: item.concept,
          phase: item.phase,
          quote: item.quote,
          notes: item.notes,
          description: item.description,
          imageSrc: BOTTLE_POSTER,
          sceneSrc: `${ENVIRONMENT_IMAGE_BASE}/${item.slug}.jpg`,
          accent: item.accent,
          status: 'ACTIVE',
          isFeatured: item.isFeatured,
          sortOrder: item.sortOrder,
          updatedAt: now,
        },
        $setOnInsert: {
          variants: [{
            id: item.variantId,
            sku: item.sku,
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
  }

  // Éclat has been superseded by the three environment compositions. Archiving
  // rather than deleting keeps any existing orders readable.
  const retired = await products.updateOne(
    { slug: 'eclat' },
    { $set: { status: 'ARCHIVED', isFeatured: false, updatedAt: now } },
  )

  console.log(`MongoDB seed complete: ${catalogue.length} compositions ready.`)
  if (retired.matchedCount > 0) console.log('Éclat archived.')
})
