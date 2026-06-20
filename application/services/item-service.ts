import { db } from '@/lib/db'
import { itemTemplates, claimCodes } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export async function saveDraft(gameId: number, data: {
  name: string; itemType: string; rarity: string; description?: string
  supply?: number; isNft?: boolean; attributes?: Record<string, string>
  imageBlobId?: string; metadataBlobId?: string
}, itemId?: number) {
  if (itemId) {
    const existing = await db.query.itemTemplates.findFirst({ where: (t, { eq }) => eq(t.id, itemId) })
    if (!existing || existing.status !== 'draft') throw new Error('Cannot edit published item')
    const [upd] = await db.update(itemTemplates).set({
      name: data.name, itemType: data.itemType, rarity: data.rarity,
      description: data.description || null, supply: data.supply ?? 1, isNft: data.isNft ?? true,
      attributes: data.attributes || null, imageBlobId: data.imageBlobId || null, metadataBlobId: data.metadataBlobId || null,
    }).where(eq(itemTemplates.id, itemId)).returning()
    return upd
  }
  const [created] = await db.insert(itemTemplates).values({ gameId, ...data, supply: data.supply ?? 1, isNft: data.isNft ?? true }).returning()
  return created
}

export async function deleteDraft(itemId: number) {
  const item = await db.query.itemTemplates.findFirst({ where: (t, { eq }) => eq(t.id, itemId) })
  if (!item || item.status !== 'draft') throw new Error('Cannot delete published item')
  await db.delete(itemTemplates).where(eq(itemTemplates.id, itemId))
}

export async function listItems(gameId: number, status?: string) {
  const conds = [eq(itemTemplates.gameId, gameId)]
  if (status && status !== 'all') conds.push(eq(itemTemplates.status, status))
  return db.select().from(itemTemplates).where(and(...conds)).orderBy(itemTemplates.createdAt)
}

export async function getItem(itemId: number) { return db.query.itemTemplates.findFirst({ where: (t, { eq }) => eq(t.id, itemId) }) }

export async function getClaimInfo(code: string) {
  const c = await db.query.claimCodes.findFirst({ where: (c, { eq }) => eq(c.code, code), with: { itemTemplate: true, game: { columns: { name: true } } } })
  if (!c) return null
  if (c.claimedAt) return { error: 'claimed' } as const
  if (new Date(c.expiresAt) < new Date()) return { error: 'expired' } as const
  return { code: c.code, itemName: c.itemTemplate.name, imageBlobId: c.itemTemplate.imageBlobId, gameName: c.game.name, rarity: c.itemTemplate.rarity, itemType: c.itemTemplate.itemType, itemTemplateId: c.itemTemplateId }
}
