# Sui Development Patterns

This file defines canonical patterns for all Sui blockchain development. Deviations from these patterns MUST be flagged via the deviation alert protocol.

## Canonical Move Contract

```move
module package_name::module_name;

use sui::object::{Self, UID};
use sui::tx_context::TxContext;

// Events must have copy + drop, be past-tense named
public struct ItemCreated has copy, drop {
    item_id: address,
    creator: address,
}

// Objects always have key, id: UID as first field
public struct Item has key, store {
    id: UID,
    name: String,
}

// Capabilities suffixed with Cap
public struct AdminCap has key, store {
    id: UID,
}

// One-Time Witness for init
public struct MODULE_NAME has drop {}

fun init(otw: MODULE_NAME, ctx: &mut TxContext) {
    let cap = AdminCap { id: object::new(ctx) };
    transfer::transfer(cap, ctx.sender());
}

// Public returns objects, doesn't transfer internally
public fun create_item(name: String, ctx: &mut TxContext): Item {
    let item = Item { id: object::new(ctx), name };
    emit(ItemCreated { item_id: object::id(&item).to_bytes(), creator: ctx.sender().to_bytes() });
    item
}

// Entry for convenience endpoints
entry fun create_and_keep(name: String, ctx: &mut TxContext) {
    let item = create_item(name, ctx);
    transfer::transfer(item, ctx.sender());
}
```

## Canonical Frontend

```typescript
// setup.ts — one-time dApp Kit setup
import { createDAppKit } from '@mysten/dapp-kit-react'
import { SuiGrpcClient } from '@mysten/sui/grpc'

export const dAppKit = createDAppKit({
  networks: [{ name: 'testnet', url: 'https://rpc.testnet.sui.io:443' }],
  createClient: (name, { url }) => new SuiGrpcClient({ network: name, baseUrl: url }),
})

// Component
import { useCurrentAccount, useCurrentClient, useDAppKit } from '@mysten/dapp-kit-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

export function MyComponent() {
  const account = useCurrentAccount()
  const client = useCurrentClient()
  const { signAndExecuteTransaction } = useDAppKit()
  const queryClient = useQueryClient()

  const { data } = useQuery({
    queryKey: ['balance', account?.address],
    queryFn: async () => {
      const coins = await client.core.listOwnedObjects({
        owner: account!.address,
        type: '0x2::coin::Coin<0x2::sui::SUI>',
      })
      return coins
    },
    enabled: !!account,
  })

  const handleTx = async () => {
    const result = await signAndExecuteTransaction({ transaction: tx })
    if (result.$kind === 'FailedTransaction') return
    await client.waitForTransaction({ digest: result.Transaction.digest })
    queryClient.invalidateQueries({ queryKey: ['balance'] })
  }
}
```

## DO

| Pattern | Details |
|---------|---------|
| Use `edition = "2024"` in Move.toml | Required for method syntax, enums, public struct fields |
| Objects: `key` + `id: UID` first field | Every onchain object must follow this pattern |
| Events: `copy + drop`, past-tense name | `ItemCreated`, not `CreateItem` |
| Capabilities: suffix `Cap` | `AdminCap`, `MintCap`, `TreasuryCap` |
| Error constants: `E` prefix + PascalCase | `ENotAuthorized`, `EInsufficientBalance` |
| Public functions return objects | Don't transfer to sender internally |
| Entry functions for convenience endpoints | Thin wrappers around public functions |
| `SuiGrpcClient` from `@mysten/sui/grpc` | Default client for v2 SDK |
| `createDAppKit` + `DAppKitProvider` | Not the old 3-provider stack |
| `useCurrentAccount()` + `useQuery` | Not the removed `useSuiClientQuery` |
| `waitForTransaction` before cache invalidation | Fullnodes are eventually consistent |
| Pass `Transaction` instance to wallet | Don't `tx.build()` first |
| `tx.pure.u64(n)` / `tx.pure.address(a)` | Typed pure values, not `tx.pure(value)` |
| gRPC for backends, GraphQL RPC for frontends | JSON-RPC is deprecated (sunset July 2026) |

## DON'T

| Anti-pattern | Why |
|-------------|------|
| `@mysten/sui.js` import | Frozen v1 package. Use `@mysten/sui` |
| `@mysten/dapp-kit` (no suffix) | Deprecated JSON-RPC-only. Use `-react` or `-core` |
| `SuiClient` / `SuiClientProvider` | Removed in v2. Use `SuiGrpcClient` |
| `useSuiClientQuery` / `useSignAndExecuteTransaction` hooks | Removed in v2. Use `useCurrentClient` + `useQuery` |
| `public entry` visibility | Use `public` or `entry`, never both |
| `test_` prefix in test functions | Module `_tests` already indicates tests |
| `assert!(x == y)` in tests | Use `assert_eq!(x, y)` for diagnostics |
| Custom `destroy_for_testing` | Use `sui::test_utils::destroy` |
| `tx.pure(value)` untyped | Use typed helpers: `tx.pure.u64(n)` |
| `tx.build()` before wallet handoff | Defeats wallet gas selection |
| Cache invalidation without `waitForTransaction` | Stale data refetch |
| JSON-RPC for new code | Deprecated. Use gRPC or GraphQL RPC |
| Applying Ethereum/Solidity patterns | Sui is object-centric, Move is resource-safe |
| Storing large files in Move objects | 250 KB limit. Use Walrus |

## DEVIATION ALERT PROTOCOL

If you're about to generate code that differs >70% from the pattern above, you MUST:

1. Print this alert:

```
⚠️ DEVIATION ALERT — Sui Development pattern deviation detected

Pattern requires: [describe canonical approach]
Codebase requires: [describe what differs]
>70% difference threshold exceeded.

Proceed? (yes / modify-pattern / no)
```

2. Wait for user response before proceeding.
3. If "modify-pattern", update pattern.md after user confirms the change.

## Import Reference

```typescript
// TypeScript SDK v2
import { SuiGrpcClient } from '@mysten/sui/grpc'
import { Transaction } from '@mysten/sui/transactions'

// dApp Kit
import { createDAppKit, DAppKitProvider, useCurrentAccount, useCurrentClient, useDAppKit, useWallets, ConnectButton } from '@mysten/dapp-kit-react'

// dApp Kit UI components
import { ConnectModal } from '@mysten/dapp-kit-react/ui'

// Move standard imports
// use sui::object::{Self, UID};
// use sui::tx_context::TxContext;
// use sui::transfer;
// use sui::event;

// Rust SDK
// use sui_transaction_builder::TransactionBuilder;
// use sui_sdk_types::ObjectId;
// use sui_rpc::SuiRpcClient;
```

## Version Requirements

- **Sui CLI**: v1.63+ (use `suiup` to manage)
- **@mysten/sui**: v2.x (latest)
- **@mysten/dapp-kit-react**: latest
- **Move edition**: 2024
- **TypeScript**: 5.x+
- **React**: 18+

To check: `sui --version` / `npm ls @mysten/sui` / `npm ls @mysten/dapp-kit-react`
