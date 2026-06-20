import { bcs } from '@mysten/sui/bcs'
import { Transaction, TransactionArgument } from '@mysten/sui/transactions'

const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID || ''

export function burn(gameId: string, capId: string, itemId: string) {
  const t = new Transaction()
  t.moveCall({
    target: `${PACKAGE_ID}::item::burn`,
    arguments: [t.object(itemId), t.object(gameId), t.object(capId)],
  })
  return t
}

export function createPublisher(name: string) {
  const t = new Transaction()
  t.moveCall({
    target: `${PACKAGE_ID}::registry::create_publisher`,
    arguments: [t.pure.string(name)],
  })
  return t
}

export function mint(gameId: string, capId: string, itemId: number, itemType: string, rarity: string, blobId: string, supply: number | null, recipient: string) {
  const t = new Transaction()
  t.moveCall({
    target: `${PACKAGE_ID}::item::mint`,
    arguments: [
      t.object(gameId), t.object(capId),
      t.pure.u64(itemId), t.pure.string(itemType), t.pure.string(rarity), t.pure.string(blobId),
      t.pure.option('u64', supply != null ? BigInt(supply) : null) as unknown as TransactionArgument,
      t.pure.address(recipient),
    ],
  })
  return t
}

export function publish(publisherId: string, gameName: string, platformAddr: string) {
  const t = new Transaction()
  const [game, ticket] = t.moveCall({
    target: `${PACKAGE_ID}::registry::initiate_publish`,
    arguments: [t.object(publisherId), t.pure.string(gameName)],
  })
  t.moveCall({
    target: `${PACKAGE_ID}::registry::finalize_publish`,
    arguments: [game, ticket, t.pure.address(platformAddr)],
  })
  return t
}

export function listForSale(itemId: string, kioskId: string, capId: string, price: number, royaltyBps: number | null) {
  const t = new Transaction()
  t.moveCall({
    target: `${PACKAGE_ID}::kiosk_ext::list_for_sale`,
    arguments: [
      t.object(itemId), t.object(kioskId), t.object(capId), t.pure.u64(price),
      t.pure.option('u64', royaltyBps != null ? BigInt(royaltyBps) : null) as unknown as TransactionArgument,
    ],
  })
  return t
}

export function buyItem(kioskId: string, policyId: string, itemId: string, price: number) {
  const t = new Transaction()
  const [coin] = t.splitCoins(t.gas, [t.pure.u64(price)])
  t.moveCall({
    target: `${PACKAGE_ID}::kiosk_ext::buy_item`,
    arguments: [t.object(kioskId), t.object(policyId), t.pure.id(itemId), coin],
  })
  return t
}

export interface EscrowConditions {
  itemIdTarget?: number | null
  gameIdAccept?: string | null
  itemTypeAccept?: string | null
  rarityAccept?: string | null
}

function serializeConditions(c: EscrowConditions) {
  return bcs.struct('EscrowConditions', {
    item_id_target: bcs.option(bcs.u64()),
    game_id_accept: bcs.option(bcs.Address),
    item_type_accept: bcs.option(bcs.String),
    rarity_accept: bcs.option(bcs.String),
  }).serialize({
    item_id_target: c.itemIdTarget != null ? BigInt(c.itemIdTarget) : null,
    game_id_accept: c.gameIdAccept ?? null,
    item_type_accept: c.itemTypeAccept ?? null,
    rarity_accept: c.rarityAccept ?? null,
  })
}

export function lockForAny(itemId: string, conditions: EscrowConditions) {
  const t = new Transaction()
  t.moveCall({
    target: `${PACKAGE_ID}::escrow::lock_item_for_any`,
    arguments: [t.object(itemId), t.pure(serializeConditions(conditions))],
  })
  return t
}

export function lockForTarget(itemId: string, conditions: EscrowConditions, counterparty: string) {
  const t = new Transaction()
  t.moveCall({
    target: `${PACKAGE_ID}::escrow::lock_item_for_target`,
    arguments: [t.object(itemId), t.pure(serializeConditions(conditions)), t.pure.address(counterparty)],
  })
  return t
}

export function fulfill(escrowId: string, myItemId: string) {
  const t = new Transaction()
  t.moveCall({
    target: `${PACKAGE_ID}::escrow::fulfill_escrow`,
    arguments: [t.object(escrowId), t.object(myItemId)],
  })
  return t
}

export function fulfillWithValue(escrowId: string, myItemId: string, topup: number) {
  const t = new Transaction()
  const [coin] = t.splitCoins(t.gas, [t.pure.u64(topup)])
  t.moveCall({
    target: `${PACKAGE_ID}::escrow::fulfill_escrow_with_value`,
    arguments: [t.object(escrowId), t.object(myItemId), coin],
  })
  return t
}

export function cancel(escrowId: string) {
  const t = new Transaction()
  t.moveCall({
    target: `${PACKAGE_ID}::escrow::cancel_escrow`,
    arguments: [t.object(escrowId)],
  })
  return t
}
