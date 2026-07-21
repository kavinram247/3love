import { withDb } from './mongodb-utils.mjs'

const clerkUserId = process.argv[2]?.trim()
const allowedAdmins = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean)

if (!clerkUserId || !/^user_[A-Za-z0-9_-]{8,}$/.test(clerkUserId)) {
  throw new Error('Usage: npm run db:promote-admin -- user_ClerkId')
}

await withDb(async (db) => {
  const user = await db.collection('users').findOne({ clerkUserId })
  if (!user) {
    throw new Error('Sign in once first (or deliver the Clerk user.created webhook), then run this command again.')
  }
  if (!allowedAdmins.includes(user.email)) {
    throw new Error(`${user.email} must be present in ADMIN_EMAILS before it can be promoted.`)
  }

  await db.collection('users').updateOne(
    { clerkUserId },
    { $set: { role: 'admin', updatedAt: new Date() } },
  )
  console.log(`Admin access granted to ${user.email} (${clerkUserId}).`)
})
