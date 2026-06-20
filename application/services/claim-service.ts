import { db } from '@/lib/db'
import { claimCodes, itemTemplates, games } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { executeAsAdmin } from '@/lib/sui/enoki-client'
import { mint } from '@/lib/sui/ptb'

export function generateClaimCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += '-'
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export async function createClaimCode(gameId: number, itemTemplateId: number, recipientId?: string) {
  const code = generateClaimCode()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
  await db.insert(claimCodes).values({ code, gameId, itemTemplateId, recipientIdentifier: recipientId || null, expiresAt })
  return code
}

export async function redeem(code: string, playerAddress: string) {
  const [claim] = await db.select().from(claimCodes).where(eq(claimCodes.code, code)).limit(1)
  if (!claim) return { success: false as const, error: 'INVALID_CODE' }
  if (claim.claimedAt) return { success: false as const, error: 'CLAIMED' }
  if (new Date(claim.expiresAt) < new Date()) return { success: false as const, error: 'EXPIRED' }

  const template = await db.query.itemTemplates.findFirst({ where: (t, { eq }) => eq(t.id, claim.itemTemplateId) })
  if (!template) return { success: false as const, error: 'TEMPLATE_NOT_FOUND' }

  const game = await db.query.games.findFirst({ where: (g, { eq }) => eq(g.id, claim.gameId) })
  if (!game?.suiGameId || !game?.gameCapabilityId) return { success: false as const, error: 'GAME_NOT_ONCHAIN' }

  try {
    const tx = mint(
      game.suiGameId, game.gameCapabilityId,
      template.id, template.itemType, template.rarity,
      template.metadataBlobId || template.imageBlobId || '',
      template.isNft ? null : template.supply,
      playerAddress,
    )
    const result = await executeAsAdmin(tx, [
      `${process.env.NEXT_PUBLIC_PACKAGE_ID}::item::mint`,
    ])

    await db.update(claimCodes).set({ claimedAt: new Date(), claimedBy: playerAddress }).where(eq(claimCodes.code, code))
    return { success: true as const, txDigest: result.digest }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'TX_FAILED'
    return { success: false as const, error: message }
  }
}
