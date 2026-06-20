'use server'

import { enokiClient } from '@/lib/sui/enoki-client'
import { Ed25519PublicKey } from '@mysten/sui/keypairs/ed25519'

export async function getZkp(input: {
  jwt: string
  ephemeralPublicKey: string
  randomness: string
  maxEpoch: number
}) {
  if (!enokiClient) throw new Error('ENOKI_SECRET_KEY not set')
  const publicKey = new Ed25519PublicKey(input.ephemeralPublicKey)
  return enokiClient.createZkLoginZkp({
    network: (process.env.NEXT_PUBLIC_SUI_NETWORK || 'testnet') as 'mainnet' | 'testnet' | 'devnet',
    jwt: input.jwt,
    ephemeralPublicKey: publicKey,
    randomness: input.randomness,
    maxEpoch: input.maxEpoch,
  })
}

export async function getNonce(ephemeralPublicKey: string, network: string) {
  if (!enokiClient) throw new Error('ENOKI_SECRET_KEY not set')
  const publicKey = new Ed25519PublicKey(ephemeralPublicKey)
  return enokiClient.createZkLoginNonce({
    network: network as 'mainnet' | 'testnet' | 'devnet',
    ephemeralPublicKey: publicKey,
  })
}

export async function getZkLoginInfo(jwt: string) {
  if (!enokiClient) throw new Error('ENOKI_SECRET_KEY not set')
  return enokiClient.getZkLogin({ jwt })
}
