import Link from 'next/link'
import { requireCustomer } from '@/lib/backend/auth'
import { collections } from '@/lib/backend/db'
import { isClerkConfigured, isMongoConfigured } from '@/lib/backend/env'
import { createAddress, deleteAddress } from './actions'

export const dynamic = 'force-dynamic'

export default async function AddressesPage({ searchParams }: { searchParams: Promise<{ result?: string }> }) {
  if (!isMongoConfigured() || !isClerkConfigured()) {
    return (
      <main id="main-content" className="commerce-shell">
        <section className="commerce-panel">
          <p className="micro-label">3LOVE / ADDRESSES</p>
          <h1>Addresses unavailable</h1>
          <p>Connect MongoDB and Clerk to enable saved UK addresses.</p>
        </section>
      </main>
    )
  }

  const user = await requireCustomer('/account/addresses')
  const { result } = await searchParams
  const db = await collections()
  const addresses = await db.addresses.find({ userId: user.id }).sort({ isDefault: -1, createdAt: -1 }).toArray()

  return (
    <main id="main-content" className="commerce-shell">
      <section className="commerce-panel">
        <p className="micro-label">3LOVE / SAVED ADDRESSES</p>
        <h1>UK shipping addresses</h1>
        {result && (
          <p className={`commerce-message ${result !== 'invalid' ? 'is-success' : ''}`} role="status">
            {result === 'saved' && 'Address saved.'}
            {result === 'removed' && 'Address removed.'}
            {result === 'invalid' && 'Check the required fields and enter a valid UK postcode.'}
          </p>
        )}
        <div className="commerce-list">
          {addresses.length === 0 ? (
            <p>No saved addresses yet.</p>
          ) : addresses.map((address) => (
            <article key={address._id.toHexString()} className="commerce-row">
              <div>
                <span>{address.isDefault ? 'Default' : address.label || 'Address'}</span>
                <strong>{address.fullName}</strong>
                <em>{address.line1}, {address.city}, {address.postcode}</em>
              </div>
              <form action={deleteAddress}>
                <input type="hidden" name="id" value={address._id.toHexString()} />
                <button type="submit">Remove</button>
              </form>
            </article>
          ))}
        </div>
      </section>

      <section className="commerce-panel">
        <p className="micro-label">ADD ADDRESS</p>
        <h2>Save a UK address</h2>
        <form className="commerce-form commerce-form-grid" action={createAddress}>
          <label>
            <span>Label</span>
            <input name="label" placeholder="Home" maxLength={40} autoComplete="off" />
          </label>
          <label>
            <span>Full name</span>
            <input name="fullName" maxLength={120} autoComplete="name" required />
          </label>
          <label>
            <span>Line 1</span>
            <input name="line1" maxLength={160} autoComplete="address-line1" required />
          </label>
          <label>
            <span>Line 2</span>
            <input name="line2" maxLength={160} autoComplete="address-line2" />
          </label>
          <label>
            <span>City</span>
            <input name="city" maxLength={100} autoComplete="address-level2" required />
          </label>
          <label>
            <span>County</span>
            <input name="county" maxLength={100} autoComplete="address-level1" />
          </label>
          <label>
            <span>Postcode</span>
            <input name="postcode" minLength={5} maxLength={10} autoComplete="postal-code" required />
          </label>
          <label>
            <span>Phone</span>
            <input name="phone" type="tel" maxLength={30} autoComplete="tel" />
          </label>
          <label className="commerce-checkbox">
            <input type="checkbox" name="isDefault" />
            <span>Set as default</span>
          </label>
          <button className="cinema-button" type="submit">
            <span>Save address</span>
            <i>↗</i>
          </button>
        </form>
        <div className="commerce-actions">
          <Link className="quiet-link" href="/account">Back to account</Link>
        </div>
      </section>
    </main>
  )
}
