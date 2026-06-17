# Sui Object Model

## Object Structure

Every Sui object contains four components:

- **Globally unique ID**: 32-byte identifier (never changes)
- **Version number**: 8-byte integer incremented on each modification (Lamport timestamps)
- **Owner field**: 32-byte value (address, object ID, or sentinel for shared/immutable)
- **Transaction digest**: 32-byte hash of the last modifying transaction

Objects can be referenced: by ID (query current state), by versioned ID (historical state), or by full object reference (ID + version + digest, used for transaction inputs).

## Defining Objects

```move
public struct Sword has key, store {
    id: UID,
    damage: u64,
    element: String,
}
```

`object::new(ctx)` is the ONLY way to create a UID.

## Abilities and Objects

| Ability | What It Controls |
|---------|-----------------|
| `key` | Struct is a Sui object. Must have `id: UID` first. |
| `store` | Can be stored inside other objects. Enables `public_transfer` from any module. |
| `copy` | Can be duplicated. Cannot be on objects (UID lacks `copy`). |
| `drop` | Can be silently discarded. Cannot be on objects (UID lacks `drop`). |

### Object Ability Combinations

- **`has key`**: Only defining module can transfer. Custom transfer rules possible.
- **`has key, store`**: Any module can transfer, share, freeze, or wrap. Once `store` is granted, custom transfer rules are permanently disabled.

## Ownership Types

| Type | Access Control | Consensus |
|------|---------------|-----------|
| **Address-owned** | Only owning address | No consensus — parallel execution |
| **Shared** | Any address | Mysticeti consensus |
| **Immutable (frozen)** | Anyone reads, no one mutates | No consensus |
| **Wrapped** | Only through parent object | Depends on parent |

### Parallel Execution

Sui executes transactions on non-overlapping owned objects in parallel without consensus. Only shared-object transactions go through Mysticeti consensus ordering. This is what enables Sui's scalability.

### Shared Objects

```move
// Create and share
transfer::share_object(pool);

// Access in PTB (frontend)
tx.setGasPayment([tx.object(sharedObjId)]);
tx.moveCall({
    target: `${PACKAGE_ID}::pool::deposit`,
    arguments: [tx.object(sharedObjId), tx.object(coinId)],
});
```

Shared objects can only end a PTB in two states: re-shared or deleted. They cannot be transferred or frozen.

## Transferring Objects

### Core Transfer Functions

| Function | Scope | Type Requirement |
|----------|-------|-----------------|
| `transfer::transfer(obj, addr)` | Module-private | `key` only |
| `transfer::public_transfer(obj, addr)` | Any module | `key + store` |
| `transfer::share_object(obj)` | Module-private | `key` only |
| `transfer::public_share_object(obj)` | Any module | `key + store` |
| `transfer::freeze_object(obj)` | Module-private | `key` only |
| `transfer::public_freeze_object(obj)` | Any module | `key + store` |

From a PTB, always use the `public_*` variants — the module-private ones require the same module's type parameter.

### Custom Transfer Rules

Omit `store` to enforce custom transfer logic:

```move
public struct SoulboundItem has key {
    id: UID,
    owner: address,
}

// Only this module can transfer
public fun transfer_soulbound(item: SoulboundItem, to: address) {
    let SoulboundItem { id, owner: _ } = item;
    // custom validation logic here
    transfer::transfer(SoulboundItem { id, owner: to }, to);
}
```

### Receiving Type

For transfer-to-object patterns:

```move
public struct Receiving<phantom T: key> has drop {
    id: ID,
    version: u64,
}

public fun receive<T: key>(parent: &mut Parent, item: Receiving<T>) { ... }
```

## Deleting Objects

```move
let item = get_item();
let Item { id, name } = item;
id.delete();  // Must explicitly delete the UID
```

## Dynamic Fields

Dynamic fields attach data to objects beyond their defined struct fields.

### Dynamic Field vs Dynamic Object Field

| Type | Child Visibility | Use Case |
|------|-----------------|----------|
| `dynamic_field` | Only through parent (not queryable by ID) | Plain data, counters, configs |
| `dynamic_object_field` | Queryable by ID in explorers/RPC | Full objects that need independent discovery |

### Core API

