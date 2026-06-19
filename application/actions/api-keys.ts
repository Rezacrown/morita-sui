'use server'

import { db } from '@/lib/db'
import { apiKeys } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import crypto from 'crypto'

export async function getApiKeys(gameId: number) {
  return db.select({
    id: apiKeys.id,
    keyPrefix: apiKeys.keyPrefix,
    isActive: apiKeys.isActive,
    lastUsedAt: apiKeys.lastUsedAt,
    createdAt: apiKeys.createdAt,
  }).from(apiKeys).where(eq(apiKeys.gameId, gameId)).orderBy(apiKeys.createdAt)
}

export async function generateApiKey(gameId: number) {
  const raw = `morita_sk_${crypto.randomBytes(32).toString('hex')}`
  const prefix = raw.slice(0, 16) + '...'
  const hash = crypto.createHash('sha256').update(raw).digest('hex')
  await db.insert(apiKeys).values({ gameId, keyHash: hash, keyPrefix: prefix })
  return { apiKey: raw }
}

export async function revokeApiKey(keyId: number) {
  const [updated] = await db.update(apiKeys)
    .set({ isActive: false })
    .where(eq(apiKeys.id, keyId))
    .returning()
  return updated
}

export async function validateApiKey(gameId: number, bearer: string) {
  const hash = crypto.createHash('sha256').update(bearer).digest('hex')
  const key = await db.query.apiKeys.findFirst({
    where: (k, { eq, and: _and }) => _and(
      eq(k.gameId, gameId),
      eq(k.keyHash, hash),
      eq(k.isActive, true),
    ),
  })
  if (key) {
    await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, key.id))
  }
  return !!key
}
