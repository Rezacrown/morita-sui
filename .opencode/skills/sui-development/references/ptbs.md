# Programmable Transaction Blocks (PTBs)

A PTB is one Sui transaction that batches up to **1,024 commands** — Move calls, coin splits/merges, object transfers, vector construction, package publish/upgrade — executed atomically. Every Sui transaction is a PTB. There is no "single call" mode.

## PTB Structure

A PTB consists of:
- **Inputs**: Values fed in from outside — objects and BCS-encoded "pure" bytes
- **Commands**: Operations on inputs and each other's results
- **Results**: Values produced by commands, consumed by subsequent commands via `Argument` enum: `Input(i)`, `GasCoin`, `Result(i)`, `NestedResult(cmd, idx)`

### End-of-Transaction Constraints

Every non-`drop` value produced during execution must be consumed (transferred, destroyed, or fed into another command). Shared objects: re-share or delete only — cannot transfer or freeze.

## TypeScript SDK PTBs

### Transaction Setup

```typescript
import { Transaction } from '@mysten/sui/transactions'

const tx = new Transaction()

// Set sender (optional — wallet sets this)
tx.setSender(senderAddress)

// Set gas payment (optional — wallet handles this)
tx.setGasPayment([tx.object(gasCoinId)])

// Set gas budget (optional)
tx.setGasBudget(100000000)
```

### moveCall

```typescript
const [returnValue] = tx.moveCall({
    target: `${PACKAGE_ID}::module::function`,
    arguments: [
        tx.object(objectId),      // Object input
        tx.object(ImmOrOwned: objectId), // Immutable or owned
        tx.object(Shared: sharedId),     // Shared object
        tx.object(Receiving: objectId),  // Receiving object
        tx.pure.u64(100),         // Pure u64
        tx.pure.address(addr),    // Pure address
        tx.pure.string('hello'),  // Pure string
        tx.pure.bool(true),       // Pure bool
        tx.pure('u64', 100),      // Generic pure (fallback)
    ],
})

// Multi-return destructuring
const [coinA, coinB] = tx.moveCall({
    target: `${PACKAGE_ID}::dex::swap`,
    arguments: [tx.object(poolId), tx.object(coinId)],
})
```

### Coin Operations

```typescript
// Split coins from gas
const [payment] = tx.splitCoins(tx.gas, [tx.pure.u64(100)])
const [a, b] = tx.splitCoins(tx.gas, [tx.pure.u64(50), tx.pure.u64(50)])

// Split from existing coin
const [half] = tx.splitCoins(tx.object(coinId), [tx.pure.u64(100)])

// Merge coins
tx.mergeCoins(tx.object(primaryCoin), [tx.object(coinA), tx.object(coinB)])
```

### Transfer Objects

```typescript
// Transfer to address
tx.transferObjects([tx.object(nftId)], tx.pure.address(recipient))
tx.transferObjects([returnValue], tx.pure.address(sender))
```

### MakeMoveVec

```typescript
const items = tx.makeMoveVec({
    type: `${PACKAGE_ID}::module::Item`,
    elements: [tx.object(item1), tx.object(item2)],
})
```

### Publish & Upgrade

```typescript
const [upgradeCap] = tx.publish({
    modules: [[compiledModuleBytes1], [compiledModuleBytes2]],
    dependencies: ['0x1', '0x2'],
})

tx.moveCall({
    target: '0x2::package::make_immutable',
    arguments: [upgradeCap],
})
```

### Sponsored Transactions

```typescript
// App side: build kind-only bytes
const kindBytes = await tx.build({ client, onlyTransactionKind: true })

// Sponsor side: rehydrate and set gas
const tx = Transaction.fromKind(kindBytes)
tx.setSender(userAddress)
tx.setGasOwner(sponsorAddress)
tx.setGasPayment([tx.object(gasCoinId)])

// Sign by both user and sponsor, submit to full node
```

### Gas Config

```typescript
tx.setSender(address)
tx.setGasPrice(1000)
tx.setGasBudget(10_000_000)
tx.setGasPayment([tx.object(coinId)])
tx.setGasOwner(sponsorAddress)
```

Do NOT hardcode gas in app code signed by user wallet — the wallet dry-runs and selects coins. Only set for backend-signed flows.

## CLI PTBs

### Basic Syntax

```bash
sui client ptb \
  --move-call @pkg::module::function \
  --split-coins @gas [100] --assign coin \
  --transfer-objects "[coin]" @0xRECIPIENT
```

### Common CLI Patterns

```bash
# Merge coins
sui client ptb --merge-coins @0xPRIMARY "[@0xCOIN_A, @0xCOIN_B]"

# Transfer
sui client ptb --transfer-objects "[@0xNFT]" @0xRECIPIENT

# Move call with assign
sui client ptb \
  --move-call @pkg::module::create_thing --assign thing \
  --transfer-objects "[thing]" @sender

# Preview (--preview flag)
sui client ptb --preview \
  --move-call @pkg::module::function
```

## Execution & Status

### TypeScript

```typescript
const result = await dAppKit.signAndExecuteTransaction({ transaction: tx })

if (result.$kind === 'FailedTransaction') {
    // Handle failure
    return
}

const digest = result.Transaction.digest

// Wait for indexing before refetching
await client.waitForTransaction({ digest })

// Now invalidate caches
queryClient.invalidateQueries({ queryKey: ['data'] })
```

### v1 vs v2 Status

```typescript
// WRONG (v1)
result.effects?.status?.status === 'success'

// WRONG (v1 method)
client.signAndExecuteTransactionBlock(...)

// CORRECT (v2)
result.$kind !== 'FailedTransaction'
result.Transaction.digest  // digest on success
```

## PTB Limits

- Max 1,024 commands per transaction
- Max 2,048 input objects
- Pure argument size: max 16 KB

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `UnusedValueWithoutDrop` | Return value not consumed | Transfer, delete, or pass to another command |
| `VMVerificationOrDeserializationError` | Type mismatch in arguments | Check Move function signature vs arguments |
| `No valid gas coins` | No coin large enough for budget + gas | Merge coins or get from faucet |
| `InsufficientGas` | Budget exceeded | Increase gas budget or check dry run |
| Shared object congestion | High contention | Optimize with `&` refs, shard objects |

## Rules

1. Use typed pure helpers: `tx.pure.u64(n)`, not `tx.pure(value)`
2. In app code for user wallets: pass `Transaction` instance (or `tx.serialize()`), not `tx.build()` bytes
3. For sponsored flows: `tx.build({ onlyTransactionKind: true })` → `Transaction.fromKind(kindBytes)`
4. Every non-`drop` value must be consumed — transfer, destroy, or chain
5. Shared objects can't be transferred or frozen — only re-share or delete
6. `MoveCall` results cannot be references — Move function returning `&T` can't be called from PTB
7. Multi-return calls: destructure or index
8. `waitForTransaction` before cache invalidation
9. `sui client ptb` for all CLI transactions (not legacy commands like `merge-coin`)

## Common Mistakes

- Untyped `tx.pure(value)` — use `tx.pure.u64(n)`, `tx.pure.address(a)`, etc.
- `tx.build()` before wallet handoff — defeats wallet gas selection
- Not checking `result.$kind` — `FailedTransaction` returns no digest
- Assuming `result.digest` direct access — it's at `result.Transaction.digest`
- Forgetting to set `enabled: !!account` on TanStack queries
- Hardcoding gas budget in wallet-signed flows
- Treating multi-return values as single values — destructure
- Using `transfer::transfer` or `transfer::share_object` from PTB — use `public_transfer` / `public_share_object`
