'use server'

import { suiClient } from '@/lib/sui/client'
import { db } from '@/lib/db'
import { games, itemCache } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

const GAME_ITEM_TYPE = `${process.env.NEXT_PUBLIC_PACKAGE_ID}::item::GameItem`

type InventoryItem = {
  objectId: string
  name: string
  gameName: string
  itemType: string
  rarity: string
  blobId: string
  gameId: string
  imageUrl: string | null
}

export async function getInventory(address: string): Promise<InventoryItem[]> {
  const result = await suiClient.listOwnedObjects({
    owner: address,
    type: GAME_ITEM_TYPE,
    include: { json: true },
  })

  const items: InventoryItem[] = []

  for (const obj of result.objects) {
    const d = obj.json as Record<string, unknown> | null
    if (!d) continue

    const blobId = d.blob_id as string | undefined
    const rarity = d.rarity as string || ''
    const itemType = d.item_type as string || ''
    const gameId = d.game_id as string || ''

    let name = ''
    let imageUrl: string | null = null
    if (blobId) {
      const cached = await db.query.itemCache.findFirst({
        where: (c, { eq }) => eq(c.blobId, blobId),
      })
      if (cached) {
        name = cached.name
        imageUrl = cached.imageBlobId
          ? `${process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR}/v1/blobs/${cached.imageBlobId}`
          : null
      }
    }

    items.push({ objectId: obj.objectId, name, gameName: '', itemType, rarity, blobId: blobId ?? '', gameId, imageUrl })
  }

  return items
}

export async function getInventoryItem(objectId: string): Promise<InventoryItem | null> {
  const obj = await suiClient.getObject({
    objectId,
    include: { json: true },
  })

  const d = obj.object.json as Record<string, unknown> | null
  if (!d) return null

  const blobId = d.blob_id as string | undefined
  const rarity = d.rarity as string || ''
  const itemType = d.item_type as string || ''
  const gameId = d.game_id as string || ''

  let name = ''
  let imageUrl: string | null = null
  let gameName = ''
  if (blobId) {
    const cached = await db.query.itemCache.findFirst({
      where: (c, { eq }) => eq(c.blobId, blobId),
    })
    if (cached) {
      name = cached.name
      imageUrl = cached.imageBlobId
        ? `${process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR}/v1/blobs/${cached.imageBlobId}`
        : null
    }
  }

  return { objectId: obj.object.objectId, name, gameName, itemType, rarity, blobId: blobId ?? '', gameId, imageUrl }
}
