# Move Language, Syntax & Conventions

## Core Move

Move is Sui's smart contract language with compile-time resource safety. Objects cannot be duplicated or silently dropped.

### Abilities

| Ability | Purpose |
|---------|---------|
| `key` | The struct is a Sui object. Must have `id: UID` as first field |
| `store` | Can be stored inside other objects; enables `public_transfer` from any module |
| `copy` | Can be duplicated. Cannot be on objects (UID lacks `copy`) |
| `drop` | Can be silently discarded. Cannot be on objects (UID lacks `drop`) |

### Object Ability Combinations

- **`has key`**: Only defining module can transfer, share, freeze. Use for custom transfer rules.
- **`has key, store`**: Any module can transfer, share, freeze. Use for freely composable assets. Once `store` is granted, custom transfer rules are permanently disabled.

### Non-Object Structs

- `has store`: Can be stored inside an object
- `has copy, drop`: Plain data for events, configs
- `has copy, drop, store`: Dynamic field key types
- No abilities: Hot potato — must be consumed in same transaction

### Struct Definition

```move
module my_package::my_module;

use sui::object::{Self, UID};
use sui::tx_context::TxContext;
use sui::transfer;
use sui::event;

// Object with key + store
public struct Item has key, store {
    id: UID,
    name: String,
}

// Event — always copy + drop, past tense
public struct ItemCreated has copy, drop {
    item_id: address,
    creator: address,
}

// Capability
public struct AdminCap has key, store {
    id: UID,
}
```

### One-Time Witness (OTW)

A struct with only `drop` ability whose name is the module's uppercase name. Used for init functions and type-level authorization.

```move
// Module: my_package::my_module
public struct MY_MODULE has drop {}

fun init(otw: MY_MODULE, ctx: &mut TxContext) {
    // One-time initialization
}

// OTW as type-level authorization
public fun protected_action<T>(_otw: &T, ctx: &mut TxContext) {
    // Only callable with the module's OTW type
}
```

### internal::Permit<T>

Type-level authorization pattern for cross-module permissioning:

```move
use sui::internal;

// Module A: issues permits for its type
public fun issue_permit(ctx: &mut TxContext): internal::Permit<MODULE_A> {
    internal::new_permit<MODULE_A>(ctx)
}

// Module B: requires permit for privileged calls
public fun privileged_action(permit: internal::Permit<MODULE_A>) {
    // Only callable with a Permit<MODULE_A>
}
```

### Events

Must have `copy` and `drop`. Named in past tense. Emit with `emit()`:

```move
public struct UserRegistered has copy, drop {
    user: address,
}

let event = UserRegistered { user: ctx.sender() };
emit(event);
```

### Coins

Creating a fungible token:

```move
use sui::coin::{Self, TreasuryCap};

fun init(otw: MODULE_NAME, ctx: &mut TxContext) {
    let (treasury_cap, metadata) = coin::create_currency(
        otw,          // OTW — links the coin type to this module
        9,            // decimals
        b"MYCOIN",    // symbol
        b"My Token",  // name
        b"Description",
        option::none(),  // icon URL
        ctx,
    );
    transfer::public_freeze_object(metadata);
    transfer::transfer(treasury_cap, ctx.sender());
}
```

Coin operations: `treasury_cap.mint(amount, ctx)`, `coin::burn(&mut treasury_cap, coin)`, `payment.value()`, `payment.into_balance()`, `balance.join(other)`, `balance.split(amount)`.

### TxContext

```move
ctx.sender()           // Address of tx sender
ctx.epoch()            // Current epoch number
ctx.epoch_timestamp_ms() // Epoch start time (not real-time — use Clock for that)
ctx.fresh_object_address() // Deterministic address based on tx digest
```

### Clock Object

For real-time timestamps, use the Clock object (`0x6`):

```move
use sui::clock::Clock;

public fun timed_action(clock: &Clock) {
    let timestamp = clock.timestamp_ms();
}
```

### Resource Safety & Object Destruction

To destroy an object without `drop`:

```move
let item = get_item();
let Item { id, name } = item;
id.delete();  // Must delete the UID
```

Never just let the struct go out of scope — the UID must be explicitly deleted.

## Modern Move (2024 Edition)

Move 2024 edition (`edition = "2024"` in Move.toml) enables modern syntax.

### Method Syntax (dot notation)

```move
// Legacy (WRONG)
coin::value(&payment);
coin::into_balance(payment);
balance::join(&mut pool.reserve, balance);
tx_context::sender(ctx);

// Modern (CORRECT)
payment.value();
payment.into_balance();
pool.reserve.join(balance);
ctx.sender();
```

### String Literals

```move
let s = "hello";                     // Direct string (2024 edition)
let ascii = b"hello".to_ascii_string(); // Explicit ASCII
```

No more `string::utf8(b"hello")`.

### Vector Literals & Methods

```move
let mut v = vector[10, 20, 30];
let first = &v[0];
let len = v.length();
v.push_back(40);
```

### Option Macros

