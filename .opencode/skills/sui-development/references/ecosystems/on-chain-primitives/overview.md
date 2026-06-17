# On-Chain Primitives — Time, Randomness & Epochs

Sui provides native on-chain primitives for time and randomness, accessible directly in Move contracts without external oracles. These are baked into the Sui protocol and available as system objects/functions.

> Source: [docs.sui.io — On-Chain Primitives](https://docs.sui.io/sui-stack/on-chain-primitives)

## Clock Object (Time)

The Clock is a **system object at address `0x6`** that provides the current real-time timestamp. Every Sui network has exactly one Clock, and it is available in every transaction.

### Clock vs `ctx.epoch_timestamp_ms()`

| Feature | `clock.timestamp_ms()` | `ctx.epoch_timestamp_ms()` |
|---------|----------------------|--------------------------|
| Returns | **Current real-time timestamp** | **Epoch START timestamp** |
| Source | System object `0x6` | Transaction context |
| Updates | Every consensus commit | Once per epoch |
| Use case | Real-time gates, auctions, time-locks | Epoch-level operations, staking |
| Precision | Milliseconds | Milliseconds |

**Critical distinction**: `ctx.epoch_timestamp_ms()` returns the timestamp **when the epoch began** — it is a constant for the entire ~24-hour epoch. Use `Clock` when you need real-time values.

### Accessing the Clock

The Clock is always passed by **immutable reference** (`&Clock`). It cannot be taken by value, mutated, or destroyed.

```move
use sui::clock::Clock;

public fun time_gated_action(clock: &Clock) {
    let now = clock.timestamp_ms();
    assert!(now > unlock_time, ETooEarly);
}
```

In PTBs, the Clock is auto-injected — you receive it as an implicit input:

```typescript
import { Transaction } from '@mysten/sui/transactions';

const tx = new Transaction();
tx.moveCall({
    target: `${packageId}::time_gate::unlock`,
    arguments: [tx.object(ClockId)], // 0x6
});
```

### Clock API

```move
module sui::clock {
    public fun timestamp_ms(clock: &Clock): u64;
}
```

| Function | Returns | Description |
|----------|---------|-------------|
| `timestamp_ms` | `u64` | Current timestamp in milliseconds since Unix epoch |

The Clock has no other public functions. It exists purely to expose `timestamp_ms()`.

### Patterns

#### Time-Locked Operations

```move
module timelock::vault {
    use sui::clock::Clock;

    const ETooEarly: u64 = 0;
    const ENotAuthorized: u64 = 1;

    public struct TimelockedVault has key {
        id: UID,
        unlock_time_ms: u64,
        owner: address,
    }

    public fun withdraw(
        vault: TimelockedVault,
        clock: &Clock,
        ctx: &TxContext,
    ) {
        assert!(ctx.sender() == vault.owner, ENotAuthorized);
        assert!(clock.timestamp_ms() >= vault.unlock_time_ms, ETooEarly);
        // ... transfer assets, delete vault
    }
}
```

#### Auction with Expiry

```move
module auction::house {
    use sui::clock::Clock;

    const EAuctionEnded: u64 = 0;
    const EAuctionNotStarted: u64 = 1;

    public struct Auction has key {
        id: UID,
        start_time_ms: u64,
        end_time_ms: u64,
        highest_bidder: address,
        highest_bid: u64,
    }

    public fun place_bid(
        auction: &mut Auction,
        clock: &Clock,
        ctx: &TxContext,
    ) {
        let now = clock.timestamp_ms();
        assert!(now >= auction.start_time_ms, EAuctionNotStarted);
        assert!(now < auction.end_time_ms, EAuctionEnded);
        // ... bid logic
    }
}
```

#### Minimum Duration Gate

```move
module staking::unstake {
    use sui::clock::Clock;

    public struct Stake has key {
        id: UID,
        staked_at_ms: u64,
        amount: u64,
    }

    const MIN_STAKE_DURATION_MS: u64 = 7 * 24 * 60 * 60 * 1000; // 7 days

    public fun unstake(stake: Stake, clock: &Clock, ctx: &TxContext) {
        let elapsed = clock.timestamp_ms() - stake.staked_at_ms;
        assert!(elapsed >= MIN_STAKE_DURATION_MS, 0);
        // ... return funds, destroy Stake
    }
}
```

---

## Randomness

Sui provides an **on-chain randomness primitive** that Move contracts can consume directly. No external oracle or commit-reveal infrastructure is required for basic use cases.

### How It Works

The randomness is derived from a distributed key generation (DKG) ceremony at the start of each epoch, using a threshold BLS scheme. The resulting randomness is available as a system object at `0x8` — the `Random` object.

At each transaction, the `Random` object generates a deterministic output based on:
1. The epoch's DKG randomness seed
2. The transaction digest

This ensures the randomness is unpredictable before the transaction is sequenced, yet verifiable after execution.

### Random API

```move
module sui::random {
    public fun new_generator(r: &Random, ctx: &mut TxContext): RandomGenerator;
}

module sui::random::RandomGenerator {
    public fun generate_u8(self: &mut RandomGenerator): u8;
    public fun generate_u16(self: &mut RandomGenerator): u16;
    public fun generate_u32(self: &mut RandomGenerator): u32;
    public fun generate_u64(self: &mut RandomGenerator): u64;
    public fun generate_u128(self: &mut RandomGenerator): u128;
    public fun generate_u256(self: &mut RandomGenerator): u256;
    public fun generate_bool(self: &mut RandomGenerator): bool;
    public fun generate_bytes(self: &mut RandomGenerator, length: u8): vector<u8>;
    public fun generate_range_u64(self: &mut RandomGenerator, low: u64, high: u64): u64;
}
```

### Basic Usage

```move
use sui::random::{Self, Random};

public fun random_value(r: &Random, ctx: &mut TxContext): u64 {
    let mut gen = random::new_generator(r, ctx);
    gen.generate_u64()
}
```

### Range-Bounded Randomness

```move
public fun random_in_range(r: &Random, ctx: &mut TxContext): u64 {
    let mut gen = random::new_generator(r, ctx);
    gen.generate_range_u64(1, 100) // 1..=99
}
```

### Patterns

#### Randomized Trait Selection (NFT Mint)

```move
module nft::mint {
    use sui::random::{Self, Random};

    const NUM_TRAITS: u64 = 6;

    fun pick_trait(r: &Random, ctx: &mut TxContext): u64 {
        let mut gen = random::new_generator(r, ctx);
        gen.generate_range_u64(0, NUM_TRAITS)
    }
}
```

#### Lottery / Raffle

```move
module lottery::draw {
    use sui::random::{Self, Random};
    use sui::vec_set::{Self, VecSet};

    public struct Lottery has key {
        id: UID,
        participants: VecSet<address>,
        drawn: bool,
    }

    public fun draw_winner(
        lottery: &mut Lottery,
        r: &Random,
        ctx: &mut TxContext,
    ): address {
        assert!(!lottery.drawn, 0);
        let len = vec_set::size(&lottery.participants);
        assert!(len > 0, 1);

        let mut gen = random::new_generator(r, ctx);
        let winner_index = gen.generate_range_u64(0, len as u64);

        lottery.drawn = true;
        lottery.participants.keys()[winner_index as u64]
    }
}
```

#### Weighted Selection

```move
module loot::crate {
    use sui::random::{Self, Random};

    const COMMON_WEIGHT: u64 = 60;
    const RARE_WEIGHT: u64 = 30;
    const EPIC_WEIGHT: u64 = 9;
    const LEGENDARY_WEIGHT: u64 = 1;
    // Total: 100

    public fun open_crate(r: &Random, ctx: &mut TxContext): u8 {
        let mut gen = random::new_generator(r, ctx);
        let roll = gen.generate_range_u64(0, 100);
        if (roll < LEGENDARY_WEIGHT) return 3;      // Legendary
        if (roll < LEGENDARY_WEIGHT + EPIC_WEIGHT) return 2; // Epic
        if (roll < LEGENDARY_WEIGHT + EPIC_WEIGHT + RARE_WEIGHT) return 1; // Rare
        0 // Common
    }
}
```

#### Fisher-Yates Shuffle

```move
module shuffle::deck {
    use sui::random::{Self, Random};

    fun shuffle<T: store>(mut items: vector<T>, r: &Random, ctx: &mut TxContext): vector<T> {
        let mut gen = random::new_generator(r, ctx);
        let len = items.length();
        let mut i = len;
        while (i > 0) {
            i = i - 1;
            let j = gen.generate_range_u64(0, (i as u64) + 1);
            items.swap(i, j as u64);
        };
        items
    }
}
```

### Security Considerations

| Concern | Mitigation |
|---------|-----------|
| Manipulation by validators | Requires threshold of validators to collude (BLS threshold scheme) |
| Front-running | Transaction ordering determines the output; MEV-style attacks are possible |
| Predictability within a transaction | Deterministic given the transaction digest — cannot be called twice for "different" randomness in same txn |
| High-stakes applications | Use **commit-reveal** patterns for lotteries/auctions with significant value |

**Commit-reveal for high-stakes randomness:**

```move
module lottery::secure {
    // Phase 1: Users submit hash(their_secret)
    public fun commit(hash: vector<u8>, ctx: &mut TxContext) { /* ... */ }

    // Phase 2: Users reveal their_secret; combined secrets + on-chain randomness produce final result
    public fun reveal(secret: vector<u8>, r: &Random, ctx: &mut TxContext) { /* ... */ }
}
```

---

## Epochs

An epoch is a fixed time period on Sui. At epoch boundaries, the network processes validator rotations, computes staking rewards, and updates gas prices.

### Epoch Constants

| Network | Duration |
|---------|----------|
| **Mainnet** | ~24 hours |
| **Testnet** | Variable (can be shorter for testing) |
| **Devnet/Localnet** | Variable |

### Epoch API

```move
module sui::tx_context {
    public fun epoch(ctx: &TxContext): u64;
    public fun epoch_timestamp_ms(ctx: &TxContext): u64;
}
```

| Function | Returns | Description |
|----------|---------|-------------|
| `epoch()` | `u64` | Current epoch number (starts at 0 at genesis) |
| `epoch_timestamp_ms()` | `u64` | Timestamp (ms) when the **current epoch started** |

### What Happens at Epoch Boundaries

- **Staking rewards** are computed and distributed to validators and stakers
- **Validator set rotation**: validators can join or leave the active set
- **Reference gas price** is recalculated based on network conditions
- **Randomness seed** is regenerated via DKG for the new epoch
- **System parameters** (like protocol version flags) can be updated by governance

### Patterns

#### Epoch-Based Logic

```move
module governance::voting {
    public struct Proposal has key {
        id: UID,
        created_epoch: u64,
        voting_duration_epochs: u64,
    }

    public fun vote(proposal: &Proposal, ctx: &TxContext) {
        let now_epoch = ctx.epoch();
        assert!(
            now_epoch < proposal.created_epoch + proposal.voting_duration_epochs,
            0
        );
    }
}
```

#### Detecting Epoch Transitions

```move
module staking::pool {
    public struct Pool has key {
        id: UID,
        last_reward_epoch: u64,
    }

    // Processes rewards if an epoch boundary was crossed
    public fun maybe_process_rewards(pool: &mut Pool, ctx: &TxContext) {
        let current_epoch = ctx.epoch();
        if (current_epoch > pool.last_reward_epoch) {
            // Rewards were computed at the epoch boundary
            // ... redeem staking rewards
            pool.last_reward_epoch = current_epoch;
        }
    }
}
```

---

## Summary

| Primitive | Address | Access | Use When |
|-----------|---------|--------|----------|
| **Clock** | `0x6` | `&Clock` immutable ref | Real-time timestamps, time-locks, auctions |
| **Random** | `0x8` | `&Random` immutable ref | Randomized selection, shuffle, lottery, NFT traits |
| **Epoch** | Via `ctx` | `ctx.epoch()` / `ctx.epoch_timestamp_ms()` | Epoch-level scheduling, reward processing, validator-aware logic |

All three primitives are **free** — they incur no additional gas beyond the normal computation cost of calling their functions. No oracle fees, no off-chain infrastructure, no separate transactions.
