# Morita — Cross-Game Inventory & Commerce Protocol

**Built on Sui for Overflow 2026 — DeFi & Payments Track**

Morita lets game developers tokenize in-game items on Sui with zero blockchain knowledge, and lets players trade those items across games — sell for SUI or barter atomically.

---

## The Problem

Game items are trapped inside their respective ecosystems. Players spend hundreds of hours earning rare items that cannot be sold, traded, or carried between games. Game developers lack accessible infrastructure to tokenize in-game assets and participate in secondary markets.

## The Solution

A plug-and-play protocol on Sui:

- **Game Developers** register their game, define items, and mint them via a simple REST API — no smart contract knowledge required
- **Gamers** log in with Google (via Enoki zkLogin), see all items across every game, sell with optional royalties, and atomically barter items between games
- **Platform** sponsors all gas via Enoki — users never touch SUI

---

## Why Sui

| Primitive | How Morita Uses It |
|-----------|-------------------|
| **Enoki (zkLogin + Sponsored Tx)** | Auth via Google with no wallet extension; platform sponsors all gas |
| **Sui Kiosk** | Enforces optional seller-set royalties for all P2P sales |
| **Programmable Transaction Blocks** | Atomic cross-game barter — swap items between games in a single transaction |
| **Walrus** | Decentralized storage for item images and metadata |
| **Object Model** | Every item is a first-class Sui object with guaranteed safety |

---

## Architecture

```
Game Server → Hono API → Server Actions → Sui Chain + PostgreSQL
                  ↑                          ↑            ↑
           API Key Auth               Enoki zkLogin    Drizzle ORM
```

**4 Smart Contracts:** registry (publisher/game management), item (mint/burn), kiosk_ext (marketplace), escrow (atomic barter)

**Tech Stack:** Next.js 16, Sui Move, Drizzle ORM, PostgreSQL, Enoki, Walrus, Hono

---

## Key Features

- **Google OAuth login** — Zero gas, zero passphrase wallet generation
- **Claim URL flow** — Game servers mint items via REST API, players claim via URL
- **Marketplace** — Direct sale with optional royalties via Sui Kiosk
- **Atomic Barter** — Trust-minimized cross-game item swapping in a single PTB
- **Value-Based Swap** — When item values differ, gap is covered with SUI atomically
- **Developer Dashboard** — Game management, item templates, API keys, analytics

---

## Quick Start

```bash
# Start PostgreSQL
docker compose up -d

# Install dependencies
cd application && bun install

# Copy and fill environment variables
cp example.env .env.local

# Run database migration
$env:DATABASE_URL="postgresql://morita:morita_pwd@localhost:5432/morita"
bun run db:migrate

# Start development server
bun run dev
```

---

## Deployment (Testnet)

- Package ID: `0xec6be0f9b9a8f5e190ed6abfc24f341d90f779d0aba2fe1fe457369d15d4817b`
- TransferPolicy: `0xb186bff1db96eac3ac34e167ba29d27de5cadb03161c76e528191dc62cd421fb`
- AdminCap + Publisher deployed via OTW pattern

Full guide: `docs/TESTNET-DEPLOY-GUIDE.md`

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
├── docs/               # Specs, blueprints, deployment guides
├── docker-compose.yml  # PostgreSQL
└── developer-guide.md  # Onboarding for team members
```

---

## Team

Built for **Sui Overflow 2026** — DeFi & Payments Track

---

*June 2026*
