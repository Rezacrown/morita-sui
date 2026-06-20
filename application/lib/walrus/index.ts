import { suiClient } from '@/lib/sui/client'
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography'
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519'

const AGGREGATOR = process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR || 'https://aggregator.walrus-testnet.walrus.space'

export function getBlobUrl(blobId: string): string {
  return `${AGGREGATOR}/v1/blobs/${blobId}`
}

export async function uploadItemImage(
  buffer: Uint8Array,
): Promise<{ blobId: string }> {
  const adminKey = process.env.ADMIN_PRIVATE_KEY
  if (!adminKey) throw new Error('ADMIN_PRIVATE_KEY not configured')

  const { secretKey } = decodeSuiPrivateKey(adminKey)
  const keypair = Ed25519Keypair.fromSecretKey(secretKey)

  const result = await suiClient.walrus.writeBlob({
    blob: buffer,
    epochs: 10,
    deletable: false,
    signer: keypair,
  })

  return { blobId: result.blobId }
}
