module morita::item;

use std::string::String;
use sui::event;
use sui::object::{Self, ID, UID};
use sui::transfer;
use sui::tx_context::TxContext;

use morita::registry::{Game, GameCapability, contains_minted_item, add_minted_item, remove_minted_item, game_id};

public struct GameItem has key, store {
    id: UID,
    game_id: ID,
    item_id: u64,
    item_type: String,
    rarity: String,
    blob_id: String,
    supply: Option<u64>,
}

// ── Events ──

public struct ItemMinted has copy, drop {
    item_id: ID,
    game_id: ID,
    recipient: address,
    blob_id: String,
}

public struct ItemBurned has copy, drop {
    item_id: ID,
    game_id: ID,
}

// ── Errors ──

#[error]
const EITEM_EXISTS: vector<u8> = b"Item with this item_id already minted for this game";

#[error]
const EITEM_GAME_MISMATCH: vector<u8> = b"Item does not belong to this Game";

// ── Public accessors ──

public fun item_game_id(item: &GameItem): ID { item.game_id }
public fun item_item_id(item: &GameItem): u64 { item.item_id }
public fun item_item_type(item: &GameItem): String { item.item_type }
public fun item_rarity(item: &GameItem): String { item.rarity }

// ── Functions ──

public fun mint(
    game: &mut Game,
    _cap: &GameCapability,
    item_id: u64,
    item_type: String,
    rarity: String,
    blob_id: String,
    supply: Option<u64>,
    recipient: address,
    ctx: &mut TxContext,
): GameItem {
    assert!(!contains_minted_item(game, item_id), EITEM_EXISTS);
    add_minted_item(game, item_id);

    let item = GameItem {
        id: object::new(ctx),
        game_id: game_id(game),
        item_id,
        item_type,
        rarity,
        blob_id,
        supply,
    };
    let item_obj_id = object::id(&item);
    let game_obj_id = game_id(game);
    let blob = item.blob_id;
    event::emit(ItemMinted { item_id: item_obj_id, game_id: game_obj_id, recipient, blob_id: blob });
    item
}

public fun burn(
    item: GameItem,
    game: &mut Game,
    _cap: &GameCapability,
) {
    assert!(item.game_id == game_id(game), EITEM_GAME_MISMATCH);
    let item_obj_id = object::id(&item);
    let game_obj_id = game_id(game);
    let GameItem { id, game_id: _, item_id, item_type: _, rarity: _, blob_id: _, supply: _ } = item;
    id.delete();
    remove_minted_item(game, item_id);
    event::emit(ItemBurned { item_id: item_obj_id, game_id: game_obj_id });
}
