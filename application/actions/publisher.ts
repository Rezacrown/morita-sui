'use server'

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
