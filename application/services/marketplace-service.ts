import { db } from '@/lib/db'
import { escrowIndex } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

export type EscrowRow = {
  id: number
  escrowId: string
  initiatorAddress: string
  offerGameId: number | null
  offerItemBlobId: string | null
  conditionsJson: {
    item_id_target?: number | null
    game_id_accept?: string | null
    item_type_accept?: string | null
    rarity_accept?: string | null
  }
  isActive: boolean
  createdAt: Date
  fulfilledAt: Date | null
  cancelledAt: Date | null
}

export async function getListings(filters: {
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

  const rows = await db.query.escrowIndex.findMany({
    where: (e, { eq, and: _and }) => {
      const conds = [eq(e.isActive, true)]
      if (filters.gameId) conds.push(eq(e.offerGameId!, filters.gameId))
      return _and(...conds)
    },
    orderBy: (e, { desc }) => [desc(e.createdAt)],
    limit,
    offset,
  })

  return { listings: rows.map(r => ({ ...r, type: 'barter' as const })), total: rows.length }
}

export async function getListingDetail(listingId: string) {
  const row = await db.query.escrowIndex.findFirst({
    where: (e, { eq }) => eq(e.escrowId, listingId),
  })
  if (!row) return null
  return { ...row, type: 'barter' as const }
}

export async function createEscrowRecord(
  escrowId: string,
  initiatorAddress: string,
  conditionsJson: Record<string, unknown>,
  offerGameId?: number,
  offerItemBlobId?: string,
) {
  const [row] = await db.insert(escrowIndex).values({
    escrowId,
    initiatorAddress,
    conditionsJson: conditionsJson as any,
    offerGameId: offerGameId ?? null,
    offerItemBlobId: offerItemBlobId ?? null,
  }).returning()
  return row
}

export async function markFulfilled(escrowId: string) {
  const [row] = await db.update(escrowIndex)
    .set({ isActive: false, fulfilledAt: new Date() })
    .where(eq(escrowIndex.escrowId, escrowId))
    .returning()
  return row
}

export async function markCancelled(escrowId: string) {
  const [row] = await db.update(escrowIndex)
    .set({ isActive: false, cancelledAt: new Date() })
    .where(eq(escrowIndex.escrowId, escrowId))
    .returning()
  return row
}
