'use server'

import { sponsorForUser, executeUserSigned } from '@/lib/sui/enoki-client'
import * as mktSvc from '@/services/marketplace-service'

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

export const getMarketplaceListings = mktSvc.getListings
export const getListingDetail = mktSvc.getListingDetail
