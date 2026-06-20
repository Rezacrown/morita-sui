# Morita — Cross-Game Inventory & Commerce Protocol

**Built on Sui for Overflow 2026 — DeFi & Payments Track**

Game items should not be trapped in one game. Morita lets developers tokenize in-game items with a simple REST API, and lets players trade those items across games — sell for SUI, swap atomically, or barter with conditions.

---

## What Morita Does

| For | Morita gives you |
|-----|-----------------|
| **Game Developers** | A dashboard to register games + define items + publish. A REST API to mint items. Zero smart contracts to write, zero gas to manage. |
| **Players** | A passport for all your items across games. Sign in with Google (no wallet), trade instantly (no gas), swap across games (no trust). |
| **The Platform** | Sponsored transactions via Enoki. Decentralized storage via Walrus. Atomic swaps via Sui PTBs. |

---

## Key Features

- **Google OAuth login** — Zero gas, zero passphrase wallet generation via Enoki zkLogin
- **Claim URL flow** — Game servers mint items via REST API, players claim with one click
- **Marketplace** — Direct sale with optional royalties via Sui Kiosk (enforced at protocol level)
- **Atomic Barter** — Trust-minimized cross-game item swapping in a single transaction
- **Value Gap Coverage** — When item values differ, the difference is covered with SUI atomically
- **Developer Dashboard** — Game management, item templates, API keys, analytics
- **On-Chain Items** — Every minted item is a first-class Sui object, visible on-chain

---

## Why Sui

| Primitive | How Morita Uses It |
|-----------|-------------------|
| **Enoki (zkLogin + Sponsored Tx)** | Auth via Google with no wallet extension; platform sponsors all gas |
| **Sui Kiosk** | Enforces optional seller-set royalties at the protocol layer |
| **Programmable Transaction Blocks** | Atomic cross-game barter — swap items between games in a single PTB |
| **Walrus** | Decentralized storage for item images and metadata |
| **Object Model** | Every item is a first-class Sui object with guaranteed safety |

---

## Quick Start

```bash
# Install dependencies
cd application && bun install

# Copy and fill environment variables
cp .env.example .env.local

# Run database migration
bun run db:push

# Start development server
bun run dev
```

---

## Project Structure

```
morita/
├── application/        # Next.js app (UI + server actions + Hono API)
│   ├── actions/        # 29 server actions
│   ├── components/     # 27 React components
│   ├── lib/            # DB, Sui SDK, Walrus, Enoki clients
│   └── stores/         # Zustand state management
├── contract/           # 4 Sui Move modules
│   └── sources/        # registry, item, kiosk_ext, escrow
├── docs/               # Specs, architecture, deployment guides
└── docker-compose.yml  # PostgreSQL
```

---

## Smart Contracts (4 Modules)

| Module | Purpose | Key Functions |
|--------|---------|---------------|
| `registry.move` | Publisher registration, game publishing, admin controls | create_publisher, initiate_publish, finalize_publish |
| `item.move` | GameItem type, mint/burn | mint, burn |
| `kiosk_ext.move` | Kiosk marketplace wrapper | list_for_sale, buy_item, create_transfer_policy |
| `escrow.move` | Atomic barter with full lock | lock_for_any, lock_for_target, fulfill, cancel |

---

## Architecture

```
Game Server → REST API → Server Actions → Sui Chain + PostgreSQL
                   ↑                          ↑            ↑
            API Key Auth               Enoki zkLogin    Drizzle ORM
```

### Two Signing Flows

- **executeAsAdmin (Flow A):** Platform signs with admin key. Used for mint, claim.
- **sponsorForUser + executeUserSigned (Flow B):** User signs with Enoki keypair. Used for create publisher, publish game, all marketplace operations.

All transactions are gasless — Enoki sponsors every transaction.

---

## Deployment (Testnet)

Full guide: `docs/TESTNET-DEPLOY-GUIDE.md`

Latest deployed IDs are tracked in `.env.local`.

---

## Team

Built for **Sui Overflow 2026** — DeFi & Payments Track

*June 2026*
