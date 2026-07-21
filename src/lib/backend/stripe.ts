import 'server-only'

import Stripe from 'stripe'
import { backendEnv } from './env'

let stripe: Stripe | null = null

export function getStripe() {
  if (!backendEnv.stripeSecretKey) {
    throw new Error('STRIPE_SECRET_KEY is required for Stripe Checkout.')
  }

  if (!stripe) {
    stripe = new Stripe(backendEnv.stripeSecretKey, {
      apiVersion: '2026-05-27.dahlia',
      maxNetworkRetries: 2,
      timeout: 20_000,
      telemetry: false,
      appInfo: { name: '3love-storefront', version: '1.0.0' },
    })
  }

  return stripe
}
