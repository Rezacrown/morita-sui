'use server'

import { db } from '@/lib/db'
import { claimCodes, itemTemplates } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'

export async function getClaimInfo(code: string) {
  const claim = await db.query.claimCodes.findFirst({
    where: (c, { eq }) => eq(c.code, code),
    with: {
      itemTemplate: true,
      game: { columns: { name: true } },
    },
  })
  if (!claim) return { isValid: false, errorMessage: 'Claim code not found' }
  if (claim.claimedAt) return { isValid: false, errorMessage: 'Already claimed' }
  if (new Date(claim.expiresAt) < new Date()) return { isValid: false, errorMessage: 'Claim code expired' }

  const tpl = claim.itemTemplate
  return {
    isValid: true,
    itemPreview: {
      name: tpl.name,
      imageBlobId: tpl.imageBlobId,
      gameName: claim.game.name,
      rarity: tpl.rarity,
      itemType: tpl.itemType,
    },
  }
}

export async function redeemClaimCode(code: string, playerAddress: string) {
  const [claim] = await db.select().from(claimCodes)
    .where(eq(claimCodes.code, code))
    .for('update')
    .limit(1)

  if (!claim) return { success: false, error: 'INVALID_CODE' }
  if (claim.claimedAt) return { success: false, error: 'CODE_CLAIMED' }
  if (new Date(claim.expiresAt) < new Date()) return { success: false, error: 'CODE_EXPIRED' }

  const template = await db.query.itemTemplates.findFirst({
    where: (t, { eq }) => eq(t.id, claim.itemTemplateId),
  })
  if (!template) return { success: false, error: 'TEMPLATE_NOT_FOUND' }

  if (!template.isNft) {
    const existingClaims = await db.select().from(claimCodes)
      .where(eq(claimCodes.itemTemplateId, template.id))
    if (existingClaims.length > 0) return { success: false, error: 'NFT_ALREADY_CLAIMED' }
  }

  await db.update(claimCodes)
    .set({ claimedAt: new Date(), claimedBy: playerAddress })
    .where(eq(claimCodes.code, code))

  return {
    success: true,
    txDigest: '',
    itemId: template.id.toString(),
    mintConfig: {
      itemId: template.id,
      itemType: template.itemType,
      rarity: template.rarity,
      blobId: template.metadataBlobId || template.imageBlobId || '',
      supply: template.isNft ? null : template.supply,
    },
  }
}
