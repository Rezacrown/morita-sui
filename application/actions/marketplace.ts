'use server'

import { sponsorForUser, executeUserSigned } from '@/lib/sui/enoki-client'
import { suiClient } from '@/lib/sui/client'
import * as mktSvc from '@/services/marketplace-service'
import * as kioskSvc from '@/services/kiosk-service'

export async function sponsorTxBytes(
  txBytesKind: string,
  userAddress: string,
  targets: string[],
) {
  return sponsorForUser(txBytesKind, userAddress, targets)
}

export async function executeSignedTx(digest: string, signature: string) {
  return executeUserSigned(digest, signature)
}

export async function finalizeCancel(escrowId: string, digest: string) {
  const txResult = await suiClient.getTransaction({
    digest,
    include: { effects: true },
  })
  const tx = txResult.$kind === 'Transaction' ? txResult.Transaction : null
  if (!tx?.effects?.status.success) {
    return { success: false as const, error: 'Transaction failed on-chain' }
  }
  await mktSvc.markCancelled(escrowId)
  return { success: true as const }
}

export async function finalizeFulfill(escrowId: string, digest: string) {
  const txResult = await suiClient.getTransaction({
    digest,
    include: { effects: true },
  })
  const tx = txResult.$kind === 'Transaction' ? txResult.Transaction : null
  if (!tx?.effects?.status.success) {
    return { success: false as const, error: 'Transaction failed on-chain' }
  }
  await mktSvc.markFulfilled(escrowId)
  return { success: true as const }
}

export async function finalizeCreateBarter(data: {
  initiatorAddress: string
  conditionsJson: Record<string, unknown>
  offerGameId?: number
  offerItemBlobId?: string
}, digest: string) {
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
  const escrowId = createdIds.find((id) => types[id]?.includes('escrow::Escrow'))
  if (!escrowId) {
    return { success: false as const, error: 'Could not find Escrow in tx effects' }
  }

  const escrow = await mktSvc.createEscrowRecord(
    escrowId,
    data.initiatorAddress,
    data.conditionsJson,
    data.offerGameId,
    data.offerItemBlobId,
  )
  return { success: true as const, escrowId, escrow }
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

export const getMarketplaceListings = mktSvc.getListings
export const getListingDetail = mktSvc.getListingDetail
export const getSalesListings = kioskSvc.getActiveListings
