import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ObjectId } from 'mongodb'
import { requireCustomer } from '@/lib/backend/auth'
import { collections } from '@/lib/backend/db'
import { isClerkConfigured, isMongoConfigured } from '@/lib/backend/env'
import { formatDate, formatGbp, formatStatus } from '@/lib/backend/format'

export const dynamic = 'force-dynamic'

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  if (!isMongoConfigured() || !isClerkConfigured()) notFound()

  const { id } = await params
  if (!ObjectId.isValid(id)) notFound()

  const user = await requireCustomer(`/account/orders/${id}`)
  const db = await collections()
  const order = await db.orders.findOne({ _id: new ObjectId(id), userId: user.id })

  if (!order) notFound()

  return (
    <main id="main-content" className="commerce-shell">
      <section className="commerce-panel">
        <p className="micro-label">3LOVE / ORDER DETAIL</p>
        <h1>{formatStatus(order.status)}</h1>
        <p>{formatDate(order.createdAt)}</p>
        <div className="commerce-list">
          {order.items.map((item) => (
            <article key={`${item.variantId}-${item.sku}`} className="commerce-row">
              <div>
                <span>{item.sku}</span>
                <strong>{item.productName} / {item.variantName}</strong>
                <em>Quantity {item.quantity}</em>
              </div>
              <strong>{formatGbp(item.totalGbpPence)}</strong>
            </article>
          ))}
        </div>
        <div className="commerce-total">
          <span>Subtotal</span>
          <strong>{formatGbp(order.subtotalGbpPence)}</strong>
        </div>
        <div className="commerce-total">
          <span>Shipping</span>
          <strong>{formatGbp(order.shippingGbpPence)}</strong>
        </div>
        <div className="commerce-total">
          <span>Tax</span>
          <strong>{formatGbp(order.taxGbpPence)}</strong>
        </div>
        <div className="commerce-total is-final">
          <span>Total</span>
          <strong>{formatGbp(order.totalGbpPence)}</strong>
        </div>
        <div className="commerce-actions">
          <Link className="quiet-link" href="/account/orders">Back to orders</Link>
          <Link className="quiet-link" href="/">Return to experience</Link>
        </div>
      </section>
    </main>
  )
}
