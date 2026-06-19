'use server'

import { db } from '@/lib/db'
import { games, escrowIndex, txEvents } from '@/lib/db/schema'
import { eq, and, desc, sql } from 'drizzle-orm'

export async function getMarketplaceListings(filters: {
  type?: string
  gameId?: number
  itemType?: string
  rarity?: string
  sortBy?: string
  limit?: number
  offset?: number
}) {
  const limit = filters.limit || 20
  const offset = filters.offset || 0

  const escrows = await db.query.escrowIndex.findMany({
    where: (e, { eq, and: _and }) => {
      const conds = [eq(e.isActive, true)]
      if (filters.gameId) conds.push(eq(e.offerGameId, filters.gameId))
      return _and(...conds)
    },
    orderBy: (e, { desc }) => [desc(e.createdAt)],
    limit,
    offset,
  })

  return { listings: escrows.map((e) => ({ ...e, type: 'barter' })), total: escrows.length }
}

export async function getListingDetail(listingId: string) {
  const escrow = await db.query.escrowIndex.findFirst({
    where: (e, { eq }) => eq(e.escrowId, listingId),
  })
  if (escrow) return { ...escrow, type: 'barter' as const }
  return null
}

export async function createEscrowOnChain(suiAddress: string, escrowId: string, data: {
  initiatorAddress: string
  offerGameId?: number
  offerItemBlobId?: string
  conditionsJson: Record<string, unknown>
}) {
  const [index] = await db.insert(escrowIndex).values({
    escrowId,
    initiatorAddress: data.initiatorAddress,
    offerGameId: data.offerGameId || null,
    offerItemBlobId: data.offerItemBlobId || null,
    conditionsJson: data.conditionsJson as any,
  }).returning()
  return index
}

export async function fulfillEscrowOnChain(escrowId: string) {
  const [updated] = await db.update(escrowIndex)
    .set({ isActive: false, fulfilledAt: new Date() })
    .where(eq(escrowIndex.escrowId, escrowId))
    .returning()
  return updated
}

export async function cancelEscrowOnChain(escrowId: string) {
  const [updated] = await db.update(escrowIndex)
    .set({ isActive: false, cancelledAt: new Date() })
    .where(eq(escrowIndex.escrowId, escrowId))
    .returning()
  return updated
}
