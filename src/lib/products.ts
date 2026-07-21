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

export const products: Product[] = [
  {
    id: 'eclat',
    slug: 'eclat',
    name: 'Éclat',
    concept: 'Self Love',
    phase: 'Phase I',
    quote: 'The love you give yourself echoes forever.',
    notes: ['Lavender Haze', 'Nu Absolute', 'White Musk'],
    volume: '50ML',
    stockLabel: 'Ships after order',
    imageSrc: BOTTLE_IMAGE_SRC,
    sceneSrc: BOTTLE_SCENE_SRC,
    accent: '176 122 255',
    variantId: 'eclat-50ml',
    sku: '3LOVE-ECLAT-50ML',
    priceGbpPence: 12000,
    currency: 'gbp',
    availableStock: 100,
  },
]

export const featuredProduct = products[0]

export const productLookup = new Map(products.map((product) => [product.id, product]))
