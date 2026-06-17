# DeepBookV3 — Decentralized CLOB on Sui

DeepBookV3 is a next-generation decentralized central limit order book (CLOB) built on Sui. It leverages Sui's parallel execution and low transaction fees for a highly performant, low-latency on-chain exchange.

## Features

- **Flash loans** — borrow assets within a single transaction
- **Governance** — DEEP token holders vote on pool parameters
- **Account abstraction** — improved BalanceManager for fund management
- **DEEP Token** — native token for trading fees and staking

## DEEP Tokenomics

The DEEP token (`0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP`) pays for trading fees. Governance sets DEEP fees 20% lower than input token fees.

**Staking Benefits:**
- Taker incentives: reduce fees by half — as low as **0.25 bps** on stable pairs, **2.5 bps** on volatile pairs
- Maker incentives: rebates based on maker volume generated

## Liquidity Support

DeepBookV3 supports market and limit orders through a CLOB architecture:

- **Ask** — sell tokens at a set price (limit) or market rate
- **Bid** — buy tokens at a set price or market rate
- **Auto-pooling** — if no single seller matches a large bid, orders are automatically pooled

## Transparency

The CLOB acts as a digital ledger logging bids and asks in chronological order. Anyone can view trades and prices for proof of fairness. Use this transparency to build metrics and monitoring dashboards.

## Integration

DeepBookV3 has no end-user interface. It provides trading functionality for DEXes, wallets, and other apps. The SDK abstracts PTB construction complexities for market making.

## Open Source

DeepBookV3 is open for community development. Use [SIPs](https://github.com/sui-foundation/sips) to propose changes.
