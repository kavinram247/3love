/** Editorial copy for each composition, shown when an environment is entered.
 *  Keyed by product slug so it applies whether the catalogue is served from
 *  MongoDB or the static fallback in ./products. */

export type CompositionSegment = {
  text: string
  strong?: boolean
}

export type FragranceProfile = {
  /** Optional time stamp shown after the name, e.g. "18:16". */
  timeMark?: string
  concentration: string
  lede: string
  body: string
  composition: CompositionSegment[]
  collaboration: string
  notes: string[]
  signature: string
}

const COLLABORATION = 'Exclusively curated by 3V-L0V3 in collaboration with Fragrances by Kaz.'

export const fragranceProfiles: Record<string, FragranceProfile> = {
  'stars-in-sanremo': {
    concentration: '35% Extrait de Parfum',
    lede: 'A flower garden beneath a velvet sky.',
    body: 'Rich hibiscus blooms through the night, softened by warm amber, tonka and deep vanilla. Floral at its heart, dark and velvety beneath — the sweetness lingers like stars that refuse to disappear.',
    composition: [
      { text: 'Composed at ' },
      { text: '35% concentration with premium perfume oils and rich floral extracts', strong: true },
      { text: ', carefully balanced for depth, diffusion and a lingering presence on skin.' },
    ],
    collaboration: COLLABORATION,
    notes: ['Hibiscus', 'Rose', 'Soft Florals', 'Amber', 'Tonka', 'Vanilla', 'Musk'],
    signature: 'Flowers fade. Some nights remain.',
  },

  'garden-of-eve': {
    concentration: '35% Extrait de Parfum',
    lede: 'A garden caught between purity and temptation.',
    body: 'Radiant citrus opens into soft florals, rare woods, warm amber and a deep veil of tonka and vanilla. Bright at first, darker as it settles — like daylight slowly disappearing behind the garden.',
    composition: [
      { text: 'Composed with a ' },
      { text: '35% concentration of premium perfume oils', strong: true },
      { text: ', selected for depth, richness and longevity.' },
    ],
    collaboration: COLLABORATION,
    notes: ['Citrus', 'Floral', 'Rosewood', 'Sandalwood', 'Amber', 'Tonka', 'Vanilla', 'Musk'],
    signature: 'Made to be experienced. Made to remain.',
  },

  'mediterranean-breeze': {
    timeMark: '18:16',
    concentration: '35% Extrait de Parfum',
    lede: 'The Mediterranean caught at 18:16.',
    body: 'Golden warmth meets the brightness of coastal air — rich spice, smooth woods and oud lifted by luminous citrus. It opens radiant and alive, before settling into something warmer, deeper and quietly addictive.',
    composition: [
      { text: 'Composed at ' },
      { text: '35% concentration with premium perfume oils', strong: true },
      { text: ', carefully balanced for richness, projection and a lasting evolution on skin.' },
    ],
    collaboration: COLLABORATION,
    notes: ['Citrus', 'Warm Spice', 'Cognac', 'Cinnamon', 'Woods', 'Oud', 'Amber', 'Musk'],
    signature: 'Golden hour, made to remain.',
  },
}

export function getFragranceProfile(slug: string): FragranceProfile | null {
  return fragranceProfiles[slug] ?? null
}
