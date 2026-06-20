'use server'

import { suiClient } from '@/lib/sui/client'
import { getOrCreateDev, getMyPublishers, createPublisherRecord } from '@/services/publisher-service'

export async function getSession(suiAddress: string) {
  if (!suiAddress) return { suiAddress: null, publishers: [], devId: null }
  const dev = await getOrCreateDev(suiAddress)
  const publishers = await getMyPublishers(dev.id)
  return { suiAddress, publishers, devId: dev.id }
}

export async function createPublisher(suiAddress: string, suiPublisherId: string, name: string, logoUrl?: string) {
  const dev = await getOrCreateDev(suiAddress)
  return createPublisherRecord(dev.id, suiPublisherId, name, logoUrl)
}

export async function finalizeCreatePublisher(suiAddress: string, name: string, digest: string) {
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
  const dev = await getOrCreateDev(suiAddress)
  const publisherId = createdIds.find((id) => types[id] && types[id].includes('registry::Publisher'))

  if (!publisherId) {
    return { success: false as const, error: 'Could not find Publisher in tx effects' }
  }

  const pub = await createPublisherRecord(dev.id, publisherId, name)
  return { success: true as const, publisher: pub }
}
