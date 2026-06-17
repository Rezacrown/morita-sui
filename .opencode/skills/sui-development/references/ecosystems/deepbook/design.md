# DeepBookV3 Design

## Architecture Overview

Three shared objects form the core:
- **Pool** — represents one market, manages order book/users/stakes
- **PoolRegistry** — prevents duplicate pools, maintains package versioning
- **BalanceManager** — sources user funds when placing orders (shared across pools)

## Pool Structure

The Pool shared object is composed of three layers:

### Book
Maintains two `BigVector<Order>` for bids and asks plus metadata. Handles:
- Storing, matching, modifying, and removing Orders
- Creating `OrderInfo` → matching against existing maker orders → accumulating `Fill`s
- Injecting remaining quantity into the order book as a limit order

### State
Processes all requests through three sub-modules:

**Governance**
- Stores pool trading params: taker fee, maker fee, stake required
- Every epoch, stakers can propose parameter changes with bounded fees:

| Pool Type | Taker Fee (bps) | Maker Fee (bps) |
|-----------|----------------|-----------------|
| Volatile | 1 - 10 | 0 - 5 |
| Stable | 0.1 - 1 | 0 - 0.5 |
| Whitelisted | 0 | 0 |

- **Voting Power Formula:** V = min(S, Vc) + max(sqrt(S) - sqrt(Vc), 0), where Vc = 100,000 DEEP
- **Quorum:** 50% of total voting power
- Proposals exceeding quorum go live from the following epoch
- Proposals and votes reset every epoch

**History**
- Tracks epoch-level aggregated volumes, trading params, fees collected, fees to burn
- Maker rebate calculations per epoch:
  - If total volume > median volume (last 28 days): no rebates
  - Lower volume = more rebates
  - Max rebates = total DEEP collected that epoch
  - Remaining DEEP is burned

**Account**
- Per-user data: volumes, stake, voted proposal, unclaimed rebates, balances
- Settled balances (pool owes user) vs Owed balances (user owes pool)
- 1:1 relationship with BalanceManager

### Vault
- Resets settled/owed balances every transaction
- Processes balance transfers to/from BalanceManager
- Stores `DeepPrice` (up to 100 data points for DEEP/base-quote conversion)

## BigVector
Arbitrary-sized vector using onchain B+ Tree for near-constant time (log max_fan_out) random access, insertion, and removal. Iteration via leaf node slices.

## Place Limit Order Flow

1. **Pool**: `place_order_int` creates OrderInfo → calls Book → calls State → calls Vault
2. **Book**: Validates inputs → matches against opposite side (generates Fills) → injects remaining as limit Order
3. **State**: Processes fills (updates volumes, settles maker funds) → calculates taker/maker fees → updates account balances
4. **Vault**: Compares balances_out vs balances_in → splits/deposits difference → repeats for base/quote/DEEP
