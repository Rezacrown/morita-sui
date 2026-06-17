# Morita — Design Document

> **Sui Overflow 2026 | DeFi & Payments Track**
> Deadline: June 21, 2026 | Final delivery: 4 days

---

## 1. Project Identity & Hackathon Alignment

### Identity

| Aspect | Detail |
|---|---|
| **Name** | Morita |
| **Track** | DeFi & Payments |
| **Tagline** | Cross-game inventory & commerce protocol — own your items, trade anywhere |

### Problem

Game items are trapped inside their respective ecosystems. Gamers spend hundreds of hours earning rare items that cannot be sold, traded, or carried between games. Web2 game developers lack accessible infrastructure to tokenize in-game assets and participate in secondary markets.

### Solution

A plug-and-play cross-game inventory & commerce protocol on Sui:
- **Game Developers** register their game, define items, and mint them to players via a simple REST API — no smart contract knowledge required
- **Gamers** log in once (Google/Twitch via Enoki zkLogin), see all their items across every game, sell them with optional royalties, and atomically barter items between games

### Why Sui (The "Superpowers")

| Sui Primitive | How Morita Uses It |
|---|---|
| **Enoki (zkLogin + Sponsored Tx)** | Auth via Google/Twitch with Enoki; platform sponsors all gas — users never touch SUI |
| **Sui Kiosk** | Enforces optional seller-set royalties at the protocol level for all P2P sales |
| **Programmable Transaction Blocks** | Atomic cross-game barter — swap Item A (Game 1) for Item B (Game 2) in a single tx |
| **Walrus** | All game assets (images, metadata JSON) stored on decentralized storage via Harbor API |
| **gRPC Streaming** | Real-time event indexing from Sui full node into PostgreSQL |

### DeFi & Payments Framing

Every transaction in Morita is a **programmable financial action**:
- **Royalty split** on secondary sales — seller optionally sets a royalty percentage enforced by Sui Kiosk
- **Trust-minimized atomic barter** — two parties swap assets across games without intermediaries
- **Value-based conditional swap** — when item values differ, the gap is covered with SUI tokens atomically

This aligns with the DeFi & Payments track's **"Trust-Minimized Finance"** and **"Payments & Consumer Finance"** idea banks.

### Judging Criteria Alignment

| Criterion | Weight | Morita's Strength |
|---|---|---|
| **Real-World Application** | 50% | Solves real pain — gamer item value loss, dev secondary market monetization |
| **Product & UX** | 20% | Enoki zkLogin + claim URLs = seamless Web2.5 onboarding; polished marketplace UI |
| **Technical Implementation** | 20% | 4 Sui Move modules, PTB atomic barter, Walrus storage, Enoki gasless tx |
| **Presentation & Vision** | 10% | End-to-end demo: dev onboard → player earn → player trade in 5-7 minutes |

---

## 2. Enoki Integration Architecture

### Overview

Enoki is Mysten Labs' SaaS for gasless onboarding. We use it for **all auth and all sponsored transactions**. No raw zkLogin — Enoki handles salt, ephemeral keys, ZK proofs, and gas sponsorship.

### Prerequisites (SETUP BEFORE CODING)

| Prerequisite | Source |
|---|---|
| Enoki Public API Key | https://portal.enoki.mystenlabs.com |
| Enoki Private API Key | https://portal.enoki.mystenlabs.com |
| Google OAuth Client ID + Secret | Google Cloud Console; configured in Enoki Portal |
| Twitch OAuth Client ID + Secret | Twitch Developer Console; configured in Enoki Portal |

### Two Signing Flows

**Flow A — Backend-only (Platform-authoritative actions):**
No user signature needed. Backend builds PTB, sponsors via Enoki, signs with platform private key, executes.

Used for:
- Mint item to player (platform holds GameCapability)
- Auto-create Kiosk for new users
- Claim code redemption (mint on-chain item to player)
- Update published game metadata (platform holds GameCapability)
- Admin actions (verify publisher, pause game)

```
Backend: build PTB → EnokiClient.createSponsoredTransaction → sign with ADMIN_KEY → execute
```

**Flow B — Client-sign (User-protected actions):**
User authorizes transfer of their own items. Enoki wallet auto-signs without confirmation popup.

Used for:
- Create Publisher (GameDev authorizes)
- Publish Game (GameDev must sign to use owned Publisher object)
- List item for sale / create escrow (owner authorizes item transfer)
- Buy item / fulfill escrow (buyer authorizes payment/item transfer)
- Cancel escrow (initiator authorizes)

