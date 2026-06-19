module morita::kiosk_ext;

use sui::event;
use sui::kiosk::{Self, Kiosk, KioskOwnerCap};
use sui::coin::Coin;
use sui::sui::SUI;
use sui::object::{Self, ID};
use sui::transfer_policy::{Self, TransferPolicy};
use sui::tx_context::TxContext;

use morita::item::GameItem;

// ── Events ──

public struct ItemListed has copy, drop {
    item_id: ID,
    kiosk_id: ID,
    price: u64,
    royalty_bps: Option<u64>,
}

public struct ItemSold has copy, drop {
    item_id: ID,
    seller: address,
    buyer: address,
    price: u64,
}

// ── Errors ──

#[error]
const EINVALID_ROYALTY: vector<u8> = b"Royalty basis points must be 0-10000";

// ── Functions ──

public fun list_for_sale(
    item: GameItem,
    kiosk: &mut Kiosk,
    kiosk_owner_cap: &KioskOwnerCap,
    price: u64,
    royalty_bps: Option<u64>,
    _ctx: &mut TxContext,
) {
    if (royalty_bps.is_some()) {
        let bps = royalty_bps.borrow();
        assert!(*bps <= 10000, EINVALID_ROYALTY);
    };
    let item_id = object::id(&item);
    let kiosk_id = object::id(kiosk);
    kiosk.place(kiosk_owner_cap, item);
    kiosk::list<GameItem>(kiosk, kiosk_owner_cap, item_id, price);
    event::emit(ItemListed {
        item_id,
        kiosk_id,
        price,
        royalty_bps,
    });
}

public fun buy_item(
    kiosk: &mut Kiosk,
    transfer_policy: &TransferPolicy<GameItem>,
    item_id: ID,
    payment: Coin<SUI>,
    ctx: &mut TxContext,
): GameItem {
    let price = payment.value();
    let (item, transfer_req) = kiosk::purchase<GameItem>(kiosk, item_id, payment);
    transfer_policy::confirm_request(transfer_policy, transfer_req);
    event::emit(ItemSold { item_id, seller: kiosk.owner(), buyer: ctx.sender(), price });
    item
}
