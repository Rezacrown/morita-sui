# Basic Move Contract Example

A complete Sui Move smart contract demonstrating: object creation, events, OTW, init, capabilities, and composable functions. Save as `sources/demo.move` in your Move project.

## Full Contract

```move
/// Module: demo

module demo_package::demo;

use sui::object::{Self, UID};
use sui::tx_context::TxContext;
use sui::transfer;
use sui::event;
use sui::coin::{Self, TreasuryCap};

// ============================================================
// Events (copy + drop, past tense naming)
// ============================================================

/// Emitted when a new Item is created
public struct ItemCreated has copy, drop {
    item_id: address,
    creator: address,
    name: String,
    level: u64,
}

/// Emitted when an Item is upgraded
public struct ItemUpgraded has copy, drop {
    item_id: address,
    new_level: u64,
}

// ============================================================
// Objects
// ============================================================

/// A game item with key + store (any module can transfer)
public struct Item has key, store {
    id: UID,
    name: String,
    level: u64,
    owner: address,
}

/// AdminCap — capability pattern, suffixed with Cap
public struct AdminCap has key, store {
    id: UID,
}

// ============================================================
// One-Time Witness
// ============================================================

/// OTW — module name in all caps with only `drop`
public struct DEMO has drop {}

// ============================================================
// Init
// ============================================================

fun init(otw: DEMO, ctx: &mut TxContext) {
    // Create admin capability and send to deployer
    let cap = AdminCap { id: object::new(ctx) };
    transfer::transfer(cap, ctx.sender());

    // Optionally create a token
    let (treasury_cap, metadata) = coin::create_currency(
        otw,
        9,
        b"DEMO",
        b"Demo Token",
        b"A demo token for the demo module",
        option::none(),
        ctx,
    );
    transfer::public_freeze_object(metadata);
    transfer::transfer(treasury_cap, ctx.sender());
}

// ============================================================
// Public Functions (composable — return objects, don't transfer)
// ============================================================

/// Create a new Item. Returns it to the caller for PTB composability.
public fun create_item(name: String, ctx: &mut TxContext): Item {
    let id = object::new(ctx);
    let item = Item {
        id,
        name,
        level: 1,
        owner: ctx.sender(),
    };

    // Emit event
    emit(ItemCreated {
        item_id: id.to_bytes(),
        creator: ctx.sender().to_bytes(),
        name: item.name,
        level: item.level,
    });

    item
}

/// Upgrade an item's level (requires AdminCap)
public fun upgrade_item(item: &mut Item, _cap: &AdminCap, levels: u64) {
    item.level = item.level + levels;
    emit(ItemUpgraded {
        item_id: item.id.to_bytes(),
        new_level: item.level,
    });
}

/// Admin: destroy any item
public fun admin_destroy_item(item: Item, _cap: &AdminCap) {
    let Item { id, name: _, level: _, owner: _ } = item;
    id.delete();  // Must explicitly delete the UID
}

// ============================================================
// Entry Functions (convenience wrappers)
// ============================================================

/// Convenience: create and keep the item
entry fun create_and_keep(name: String, ctx: &mut TxContext) {
    let item = create_item(name, ctx);
    transfer::transfer(item, ctx.sender());
}

/// Convenience: create, upgrade, and keep
entry fun create_and_upgrade(name: String, cap: &AdminCap, ctx: &mut TxContext) {
    let mut item = create_item(name, ctx);
    upgrade_item(&mut item, cap, 2);
    transfer::transfer(item, ctx.sender());
}
```

## How to Use

### 1. Create Project & Deploy

```bash
sui move new demo_package
# Copy the contract to sources/demo.move
sui move build
sui client publish
```

### 2. Interact via CLI (PTB)

```bash
# Create an item
sui client ptb \
  --move-call <PACKAGE_ID>::demo::create_and_keep '"My Sword"' @sender

# Create, upgrade, and keep (chained)
sui client ptb \
  --move-call <PACKAGE_ID>::demo::create_item '"My Sword"' --assign item \
  --move-call <PACKAGE_ID>::demo::upgrade_item item @<ADMIN_CAP_ID> 3 \
  --transfer-objects "[item]" @sender
```

### 3. Interact via TypeScript

```typescript
import { Transaction } from '@mysten/sui/transactions'

const tx = new Transaction()
tx.moveCall({
    target: `${PACKAGE_ID}::demo::create_and_keep`,
    arguments: [tx.pure.string('My Sword')],
})

const result = await dAppKit.signAndExecuteTransaction({ transaction: tx })
```

## Key Patterns Demonstrated

- **Object structure**: `id: UID` as first field with `key` ability
- **Events**: `copy + drop`, past-tense naming (`ItemCreated`, `ItemUpgraded`)
- **OTW**: Module name in caps with only `drop`
- **Capabilities**: `AdminCap` suffixed with `Cap`
- **Composable functions**: `create_item` returns the object instead of transferring
- **Entry wrappers**: `create_and_keep` for convenience
- **Resource safety**: `id.delete()` when destroying objects
- **Type-level authorization**: `upgrade_item` requires `&AdminCap` reference
