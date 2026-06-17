# Sui Overview, Installation & CLI

## Sui Overview

Sui is a scalable, performant Layer 1 blockchain built around an **object-centric data model**. Unlike account-based blockchains (Ethereum) or UTXO-based chains (Bitcoin), Sui treats every piece of onchain state as a typed object with a unique ID.

### Core Concepts

- **Object-centric model**: Every item on Sui is an object with a unique ID and version. Transactions consume objects as inputs and produce modified versions as outputs.
- **Move language**: Compile-time resource safety. Objects cannot be duplicated or silently dropped. Invalid resource handling is a compilation error, not a runtime cost.
- **Programmable Transaction Blocks (PTBs)**: Batch up to 1,024 commands into one atomic transaction — multiple Move calls, coin operations, and transfers.
- **Parallel execution**: Transactions on non-overlapping owned objects execute in parallel without consensus.

### Ownership Types

| Type | Access | Consensus |
|------|--------|-----------|
| **Address-owned** | Only owner can use | No consensus (parallel) |
| **Shared** | Any address | Mysticeti consensus |
| **Immutable (frozen)** | Anyone reads, no one mutates | No consensus |
| **Wrapped** | Stored inside another object | Via parent only |

### Sui vs Ethereum

| Concept | Ethereum | Sui |
|---------|----------|-----|
| Data model | Account-based with contract storage | Object-centric with typed, owned objects |
| Language | Solidity (EVM) | Move (compile-time safety) |
| State storage | Shared mappings in contracts | Individual objects with IDs |
| Safety model | Gas-based runtime prevention | Compile-time resource guarantees |
| Parallel execution | Sequential only | Parallel for owned-object txns |

### Sui Stack Primitives

- **zkLogin**: Web2 OAuth login (Google, Apple, etc.) for Sui wallets
- **DeepBook**: Native on-chain order book (like a CLOB)
- **Kiosk**: NFT marketplace primitive (royalties, listing, escrow)
- **Walrus**: Decentralized blob storage (images, docs, large files)
- **Seal**: Encrypted data on-chain with access control
- **Randomness**: On-chain randomness primitive

## System Requirements

- **Linux**: Ubuntu 22.04+ (Jammy)
- **macOS**: Monterey+
- **Windows**: Windows 10/11 (use WSL for curl-based install)

## Installing Sui (suiup)

`suiup` is the official installer and version manager:

```bash
curl -sSfL https://raw.githubusercontent.com/MystenLabs/suiup/main/install.sh | sh
```

Install the Sui CLI for a specific network:

```bash
suiup install sui@testnet    # Testnet-compatible version
suiup install sui@mainnet    # Mainnet-compatible version
```

**Windows**: The `curl | sh` command requires WSL. Alternatively use Chocolatey: `choco install sui`.

### Update & Switch

```bash
suiup update sui@testnet     # Download latest (does NOT switch)
suiup switch sui@testnet      # Set as active default
suiup show                    # List installed versions
```

### Optional Tools

```bash
suiup install move-analyzer   # Move Language Server (VS Code)
suiup install mvr             # Move Registry CLI
suiup install walrus          # Walrus CLI for storage
suiup install site-builder    # Walrus site builder
```

After installing, switch each: `suiup switch move-analyzer@testnet`

## Sui Networks

| Network | Purpose | Tokens |
|---------|---------|--------|
| **Mainnet** | Production | Real SUI value |
| **Testnet** | Integration testing, staging | Free from faucets |
| **Devnet** | Early development | Free from faucets |
| **Localnet** | Offline development | Free local faucet |

### Switching Networks

```bash
sui client active-env          # Show current network
sui client switch --env devnet # Switch network
```

## Client Configuration

First-time setup: run `sui client` (or `sui client -y` to skip prompt). This creates:
- A new key pair and address
- A 12-word recovery phrase (save immediately, never stored)
- `client.yaml` configuration

Config locations:
- **macOS/Linux**: `~/.sui/sui_config/client.yaml`
- **Windows**: `%USERPROFILE%\.sui\sui_config\client.yaml`

### Key Commands

| Command | Purpose |
|---------|---------|
| `sui client active-env` | Current network |
| `sui client active-address` | Current address |
| `sui client switch --env <ENV>` | Switch network |
| `sui client switch --address <ADDR>` | Switch address |
| `sui client new-address ed25519` | Create new address |
| `sui client addresses` | List all addresses |
| `sui client balance` | Check SUI balance |
| `sui client gas` | List gas coin objects |

### Key Storage

Keys stored at: `~/.sui/sui_config/sui.keystore` (Base64-encoded private keys). Not to be confused with system keystore.

### Recovery

```bash
sui keytool import '<12-WORD-PHRASE>' ed25519
```

## Gas Model

**gas cost = computation cost + storage cost - storage rebate**

- **Computation cost**: Proportional to execution effort
- **Storage cost**: Cost of storing new/expanded objects onchain
- **Storage rebate**: Refund when deleting objects or reducing size

Always specify `--gas-budget` when submitting transactions from CLI.

## Epochs

An epoch is a fixed time period (~24h on Mainnet). At epoch boundaries: staking rewards process, validators rotate, gas price updates. Use `ctx.epoch()` and `ctx.epoch_timestamp_ms()` in Move.

## Getting SUI Tokens

| Method | Works On |
|--------|----------|
| Web faucet (`faucet.sui.io`) | Testnet, Devnet |
| `sui client faucet` | **Devnet/Localnet only** — NOT Testnet |
| Discord: `!faucet <ADDR>` | Testnet, Devnet |
| TypeScript: `requestSuiFromFaucetV2()` | Testnet, Devnet |

**WARNING**: `sui client faucet` does NOT work on Testnet. Use the web faucet instead.

### Merging Gas Coins

```bash
sui client ptb \
  --merge-coins @0xPRIMARY_COIN_ID "[@0xCOIN_A, @0xCOIN_B]"
```

## Explorers

- **SuiVision**: `suivision.xyz`
- **Suiscan**: `suiscan.xyz`

## Rules

- Always verify `sui client active-env` before publishing
- `sui client faucet` is Devnet/Localnet only
- `suiup update` downloads but doesn't switch — always follow with `suiup switch`
- Use `sui client ptb` for CLI transactions, not legacy single-purpose commands
- Do not manually edit `client.yaml`

## Common Mistakes

- Forgetting to switch networks before publishing (Mainnet instead of Testnet)
- Using `sui client faucet` on Testnet — won't work
- Running `suiup update` and thinking it switched — need `suiup switch` too
- Version mismatch: CLI older than network causes build failures
