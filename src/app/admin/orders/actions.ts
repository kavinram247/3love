'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { ObjectId } from 'mongodb'
import { requireAdmin } from '@/lib/backend/auth'
import { releaseOrderReservations } from '@/lib/backend/checkout'
import { collections } from '@/lib/backend/db'
import { getStripe } from '@/lib/backend/stripe'
import { orderStatuses, type OrderStatus } from '@/lib/backend/types'

function readField(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

function readOrderStatus(value: string) {
  return orderStatuses.includes(value as OrderStatus) ? value as OrderStatus : 'PENDING'
}

export async function updateOrderStatus(formData: FormData) {
  await requireAdmin('/admin/orders')

  const id = readField(formData, 'orderId')
  if (!id || !ObjectId.isValid(id)) return

  const db = await collections()
  const orderId = new ObjectId(id)
  const order = await db.orders.findOne({ _id: orderId })
  if (!order) redirect('/admin/orders?result=not-found')

  const nextStatus = readOrderStatus(readField(formData, 'status'))
  const allowed: Partial<Record<OrderStatus, OrderStatus[]>> = {
    PENDING: ['CANCELLED'],
    PAID: ['FULFILLING', 'REFUNDED'],
    FULFILLING: ['SHIPPED', 'REFUNDED'],
    SHIPPED: ['REFUNDED'],
    PARTIALLY_REFUNDED: ['REFUNDED'],
  }
  if (nextStatus === order.status) redirect('/admin/orders')
  if (!allowed[order.status]?.includes(nextStatus)) {
    redirect('/admin/orders?result=invalid-transition')
  }

  if (nextStatus === 'CANCELLED') {
    await releaseOrderReservations(id)
  } else if (nextStatus === 'REFUNDED') {
    if (!order.stripePaymentIntent) redirect('/admin/orders?result=missing-payment')
    const refund = await getStripe().refunds.create({
      payment_intent: order.stripePaymentIntent,
      reason: 'requested_by_customer',
      metadata: { orderId: id, clerkUserId: order.userId },
    }, { idempotencyKey: `order-refund/${id}` })
    if (refund.status === 'succeeded') {
      await db.orders.updateOne(
        { _id: orderId, status: order.status },
        {
          $set: {
            status: 'REFUNDED',
            stripeRefundId: refund.id,
            refundedGbpPence: order.totalGbpPence,
            updatedAt: new Date(),
          },
        },
      )
    } else {
      redirect('/admin/orders?result=refund-pending')
    }
  } else {
    await db.orders.updateOne(
      { _id: orderId, status: order.status },
      { $set: { status: nextStatus, updatedAt: new Date() } },
    )
  }

  revalidatePath('/admin/orders')
  redirect('/admin/orders?result=updated')
}
