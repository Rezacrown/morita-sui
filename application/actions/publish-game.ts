'use server'

import { suiClient } from '@/lib/sui/client'
import { finalizePublish } from '@/services/game-service'

export async function finalizeGamePublish(gameId: number, digest: string) {
  const txResult = await suiClient.getTransaction({
    digest,
    include: { effects: true, objectTypes: true },
  })

  const tx = txResult.$kind === 'Transaction' ? txResult.Transaction : null
  if (!tx || !tx.effects || !tx.objectTypes) {
    return { success: false as const, error: 'Could not read transaction effects' }
  }

  const createdIds = tx.effects.changedObjects
    .filter((c) => c.idOperation === 'Created')
    .map((c) => c.objectId)

  const types = tx.objectTypes!
  const suiGameId = createdIds.find((id) => types[id] && types[id].includes('registry::Game'))
  const capId = createdIds.find((id) => types[id] && types[id].includes('registry::GameCapability'))

  if (!suiGameId || !capId) {
    return { success: false as const, error: 'Could not find Game or GameCapability in tx effects' }
  }

  const result = await finalizePublish(gameId, suiGameId, capId)
  return { success: true as const, game: result.game, apiKey: result.apiKey }
}
