import 'server-only'

import { auth, currentUser } from '@clerk/nextjs/server'
import { ObjectId } from 'mongodb'
import { redirect } from 'next/navigation'
import { collections } from './db'
import { backendEnv, isClerkConfigured, isMongoConfigured } from './env'
import type { SafeUser } from './types'
import { syncClerkUserProfile, toSafeUser } from './users'

function safeReturnTo(value: string, fallback: string) {
  return value.startsWith('/') && !value.startsWith('//') ? value : fallback
}

export async function getServerUser(): Promise<SafeUser | null> {
  if (!isMongoConfigured() || !isClerkConfigured()) return null

  const { userId } = await auth()
  if (!userId) return null

  const db = await collections()
  const localUser = await db.users.findOne({ clerkUserId: userId })
  if (localUser && !localUser.deletedAt) return toSafeUser(localUser)

  const clerkUser = await currentUser()
  if (!clerkUser || clerkUser.id !== userId) return null

  const primaryEmail = clerkUser.primaryEmailAddress
    ?? clerkUser.emailAddresses.find((address) => address.verification?.status === 'verified')
    ?? clerkUser.emailAddresses[0]
  if (!primaryEmail?.emailAddress) {
    throw new Error('A Clerk account email is required to use customer features.')
  }

  return syncClerkUserProfile({
    clerkUserId: clerkUser.id,
    email: primaryEmail.emailAddress,
    fullName: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || null,
    emailVerified: primaryEmail.verification?.status === 'verified',
    allowReactivation: true,
  })
}

export async function requireCustomer(returnTo = '/account') {
  const user = await getServerUser()
  if (!user) {
    const destination = safeReturnTo(returnTo, '/account')
    redirect(`/login?redirect_url=${encodeURIComponent(destination)}`)
  }
  return user
}

export async function requireAdmin(returnTo = '/admin') {
  const user = await requireCustomer(returnTo)
  if (!user.emailVerified || user.role !== 'admin' || !backendEnv.adminEmails.includes(user.email)) {
    redirect('/account?admin=denied')
  }
  return { user }
}

export function parseObjectId(id: string) {
  if (!ObjectId.isValid(id)) throw new Error('Invalid id.')
  return new ObjectId(id)
}
