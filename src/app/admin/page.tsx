import Link from 'next/link'
import { requireAdmin } from '@/lib/backend/auth'
import { isClerkConfigured, isMongoConfigured } from '@/lib/backend/env'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  if (!isMongoConfigured() || !isClerkConfigured()) {
    return (
      <main id="main-content" className="commerce-shell">
        <section className="commerce-panel">
          <p className="micro-label">3LOVE / ADMIN SETUP</p>
          <h1>Admin backend pending</h1>
          <p>Add MongoDB, Clerk, and ADMIN_EMAILS, then promote the intended account with the admin setup command.</p>
        </section>
      </main>
    )
  }

  await requireAdmin('/admin')

  return (
    <main id="main-content" className="commerce-shell">
      <section className="commerce-panel account-hero">
        <p className="micro-label">3LOVE / ADMIN</p>
        <h1>Commerce control room</h1>
        <p>Manage the catalog, inventory, orders, and fulfillment state.</p>
        <div className="commerce-actions">
          <Link className="cinema-button" href="/admin/products"><span>Products</span><i>↗</i></Link>
          <Link className="quiet-link" href="/admin/orders">Orders</Link>
          <Link className="quiet-link" href="/">Return to experience</Link>
        </div>
      </section>
    </main>
  )
}
