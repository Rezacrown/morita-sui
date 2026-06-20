'use server'

import { suiClient } from '@/lib/sui/client'

const GAME_ITEM_TYPE = `${process.env.NEXT_PUBLIC_PACKAGE_ID}::item::GameItem`

export type OnChainItem = {
  objectId: string
  itemId: number
  itemType: string
  rarity: string
  blobId: string
}

export async function getOnChainItems(gameId: string): Promise<OnChainItem[]> {
  const result = await suiClient.listOwnedObjects({
    owner: process.env.NEXT_PUBLIC_PLATFORM_ADDR!,
    type: GAME_ITEM_TYPE,
    include: { json: true },
  })

  return result.objects
    .map((obj) => {
      const d = obj.json as Record<string, unknown> | null
      if (!d) return null
      const objGameId = d.game_id as string
      if (objGameId !== gameId) return null
      return {
        objectId: obj.objectId,
        itemId: Number(d.item_id as string),
        itemType: d.item_type as string,
        rarity: d.rarity as string,
        blobId: d.blob_id as string,
      }
    })
    .filter((i): i is OnChainItem => i !== null)
}
