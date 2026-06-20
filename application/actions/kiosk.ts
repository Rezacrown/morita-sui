'use server'

import { suiClient } from '@/lib/sui/client'
import * as kioskSvc from '@/services/kiosk-service'

export async function getMyKiosk(suiAddress: string) {
  const row = await kioskSvc.getKioskByAddress(suiAddress)
  if (!row) return null
  return { kioskId: row.kioskId, kioskOwnerCapId: row.kioskOwnerCapId }
}

export async function finalizeCreateKiosk(suiAddress: string, digest: string) {
  const txResult = await suiClient.getTransaction({
    digest,
    include: { effects: true, objectTypes: true },
  })

  const tx = txResult.$kind === 'Transaction' ? txResult.Transaction : null
  if (!tx?.effects?.status.success || !tx.objectTypes) {
    return { success: false as const, error: 'Transaction failed on-chain' }
  }

  const createdIds = tx.effects.changedObjects
    .filter((c) => c.idOperation === 'Created')
    .map((c) => c.objectId)

  const types = tx.objectTypes
  const kioskId = createdIds.find((id) => types[id]?.includes('0x2::kiosk::Kiosk'))
  const capId = createdIds.find((id) => types[id]?.includes('0x2::kiosk::KioskOwnerCap'))

  if (!kioskId || !capId) {
    return { success: false as const, error: 'Could not find Kiosk or KioskOwnerCap in tx effects' }
  }

  await kioskSvc.getOrCreateKioskRecord(suiAddress, kioskId, capId)
  return { success: true as const, kioskId, capId }
}

export async function finalizeListForSale(data: {
  itemObjectId: string
  sellerAddress: string
  kioskId: string
  price: string
  itemName: string
  itemType: string
  rarity: string
  gameName: string
}, digest: string) {
  const txResult = await suiClient.getTransaction({
    digest,
    include: { effects: true },
  })
  const tx = txResult.$kind === 'Transaction' ? txResult.Transaction : null
  if (!tx?.effects?.status.success) {
    return { success: false as const, error: 'Transaction failed on-chain' }
  }
  const listing = await kioskSvc.createListingRecord(data)
  return { success: true as const, listing }
}

export async function finalizeBuy(itemObjectId: string, digest: string) {
  const txResult = await suiClient.getTransaction({
    digest,
    include: { effects: true },
  })
  const tx = txResult.$kind === 'Transaction' ? txResult.Transaction : null
  if (!tx?.effects?.status.success) {
    return { success: false as const, error: 'Transaction failed on-chain' }
  }
  await kioskSvc.deactivateListing(itemObjectId)
  return { success: true as const }
}

export const getActiveListings = kioskSvc.getActiveListings
export const getMyKioskAction = kioskSvc.getKioskByAddress
