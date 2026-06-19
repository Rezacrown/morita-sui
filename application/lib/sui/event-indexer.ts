import { suiClient } from './client'

const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID || ''

export async function startEventIndexer() {
  if (!PACKAGE_ID) {
    console.warn('[event-indexer] PACKAGE_ID not configured, skipping')
    return
  }
  console.log('[event-indexer] gRPC event streaming not yet implemented for MVP')
  console.log('[event-indexer] Use Sui Explorer or manual DB inserts for event tracking')
}
