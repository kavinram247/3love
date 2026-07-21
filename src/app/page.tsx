import CinematicScrollExperience from '@/components/CinematicScrollExperience'
import { getStorefrontProducts } from '@/lib/backend/catalog'

export const revalidate = 60

export default async function Home() {
  const storefrontProducts = await getStorefrontProducts()

  return <CinematicScrollExperience storefrontProducts={storefrontProducts} />
}
