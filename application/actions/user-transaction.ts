'use server'

import { sponsorForUser, executeUserSigned } from '@/lib/sui/enoki-client'

export async function sponsorTransaction(
  txBytesKind: string,
  userAddress: string,
  targets: string[],
) {
  return sponsorForUser(txBytesKind, userAddress, targets)
}

export async function executeTransaction(digest: string, signature: string) {
  return executeUserSigned(digest, signature)
}
