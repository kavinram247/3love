'use client'

import { useEffect } from 'react'

export default function CheckoutCartCleanup() {
  useEffect(() => {
    try {
      window.localStorage.removeItem('3love-cart-v1')
    } catch {
      // Storage may be disabled; the server cart is finalized by the Stripe webhook.
    }
  }, [])

  return null
}
