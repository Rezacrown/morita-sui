'use server'

import { db } from '@/lib/db'
import { itemTemplates } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function saveItemDraft(
  gameId: number,
  data: {
    name: string
    itemType: string
    rarity: string
    description?: string
    supply?: number
    isNft?: boolean
    attributes?: Record<string, string>
    imageBlobId?: string
    metadataBlobId?: string
  },
  itemId?: number,
) {
  if (itemId) {
    const existing = await db.query.itemTemplates.findFirst({
      where: (t, { eq }) => eq(t.id, itemId),
    })
    if (!existing || existing.status !== 'draft') throw new Error('Item not found or already published')
    const [updated] = await db.update(itemTemplates).set({
      name: data.name,
      itemType: data.itemType,
      rarity: data.rarity,
      description: data.description || null,
      supply: data.supply ?? 1,
      isNft: data.isNft ?? true,
      attributes: data.attributes || null,
      imageBlobId: data.imageBlobId || null,
      metadataBlobId: data.metadataBlobId || null,
    }).where(eq(itemTemplates.id, itemId)).returning()
    revalidatePath(`/dashboard/*/games/${gameId}/items`)
    return updated
  }

  const [created] = await db.insert(itemTemplates).values({
    gameId,
    name: data.name,
    itemType: data.itemType,
    rarity: data.rarity,
    description: data.description || null,
    supply: data.supply ?? 1,
    isNft: data.isNft ?? true,
    attributes: data.attributes || null,
    imageBlobId: data.imageBlobId || null,
    metadataBlobId: data.metadataBlobId || null,
  }).returning()
  revalidatePath(`/dashboard/*/games/${gameId}/items`)
  return created
}

export async function deleteItemDraft(itemId: number) {
  const item = await db.query.itemTemplates.findFirst({
    where: (t, { eq }) => eq(t.id, itemId),
  })
  if (!item || item.status !== 'draft') throw new Error('Item not found or already published')
  await db.delete(itemTemplates).where(eq(itemTemplates.id, itemId))
  revalidatePath(`/dashboard/*/games/${item.gameId}/items`)
}

export async function getItems(gameId: number, status?: string) {
  const conditions = [eq(itemTemplates.gameId, gameId)]
  if (status && status !== 'all') {
    conditions.push(eq(itemTemplates.status, status))
  }
  return db.select().from(itemTemplates).where(and(...conditions)).orderBy(itemTemplates.createdAt)
}

export async function getItemDetail(itemId: number) {
  return db.query.itemTemplates.findFirst({
    where: (t, { eq }) => eq(t.id, itemId),
  })
}
