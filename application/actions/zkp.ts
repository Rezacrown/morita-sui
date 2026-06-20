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
    jwt: input.jwt,
    ephemeralPublicKey: publicKey,
    randomness: input.randomness,
    maxEpoch: input.maxEpoch,
  })
}