```
Frontend: build PTB → tx.build({ onlyTransactionKind: true }) → send txBytes to backend
Backend: EnokiClient.createSponsoredTransaction(...) → return bytes + digest to frontend
Frontend: Enoki wallet auto-signs (no user confirmation needed)
Frontend → Backend: digest + signature
Backend: EnokiClient.executeSponsoredTransaction(...)
```

### Enoki Wallet Registration (Frontend)

```typescript
import { registerEnokiWallets } from '@mysten/enoki'
import { SuiGrpcClient } from '@mysten/sui/grpc'

const suiClient = new SuiGrpcClient({
    network: 'testnet',
    baseUrl: 'https://rpc.testnet.sui.io:443',
})

registerEnokiWallets({
    client: suiClient,
    network: 'testnet',
    apiKey: 'PUBLIC_ENOKI_API_KEY',
    providers: {
        google: { clientId: 'GOOGLE_CLIENT_ID' },
        twitch: { clientId: 'TWITCH_CLIENT_ID' },
    },
})
```

### Enoki Backend Client

```typescript
import { EnokiClient } from '@mysten/enoki'

const enokiClient = new EnokiClient({
    apiKey: process.env.ENOKI_SECRET_KEY!,
})
```

### Limitation (MVP)

Enoki-only wallet support. No Sui Wallet extension or other wallets. Users must use Google/Twitch OAuth. This simplifies UX for MVP; standard wallet support is a future consideration.

---

## 3. On-Chain Architecture (Sui Move)

### Module Overview

```
morita/contract/sources/
├── registry.move     # Publisher, Game, GameCapability, AdminCap
├── item.move         # GameItem mint/burn, supply model
├── kiosk_ext.move    # Kiosk wrapper: listing with optional royalty (imports 0x2::kiosk)
└── escrow.move       # Lock-and-swap: public barter, direct barter, conditions
```

### Module 1: `registry.move`

**On-chain entities:**

```
AdminCap (held by platform)
  ├── verify_publisher(publisher_id)
  ├── pause_game(game_id) / resume_game(game_id)

Publisher (self-service, anyone can create)
  ├── name: String
  ├── owner: address
  └── is_verified: bool

Game (created by publisher)
  ├── name: String
  ├── publisher_id: ID
  ├── created_at: u64
  └── is_active: bool

GameCapability (issued to platform on publish)
  └── Authorizes mint/burn of items for that game
  └── Held by platform sponsor address (for Flow A mint)
```

**Functions:**
- `create_publisher(name, ctx)` — self-service, anyone with Sui address
- `verify_publisher(AdminCap, publisher_id)` — admin only
- `create_game(publisher, game_name, ctx)` — publisher owner only; returns Game and GameCapability
- `update_game(GameCapability, new_name, ctx)` — metadata edit after publish (GameCapability held by platform)
- `pause_game(AdminCap, game_id)` / `resume_game(AdminCap, game_id)` — emergency control

**State transitions:**
```
Publisher:  active ──→ verified (admin toggle)
Game:       created ──→ paused ──→ resumed
```

**Key design decision:** `create_game` returns GameCapability. During publish (Flow B), the PTB includes a `transferObjects` command to send the GameCapability to the platform sponsor address. This enables Flow A mints.

### Module 2: `item.move`

**Struct:**
```
GameItem
  ├── game_id: ID          # Which game this item belongs to
  ├── item_id: u64         # Unique ID within the game
  ├── item_type: String    # Gamedev-defined (e.g., "weapon", "sword", "melee")
  ├── rarity: String       # Gamedev-defined (e.g., "legendary", "S-rank", "divine")
  ├── blob_id: String      # Walrus Blob ID pointing to metadata JSON
  ├── supply: Option<u64>  # None = NFT (unique), Some(n) = fungible copies
  └── owner: address       # Current owner
```

**Metadata Model (3 layers):**

