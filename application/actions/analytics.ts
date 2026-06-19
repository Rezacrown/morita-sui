'use server'

import { db } from '@/lib/db'
import { txEvents, claimCodes, games } from '@/lib/db/schema'
import { eq, gte, and, sql } from 'drizzle-orm'

export async function getPublisherAnalytics(publisherId: number, timeRange: string = '7d') {
  const publisherGames = await db.select({ id: games.id }).from(games)
    .where(eq(games.publisherId, publisherId))
  const gameIds = publisherGames.map((g) => g.id)
  if (gameIds.length === 0) return { totalMinted: 0, totalClaimed: 0, activePlayers: 0, txVolume: 0 }

  const days = timeRange === '30d' ? 30 : timeRange === 'all' ? 0 : 7
  const since = days > 0 ? new Date(Date.now() - days * 86400000) : new Date(0)

  const minted = await db.select({ count: sql<number>`count(*)::int` }).from(txEvents)
    .where(eq(txEvents.eventType, 'ItemMinted'))

  const claimedResult = await db.select({ count: sql<number>`count(*)::int` }).from(claimCodes)
    .where(gte(claimCodes.createdAt, since))

  return {
    totalMinted: minted[0]?.count || 0,
    totalClaimed: claimedResult[0]?.count || 0,
    activePlayers: 0,
    txVolume: 0,
  }
}

export async function getPublisherActivity(
  publisherId: number,
  filters?: { gameId?: number; eventType?: string; limit?: number; offset?: number },
) {
  const limit = filters?.limit || 50
  const offset = filters?.offset || 0

  const publisherGames = await db.select({ id: games.id }).from(games)
    .where(eq(games.publisherId, publisherId))
  const gameIds = publisherGames.map((g) => g.id)
  if (gameIds.length === 0) return []

  const conditions = [eq(txEvents.gameId, gameIds[0])]
  if (filters?.eventType && filters.eventType !== 'all') {
    conditions.push(eq(txEvents.eventType, filters.eventType))
  }

  return db.select().from(txEvents)
    .where(and(...conditions))
    .orderBy(txEvents.createdAt)
    .limit(limit)
    .offset(offset)
}