```move
// Add
dynamic_field::add(&mut parent, key, value);

// Read
dynamic_field::borrow<K, V>(&parent, key): &V
dynamic_field::borrow_mut<K, V>(&mut parent, key): &mut V

// Check existence
dynamic_field::exists_<K>(&parent, key): bool

// Remove
dynamic_field::remove<K, V>(&mut parent, key): V
```

Accessing a nonexistent field via `borrow`, `borrow_mut`, or `remove` aborts the transaction. Use `exists_` first.

### Field Naming (Key Types)

```move
public struct ItemKey(String) has copy, drop, store;  // Positional struct
```

### Cleanup Warning

Always remove all dynamic fields before deleting a parent object. Orphaned fields become permanently inaccessible.

## Collections

| Collection | Storage | Lookup | Best For |
|-----------|---------|--------|----------|
| `Table<K, V>` | Dynamic fields per entry | O(1) | Large collections (>100 items) |
| `Bag` | Like Table with arbitrary keys | O(1) | Heterogeneous collections |
| `VecMap<K, V>` | Inline (part of object) | O(n) | Small collections (<100 items) |
| `LinkedTable<K, V>` | Dynamic fields, ordered | O(1) | Ordered collections |

Don't use `VecMap` for >100 entries — stored inline, hits the 250 KB limit.

## Common Patterns

### Capability Pattern

```move
public struct AdminCap has key, store { id: UID }
public struct MintCap has key, store { id: UID }
public struct TreasuryCap<phantom T> has key, store { id: UID }

public fun admin_action(_cap: &AdminCap, ...) { ... }
```

### Hot Potato Pattern

```move
// No abilities — must be consumed in same transaction
public struct FlashLoanReceipt {
    amount: u64,
}

public fun borrow(amount: u64): (Coin<SUI>, FlashLoanReceipt) { ... }
public fun repay(coin: Coin<SUI>, receipt: FlashLoanReceipt) { ... }
```

### Soulbound Objects

```move
public struct Diploma has key {  // No `store` — can't be freely transferred
    id: UID,
    graduate: address,
}
```

### Inventory Pattern

```move
public struct ObjectBag has key {
    id: UID,
    size: u64,
}

// Items stored as dynamic fields keyed by type
public fun add<T: key + store>(bag: &mut ObjectBag, item: T) {
    dynamic_field::add(&mut bag.id, T::type_name(), item);
}
```

### Derived Objects

Create objects with deterministic IDs for predictable addresses:

```move
let derived_id = object::new(ctx);  // Deterministic from tx digest
```

## Object Display V2

Set up how objects render in wallets and explorers:

```move
use sui::display_registry::{Self, Display};

let mut display = display_registry::new_with_publisher<T>(publisher, ctx);
display.set(b"name", b"{name}")!;
display.set(b"description", b"A level {level} item")!;
display.set(b"image_url", b"{image_url}")!;
display_registry::share(display);
```

Template syntax: `{field_name}` auto-substitutes struct field values. Nested field access supported.

## Rules

- `object::new(ctx)` is the only way to create a UID. `id: UID` must be the first field.
- Once `store` is added, custom transfer rules permanently disabled.
- Once an object is shared, it cannot be converted back to address-owned.
- Always remove dynamic fields before deleting parent — orphans are irretrievable.
- Use `exists_` before `borrow`/`borrow_mut`/`remove` on dynamic fields.
- Each `Table` entry is a separate storage operation — gas scales linearly.
- Prefer `&` (immutable ref) on shared objects to maximize parallel execution.
- Do not use `VecMap` for >100 entries. Use `Table`.
- Common capabilities: `AdminCap`, `TreasuryCap`, `UpgradeCap`, `MintCap`.
- For new code, use `sui::display_registry` (V2), not `sui::display` (V1, deprecated).

## Common Mistakes

- Adding `store` when custom transfer rules needed — permanently bypassed
- Using `VecMap` for large collections — O(n) lookup, hits 250 KB limit
- Confusing `dynamic_field` with `dynamic_object_field` — use `_object_field` when child needs to be queryable
- Deleting parent without cleaning dynamic fields — data permanently lost
- Using deprecated `sui::display` (V1) instead of `sui::display_registry` (V2)
- Forgetting `display_registry::share(display)` — display won't be discoverable
