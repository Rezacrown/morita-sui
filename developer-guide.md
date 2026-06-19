# Morita — Developer Guide

> Cross-game inventory & commerce protocol on Sui.
> Sui Overflow 2026 | DeFi & Payments Track

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Repository Structure](#3-repository-structure)
4. [Architecture Overview](#4-architecture-overview)
5. [File Map & Connections](#5-file-map--connections)
6. [Key Workflows](#6-key-workflows)
7. [Setup & Running Locally](#7-setup--running-locally)
8. [Deployment](#8-deployment)
9. [Environment Variables](#9-environment-variables)

---

## 1. Project Overview

Morita lets game developers tokenize in-game items on Sui and lets players trade those items across games — sell for SUI or barter atomically.

### Core Principles

- **GameDevs** register games and define items via a web dashboard. Players claim items via URL — no smart contract knowledge required.
- **Gamers** log in with Google (via Enoki zkLogin), see all items across every game, sell with optional royalties, and barter items between games.
- **Platform** sponsors all gas via Enoki. Users never touch SUI.

---

## 2. Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Runtime** | Bun (Windows) | Script runner, package manager |
| **Framework** | Next.js 16 (App Router) | Full-stack: frontend + server actions + API routes |
| **Language** | TypeScript | All backend + frontend code |
| **Smart Contracts** | Sui Move (edition 2024) | 4 modules: registry, item, kiosk_ext, escrow |
| **Database** | PostgreSQL 17 + Drizzle ORM | Relational storage for drafts, claims, analytics |
| **Auth & Gas** | Enoki (zkLogin + Sponsored Tx) | Google OAuth, no-gas-required transactions |
| **Storage** | Walrus (Aggregator + SDK) | Decentralized blob storage for item images |
| **External API** | Hono (via Next.js catch-all) | REST endpoints for game servers |
| **Styling** | Tailwind CSS v4 | Neo-Brutalist design system |
| **State** | Zustand + TanStack Query | Client state + server cache |
| **Validation** | Zod v4 | Runtime type validation |

---

## 3. Repository Structure

```
morita/
├── application/                    # Next.js app (frontend + backend)
│   ├── app/                        # App Router pages + API routes
│   │   ├── (hub)/                  # Gamer pages (inventory, marketplace, claim, etc.)
│   │   ├── (dashboard)/            # Developer dashboard pages
│   │   ├── api/[[...route]]/       # Hono external API (mounted on Next.js)
│   │   ├── layout.tsx              # Root layout
│   │   ├── providers.tsx           # DAppKit + QueryClient providers
│   │   └── page.tsx                # Landing page
│   ├── actions/                    # Server Actions (backend logic)
│   │   ├── auth.ts                 # Session management
│   │   ├── publisher.ts            # Publisher CRUD
│   │   ├── game.ts                 # Game CRUD + publish
│   │   ├── item.ts                 # Item template CRUD
│   │   ├── claim.ts                # Claim code redemption
│   │   ├── marketplace.ts          # Escrow + listing indexing
│   │   ├── api-keys.ts             # API key generation + validation
│   │   ├── analytics.ts            # Dashboard analytics
│   │   └── admin.ts                # Admin operations (verify, pause, resume)
│   ├── components/                 # React components
│   │   ├── landing/                # Landing page (10 components)
│   │   └── shared/                 # Reusable (17 components)
│   ├── lib/                        # Shared libraries
│   │   ├── db/
│   │   │   ├── schema.ts           # Drizzle ORM schema (10 tables)
│   │   │   └── index.ts            # DB connection singleton
│   │   ├── sui/
│   │   │   ├── client.ts           # SuiGrpcClient (testnet/devnet/localnet)
│   │   │   ├── enoki-client.ts     # Enoki backend client
│   │   │   ├── ptb-builder.ts      # PTB construction helpers
│   │   │   └── event-indexer.ts    # gRPC event streaming (stub)
│   │   └── walrus/
│   │       └── index.ts            # Walrus upload + aggregator read
│   ├── stores/                     # Zustand stores (5)
│   ├── schemas/                    # Zod validation schemas
│   ├── drizzle.config.ts           # Drizzle Kit config
│   └── package.json
│
├── contract/                       # Sui Move smart contracts
│   ├── sources/
│   │   ├── registry.move           # Publisher, Game, GameCapability, AdminCap
│   │   ├── item.move               # GameItem mint/burn
│   │   ├── kiosk_ext.move          # Kiosk listing + purchase
│   │   └── escrow.move             # Atomic barter with value-based swap
│   ├── Move.toml
│   ├── Makefile                    # Build/test/publish targets
│   └── LOCALNET-GUIDE.md
│
├── docker-compose.yml              # PostgreSQL container
├── docs/
│   ├── superpowers/
│   │   ├── specs/                  # Design doc + DBML schema
│   │   ├── blueprints/             # YAML blueprints
│   │   └── plans/                  # Implementation plans
│   └── TESTNET-DEPLOY-GUIDE.md     # Step-by-step testnet deployment
├── prompts.txt                     # Original hackathon context
└── developer-guide.md              # This file
```

---

## 4. Architecture Overview

```
GAME SERVER (third-party)
        │  POST /api/v1/game/:id/item/mint
        │  Authorization: Bearer morita_sk_xxxx
        ▼
┌─────────────── HONO API ROUTES ──────────────┐
│  (External — consumed by game devs)           │
│  /api/v1/game/:id/item/mint                   │
│  /api/v1/game/:id/item/burn                   │
│  /api/v1/game/:id/inventory/:address          │
│  /api/v1/game/:id/item/:item_id              │
└──────────────────────────────────────────────┘
        │  Internal call
        ▼
┌─────────────── SERVER ACTIONS ───────────────┐
│  (Internal — consumed by frontend)            │
│  Auth: Enoki session                          │
│  Signing: Flow A (backend) or Flow B (client) │
│  DB: Drizzle ORM → PostgreSQL                 │
└──────────────────────────────────────────────┘
        │
        ▼
┌─────────── SHARED LAYER (lib/) ─────────────┐
│  SuiGrpcClient  │  EnokiClient  │  Drizzle   │
│  PTB Builder    │  Walrus SDK   │  Harbor      │
└──────────────────────────────────────────────┘
        │                          │
        ▼                          ▼
┌──────────────┐          ┌──────────────┐
│  SUI CHAIN   │          │  PostgreSQL  │
│  (4 modules) │          │  (10 tables) │
│  + Walrus    │          │              │
└──────────────┘          └──────────────┘
```

### Two Signing Flows

**Flow A — Backend-only (platform-authoritative):** No user signature needed. Backend builds PTB, sponsors via Enoki, signs with `ADMIN_PRIVATE_KEY`, executes.

Used for: mint item, create Kiosk, redeem claim code, admin actions.

**Flow B — Client-sign (user-protected):** User builds PTB in frontend, sends `txBytes` to backend for Enoki sponsorship, Enoki wallet auto-signs (no popup).

Used for: create publisher, publish game, list for sale, buy item, escrow operations.

---

## 5. File Map & Connections

### Action Files ↔ Contract Functions

| Server Action | File | Flow | Move Call | DB Table |
|---------------|------|------|-----------|----------|
| `savePublisherOnChain` | `actions/publisher.ts` | B | `registry::create_publisher` | `publishers`, `gamedevs` |
| `createGame` | `actions/game.ts` | — | (DB only) | `games` |
| `publishGameComplete` | `actions/game.ts` | B | `initiate_publish` + `finalize_publish` | `games`, `item_templates`, `api_keys` |
| `saveItemDraft` | `actions/item.ts` | — | (DB only) | `item_templates` |
| `redeemClaimCode` | `actions/claim.ts` | A | `item::mint` | `claim_codes`, `item_templates` |
| `createEscrowOnChain` | `actions/marketplace.ts` | B | `escrow::lock_item_for_any/target` | `escrow_index` |
| `fulfillEscrowOnChain` | `actions/marketplace.ts` | B | `escrow::fulfill_escrow` | `escrow_index` |
| `generateApiKey` | `actions/api-keys.ts` | — | (server-side) | `api_keys` |
| `verifyPublisher` | `actions/admin.ts` | A | `registry::verify_publisher` | `publishers` |

### PTB Builders ↔ Contract Calls

| Helper | File | Target |
|--------|------|--------|
| `buildMintPTB` | `lib/sui/ptb-builder.ts` | `item::mint` |
| `buildPublishPTB` | `lib/sui/ptb-builder.ts` | `initiate_publish` + `finalize_publish` |
| `buildListForSalePTB` | `lib/sui/ptb-builder.ts` | `kiosk_ext::list_for_sale` |
| `buildBuyItemPTB` | `lib/sui/ptb-builder.ts` | `kiosk_ext::buy_item` |
| `buildLockForAnyPTB` | `lib/sui/ptb-builder.ts` | `escrow::lock_item_for_any` |
| `buildFulfillEscrowPTB` | `lib/sui/ptb-builder.ts` | `escrow::fulfill_escrow` |
| `buildCancelEscrowPTB` | `lib/sui/ptb-builder.ts` | `escrow::cancel_escrow` |
| `buildFulfillEscrowWithValuePTB` | `lib/sui/ptb-builder.ts` | `escrow::fulfill_escrow_with_value` |

### Hono API ↔ External Endpoints

| Endpoint | Method | Handler | Auth |
|----------|--------|---------|------|
| `/api/v1/game/:id/item/mint` | POST | Create claim code in DB | API Key |
| `/api/v1/game/:id/item/burn` | POST | Flow A burn | API Key |
| `/api/v1/game/:id/inventory/:addr` | GET | Query on-chain items (stub) | API Key |
| `/api/v1/game/:id/item/:id` | GET | Query item detail (stub) | API Key |

---

## 6. Key Workflows

### Dev Onboarding
```
Google Login → Enoki wallet → Dashboard
→ Create Publisher (on-chain, Flow B)
→ Create Game (DB draft)
→ Create Item Templates (DB draft, upload images placeholder)
→ Publish Game: Walrus upload → PTB (initiate + finalize) → API key generated
→ Share API key with game server
```

### Player Claim
```
Game Server: POST /api/v1/game/:id/item/mint → claim code
Player: Open /claim?code=XXX → Enoki login → Preview item → Claim
Backend: SELECT FOR UPDATE → item::mint (Flow A) → Item in inventory
```

### Marketplace
```
Player A: List item → PTB list_for_sale (Flow B) → Item in Kiosk
Player B: Browse marketplace → Buy → PTB buy_item (Flow B) → Kiosk splits payment
OR
Player A: Create escrow → PTB lock_item_for_any (Flow B) → Item locked
Player B: Fulfill → PTB fulfill_escrow (Flow B) → Atomic swap
```

---

## 7. Setup & Running Locally

### Prerequisites

- **Bun** (Windows): `powershell -c "irm bun.sh/install.ps1 | iex"`
- **Docker Desktop**: For PostgreSQL
- **Sui CLI**: Via WSL/linuxbrew (`/home/linuxbrew/.linuxbrew/bin/sui`)
- **Enoki Account**: https://portal.enoki.mystenlabs.com
- **Google OAuth Client ID**: Google Cloud Console

### Quick Start

```bash
# 1. Start PostgreSQL
docker compose up -d

# 2. Install dependencies
cd application
bun install

# 3. Setup .env.local (copy from example.env + fill in keys)
cp example.env .env.local

# 4. Run database migration
$env:DATABASE_URL="postgresql://morita:morita_pwd@localhost:5432/morita"
bun run db:migrate

# 5. Start development server
bun run dev
```

### Required Environment Variables

See `application/example.env` for full list. Critical ones:

```
ADMIN_PRIVATE_KEY=suiprivkey1...    # Platform admin keypair
NEXT_PUBLIC_ENOKI_PUBLIC_KEY=       # From Enoki Portal
ENOKI_SECRET_KEY=                   # From Enoki Portal (private!)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=       # From Google Cloud Console
DATABASE_URL=postgresql://morita:morita_pwd@localhost:5432/morita
```

---

## 8. Deployment

### Testnet Deploy (Contracts)

See `docs/TESTNET-DEPLOY-GUIDE.md` for full steps:

```bash
# 1. Switch to testnet
sui client switch --env testnet

# 2. Get SUI from faucet
curl -X POST https://faucet.testnet.sui.io/v1/gas -H "Content-Type: application/json" \
  -d '{"FixedAmountRequest":{"recipient":"<ADMIN_ADDRESS>"}}'

# 3. Publish
sui client publish --gas-budget 50000000

# 4. Deploy TransferPolicy
sui client ptb \
  --assign publisher @<PUBLISHER_OBJECT_ID> \
  --move-call <PACKAGE_ID>::kiosk_ext::create_transfer_policy publisher \
  --gas-budget 20000000

# 5. Update .env.local + Enoki Portal whitelist
```

### Wallet Generation

```bash
# Generate platform keypair
sui client new-address ed25519

# Export private key
sui keytool export --key-identity <ALIAS>
```

---

## 9. Environment Variables

| Variable | Source | Used In |
|----------|--------|---------|
| `NEXT_PUBLIC_SUI_NETWORK` | Config | `lib/sui/client.ts`, `providers.tsx` |
| `NEXT_PUBLIC_PACKAGE_ID` | Contract deploy | `ptb-builder.ts`, `route.ts`, `event-indexer.ts` |
| `ADMIN_PRIVATE_KEY` | `sui keytool export` | `lib/walrus/index.ts`, `enoki-client.ts` |
| `NEXT_PUBLIC_PLATFORM_ADDR` | `sui client new-address` | `ptb-builder.ts` |
| `NEXT_PUBLIC_ENOKI_PUBLIC_KEY` | Enoki Portal | `providers.tsx` |
| `ENOKI_SECRET_KEY` | Enoki Portal | `enoki-client.ts` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google Cloud Console | `providers.tsx` |
| `WALRUS_AGGREGATOR_URL` | Walrus docs | `lib/walrus/index.ts` |
| `NEXT_PUBLIC_WALRUS_AGGREGATOR` | Walrus docs | Frontend image display |
| `DATABASE_URL` | Docker Compose | `lib/db/index.ts` |
| `NEXT_PUBLIC_APP_URL` | Config | `route.ts` (claim URL generation) |

---

## 10. Current Deployment (Testnet)

| Item | ID |
|------|-----|
| **Package ID** | `0xec6be0f9b9a8f5e190ed6abfc24f341d90f779d0aba2fe1fe457369d15d4817b` |
| **AdminCap** | `0xcaab9159d5a0aece2123054fbb1255658255105b9120c54175249f8aaab45139` |
| **Publisher** | `0x339ef5be9f21c2b3f41b7630589415e627bd695c74ebd64aff4970d1fccda7d7` |
| **TransferPolicy\<GameItem\>** | `0xb186bff1db96eac3ac34e167ba29d27de5cadb03161c76e528191dc62cd421fb` |
| **TransferPolicyCap** | `0x061aa134bd02114ea3b093e3e86b0c6ed6fb4ab667c97f855b6238633bce602b` |
| **UpgradeCap** | `0x282e437cee756bec89d4c9c931953866a41cb438c6d13e548d789c68f2239c8c` |
| **Admin Address (PLATFORM_ADDR)** | `0x8aabd8a2fe756e6a13744382d193541ea4be72e022d61b130bea7c7df017bb47` |

### Enoki Config
| Key | Value |
|-----|-------|
| Public Key | `enoki_public_fcfd5b8ec0f4a7dbfa641c7c514e3134` |
| Secret Key | `enoki_private_cf3aa053defd134279e6c356d363d03f` |
| Google Client ID | `833312387115-7u45vtkrt1d77iqrp2uvd6042i3fat7j.apps.googleusercontent.com` |

### Enoki Portal Whitelist (16 Move Call Targets)
All targets use Package ID: `0xec6be0f9b9a8f5e190ed6abfc24f341d90f779d0aba2fe1fe457369d15d4817b`

```
registry::create_publisher
registry::initiate_publish
registry::finalize_publish
registry::update_game
registry::verify_publisher
registry::pause_game
registry::resume_game
item::mint
item::burn
kiosk_ext::list_for_sale
kiosk_ext::buy_item
escrow::lock_item_for_any
escrow::lock_item_for_target
escrow::fulfill_escrow
escrow::fulfill_escrow_with_value
escrow::cancel_escrow
```

**Allowed Address:** `0x8aabd8a2fe756e6a13744382d193541ea4be72e022d61b130bea7c7df017bb47`

### Walrus
| Endpoint | URL |
|----------|-----|
| Aggregator (read) | `https://aggregator.walrus-testnet.walrus.space` |
| Relay (upload) | `https://relay.walrus-testnet.walrus.space` |

### Database
**Connection:** `postgresql://morita:morita_pwd@localhost:5432/morita`
**Tables (10):** gamedevs, publishers, games, user_kiosks, api_keys, item_templates, claim_codes, escrow_index, item_cache, tx_events

---

## 11. Pending Tasks (MVP Gaps)

| # | Priority | Task | File | Notes |
|---|----------|------|------|-------|
| 1 | 🔴 | **Wire Claim Flow A** — `redeemClaimCode` → real PTB `item::mint` via Enoki sponsored tx | `actions/claim.ts` + `lib/sui/enoki-client.ts` | Currently returns `txDigest: ''` |
| 2 | 🔴 | **Wire Flow B Signing** — frontend build PTB → backend sponsor → EnokiFlow keypair sign → execute | `components/landing/login-modal.tsx` + `actions/publisher.ts` | Need `useEnokiFlow().getKeypair()` for signing |
| 3 | 🟡 | **Hono Inventory Endpoint** — query on-chain items via `suiClient.getOwnedObjects()` | `app/api/[[...route]]/route.ts` | Currently returns `items: []` |
| 4 | 🟡 | **Hono Item Detail Endpoint** — query on-chain item object | `app/api/[[...route]]/route.ts` | Currently returns `item: null` |
| 5 | 🟡 | **Hono Burn Endpoint** — real Flow A `item::burn` | `app/api/[[...route]]/route.ts` | Currently empty success |
| 6 | 🟡 | **Event Indexer** — gRPC streaming for event indexing | `lib/sui/event-indexer.ts` | Currently a stub |
| 7 | 🟢 | **Dashboard → Create Publisher** — wire Flow B signing | Frontend + `actions/publisher.ts` | Depends on #2 |
| 8 | 🟢 | **Dashboard → Publish Game** — Walrus upload + PTB | `actions/game.ts` | Depends on #1, #2 |
| 9 | 🟢 | **Marketplace listings** — query Kiosk on-chain for sale items | `actions/marketplace.ts` | Currently escrow-index only |
| 10 | 🟢 | **Demo Day Prep** — test 5-min flow end-to-end | — | After #1-3 done |

---

## Key Design Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| D1 | Mint on-demand during claim | Simplifies publish; no item state issues |
| D2 | Enoki for auth + gas | Eliminates zkLogin complexity |
| D3 | PublishTicket hot potato pattern | GameCapability forced to platform — trustless |
| D4 | Metadata in Walrus, not on-chain | Lower gas, flexible metadata |
| D5 | Seller-set price + optional royalty | Simple, no oracle needed |
| D6 | Single workspace per user | MVP simplification |
| D7 | GameItem has key, store | Required for Kiosk compatibility |
| D8 | Flat actions/ directory | Simpler than nested modules |

---

*Last updated: June 19, 2026*

