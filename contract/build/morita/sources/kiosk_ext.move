module morita::kiosk_ext;

use sui::kiosk::{Self, Kiosk, KioskOwnerCap};
use sui::coin::Coin;
use sui::sui::SUI;
use sui::object::{Self, ID};
use sui::transfer;
use sui::transfer_policy::{Self as tp, TransferPolicy};
use sui::tx_context::TxContext;
use sui::package::Publisher;
use sui::event;

use morita::item::GameItem;

public struct ItemListed has copy, drop { item_id: ID, kiosk_id: ID, price: u64, royalty_bps: Option<u64> }
public struct ItemSold has copy, drop { item_id: ID, seller: address, buyer: address, price: u64 }

public fun list_for_sale(
    item: GameItem,
    kiosk: &mut Kiosk,
    cap: &KioskOwnerCap,
    price: u64,
    royalty_bps: Option<u64>,
) {
    if (royalty_bps.is_some()) { assert!(*royalty_bps.borrow() <= 10000); };
    let item_id = object::id(&item);
    let kiosk_id = object::id(kiosk);
    kiosk.place(cap, item);
    kiosk::list<GameItem>(kiosk, cap, item_id, price);
    event::emit(ItemListed { item_id, kiosk_id, price, royalty_bps });
}

public fun buy_item(
    kiosk: &mut Kiosk,
    policy: &TransferPolicy<GameItem>,
    item_id: ID,
    payment: Coin<SUI>,
    ctx: &mut TxContext,
): GameItem {
    let price = payment.value();
    let (item, req) = kiosk::purchase<GameItem>(kiosk, item_id, payment);
    tp::confirm_request(policy, req);
    event::emit(ItemSold { item_id, seller: kiosk.owner(), buyer: ctx.sender(), price });
    item
}

public fun create_transfer_policy(pub_: &Publisher, ctx: &mut TxContext) {
    let (tp, cap) = tp::new<GameItem>(pub_, ctx);
    transfer::public_share_object(tp);
    transfer::public_transfer(cap, ctx.sender());
}
