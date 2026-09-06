import Link from 'next/link'
import { requireAdmin } from '@/lib/backend/auth'
import { collections } from '@/lib/backend/db'
import { isClerkConfigured, isMongoConfigured } from '@/lib/backend/env'
import { formatDate, formatGbp } from '@/lib/backend/format'
import type { OrderStatus } from '@/lib/backend/types'
import { updateOrderStatus } from './actions'

export const dynamic = 'force-dynamic'

const transitions: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PENDING: ['CANCELLED'],
  PAID: ['FULFILLING', 'REFUNDED'],
  FULFILLING: ['SHIPPED', 'REFUNDED'],
  SHIPPED: ['REFUNDED'],
  PARTIALLY_REFUNDED: ['REFUNDED'],
}

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ result?: string }> }) {
  if (!isMongoConfigured() || !isClerkConfigured()) {
    return (
      <main id="main-content" className="commerce-shell">
        <section className="commerce-panel">
          <p className="micro-label">3LOVE / ORDERS</p>
          <h1>Orders unavailable</h1>
          <p>Connect MongoDB and Clerk to manage orders.</p>
        </section>
      </main>
    )
  }

  await requireAdmin('/admin/orders')
  const { result } = await searchParams
  const db = await collections()
  const orders = await db.orders.find({}).sort({ createdAt: -1 }).toArray()

  return (
    <main id="main-content" className="commerce-shell">
      <section className="commerce-panel">
        <p className="micro-label">3LOVE / FULFILLMENT</p>
        <h1>Orders</h1>
        {result && (
          <p className={`commerce-message ${result === 'updated' ? 'is-success' : ''}`} role="status">
            {result === 'updated' && 'Order updated.'}
            {result === 'invalid-transition' && 'That status change is not allowed. Paid and refunded states must stay aligned with Stripe.'}
            {result === 'refund-pending' && 'Stripe accepted the refund. The order will update when Stripe confirms it.'}
            {result === 'missing-payment' && 'This order has no Stripe payment to refund.'}
            {result === 'not-found' && 'Order not found.'}
          </p>
        )}
        <div className="commerce-list">
          {orders.length === 0 ? (
            <p>No orders yet.</p>
          ) : orders.map((order) => (
            <article key={order._id.toHexString()} className="commerce-row admin-order-row">
              <div>
                <span>{formatDate(order.createdAt)}</span>
                <strong>{order.email}</strong>
                <em>{order.items.map((item) => `${item.quantity} x ${item.productName}`).join(', ')}</em>
                {/* Sent to Stripe as client_reference_id and as orderId in both
                    the session and payment-intent metadata, so it finds the
                    payment from either side. */}
                <code className="order-ref">
                  <b>REF</b>{order._id.toHexString()}
                </code>
              </div>
              <div>
                <strong>{formatGbp(order.totalGbpPence)}</strong>
                {order.stripePaymentIntent ? (
                  <code className="order-ref"><b>PAYMENT</b>{order.stripePaymentIntent}</code>
                ) : order.stripeSessionId ? (
                  <code className="order-ref"><b>SESSION</b>{order.stripeSessionId}</code>
                ) : (
                  <code className="order-ref is-muted"><b>PAYMENT</b>not started</code>
                )}
                {order.stripeRefundId && (
                  <code className="order-ref"><b>REFUND</b>{order.stripeRefundId}</code>
                )}
                <em>{order.shippingPostcode || 'Shipping from Stripe pending'}</em>
              </div>
              <form action={updateOrderStatus} className="commerce-inline-form">
                <input type="hidden" name="orderId" value={order._id.toHexString()} />
                <select name="status" defaultValue={order.status} aria-label={`Status for order ${order._id.toHexString()}`}>
                  <option value={order.status}>{order.status}</option>
                  {(transitions[order.status] ?? []).map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
                <button type="submit" disabled={(transitions[order.status] ?? []).length === 0}>Update</button>
              </form>
            </article>
          ))}
        </div>
        <div className="commerce-actions">
          <Link className="quiet-link" href="/admin">Back to admin</Link>
        </div>
      </section>
    </main>
  )
}
