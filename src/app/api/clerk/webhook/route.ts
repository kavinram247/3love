import { verifyWebhook } from '@clerk/nextjs/webhooks'
import { NextRequest, NextResponse } from 'next/server'
import { backendEnv, isMongoConfigured } from '@/lib/backend/env'
import { markClerkUserDeleted, syncClerkUserProfile } from '@/lib/backend/users'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  if (!isMongoConfigured() || !backendEnv.clerkWebhookSigningSecret) {
    return NextResponse.json({ error: 'Clerk webhook is not configured.' }, { status: 503 })
  }

  let event: Awaited<ReturnType<typeof verifyWebhook>>
  try {
    event = await verifyWebhook(request, { signingSecret: backendEnv.clerkWebhookSigningSecret })
  } catch (error) {
    console.warn('Rejected an invalid Clerk webhook.', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Invalid Clerk webhook signature.' }, { status: 400 })
  }

  try {
    if (event.type === 'user.created' || event.type === 'user.updated') {
      const primaryEmail = event.data.email_addresses.find(
        (address) => address.id === event.data.primary_email_address_id,
      ) ?? event.data.email_addresses.find((address) => address.verification?.status === 'verified')
        ?? event.data.email_addresses[0]

      if (!primaryEmail?.email_address) {
        throw new Error(`Clerk user ${event.data.id} has no email address.`)
      }

      await syncClerkUserProfile({
        clerkUserId: event.data.id,
        email: primaryEmail.email_address,
        fullName: [event.data.first_name, event.data.last_name].filter(Boolean).join(' ') || null,
        emailVerified: primaryEmail.verification?.status === 'verified',
      })
    }

    if (event.type === 'user.deleted' && event.data.id) {
      await markClerkUserDeleted(event.data.id)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error(`Clerk webhook ${event.type} could not be processed.`, error)
    return NextResponse.json({ error: 'Clerk webhook processing failed.' }, { status: 500 })
  }
}