| Layer | Location | Content |
|---|---|---|
| Layer 1 | On-chain (`GameItem` fields) | `game_id`, `item_id`, `item_type`, `rarity`, `blob_id`, `supply` |
| Layer 2 | Walrus (via `blob_id`) | Full metadata JSON: name, description, image blob_id, tags, attributes |
| Layer 3 | Walrus (via metadata's `image` field) | Actual media asset (PNG/WebP) |

Walrus blob is immutable by default. Metadata is permanent.

**Functions:**
- `mint(GameCapability, item_config, recipient, ctx)` — create item, transfer to player
- `burn(GameCapability, item)` — destroy item

**Important:** `mint` happens ONLY when a player claims their item (Flow A, backend-only). Items are NOT minted during game publish. GameCapability is held by the platform sponsor address.

**Important:** No `edit_item` function. Once published on-chain, items are immutable.

**MVP note on fungible items:** For MVP/demo, mint quantities are small (1-3 items per demo). Production should consider Coin<T> or bag contract for large quantities (>100 copies).

**State transitions:**
```
Item:  draft (DB only) ──→ published (on-chain, immutable forever)
```

### Module 3: `kiosk_ext.move`

Wraps Sui Kiosk for marketplace operations. Requires `0x2::kiosk` dependency in Move.toml.

**Functions:**
- `list_with_royalty(GameItem, kiosk, kiosk_owner_cap, price, royalty_bps: Option<u64>, ctx)`
  - If `royalty_bps` is `Some(n)`: installs a Kiosk `Rule<Royalty>` for `n` basis points
  - If `royalty_bps` is `None`: item listed with no royalty
  - Places item in Kiosk for direct sale

- `buy_item(kiosk, kiosk_owner_cap, item_id, payment, ctx)`
  - Standard Kiosk purchase
  - If royalty rule exists: auto-splits payment (seller + royalty recipient)
  - Emits event for backend indexing

**Royalty flow:**
- Gamer A lists item → optionally sets royalty (e.g., 3%)
- Gamer B buys → Kiosk auto-splits: 97% to seller, 3% to royalty reserve
- When Gamer B resells to Gamer C → Gamer A receives 3% again
- Royalty persists forever (Kiosk rule stays with item)

**Kiosk Management:**
- When a player first attempts to list/sell an item, backend checks if they have a Kiosk
- If not, Flow A (backend-only PTB) auto-creates one: `kiosk::new()` + `kiosk::share()`
- Kiosk ID is stored in PostgreSQL: `user_kiosks { sui_address, kiosk_id, kiosk_owner_cap_id }`
- Subsequent transactions use the stored Kiosk ID

### Module 4: `escrow.move`

**Struct:**
```
Escrow (shared object)
  ├── offer_item: GameItem           # Item locked by initiator
  ├── initiator: address
  ├── counterparty: Option<address>  # None = public, Some(addr) = direct
  ├── conditions: EscrowConditions
  └── is_active: bool

EscrowConditions
  ├── item_id_target: Option<u64>
  ├── game_id_accept: Option<ID>
  ├── item_type_accept: Option<String>
  └── rarity_accept: Option<String>
```

**Functions:**
- `lock_item_for_any(GameItem, conditions, ctx)` — public barter
- `lock_item_for_target(GameItem, counterparty_addr, conditions, ctx)` — direct barter
- `fulfill_escrow(Escrow, my_item: GameItem, ctx)` — instant 1:1 swap
- `fulfill_escrow_with_value(Escrow, my_item: GameItem, token_topup: Coin<SUI>, ctx)` — value-based swap
- `cancel_escrow(Escrow, ctx)` — initiator cancels, item returns

**Lock mechanics:**
- Item is physically transferred to the escrow shared object (full lock)
- Initiator can cancel anytime before fulfillment
- On fulfillment: both items swap ownership atomically

**SUI for value-based barter:** Players using Enoki zkLogin have no native SUI balance. For MVP demo, pre-fund demo player addresses via testnet faucet. In production, players acquire SUI through exchanges, game rewards, or platform faucets.

### Events

All modules emit events for backend indexing (consumed via gRPC streaming):
- `registry`: `PublisherCreated`, `GameCreated`, `GameUpdated`, `PublisherVerified`, `GamePaused`, `GameResumed`
- `item`: `ItemMinted`, `ItemBurned`
- `kiosk_ext`: `ItemListed`, `ItemSold`
- `escrow`: `EscrowCreated`, `EscrowFulfilled`, `EscrowCancelled`

### Deployment Order

1. Contract must be deployed first to get Package IDs
2. `sui client publish` via CLI to testnet
3. Store Package IDs in `.env.local` for backend/frontend

---

## 4. Off-Chain Architecture

### Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Bun |
| Full-stack Framework | Next.js (App Router) |
| Internal Backend | Server Actions |
| External API | Hono (mounted in Next.js API routes) |
| Database | PostgreSQL (Docker Compose) |
| ORM | Drizzle ORM |
| Sui SDK | `@mysten/sui` (v2), `@mysten/sui/transactions`, `@mysten/sui/grpc` |
| Auth & Gas | Enoki (`@mysten/enoki`) |
| Walrus | Harbor API (HTTP) |
| Styling | Tailwind CSS + shadcn/ui components |

### Database Schema

**publishers:** `id serial PK`, `sui_publisher_id varchar UNIQUE`, `dev_id int FK→gamedevs`, `name varchar`, `logo_url varchar NULLABLE`, `is_verified bool DEFAULT false`, `created_at timestamp`

**gamedevs:** `id serial PK`, `sui_address varchar UNIQUE`, `email varchar`, `name varchar`, `created_at timestamp`

**games:** `id serial PK`, `sui_game_id varchar NULLABLE`, `publisher_id int FK→publishers`, `name varchar`, `description text`, `genre varchar`, `website_url varchar NULLABLE`, `status enum('draft','published')`, `game_capability_id varchar NULLABLE`, `created_at timestamp`

**user_kiosks:** `id serial PK`, `sui_address varchar UNIQUE`, `kiosk_id varchar UNIQUE`, `kiosk_owner_cap_id varchar`, `created_at timestamp`

**api_keys:** `id serial PK`, `game_id int FK→games`, `key_hash varchar UNIQUE`, `key_prefix varchar`, `is_active bool DEFAULT true`, `last_used_at timestamp NULLABLE`, `created_at timestamp`

**item_templates:** `id serial PK`, `game_id int FK→games`, `sui_item_id varchar NULLABLE`, `name varchar`, `item_type varchar`, `rarity varchar`, `description text`, `image_blob_id varchar NULLABLE`, `metadata_blob_id varchar NULLABLE`, `supply int`, `is_nft bool DEFAULT true`, `attributes jsonb`, `status enum('draft','published')`, `created_at timestamp`

**claim_codes:** `id serial PK`, `code varchar UNIQUE`, `game_id int FK→games`, `item_template_id int FK→item_templates`, `recipient_identifier varchar`, `expires_at timestamp`, `claimed_at timestamp NULLABLE`, `claimed_by varchar NULLABLE`, `created_at timestamp`

**escrow_index:** `id serial PK`, `escrow_id varchar UNIQUE`, `initiator_address varchar`, `offer_game_id int FK NULLABLE`, `offer_item_blob_id varchar NULLABLE`, `conditions_json jsonb`, `is_active bool DEFAULT true`, `created_at timestamp`, `fulfilled_at timestamp NULLABLE`, `cancelled_at timestamp NULLABLE`

**item_cache:** `id serial PK`, `blob_id varchar UNIQUE`, `game_id int FK`, `name varchar`, `description text`, `image_blob_id varchar`, `tags jsonb`, `attributes jsonb`, `created_at timestamp`

**tx_events:** `id serial PK`, `tx_hash varchar`, `event_type varchar`, `game_id int FK NULLABLE→games`, `from_address varchar NULLABLE`, `to_address varchar NULLABLE`, `item_blob_id varchar NULLABLE`, `metadata jsonb`, `created_at timestamp`

### Event Indexing (gRPC Streaming)

Backend subscribes to Move events from our deployed package:

```typescript
const client = new SuiGrpcClient({ network: 'testnet', baseUrl: '...' })

for await (const event of client.subscriptionService.subscribeEvents({
    filter: { MoveEventModule: { package: PACKAGE_ID, module: 'registry' } },
})) {
    // Upsert to tx_events / escrow_index / item_cache tables
}
```

Runs as a background process at server boot, keeping PostgreSQL in sync with on-chain state.

### API Architecture

**Principle:** Clean separation between external (game server) and internal (platform frontend) calls.

```
GAME SERVER (third-party)
        │  POST /api/v1/game/:id/item/mint
        │  Authorization: Bearer morita_sk_xxxx
        ▼
┌─────────────── HONO API ROUTES ──────────────┐
│  (External — consumed by gamedevs)            │
└──────────────────────────────────────────────┘
        │  Internal call
        ▼
┌─────────────── SERVER ACTIONS ───────────────┐
│  (Internal — consumed by our app)             │
│  Auth: Enoki session                          │
│  Signing: Flow A or Flow B                    │
└──────────────────────────────────────────────┘
        │
        ▼
┌─────────── SHARED LAYER (lib/) ──────────────┐
│  Sui SDK, EnokiClient, Walrus Harbor, Drizzle │
└──────────────────────────────────────────────┘
```

### External API Endpoints (Hono)

All require `Authorization: Bearer morita_sk_xxxx`. Game ID in URL + API Key must match.

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/v1/game/:game_id/item/mint` | POST | Create claim code → returns `{ claim_url }` |
| `/api/v1/game/:game_id/item/burn` | POST | Burn item from player |
| `/api/v1/game/:game_id/inventory/:address` | GET | Query player inventory |
| `/api/v1/game/:game_id/item/:item_id` | GET | Query item detail |

Mint request: `{ item_template_id, recipient_identifier, quantity }`
Mint response: `{ success, claim_url, expires_at }`

Note: Mint endpoint only creates a claim code in DB. On-chain mint happens at claim redemption (Flow A).

### Server Actions

**Auth:** `loginWithEnoki`, `getCurrentSession`

**Publisher:** `createPublisher` (Flow B), `updatePublisher`, `getMyPublishers`, `getPublisherDetail`

**Game (Draft):** `createGame`, `updateGame`, `deleteGame`, `getGames`, `getGameDetail`, `publishGame` (Flow B)

**Game (Published):** `updatePublishedGame` (Flow A)

**Item Template:** `saveItemDraft`, `deleteItemDraft`, `getItems`, `getItemDetail`

**API Keys:** `generateApiKey`, `revokeApiKey`, `getApiKeys`

**Marketplace:** `getMarketplaceListings`, `getListingDetail`, `buyItem` (Flow B), `createEscrow` (Flow B), `fulfillEscrow` (Flow B), `fulfillEscrowWithValue` (Flow B), `cancelEscrow` (Flow B)

**Inventory:** `getMyInventory`, `getTransactionHistory`

**Claim:** `redeemClaimCode` (Flow A, with `SELECT ... FOR UPDATE`), `getClaimInfo`

**Analytics:** `getPublisherAnalytics`, `getPublisherActivity`

**Admin:** `verifyPublisher` (Flow A), `pauseGame` (Flow A), `resumeGame` (Flow A)

---

## 5. Key Workflows

### Workflow A: Game Developer Onboarding
1. Dev opens dashboard → Enoki wallet connect (Google/Twitch) → Sui address generated
2. "Create Publisher" → Flow B (Enoki auto-sign) → `registry::create_publisher` on-chain + DB insert
3. "Create Game" → saved as draft in DB
4. "Create Item Templates" — upload images, fill metadata → saved as draft in DB
5. "Publish Game":
   - Backend uploads images + metadata to Walrus Harbor → blob_ids stored in DB
   - Frontend builds PTB: `create_game(publisher, name)` + `transferObjects(capability, platform_addr)`
   - Flow B: GameDev signs via Enoki auto-sign
   - Game + GameCapability on-chain; zero items minted during publish
   - DB: status='published', API key auto-generated

### Workflow B: In-Game Item Earn
1. Game server: `POST /api/v1/game/:id/item/mint` with API Key
2. Backend: validate → generate claim code → store in DB (24h TTL) → return `{ claim_url }`
3. Game shows claim URL to player in-game
4. Player opens URL → Enoki login (if needed) → sees item preview → clicks "Claim"
5. Backend (Flow A): validate claim code (`SELECT ... FOR UPDATE`) → `item::mint(GameCapability, config, player_address)` → Enoki sponsor + sign + execute
6. Item appears in player inventory

### Workflow C: Marketplace Direct Sale
1. Gamer A inventory → "Sell" → set price + optional royalty
2. Flow B: check Kiosk (auto-create if needed) → `list_with_royalty(item, kiosk, cap, price, royalty?)`
3. Item listed, visible on marketplace
4. Gamer B clicks "Buy Now"
5. Flow B: `buy_item(kiosk, cap, item_id, payment)` → Kiosk auto-splits
6. Event indexed in DB

### Workflow D: Atomic Cross-Game Barter (Instant)
1. Gamer A creates escrow: `lock_item_for_any(item, conditions)` — Flow B
2. Item locked, listing appears on marketplace (via `escrow_index`)
3. Gamer B clicks "Fulfill Barter" → Flow B: `fulfill_escrow(escrow_id, my_item)`
4. Atomic swap — both items transfer in 1 tx

### Workflow E: Value-Based Barter
1. Same as above but gap covered with SUI
2. Flow B: `fulfill_escrow_with_value(escrow_id, my_item, sui_topup)`
3. Demo players pre-funded via testnet faucet

### Workflow F: Publish Game (Detail)
1. Backend validates game has items in draft
2. Backend uploads images → Walrus (progress UI shown)
3. Backend builds metadata JSON per item → uploads to Walrus
4. Backend stores blob_ids in DB, returns item configs to frontend
5. Frontend builds PTB (create_game + transfer capability)
6. Flow B: Enoki auto-sign → sponsor → execute
7. DB: status='published', API key generated

---

## 6. Frontend UI Spec

> Note: Detailed styling handled by user. This covers pages, purpose, actions, data display.

### A. Gamer Hub

**Landing (`/`)**: Hero + "Your Items, Any Game" + featured listings preview + "Explore Marketplace" CTA + Enoki login

**Inventory (`/inventory`)**: Grid of ItemCards, empty state, per-item "Sell"/"Barter" actions. Data: on-chain gRPC + metadata cache.

**Marketplace (`/marketplace`)**: Tabs "For Sale"/"For Barter"/"All", filters (game, type, rarity, price), ListingRow (sale) / EscrowCard (barter). Data: indexed from on-chain events.

**Barter Detail (`/barter/[id]`)**: ItemDetail + conditions + status + "Fulfill Barter" modal (select compatible item) + "Cancel" (if own)

**Claim (`/claim?code=xxx`)**: States: not logged in → Enoki prompt; valid → item preview + "Claim"; claiming → spinner; success → redirect; already claimed → link inventory; expired; invalid

**History (`/history`)**: Timeline grouped by date, tx hash links to Sui Explorer. Data: tx_events table.

### B. Developer Dashboard

**Dashboard Home (`/dashboard`)**: Welcome + publisher list (switcher) + quick stats + recent feed. Empty: "Create first publisher"

**Publisher Workspace (`/dashboard/[publisher_id]`)**: Sidebar (Games, Analytics, Activity, Settings) + top bar (name, verified badge, switcher)

**Games Manager (`/dashboard/[publisher_id]/games`)**: GameCards with Draft/Published badges. Draft → "Continue Editing", Published → "View"

**Game Detail (`/dashboard/[publisher_id]/games/[game_id]`)**: 
- Draft: publish banner + tabs (Overview, Items)
- Published: badge + tabs (Overview, Items, API Keys, Analytics, Activity)
- Publish modal with item count confirmation + progress bar during upload

**Item Manager (`/dashboard/[publisher_id]/games/[game_id]/items`)**: Filterable grid, "Create Item" button

**Item Detail (`.../items/[item_id]`)**: Draft → full edit form (image upload, fields, attributes, supply toggle, "Save"). Published → read-only (image, attributes, stats, "Immutable" badge)

**API Keys (`.../api-keys`)**: Key table, generate/revoke, code snippet

**Analytics (`.../analytics`)**: Metric cards, charts, per-game breakdown, time range filter

**Activity Log (`.../activity`)**: Timestamped events, filter by game/type, search

**Settings (`.../settings`)**: Edit publisher name/logo + danger zone (future)

### C. Shared Components

| Component | Purpose |
|---|---|
| `ItemCard` | Grid preview: image, name, game/rarity/type badges, price |
| `ItemDetail` | Full view: image, description, attributes table, supply |
| `ListingRow` | Marketplace sale: item + price + "Buy Now" |
| `EscrowCard` | Barter: offered item + conditions + "Fulfill" |
| `WalletButton` | Enoki connect/disconnect |
| `PublisherSwitcher` | Sidebar dropdown workspace switcher |
| `GameBadge`, `RarityBadge`, `StatusBadge` | Color-coded indicators |
| `TxStatusToast` | "Submitting..." → "Confirmed!" with tx hash |
| `EmptyState`, `ConfirmModal`, `FilterBar`, `MetricCard` | Layout utilities |
| `PublishProgressBar` | Step indicator during Walrus upload |

---

## 7. Demo Day Flow (5-7 minutes)

```
Scene 0 — Context (30s): Problem → Morita solution → Built on Sui

Scene 1 — Game Dev Onboarding (1 min):
  Enoki login → Create Publisher → Create Game (draft)
  → Create items → Publish (Walrus upload → on-chain deploy)
  → Show API Key

Scene 2 — In-Game Earn (1.5 min):
  curl API mint → claim_url → gamer Enoki login
  → Claim page → item minted on-chain → in inventory

Scene 3 — Marketplace & Barter (1.5 min):
  Browse → List for sale (optional royalty) → Buy
  → Escrow barter (atomic swap, 1 tx, 2 games)
  → Both inventories updated

Scene 4 — Why Sui + Future (1 min):
  Enoki invisible blockchain → Kiosk royalties → PTB atomic → Walrus storage
  → Roadmap: SDK, Wallet Linking, community reputation
```

---

## 8. Issue Registry (All Resolved)

| ID | Severity | Issue | Resolution |
|---|---|---|---|
| C-1 | 🔴 | Mint timing | Mint on-demand during claim; publish = Game + Capability only |
| C-2 | 🔴 | GameCapability ownership | Held by platform; transferred during publish Flow B |
| C-3 | 🔴 | Kiosk auto-create | Check + create in PTB; store in user_kiosks table |
| C-4 | 🔴 | escrow_index table | Added for marketplace browsing |
| C-5 | 🔴 | zkLogin complexity | Enoki handles all: Flow A (backend) + Flow B (client) |
| C-6 | 🔴 | Salt consistency | Enoki manages salt server-side |
| C-7 | 🟡 | Claim race condition | PostgreSQL SELECT ... FOR UPDATE |
| C-8 | 🟡 | Fungible scale | MVP small qty; note for Coin<T> in production |
| C-9 | 🟡 | Event indexing | gRPC streaming from SuiGrpcClient |
| C-10 | 🔴 | Enoki prerequisites | Must setup Enoki Portal + API keys + OAuth before coding |
| C-11 | 🔴 | SUI for value barter | Pre-fund demo players from testnet faucet |
| C-12 | 🟡 | Supply tracking | Off-chain via claim tracking; note for on-chain counter |
| C-13 | 🟡 | Kiosk ID lookup | Store in user_kiosks table |
| C-14 | 🟡 | Enoki-only wallets | MVP limitation; standard wallet support future |
| C-15 | 🟡 | GameDev signing | Flow B via Enoki auto-sign (no confirmation popup) |
| C-16 | 🔴 | Publish = Flow B | GameDev must sign (owned Publisher); Enoki handles silently |
| C-17 | 🟡 | Contract deploy first | Package IDs needed before backend/frontend |
| C-18 | 🟡 | Walrus upload latency | PublishProgressBar + loading states |
| C-19 | 🟡 | Kiosk dependency | kiosk_ext.move imports 0x2::kiosk |
| C-20 | 🟡 | Session for claims | MVP: frontend trusted via Enoki; address from wallet |

---

## 9. Future Considerations (Post-MVP)

- **Wallet Linking:** Sui wallet connection in-game (SDK) for instant item delivery
- **SDK for Game Integration:** TypeScript SDK for gamedev game clients
- **Community Reputation Contract:** Decentralized publisher verification (staking, slashing, voting)
- **Standard Wallet Support:** Sui Wallet extension and other wallet-standard wallets
- **AdminCap Transfer:** Key rotation / multi-sig admin
- **Direct Walrus Integration:** Replace Harbor API with Walrus SDK/CLI
- **Multi-Chain Support:** Beyond Sui
- **Gas Pool Model:** Gamedev deposit SUI for sponsoring their players
- **Item Crafting/Evolution:** On-chain item state changes
- **Lending/Rental:** Time-bound item lending with automatic return
- **On-chain Supply Counter:** Trustless supply enforcement
- **Platform Fee:** Fee collection on marketplace transactions (e.g., 1%)

---

## 10. Decision Log

| # | Decision | Rationale |
|---|---|---|
| D1 | Full scope (4 contracts + backend + frontend) | AI acceleration; go all-in |
| D2 | Gamer persona primary for Demo Day | Consumer "magic" wins in 5 min |
| D3 | DeFi framing: programmable payments, trust-minimized barter | Matches track criteria |
| D4 | Seller-set price + negotiated value | Simple, no oracle, hybrid model |
| D5 | Public + direct barter in escrow | `counterparty: Option<address>` |
| D6 | Metadata in Walrus, not on-chain | Lower gas, flexible |
| D7 | 2 Walrus blobs per item | Standard NFT metadata structure |
| D8 | Royalties optional, gamer-only | Fair: gamer earned the item |
| D9 | Claim URL flow (Level 1) | Universal, no gamedev OAuth needed |
| D10 | Full lock escrow | Safe: no item state drift |
| D11 | Enoki sponsors all gas | Handles seamlessly; testnet free |
| D12 | Harbor API for Walrus | Easiest integration |
| D13 | Claim logic backend/DB | Temporary bridge, not worth contract |
| D14 | PostgreSQL + Drizzle | Production-ready, Docker |
| D15 | Next.js + Hono + Server Actions | Unified codebase, clean separation |
| D16 | Items immutable after publish | Permanence vs practical |
| D17 | Draft/publish workflow | Devs iterate before committing |
| D18 | Publisher layer above games | Verifiable on-chain identity |
| D19 | shadcn/ui components | Fast polish, dark mode |
| D20 | Enoki for auth + gas | Eliminates ZK proof/salt/ephemeral complexity |
| D21 | Mint on-demand during claim | Simplify publish; items on need basis |
| D22 | GameCapability held by platform | Enables Flow A backend-only mints |
| D23 | Publish = Flow B (GameDev signs) | Publisher is owned object |
| D24 | gRPC streaming for events | Real-time, no polling |

---

## 11. Project Structure

```
morita/
├── contract/
│   ├── Move.toml
│   └── sources/
│       ├── registry.move
│       ├── item.move
│       ├── kiosk_ext.move
│       └── escrow.move
│
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    # Landing
│   ├── providers.tsx               # DAppKit + Enoki + QueryClient
│   ├── (hub)/
│   │   ├── inventory/page.tsx
│   │   ├── marketplace/page.tsx
│   │   ├── barter/[id]/page.tsx
│   │   ├── claim/page.tsx
│   │   └── history/page.tsx
│   ├── (dashboard)/
│   │   ├── page.tsx                # Dashboard home
│   │   ├── layout.tsx
│   │   ├── [publisher_id]/
│   │   │   ├── page.tsx            # Workspace
│   │   │   ├── games/page.tsx
│   │   │   ├── games/[game_id]/
│   │   │   │   ├── page.tsx        # Game detail
│   │   │   │   ├── api-keys/page.tsx
│   │   │   │   └── items/
│   │   │   │       ├── page.tsx
│   │   │   │       └── [item_id]/page.tsx
│   │   │   ├── analytics/page.tsx
│   │   │   ├── activity/page.tsx
│   │   │   └── settings/page.tsx
│   └── api/v1/game/[game_id]/
│       ├── item/mint/route.ts
│       ├── item/burn/route.ts
│       ├── inventory/route.ts
│       └── item/[item_id]/route.ts
│
├── components/
│   ├── ui/            # shadcn/ui
│   ├── items/         # ItemCard, ItemDetail, RarityBadge, GameBadge
│   ├── marketplace/   # ListingRow, EscrowCard, FilterBar
│   ├── dashboard/     # PublisherSwitcher, MetricCard, Sidebar, PublishProgressBar
│   ├── auth/          # WalletButton
│   └── shared/        # EmptyState, ConfirmModal, TxStatusToast
│
├── lib/
│   ├── sui/           # client.ts, enoki-client.ts, ptb-builder.ts, event-indexer.ts, dapp-kit.ts
│   ├── walrus/        # harbor.ts
│   ├── db/            # schema.ts, index.ts, queries/
│   ├── auth.ts
│   └── utils.ts
│
├── actions/           # auth, publisher, game, item, marketplace, inventory, claim, api-keys, analytics, admin
├── docker-compose.yml
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
└── .env.local
```

---

## 12. Environment Variables

```
# Sui
NEXT_PUBLIC_SUI_NETWORK=testnet
ADMIN_PRIVATE_KEY=            # Platform key for Flow A signing

# Enoki
NEXT_PUBLIC_ENOKI_PUBLIC_KEY=
ENOKI_SECRET_KEY=             # Private key for sponsored tx

# OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
NEXT_PUBLIC_TWITCH_CLIENT_ID=

# Walrus Harbor
WALRUS_HARBOR_URL=

# Database
DATABASE_URL=postgresql://...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

*Design document finalized. All 20 issues resolved. Ready for implementation plan.*
