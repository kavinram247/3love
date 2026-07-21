import Link from 'next/link'
import { requireCustomer } from '@/lib/backend/auth'
import { collections } from '@/lib/backend/db'
import { isClerkConfigured, isMongoConfigured } from '@/lib/backend/env'
import { formatDate, formatGbp, formatStatus } from '@/lib/backend/format'
import CheckoutCartCleanup from './CheckoutCartCleanup'

export const dynamic = 'force-dynamic'

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ checkout?: string; session_id?: string }> }) {
  if (!isMongoConfigured() || !isClerkConfigured()) {
    return (
      <main id="main-content" className="commerce-shell">
        <section className="commerce-panel">
          <p className="micro-label">3LOVE / ORDERS</p>
          <h1>Orders unavailable</h1>
          <p>Connect MongoDB and Clerk to enable order history.</p>
        </section>
      </main>
    )
  }

  const user = await requireCustomer('/account/orders')
  const db = await collections()
  const userId = user.id
  const [orders, query] = await Promise.all([
    db.orders.find({ userId }).sort({ createdAt: -1 }).toArray(),
    searchParams,
  ])
  const checkoutOrder = query.checkout === 'success' && query.session_id
    ? await db.orders.findOne({ userId, stripeSessionId: query.session_id })
    : null

  return (
    <main id="main-content" className="commerce-shell">
      {query.checkout === 'success' && <CheckoutCartCleanup />}
      <section className="commerce-panel">
        <p className="micro-label">3LOVE / ORDER HISTORY</p>
        <h1>Orders</h1>
        {query.checkout === 'success' && (
          <div className={`commerce-notice ${checkoutOrder && checkoutOrder.status !== 'PENDING' ? 'is-success' : ''}`} role="status">
            <strong>{checkoutOrder && checkoutOrder.status !== 'PENDING' ? 'Payment confirmed' : 'Checkout received'}</strong>
            <span>{checkoutOrder && checkoutOrder.status !== 'PENDING'
              ? 'Your order is in our system and ready for the next step.'
              : 'Stripe is confirming the payment. This page will show the updated status shortly.'}</span>
          </div>
        )}
        <div className="commerce-list">
          {orders.length === 0 ? (
            <p>No orders yet.</p>
          ) : orders.map((order) => (
            <article key={order._id.toHexString()} className="commerce-row">
              <div>
                <span>{formatDate(order.createdAt)}</span>
                <strong>{order.items.map((item) => item.productName).join(', ')}</strong>
                <em className={`status-badge status-${order.status.toLowerCase()}`}>{formatStatus(order.status)}</em>
              </div>
              <div>
                <strong>{formatGbp(order.totalGbpPence)}</strong>
                <Link href={`/account/orders/${order._id.toHexString()}`}>Details</Link>
              </div>
            </article>
          ))}
        </div>
        <div className="commerce-actions">
          <Link className="quiet-link" href="/account">Back to account</Link>
          <Link className="quiet-link" href="/">Return to experience</Link>
        </div>
      </section>
    </main>
  )
}
