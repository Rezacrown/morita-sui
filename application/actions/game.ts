'use server'

import { db } from '@/lib/db'
import { games, publishers as publishersTable, apiKeys, itemTemplates } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import crypto from 'crypto'

function generateApiKey(): { raw: string; prefix: string; hash: string } {
  const raw = `morita_sk_${crypto.randomBytes(32).toString('hex')}`
  const prefix = raw.slice(0, 16) + '...'
  const hash = crypto.createHash('sha256').update(raw).digest('hex')
  return { raw, prefix, hash }
}

export async function createGame(
  publisherId: number,
  data: { name: string; description?: string; genre?: string; websiteUrl?: string },
) {
  const [game] = await db.insert(games).values({
    publisherId,
    name: data.name,
    description: data.description || null,
    genre: data.genre || null,
    websiteUrl: data.websiteUrl || null,
  }).returning()
  revalidatePath(`/dashboard/${publisherId}/games`)
  return game
}

export async function updateGame(
  gameId: number,
  data: { name?: string; description?: string; genre?: string; websiteUrl?: string },
) {
  const game = await db.query.games.findFirst({ where: (g, { eq }) => eq(g.id, gameId) })
  if (!game || game.status !== 'draft') throw new Error('Game not found or already published')
  const [updated] = await db.update(games).set({
    name: data.name,
    description: data.description,
    genre: data.genre,
    websiteUrl: data.websiteUrl,
  }).where(eq(games.id, gameId)).returning()
  revalidatePath(`/dashboard/*/games/${gameId}`)
  return updated
}

export async function deleteGame(gameId: number) {
  const game = await db.query.games.findFirst({ where: (g, { eq }) => eq(g.id, gameId) })
  if (!game || game.status !== 'draft') throw new Error('Game not found or already published')
  await db.delete(games).where(eq(games.id, gameId))
  revalidatePath(`/dashboard/${game.publisherId}/games`)
}

export async function getGames(publisherId: number) {
  return db.query.games.findMany({
    where: (g, { eq }) => eq(g.publisherId, publisherId),
    orderBy: (g, { desc }) => [desc(g.createdAt)],
  })
}

export async function getGameDetail(gameId: number) {
  const game = await db.query.games.findFirst({
    where: (g, { eq }) => eq(g.id, gameId),
  })
  if (!game) return null
  const items = await db.query.itemTemplates.findMany({
    where: (t, { eq }) => eq(t.gameId, gameId),
  })
  return {
    ...game,
    totalItems: items.length,
    publishedItems: items.filter((i) => i.status === 'published').length,
  }
}

export async function publishGameComplete(
  gameId: number,
  suiGameId: string,
  gameCapabilityId: string,
) {
  const game = await db.query.games.findFirst({ where: (g, { eq }) => eq(g.id, gameId) })
  if (!game || game.status !== 'draft') throw new Error('Game not found or already published')
  const [updated] = await db.update(games).set({
    suiGameId,
    gameCapabilityId,
    status: 'published',
  }).where(eq(games.id, gameId)).returning()

  await db.update(itemTemplates)
    .set({ status: 'published' })
    .where(eq(itemTemplates.gameId, gameId))

  const { raw, prefix, hash } = generateApiKey()
  await db.insert(apiKeys).values({ gameId, keyHash: hash, keyPrefix: prefix })

  revalidatePath(`/dashboard/${game.publisherId}/games/${gameId}`)
  return { game: updated, apiKey: raw }
}
