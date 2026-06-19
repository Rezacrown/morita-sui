import { Transaction } from '@mysten/sui/transactions'
import { bcs } from '@mysten/sui/bcs'

const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID || ''

export function buildMintPTB(
  gameId: string,
  gameCapId: string,
  itemId: number,
  itemType: string,
  rarity: string,
  blobId: string,
  supply: number | null,
  recipient: string,
) {
  const tx = new Transaction()
  const supplyArg = supply !== null
    ? tx.pure.option('u64', BigInt(supply))
    : tx.pure.option('u64', null)
  tx.moveCall({
    target: `${PACKAGE_ID}::item::mint`,
    arguments: [
      tx.object(gameId),
      tx.object(gameCapId),
      tx.pure.u64(itemId),
      tx.pure.string(itemType),
      tx.pure.string(rarity),
      tx.pure.string(blobId),
      supplyArg as any,
      tx.pure.address(recipient),
    ],
  })
  return tx
}

export function buildPublishPTB(publisherId: string, gameName: string) {
  const tx = new Transaction()
  const publisher = tx.object(publisherId)
  const [game, ticket] = tx.moveCall({
    target: `${PACKAGE_ID}::registry::initiate_publish`,
    arguments: [publisher, tx.pure.string(gameName)],
  })
  tx.moveCall({
    target: `${PACKAGE_ID}::registry::finalize_publish`,
    arguments: [
      game,
      ticket,
      tx.pure.address(process.env.NEXT_PUBLIC_PLATFORM_ADDR || ''),
    ],
  })
  return tx
}

export function buildListForSalePTB(
  itemId: string,
  kioskId: string,
  kioskOwnerCapId: string,
  price: number,
  royaltyBps: number | null,
) {
  const tx = new Transaction()
  const item = tx.object(itemId)
  const royaltyArg = royaltyBps !== null
    ? tx.pure.option('u64', BigInt(royaltyBps))
    : tx.pure.option('u64', null)
  tx.moveCall({
    target: `${PACKAGE_ID}::kiosk_ext::list_for_sale`,
    arguments: [
      item,
      tx.object(kioskId),
      tx.object(kioskOwnerCapId),
      tx.pure.u64(price),
      royaltyArg as any,
    ],
  })
  return tx
}

export function buildBuyItemPTB(
  kioskId: string,
  transferPolicyId: string,
  itemId: string,
  payment: number,
) {
  const tx = new Transaction()
  const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(payment)])
  tx.moveCall({
    target: `${PACKAGE_ID}::kiosk_ext::buy_item`,
    arguments: [
      tx.object(kioskId),
      tx.object(transferPolicyId),
      tx.pure.id(itemId),
      coin,
    ],
  })
  return tx
}

export function buildLockForAnyPTB(
  itemId: string,
  conditions: {
    itemIdTarget?: number | null
    gameIdAccept?: string | null
    itemTypeAccept?: string | null
    rarityAccept?: string | null
  },
) {
  const tx = new Transaction()
  const item = tx.object(itemId)

  function optU64(v: number | null | undefined) {
    return v != null ? tx.pure.option('u64', BigInt(v)) : tx.pure.option('u64', null)
  }
  function optId(v: string | null | undefined) {
    return v != null ? tx.pure.option('address', v as any) : tx.pure.option('address', null)
  }
  function optString(v: string | null | undefined) {
    const s = v ?? null
    return s != null ? tx.pure.option('string', s) : tx.pure.option('string', null)
  }

  const escrowConditions = tx.pure(
    bcs.struct('EscrowConditions', {
      item_id_target: bcs.option(bcs.u64()),
      game_id_accept: bcs.option(bcs.Address),
      item_type_accept: bcs.option(bcs.String),
      rarity_accept: bcs.option(bcs.String),
    }).serialize({
      item_id_target: conditions.itemIdTarget != null ? BigInt(conditions.itemIdTarget) : null,
      game_id_accept: conditions.gameIdAccept ?? null,
      item_type_accept: conditions.itemTypeAccept ?? null,
      rarity_accept: conditions.rarityAccept ?? null,
    }),
  )

  tx.moveCall({
    target: `${PACKAGE_ID}::escrow::lock_item_for_any`,
    arguments: [item, escrowConditions],
  })
  return tx
}

export function buildFulfillEscrowPTB(escrowId: string, myItemId: string) {
  const tx = new Transaction()
  const myItem = tx.object(myItemId)
  tx.moveCall({
    target: `${PACKAGE_ID}::escrow::fulfill_escrow`,
    arguments: [tx.object(escrowId), myItem],
  })
  return tx
}

export function buildCancelEscrowPTB(escrowId: string) {
  const tx = new Transaction()
  tx.moveCall({
    target: `${PACKAGE_ID}::escrow::cancel_escrow`,
    arguments: [tx.object(escrowId)],
  })
  return tx
}

export function buildFulfillEscrowWithValuePTB(
  escrowId: string,
  myItemId: string,
  topupAmount: number,
) {
  const tx = new Transaction()
  const myItem = tx.object(myItemId)
  const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(topupAmount)])
  tx.moveCall({
    target: `${PACKAGE_ID}::escrow::fulfill_escrow_with_value`,
    arguments: [tx.object(escrowId), myItem, coin],
  })
  return tx
}
