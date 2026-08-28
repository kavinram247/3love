export type Product = {
  id: string
  slug: string
  name: string
  concept: string
  phase: string
  quote: string
  notes: string[]
  description?: string | null
  volume: string
  stockLabel: string
  imageSrc: string
  sceneSrc: string
  accent: string
  variantId: string
  sku: string
  priceGbpPence: number
  currency: string
  availableStock: number
  stripePriceId?: string
}

export const BOTTLE_SCENE_SRC = '/assets/rotation/3love-rotation-cosmic-drift-4k-poster.jpg'
export const BOTTLE_IMAGE_SRC = BOTTLE_SCENE_SRC

/** Environment art lives here. Until the files exist, the panel falls back to a
 *  per-environment gradient, so dropping the images in needs no code change. */
export const ENVIRONMENT_IMAGE_BASE = '/assets/environments'

export const products: Product[] = [
  {
    id: 'stars-in-sanremo',
    slug: 'stars-in-sanremo',
    name: 'Stars in Sanremo',
    concept: 'Emotion',
    phase: 'Phase I',
    quote: 'Flowers fade. Some nights remain.',
    notes: ['Hibiscus', 'Rose', 'Soft Florals', 'Amber', 'Tonka', 'Vanilla', 'Musk'],
    volume: '50ML',
    stockLabel: 'Ships after order',
    imageSrc: BOTTLE_IMAGE_SRC,
    sceneSrc: `${ENVIRONMENT_IMAGE_BASE}/stars-in-sanremo.jpg`,
    accent: '150 132 224',
    variantId: 'stars-in-sanremo-50ml',
    sku: '3LOVE-SANREMO-50ML',
    priceGbpPence: 12000,
    currency: 'gbp',
    availableStock: 100,
  },
  {
    id: 'garden-of-eve',
    slug: 'garden-of-eve',
    name: 'Garden of Eve',
    concept: 'Experience',
    phase: 'Phase I',
    quote: 'Made to be experienced. Made to remain.',
    notes: ['Citrus', 'Floral', 'Rosewood', 'Sandalwood', 'Amber', 'Tonka', 'Vanilla', 'Musk'],
    volume: '50ML',
    stockLabel: 'Ships after order',
    imageSrc: BOTTLE_IMAGE_SRC,
    sceneSrc: `${ENVIRONMENT_IMAGE_BASE}/garden-of-eve.jpg`,
    accent: '206 132 188',
    variantId: 'garden-of-eve-50ml',
    sku: '3LOVE-EVE-50ML',
    priceGbpPence: 12000,
    currency: 'gbp',
    availableStock: 100,
  },
  {
    id: 'mediterranean-breeze',
    slug: 'mediterranean-breeze',
    name: 'Mediterranean Breeze',
    concept: 'Memory',
    phase: 'Phase I',
    quote: 'Golden hour, made to remain.',
    notes: ['Citrus', 'Warm Spice', 'Cognac', 'Cinnamon', 'Woods', 'Oud', 'Amber', 'Musk'],
    volume: '50ML',
    stockLabel: 'Ships after order',
    imageSrc: BOTTLE_IMAGE_SRC,
    sceneSrc: `${ENVIRONMENT_IMAGE_BASE}/mediterranean-breeze.jpg`,
    accent: '230 170 84',
    variantId: 'mediterranean-breeze-50ml',
    sku: '3LOVE-MEDITERRANEAN-50ML',
    priceGbpPence: 12000,
    currency: 'gbp',
    availableStock: 100,
  },
]

export const featuredProduct = products[0]

export const productLookup = new Map(products.map((product) => [product.id, product]))
