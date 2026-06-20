module morita::registry;

use sui::object::{Self, ID, UID};
use sui::table::{Self, Table};
use sui::transfer;
use sui::tx_context::TxContext;
use sui::package;
use sui::event;

use std::string::{Self, String};

public struct REGISTRY has drop {}

public struct AdminCap has key, store { id: UID }
public struct GameCapability has key, store { id: UID, game_id: ID }
public struct PublishTicket { game_id: ID, publisher_id: ID }

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

public struct PublisherCreated has copy, drop { publisher_id: ID, owner: address, name: String }
public struct PublisherVerified has copy, drop { publisher_id: ID }
public struct GameCreated has copy, drop { game_id: ID, publisher_id: ID, name: String }
public struct GameShared has copy, drop { game_id: ID, publisher_id: ID }
public struct GameUpdated has copy, drop { game_id: ID, new_name: String }
public struct GamePaused has copy, drop { game_id: ID }
public struct GameResumed has copy, drop { game_id: ID }

fun init(otw: REGISTRY, ctx: &mut TxContext) {
    let publisher = package::claim(otw, ctx);
    transfer::public_transfer(publisher, ctx.sender());
    transfer::public_transfer(AdminCap { id: object::new(ctx) }, ctx.sender());
}

public fun create_publisher(name: String, ctx: &mut TxContext): Publisher {
    let pub_ = Publisher {
        id: object::new(ctx),
        name,
        owner: ctx.sender(),
        is_verified: false,
    };
    event::emit(PublisherCreated { publisher_id: object::id(&pub_), owner: ctx.sender(), name: pub_.name });
    pub_
}

public fun verify_publisher(_cap: &AdminCap, pub_: &mut Publisher) {
    pub_.is_verified = true;
    event::emit(PublisherVerified { publisher_id: object::id(pub_) });
}

public fun initiate_publish(pub_: &Publisher, name: String, ctx: &mut TxContext): (Game, PublishTicket) {
    assert!(pub_.owner == ctx.sender());
    let game = Game {
        id: object::new(ctx),
        name,
        publisher_id: object::id(pub_),
        created_at: ctx.epoch_timestamp_ms(),
        is_active: true,
        minted_items: table::new(ctx),
    };
    let gid = object::id(&game);
    let ticket = PublishTicket { game_id: gid, publisher_id: object::id(pub_) };
    event::emit(GameCreated { game_id: gid, publisher_id: object::id(pub_), name });
    (game, ticket)
}

public fun finalize_publish(game: Game, ticket: PublishTicket, platform_addr: address, ctx: &mut TxContext) {
    assert!(object::id(&game) == ticket.game_id);
    let PublishTicket { game_id: _, publisher_id } = ticket;
    let game_id = object::id(&game);
    let cap = GameCapability { id: object::new(ctx), game_id };
    transfer::share_object(game);
    transfer::public_transfer(cap, platform_addr);
    event::emit(GameShared { game_id, publisher_id });
}

public fun update_game(cap: &GameCapability, game: &mut Game, new_name: String) {
    assert!(object::id(game) == cap.game_id);
    assert!(game.is_active);
    game.name = new_name;
    event::emit(GameUpdated { game_id: object::id(game), new_name });
}

public fun pause_game(_cap: &AdminCap, game: &mut Game) {
    game.is_active = false;
    event::emit(GamePaused { game_id: object::id(game) });
}

public fun resume_game(_cap: &AdminCap, game: &mut Game) {
    game.is_active = true;
    event::emit(GameResumed { game_id: object::id(game) });
}

public fun game_id(game: &Game): ID { object::id(game) }
public fun contains_minted_item(game: &Game, item_id: u64): bool { table::contains(&game.minted_items, item_id) }
public fun add_minted_item(game: &mut Game, item_id: u64) { table::add(&mut game.minted_items, item_id, true); }
public fun remove_minted_item(game: &mut Game, item_id: u64) { table::remove(&mut game.minted_items, item_id); }
