import 'server-only'

import { createHash } from 'node:crypto'
import { collections } from './db'
import { backendEnv } from './env'
import { AppError } from './http'

export async function enforceRateLimit(input: {
  scope: string
  identity: string
  limit: number
  windowSeconds: number
}) {
  if (backendEnv.rateLimitSecret.length < 32) {
    throw new Error('RATE_LIMIT_SECRET must be at least 32 characters.')
  }

  const now = Date.now()
  const bucket = Math.floor(now / (input.windowSeconds * 1000))
  const digest = createHash('sha256')
    .update(`${backendEnv.rateLimitSecret}:${input.scope}:${input.identity}`)
    .digest('hex')
  const key = `${input.scope}:${bucket}:${digest}`
  const expiresAt = new Date((bucket + 1) * input.windowSeconds * 1000 + 60_000)
  const db = await collections()
  const result = await db.rateLimits.findOneAndUpdate(
    { key },
    {
      $inc: { count: 1 },
      $set: { updatedAt: new Date(now), expiresAt },
      $setOnInsert: { key, createdAt: new Date(now) },
    },
    { upsert: true, returnDocument: 'after' },
  )

  if (result && result.count > input.limit) {
    const retryAfter = Math.max(Math.ceil((expiresAt.getTime() - now - 60_000) / 1000), 1)
    throw new AppError(`Too many attempts. Try again in ${Math.ceil(retryAfter / 60)} minute(s).`, 429, 'RATE_LIMITED')
  }
}
