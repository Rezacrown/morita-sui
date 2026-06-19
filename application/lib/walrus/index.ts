import { SuiGrpcClient } from '@mysten/sui/grpc'
import { WalrusClient } from '@mysten/walrus'
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519'
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography'

const AGGREGATOR = 'https://aggregator.walrus-testnet.walrus.space'

export function getBlobUrl(blobId: string): string {
  return `${AGGREGATOR}/v1/blobs/${blobId}`
}

export async function uploadBlob(
  data: Uint8Array,
  epochs: number = 10,
  deletable: boolean = false,
): Promise<{ blobId: string; objectId: string }> {
  const adminKey = process.env.ADMIN_PRIVATE_KEY
  if (!adminKey) throw new Error('ADMIN_PRIVATE_KEY not configured')

  const { secretKey } = decodeSuiPrivateKey(adminKey)
  const keypair = Ed25519Keypair.fromSecretKey(secretKey)

  const suiClient = new SuiGrpcClient({
    network: 'testnet',
    baseUrl: 'https://rpc.testnet.sui.io:443',
  })

  const walrusClient = new WalrusClient({
    network: 'testnet',
    suiClient,
    uploadRelay: { url: 'https://relay.walrus-testnet.walrus.space' } as any,
  })

  const result = await walrusClient.writeBlob({
    blob: data,
    epochs,
    deletable,
    signer: keypair,
  })

  return { blobId: result.blobId, objectId: result.blobObject.id }
}
