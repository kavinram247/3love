import 'server-only'

import type { WithId } from 'mongodb'
import { collections } from './db'
import type { SafeUser, UserDocument } from './types'

export type ClerkUserProfile = {
  clerkUserId: string
  email: string
  fullName: string | null
  emailVerified: boolean
  allowReactivation?: boolean
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function isDuplicateKeyError(error: unknown) {
  return Boolean(error && typeof error === 'object' && 'code' in error && error.code === 11000)
}

export function toSafeUser(user: WithId<UserDocument>): SafeUser {
  return {
    id: user.clerkUserId,
    email: user.email,
    fullName: user.fullName ?? null,
    role: user.role,
    emailVerified: Boolean(user.emailVerifiedAt),
  }
}

export async function syncClerkUserProfile(profile: ClerkUserProfile): Promise<SafeUser> {
  const clerkUserId = profile.clerkUserId.trim()
  const email = normalizeEmail(profile.email)
  const fullName = profile.fullName?.trim().slice(0, 120) || null
  if (!clerkUserId || clerkUserId.length > 256 || !email || email.length > 254) {
    throw new Error('Clerk returned an invalid user identity.')
  }

  const db = await collections()
  const now = new Date()
  const existing = await db.users.findOne({ clerkUserId })

  if (existing?._id) {
    if (existing.deletedAt && !profile.allowReactivation) return toSafeUser(existing)
    const emailVerifiedAt = profile.emailVerified
      ? existing.emailVerifiedAt ?? now
      : null
    const updated = await db.users.findOneAndUpdate(
      { _id: existing._id },
      {
        $set: {
          clerkUserId,
          email,
          fullName,
          emailVerifiedAt,
          deletedAt: null,
          lastSyncedAt: now,
          updatedAt: now,
        },
      },
      { returnDocument: 'after' },
    )
    if (!updated) throw new Error('The Clerk customer profile could not be updated.')
    return toSafeUser(updated)
  }

  try {
    const result = await db.users.insertOne({
      clerkUserId,
      email,
      fullName,
      phone: null,
      role: 'customer',
      stripeCustomerId: null,
      emailVerifiedAt: profile.emailVerified ? now : null,
      deletedAt: null,
      lastSyncedAt: now,
      createdAt: now,
      updatedAt: now,
    })
    const created = await db.users.findOne({ _id: result.insertedId })
    if (!created) throw new Error('The Clerk customer profile could not be created.')
    return toSafeUser(created)
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error
    const concurrent = await db.users.findOne({ clerkUserId })
    if (!concurrent) throw error
    return toSafeUser(concurrent)
  }
}

export async function markClerkUserDeleted(clerkUserId: string) {
  const now = new Date()
  const db = await collections()
  await Promise.all([
    db.users.updateOne(
      { clerkUserId },
      {
        $set: {
          email: `deleted+${clerkUserId}@users.invalid`,
          fullName: null,
          phone: null,
          role: 'customer',
          emailVerifiedAt: null,
          deletedAt: now,
          lastSyncedAt: now,
          updatedAt: now,
        },
      },
    ),
    db.addresses.deleteMany({ userId: clerkUserId }),
    db.carts.deleteMany({ userId: clerkUserId }),
  ])
}