```move
opt.do!(|value| call_function(value));     // If Some
let value = opt.destroy_or!(default);      // Default value
```

### Loop Macros

```move
32u8.do!(|_| do_action());               // Repeat N times
10u64.do!(|i| results.push_back(i * i));  // 0..9
vec.do_ref!(|e| call_function(e));         // Iterate vector
let v = vector::tabulate!(32, |i| i);      // Create from range
let sum = source.fold!(0, |acc, v| acc + v); // Fold
let filtered = source.filter!(|e| e > 10);    // Filter
```

### Struct Unpacking

```move
let MyStruct { id, .. } = value;  // Ignore unused fields
```

### Public Structs

```move
public struct Token has key, store { id: UID, value: u64 }  // Fields visible outside module
struct Internal has key { id: UID, secret: u64 }            // Module-private fields
```

### Enums

```move
public enum Color {
    Red,
    Green,
    Blue,
    Custom(u8, u8, u8),
}

public fun is_red(c: &Color): bool {
    match (c) {
        Color::Red => true,
        _ => false,
    }
}
```

### Module Declaration

```move
module my_package::my_module;  // No curly braces — whole file is the module
```

### Quick Reference

| Legacy | 2024 Edition |
|--------|-------------|
| `coin::value(&c)` | `c.value()` |
| `coin::into_balance(c)` | `c.into_balance()` |
| `tx_context::sender(ctx)` | `ctx.sender()` |
| `object::delete(id)` | `id.delete()` |
| `string::utf8(b"x")` | `"x"` |
| `vector::empty()` | `vector[]` |
| `vector::push_back(&mut v, x)` | `v.push_back(x)` |
| `vector::length(&v)` | `v.length()` |
| `opt.is_some() + destroy_some` | `opt.do!(\|v\| ...)` |

## Composable Functions

### Visibility

```move
public fun mint(ctx: &mut TxContext): NFT { ... }    // Composable, returns objects
entry fun mint_and_keep(ctx: &mut TxContext) { ... }  // Non-composable endpoint
```

Never `public entry`. Use `public` for composable functions, `entry` only for convenience wrappers.

### Parameter Ordering

1. **Objects first** (the primary object being acted on)
2. **Capabilities** (AdminCap, etc.)
3. **Primitive values** (amounts, flags, addresses)
4. **Clock** (exception — near end, before ctx)
5. **`ctx: &mut TxContext` last** — always

```move
public fun swap(
    pool: &mut Pool,       // Object
    cap: &AdminCap,        // Capability
    amount: u64,           // Primitive
    clock: &Clock,         // Clock (before ctx)
    ctx: &mut TxContext,   // Always last
): (Coin<A>, Coin<B>) { ... }
```

### Return Objects, Don't Transfer Internally

Public functions return values to the caller. The caller decides what to do in the PTB.

## Naming Conventions

### Quick Reference

| Element | Convention | Example |
|---------|-----------|---------|
| Error constants | `E` + PascalCase | `ENotAuthorized` |
| Regular constants | ALL_CAPS | `FEE_NUMERATOR` |
| Capabilities | Suffix `Cap` | `AdminCap`, `MintCap` |
| Events | Past tense | `PoolCreated`, `UserRegistered` |
| Getters | Field name, no `get_` | `balance()`, `name()` |
| Mutable getters | Field name + `_mut` | `balance_mut()` |
| Hot potato | Descriptive, no `Potato` | `FlashLoanReceipt` |
| Dynamic field keys | Positional + `Key` suffix | `ItemKey(String)` |

### Error Constants

```move
// Preferred: #[error] with human-readable message
#[error]
const ENotAuthorized: vector<u8> = b"Caller is not authorized";

// Also valid: u64 values
const ENotAuthorized: u64 = 0;
```

### Events

```move
// WRONG
public struct CreatePool has copy, drop { pool_id: ID }

// CORRECT
public struct PoolCreated has copy, drop { pool_id: ID }
```

### Capabilities

```move
// WRONG
public struct Admin has key, store { id: UID }

// CORRECT
public struct AdminCap has key, store { id: UID }
```

### Dynamic Field Keys

```move
// CORRECT — positional struct with Key suffix
public struct ItemKey(String) has copy, drop, store;
```

## Rules

- `object::new(ctx)` is the ONLY way to create a UID
- `public_transfer` (not `transfer`) from outside the defining module
- Event structs must have `copy` and `drop`
- No `as` casts — use `from`/`into` or `try_from`/`try_into`
- To destroy: unpack struct + `object::delete(id)` on UID
- Once `store` added, custom transfer rules permanently disabled
- `#[error]` preferred over bare `u64` for error constants
- Use `public(package)` for non-library functions

## Common Mistakes

- Confusing `transfer` with `public_transfer` — only `public_transfer` works from outside the defining module
- Forgetting `object::delete(id)` when destroying objects
- `public entry` — use `public` or `entry`, never both
- Assuming `ctx.epoch_timestamp_ms()` is real-time — it's epoch start time
- Adding `store` when you need custom transfer rules
- Legacy function-call syntax in 2024 edition
