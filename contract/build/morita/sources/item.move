module morita::item;

use sui::object::{Self, ID, UID};
use sui::tx_context::TxContext;
use sui::event;
use std::string::String;

use morita::registry::{Self as reg, Game, GameCapability};

public struct GameItem has key, store {
    id: UID,
    game_id: ID,
    item_id: u64,
    item_type: String,
    rarity: String,
    blob_id: String,
    supply: Option<u64>,
}

public struct ItemMinted has copy, drop { item_id: ID, game_id: ID, recipient: address }
public struct ItemBurned has copy, drop { item_id: ID, game_id: ID }

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
    assert!(!reg::contains_minted_item(game, item_id));
    reg::add_minted_item(game, item_id);
    let gid = reg::game_id(game);
    let item = GameItem {
        id: object::new(ctx),
        game_id: gid,
        item_id, item_type, rarity, blob_id, supply,
    };
    event::emit(ItemMinted { item_id: object::id(&item), game_id: gid, recipient });
    item
}

public fun burn(item: GameItem, game: &mut Game, _cap: &GameCapability) {
    assert!(item.game_id == reg::game_id(game));
    let gid = reg::game_id(game);
    let item_obj_id = object::id(&item);
    let item_id = item.item_id;
    let GameItem { id, game_id: _, item_id: _, item_type: _, rarity: _, blob_id: _, supply: _ } = item;
    id.delete();
    reg::remove_minted_item(game, item_id);
    event::emit(ItemBurned { item_id: item_obj_id, game_id: gid });
}

public fun item_game_id(item: &GameItem): ID { item.game_id }
public fun item_item_id(item: &GameItem): u64 { item.item_id }
public fun item_item_type(item: &GameItem): String { item.item_type }
public fun item_rarity(item: &GameItem): String { item.rarity }
