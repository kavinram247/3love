import Link from 'next/link'
import { SignOutButton } from '@clerk/nextjs'
import { requireCustomer } from '@/lib/backend/auth'
import { collections } from '@/lib/backend/db'
import { isClerkConfigured, isMongoConfigured } from '@/lib/backend/env'
import { formatDate } from '@/lib/backend/format'

export const dynamic = 'force-dynamic'

export default async function AccountPage() {
  if (!isMongoConfigured() || !isClerkConfigured()) {
    return (
      <main id="main-content" className="commerce-shell">
        <section className="commerce-panel">
          <p className="micro-label">3LOVE / BACKEND SETUP</p>
          <h1>Account backend pending</h1>
          <p>Add MongoDB and Clerk environment variables to enable login, saved addresses, and order history.</p>
          <Link className="cinema-button" href="/"><span>Return to experience</span><i>↗</i></Link>
        </section>
      </main>
    )
  }

  const user = await requireCustomer('/account')
  const db = await collections()
  const userId = user.id
  const [profile, orderCount, addressCount] = await Promise.all([
    db.users.findOne({ clerkUserId: userId }),
    db.orders.countDocuments({ userId }),
    db.addresses.countDocuments({ userId }),
  ])

  return (
    <main id="main-content" className="commerce-shell">
      <section className="commerce-panel account-hero">
        <p className="micro-label">3LOVE / CUSTOMER ACCOUNT</p>
        <h1>{profile?.fullName || user.fullName || 'Your account'}</h1>
        <p>{profile?.email || user.email}</p>
        <div className="commerce-stats">
          <span><strong>{orderCount}</strong> orders</span>
          <span><strong>{addressCount}</strong> saved addresses</span>
          <span><strong>{profile ? formatDate(profile.createdAt) : 'New'}</strong> joined</span>
        </div>
        <div className="commerce-actions">
          <Link className="cinema-button" href="/account/orders"><span>View orders</span><i>↗</i></Link>
          <Link className="quiet-link" href="/account/addresses">Saved addresses</Link>
          <Link className="quiet-link" href="/account/profile">Manage profile</Link>
          <Link className="quiet-link" href="/">Return to experience</Link>
          <SignOutButton redirectUrl="/">
            <button className="quiet-link" type="button">Log out</button>
          </SignOutButton>
        </div>
      </section>
    </main>
  )
}
