module morita::registry;

use std::string::String;
use sui::event;
use sui::object::{Self, ID, UID};
use sui::table::{Self, Table};
use sui::transfer;
use sui::tx_context::TxContext;

public struct AdminCap has key, store { id: UID }

public struct Publisher has key, store {
    id: UID,
    name: String,
    owner: address,
    is_verified: bool,
}

public struct Game has key, store {
    id: UID,
    name: String,
    publisher_id: ID,
    created_at: u64,
    is_active: bool,
    minted_items: Table<u64, bool>,
}

public struct GameCapability has key, store {
    id: UID,
    game_id: ID,
}

public struct PublishTicket {
    game_id: ID,
    publisher_id: ID,
}

// ── Events ──

public struct PublisherCreated has copy, drop {
    publisher_id: ID,
    owner: address,
    name: String,
}

public struct GameCreated has copy, drop {
    game_id: ID,
    publisher_id: ID,
    name: String,
}

public struct GameShared has copy, drop {
    game_id: ID,
    publisher_id: ID,
    platform_addr: address,
}

public struct GameUpdated has copy, drop {
    game_id: ID,
    new_name: String,
}

public struct PublisherVerified has copy, drop {
    publisher_id: ID,
}

public struct GamePaused has copy, drop {
    game_id: ID,
}

public struct GameResumed has copy, drop {
    game_id: ID,
}

// ── Errors ──

#[error]
const EUNAUTHORIZED: vector<u8> = b"Not authorized";

#[error]
const ETICKET_MISMATCH: vector<u8> = b"PublishTicket does not correspond to this Game";

#[error]
const EGAME_PAUSED: vector<u8> = b"Game is paused";

// ── Public accessors for minted_items (cross-module access) ──

public fun contains_minted_item(game: &Game, item_id: u64): bool {
    table::contains(&game.minted_items, item_id)
}

public fun add_minted_item(game: &mut Game, item_id: u64) {
    table::add(&mut game.minted_items, item_id, true);
}

public fun remove_minted_item(game: &mut Game, item_id: u64) {
    table::remove(&mut game.minted_items, item_id);
}

public fun game_id(game: &Game): ID {
    object::id(game)
}

// ── Functions ──

public fun create_publisher(name: String, ctx: &mut TxContext): Publisher {
    let sender = ctx.sender();
    let publisher = Publisher {
        id: object::new(ctx),
        name,
        owner: sender,
        is_verified: false,
    };
    event::emit(PublisherCreated {
        publisher_id: object::id(&publisher),
        owner: sender,
        name: publisher.name,
    });
    publisher
}

public fun verify_publisher(publisher_id: ID, _admin: &AdminCap, _ctx: &mut TxContext) {
    event::emit(PublisherVerified { publisher_id });
}

public fun initiate_publish(publisher: &Publisher, name: String, ctx: &mut TxContext): (Game, PublishTicket) {
    assert!(publisher.owner == ctx.sender(), EUNAUTHORIZED);
    let game = Game {
        id: object::new(ctx),
        name,
        publisher_id: object::id(publisher),
        created_at: ctx.epoch_timestamp_ms(),
        is_active: true,
        minted_items: table::new(ctx),
    };
    let ticket = PublishTicket {
        game_id: object::id(&game),
        publisher_id: object::id(publisher),
    };
    event::emit(GameCreated {
        game_id: object::id(&game),
        publisher_id: object::id(publisher),
        name: game.name,
    });
    (game, ticket)
}

public fun finalize_publish(game: Game, ticket: PublishTicket, ctx: &mut TxContext): GameCapability {
    assert!(object::id(&game) == ticket.game_id, ETICKET_MISMATCH);
    let PublishTicket { game_id: _, publisher_id: _ } = ticket;
    let game_obj_id = object::id(&game);
    let cap = GameCapability { id: object::new(ctx), game_id: game_obj_id };
    transfer::share_object(game);
    event::emit(GameShared {
        game_id: game_obj_id,
        publisher_id: game_obj_id,
        platform_addr: ctx.sender(),
    });
    cap
}

public fun update_game(game: &mut Game, new_name: String) {
    assert!(game.is_active, EGAME_PAUSED);
    game.name = new_name;
    event::emit(GameUpdated { game_id: object::id(game), new_name });
}

public fun pause_game(game: &mut Game, _admin: &AdminCap) {
    game.is_active = false;
    event::emit(GamePaused { game_id: object::id(game) });
}

public fun resume_game(game: &mut Game, _admin: &AdminCap) {
    game.is_active = true;
    event::emit(GameResumed { game_id: object::id(game) });
}
