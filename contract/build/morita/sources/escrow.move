module morita::escrow;

use std::option;
use std::string::String;
use sui::event;
use sui::object::{Self, ID, UID};
use sui::transfer;
use sui::tx_context::TxContext;
use sui::coin::Coin;
use sui::sui::SUI;

use morita::item::{GameItem, item_game_id, item_item_id, item_item_type, item_rarity};

public struct EscrowConditions has store, drop {
    item_id_target: Option<u64>,
    game_id_accept: Option<ID>,
    item_type_accept: Option<String>,
    rarity_accept: Option<String>,
}

public struct Escrow has key, store {
    id: UID,
    offer_item: Option<GameItem>,
    initiator: address,
    counterparty: Option<address>,
    conditions: EscrowConditions,
    is_active: bool,
}

// ── Events ──

public struct EscrowCreated has copy, drop {
    escrow_id: ID,
    initiator: address,
    offer_item_id: ID,
    counterparty: Option<address>,
}

public struct EscrowFulfilled has copy, drop {
    escrow_id: ID,
    fulfiller: address,
}

public struct EscrowCancelled has copy, drop {
    escrow_id: ID,
}

// ── Errors ──

#[error]
const EUNAUTHORIZED: vector<u8> = b"Not authorized";

#[error]
const EESCROW_INACTIVE: vector<u8> = b"Escrow already fulfilled or cancelled";

#[error]
const ECONDITION_MISMATCH: vector<u8> = b"Item does not match escrow conditions";

#[error]
const ESELF_FULFILL: vector<u8> = b"Cannot fulfill your own escrow";

#[error]
const ENOT_COUNTERPARTY: vector<u8> = b"Escrow is targeted but caller is not the counterparty";

// ── Helper: validate conditions ──

fun check_conditions(item: &GameItem, conditions: &EscrowConditions) {
    if (conditions.item_id_target.is_some()) {
        let target_id = *conditions.item_id_target.borrow();
        assert!(item_item_id(item) == target_id, ECONDITION_MISMATCH);
    };
    if (conditions.game_id_accept.is_some()) {
        let game_id = *conditions.game_id_accept.borrow();
        assert!(item_game_id(item) == game_id, ECONDITION_MISMATCH);
    };
    if (conditions.item_type_accept.is_some()) {
        let type_accepted = conditions.item_type_accept.borrow();
        assert!(&item_item_type(item) == type_accepted, ECONDITION_MISMATCH);
    };
    if (conditions.rarity_accept.is_some()) {
        let rarity_accepted = conditions.rarity_accept.borrow();
        assert!(&item_rarity(item) == rarity_accepted, ECONDITION_MISMATCH);
    };
}

// ── Functions ──

public fun lock_item_for_any(
    item: GameItem,
    conditions: EscrowConditions,
    ctx: &mut TxContext,
) {
    let offer_item_id = object::id(&item);
    let escrow = Escrow {
        id: object::new(ctx),
        offer_item: option::some(item),
        initiator: ctx.sender(),
        counterparty: option::none(),
        conditions,
        is_active: true,
    };
    let escrow_id = object::id(&escrow);
    event::emit(EscrowCreated {
        escrow_id,
        initiator: ctx.sender(),
        offer_item_id,
        counterparty: option::none(),
    });
    transfer::share_object(escrow);
}

public fun lock_item_for_target(
    item: GameItem,
    conditions: EscrowConditions,
    counterparty: address,
    ctx: &mut TxContext,
) {
    let offer_item_id = object::id(&item);
    let escrow = Escrow {
        id: object::new(ctx),
        offer_item: option::some(item),
        initiator: ctx.sender(),
        counterparty: option::some(counterparty),
        conditions,
        is_active: true,
    };
    let escrow_id = object::id(&escrow);
    event::emit(EscrowCreated {
        escrow_id,
        initiator: ctx.sender(),
        offer_item_id,
        counterparty: option::some(counterparty),
    });
    transfer::share_object(escrow);
}

public fun fulfill_escrow(
    escrow: &mut Escrow,
    my_item: GameItem,
    ctx: &mut TxContext,
): GameItem {
    assert!(escrow.is_active, EESCROW_INACTIVE);
    assert!(ctx.sender() != escrow.initiator, ESELF_FULFILL);
    if (escrow.counterparty.is_some()) {
        let counterparty = escrow.counterparty.borrow();
        assert!(ctx.sender() == *counterparty, ENOT_COUNTERPARTY);
    };
    check_conditions(&my_item, &escrow.conditions);

    let offered = option::extract(&mut escrow.offer_item);
    option::fill(&mut escrow.offer_item, my_item);
    escrow.is_active = false;

    event::emit(EscrowFulfilled { escrow_id: object::id(escrow), fulfiller: ctx.sender() });
    offered
}

public fun fulfill_escrow_with_value(
    escrow: &mut Escrow,
    my_item: GameItem,
    token_topup: Coin<SUI>,
    ctx: &mut TxContext,
): GameItem {
    assert!(escrow.is_active, EESCROW_INACTIVE);
    assert!(ctx.sender() != escrow.initiator, ESELF_FULFILL);
    if (escrow.counterparty.is_some()) {
        let counterparty = escrow.counterparty.borrow();
        assert!(ctx.sender() == *counterparty, ENOT_COUNTERPARTY);
    };
    check_conditions(&my_item, &escrow.conditions);

    let offered = option::extract(&mut escrow.offer_item);
    option::fill(&mut escrow.offer_item, my_item);
    escrow.is_active = false;

    // Send SUI top-up to the initiator as value gap compensation
    transfer::public_transfer(token_topup, escrow.initiator);

    event::emit(EscrowFulfilled { escrow_id: object::id(escrow), fulfiller: ctx.sender() });
    offered
}

public fun cancel_escrow(
    escrow: &mut Escrow,
    ctx: &mut TxContext,
): GameItem {
    assert!(ctx.sender() == escrow.initiator, EUNAUTHORIZED);
    assert!(escrow.is_active, EESCROW_INACTIVE);
    escrow.is_active = false;
    let item = option::extract(&mut escrow.offer_item);
    event::emit(EscrowCancelled { escrow_id: object::id(escrow) });
    item
}
