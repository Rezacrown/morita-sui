# Sui SDKs

## SDK Landscape

Two officially-supported SDKs (by Mysten Labs). Everything else is community-maintained.

| SDK | Status | Package | Use Case |
|-----|--------|---------|----------|
| **TypeScript** | Official, v2 | `@mysten/sui` | Frontends, Node.js backends, CLI tools |
| **Rust** | Official | `sui-rust-sdk` crates | Backend services, indexers, validators |
| **Python** | Community | `pysui` | Scripting, data analysis |
| **Go** | Community | `block-vision/sui-go-sdk` | Go backends |
| **Dart** | Community | `mofalabs/sui` | Dart/Flutter apps |
| **Kotlin** | Community | `mcxross/ksui` | Android/Kotlin |
| **Swift** | Community | `opendive/suikit` | iOS/Swift |

Community SDKs may lag protocol updates. Check repo activity before relying on them. For non-TS/non-Rust languages, consider calling the Rust SDK via FFI.

## TypeScript SDK (`@mysten/sui` v2)

### Install

```bash
npm install @mysten/sui
```

### Client Types

| Client | Package | When to Use |
|--------|---------|-------------|
| `SuiGrpcClient` | `@mysten/sui/grpc` | Default for new code. Backends, indexers, real-time apps |
| `SuiGraphQLClient` | `@mysten/sui/graphql` | Frontends needing flexible queries |
| `SuiJsonRpcClient` | `@mysten/sui` | Legacy compatibility only — JSON-RPC deprecated |

**JSON-RPC is deprecated.** Sunset July 2026. All new code uses gRPC or GraphQL.

### gRPC Client

```typescript
import { SuiGrpcClient } from '@mysten/sui/grpc'

const client = new SuiGrpcClient({
    network: 'testnet',
    baseUrl: 'https://rpc.testnet.sui.io:443',
})
```

### Core API (v2)

```typescript
// Get object
const obj = await client.core.getObject({
    id: objectId,
    include: { type: true, content: true, owner: true, version: true },
})

// List owned objects
const owned = await client.core.listOwnedObjects({
    owner: address,
    type: '0x2::coin::Coin<0x2::sui::SUI>',
})

// List coins
const coins = await client.core.listCoins({
    owner: address,
    coinType: '0x2::sui::SUI',
})

// Get balance
const balance = await client.core.getBalance({ owner: address })

// Wait for transaction
await client.waitForTransaction({ digest })
```

### PTB Construction

```typescript
import { Transaction } from '@mysten/sui/transactions'

const tx = new Transaction()
tx.setSender(address)
tx.setGasPayment([tx.object(gasCoinId)])

const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(100)])
tx.transferObjects([coin], tx.pure.address(recipient))
```

### $extend Pattern (v2)

Extensions add domain-specific methods to the client:

```typescript
import { suins } from '@mysten/suins'
import { deepbook } from '@mysten/deepbook-v3'
import { walrus } from '@mysten/walrus'
import { seal } from '@mysten/seal'
import { zksend } from '@mysten/zksend'

const client = new SuiGrpcClient({ ... })
const extClient = client.$extend(
    suins(),
    deepbook({ address: DEEPBOOK_PACKAGE_ID }),
    walrus(),
)

// Now call extension methods
const name = await extClient.suins.getName(address)
```

### LLM Docs Convention

Every `@mysten/*` package ships LLM documentation:

```
node_modules/@mysten/sui/docs/llms-index.md
node_modules/@mysten/dapp-kit-react/docs/llms-index.md
```

Always check these before writing code — they match the installed version exactly.

### v1 → v2 Migration

| v1 | v2 |
|----|-----|
| `@mysten/sui.js` | `@mysten/sui` |
| `SuiClient` | `SuiGrpcClient` / `SuiGraphQLClient` |
| `TransactionBlock` | `Transaction` |
| `getFullnodeUrl('testnet')` | Network name + gRPC URL |
| `signAndExecuteTransactionBlock` | `signAndExecuteTransaction` |
| `result.effects?.status?.status` | `result.$kind !== 'FailedTransaction'` |
| `result.digest` | `result.Transaction.digest` |
| `options: { showEffects }` | `include:` in core API |
| `SuiClientProvider` + `WalletProvider` | `createDAppKit` + `DAppKitProvider` |

## Rust SDK (`sui-rust-sdk` crates)

### Crates

| Crate | Purpose |
|-------|---------|
| `sui-sdk-types` | Core types (ObjectId, Address, etc.) |
| `sui-crypto` | Key generation, signing |
| `sui-rpc` | gRPC client for full nodes |
| `sui-graphql` | GraphQL client |
| `sui-transaction-builder` | PTB construction |

### Example

```rust
use sui_transaction_builder::TransactionBuilder;
use sui_sdk_types::ObjectId;

let mut builder = TransactionBuilder::new(sender);
let coin = builder.split_coins(builder.gas(), &[100u64])?;
builder.transfer_objects(coin, recipient)?;

let tx = builder.build(client).await?;
let result = client.execute_transaction(&tx).await?;
```

Prefer the new modular crates over the legacy `sui-sdk` monorepo crate.

## Community SDKs

### Python (pysui)

```bash
pip install pysui
```

Status: Community-maintained. Good for data analysis and scripting. Check repo activity first.

### Go (block-vision/sui-go-sdk)

```bash
go get github.com/block-vision/sui-go-sdk
```

Status: Community-maintained. Popular Go option.

For any community SDK: mention it's community-maintained, check the repo's last commit date, and offer Rust SDK via FFI as an alternative.

## Rules

1. Default to TypeScript (`@mysten/sui`) or Rust (`sui-rust-sdk`) for new projects
2. Never recommend `@mysten/sui.js` — frozen at v1
3. Never recommend `@mysten/dapp-kit` (no suffix) — deprecated
4. For TS v2, use `SuiGrpcClient` by default (not JSON-RPC)
5. Community SDK caveat is mandatory — mention community maintenance and potential lag
6. Route frontend questions to `frontend.md` for hook-level details
7. Check `node_modules/@mysten/*/docs/llms-index.md` before writing TS code
8. Don't mix v1 and v2 patterns in the same codebase

## Common Mistakes

- Calling community SDK "the official Python SDK" — name the specific package
- Recommending `SuiClient` — removed in v2, use `SuiGrpcClient`
- Using `@mysten/sui.js` — deprecated, use `@mysten/sui`
- Fetching TS docs from web when they're installed locally — check `node_modules` first
- Hardcoding SDK versions — prefer "install latest" + consult bundled docs
- Using JSON-RPC as default — deprecated, use gRPC or GraphQL
