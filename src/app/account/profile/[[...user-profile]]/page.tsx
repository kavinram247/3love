import { UserProfile } from '@clerk/nextjs'
import Link from 'next/link'
import { requireCustomer } from '@/lib/backend/auth'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  await requireCustomer('/account/profile')

  return (
    <main id="main-content" className="commerce-shell auth-shell">
      <section className="commerce-panel auth-panel clerk-profile-panel">
        <p className="micro-label">3LOVE / PROFILE &amp; SECURITY</p>
        <UserProfile
          routing="path"
          path="/account/profile"
          appearance={{
            elements: {
              rootBox: 'clerk-profile-root',
              cardBox: 'clerk-profile-card-box',
              card: 'clerk-profile-card',
            },
          }}
        />
        <div className="commerce-links clerk-auth-links">
          <Link href="/account">Back to account</Link>
          <Link href="/">Return to experience</Link>
        </div>
      </section>
    </main>
  )
}
