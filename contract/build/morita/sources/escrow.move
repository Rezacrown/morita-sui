module morita::escrow;

use sui::object::{Self, ID, UID};
use sui::transfer;
use sui::tx_context::TxContext;
use sui::coin::Coin;
use sui::sui::SUI;
use sui::event;
use std::option;
use std::string::String;

use morita::item::{Self, GameItem, item_game_id, item_item_id, item_item_type, item_rarity};

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

public struct EscrowCreated has copy, drop { escrow_id: ID, initiator: address }
public struct EscrowFulfilled has copy, drop { escrow_id: ID }
public struct EscrowCancelled has copy, drop { escrow_id: ID }

fun check_conditions(item: &GameItem, conditions: &EscrowConditions) {
    if (conditions.item_id_target.is_some()) { assert!(item_item_id(item) == *conditions.item_id_target.borrow()); };
    if (conditions.game_id_accept.is_some()) { assert!(item_game_id(item) == *conditions.game_id_accept.borrow()); };
    if (conditions.item_type_accept.is_some()) { assert!(&item_item_type(item) == conditions.item_type_accept.borrow()); };
    if (conditions.rarity_accept.is_some()) { assert!(&item_rarity(item) == conditions.rarity_accept.borrow()); };
}

fun new_escrow(item: GameItem, conditions: EscrowConditions, counterparty: Option<address>, ctx: &mut TxContext): Escrow {
    let escrow = Escrow {
        id: object::new(ctx),
        offer_item: option::some(item),
        initiator: ctx.sender(),
        counterparty,
        conditions,
        is_active: true,
    };
    event::emit(EscrowCreated { escrow_id: object::id(&escrow), initiator: ctx.sender() });
    escrow
}

public fun lock_item_for_any(item: GameItem, conditions: EscrowConditions, ctx: &mut TxContext) {
    transfer::share_object(new_escrow(item, conditions, option::none(), ctx));
}

public fun lock_item_for_target(item: GameItem, conditions: EscrowConditions, counterparty: address, ctx: &mut TxContext) {
    transfer::share_object(new_escrow(item, conditions, option::some(counterparty), ctx));
}

public fun fulfill_escrow(escrow: &mut Escrow, my_item: GameItem, ctx: &mut TxContext): GameItem {
    assert!(escrow.is_active);
    assert!(ctx.sender() != escrow.initiator);
    if (escrow.counterparty.is_some()) { assert!(ctx.sender() == *escrow.counterparty.borrow()); };
    check_conditions(&my_item, &escrow.conditions);
    let offered = option::extract(&mut escrow.offer_item);
    escrow.is_active = false;
    transfer::public_transfer(my_item, escrow.initiator);
    event::emit(EscrowFulfilled { escrow_id: object::id(escrow) });
    offered
}

public fun fulfill_escrow_with_value(escrow: &mut Escrow, my_item: GameItem, token_topup: Coin<SUI>, ctx: &mut TxContext): GameItem {
    assert!(escrow.is_active);
    assert!(ctx.sender() != escrow.initiator);
    if (escrow.counterparty.is_some()) { assert!(ctx.sender() == *escrow.counterparty.borrow()); };
    check_conditions(&my_item, &escrow.conditions);
    let offered = option::extract(&mut escrow.offer_item);
    escrow.is_active = false;
    transfer::public_transfer(my_item, escrow.initiator);
    transfer::public_transfer(token_topup, escrow.initiator);
    event::emit(EscrowFulfilled { escrow_id: object::id(escrow) });
    offered
}

public fun cancel_escrow(escrow: &mut Escrow, ctx: &mut TxContext): GameItem {
    assert!(ctx.sender() == escrow.initiator);
    assert!(escrow.is_active);
    escrow.is_active = false;
    let item = option::extract(&mut escrow.offer_item);
    event::emit(EscrowCancelled { escrow_id: object::id(escrow) });
    item
}
