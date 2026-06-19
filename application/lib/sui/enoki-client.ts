import { EnokiClient } from '@mysten/enoki'

const apiKey = process.env.ENOKI_SECRET_KEY
export const enokiClient = apiKey ? new EnokiClient({ apiKey }) : null

export async function createSponsoredTx(
  txBytes: string,
  sender: string,
  allowedMoveCallTargets: string[],
  allowedAddresses: string[],
  network: string = 'testnet',
) {
  if (!enokiClient) throw new Error('ENOKI_SECRET_KEY not configured')
  return enokiClient.createSponsoredTransaction({
    network: network as any,
    transactionKindBytes: txBytes,
    sender,
    allowedMoveCallTargets,
    allowedAddresses,
  })
}

export async function executeSponsoredTx(digest: string, signature: string) {
  if (!enokiClient) throw new Error('ENOKI_SECRET_KEY not configured')
  return enokiClient.executeSponsoredTransaction({ digest, signature })
}
