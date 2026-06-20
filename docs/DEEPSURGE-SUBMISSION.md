# Morita — Cross-Game Inventory & Commerce Protocol on Sui

**Sui Overflow 2026 | DeFi & Payments Track**

**Package ID:** `0x68145a7f8c14ba84c250b81277b4e0060be65ca13242052d26a18e5e0cc977b3`

---

## The Problem

Game items are trapped inside walled gardens. A legendary sword earned in one game cannot be sold, traded, or used anywhere else. Players accumulate hundreds of hours of value with zero liquidity.

Developers who want to tokenize their in-game assets face a steep wall: write and audit custom smart contracts, manage cryptographic keys, fund gas for every mint, build a marketplace from scratch, and figure out how to make royalties actually enforceable. Most give up before they start.

---

## What Morita Does

Morita is a full-stack, plug-and-play protocol that connects game economies on Sui. Developers register their game through a web dashboard, define item templates, and publish with one click. A REST API lets game servers mint items and generate one-click claim URLs for players.

Players sign in with Google (no wallet extension, no seed phrase, no gas fees), see all their items across every game in a unified inventory, and trade freely — sell for SUI with automatic royalties, or barter atomically across games.

---

## What Makes Morita Different

### 1. Zero Blockchain Knowledge Required for Developers

Most Web3 gaming platforms require developers to write Solidity or Move smart contracts. Morita handles everything on-chain behind the scenes. Developers use a familiar web dashboard + REST API — exactly like any other B2B SaaS. The Sui Move contracts, PTB construction, Kiosk integration, and gas sponsorship are all abstracted away.

- Dashboard: log in with Google, create a publisher workspace, register games, define item templates
- API: simple REST calls with Bearer token auth — `POST /api/v1/game/:id/item/mint` returns a claim URL
- No Solidity, no Rust, no private key management. Just HTTP.

### 2. Gas-Free for Everyone, Always

Every transaction on Morita is sponsored by the platform via Enoki gas stations. Developers never spend SUI minting items. Players never spend SUI trading.

No token deposits. No gas calculations. No "you need 0.01 SUI to perform this action" errors. This is critical for mainstream gaming adoption — asking players to manage gas kills retention before the first trade.

### 3. Atomic Cross-Game Barter

Players can lock an item from Game A into escrow, set conditions (rarity, item type, specific game), and another player from Game B can fulfill the barter in a single Sui Programmable Transaction Block.

Both items transfer or neither does. If the values don't match, the gap is covered with SUI atomically (`fulfill_escrow_with_value`). This is not a marketplace listing — it is trust-minimized P2P swapping across entirely separate game economies.

### 4. Protocol-Level Royalty Enforcement

Most NFT marketplaces enforce royalties through contract logic that can be — and routinely is — bypassed by using custom contracts or trading off-platform.

Morita uses native Sui Kiosk transfer policies. The royalty rules live at the Sui protocol layer, not in application code. When an item is purchased through `kiosk_ext::buy_item`, the `TransferPolicy<GameItem>` confirms the transfer and the royalty split executes atomically in the same transaction. There is no way to circumvent it.

### 5. On-Chain Items, Off-Chain Metadata

Every item is a first-class Sui object (`GameItem`) with guaranteed safety through the Move type system. Each object carries its game ID, item type, rarity, and a blob ID referencing its metadata.

Large assets — images, 3D model data, JSON specifications — are stored on Walrus, a decentralized blob storage network built by Mysten Labs. The blockchain stores only a lightweight blob ID reference, keeping gas costs minimal while ensuring metadata is immutable and permanently accessible.

### 6. Complete Architecture, Not a Demo

| Layer | Technology | What It Does |
|-------|-----------|--------------|
| **Smart Contracts** | 4 Sui Move modules | Registry, item, kiosk, escrow |
| **Frontend** | Next.js 16, 18 pages | Dashboard, inventory, marketplace, claim, barter |
| **Backend** | 29 server actions, Hono REST API | Business logic, PTB builders, Enoki client |
| **Auth** | Enoki zkLogin (Google OAuth) | Zero-wallet sign-in, sponsored transactions |
| **Database** | PostgreSQL + Drizzle ORM | 11 tables: games, items, claims, escrows, kiosks |
| **Storage** | Walrus | Decentralized item metadata and images |
| **Transactions** | 11 PTB builders + 2 signing flows | All user tx sponsored, admin tx executed server-side |

**4 Smart Contracts:**
- `registry.move` — Publisher registration, game lifecycle (draft → published), admin controls (pause, resume, verify). Uses OTW pattern for one-time initialization.
- `item.move` — GameItem type with mint/burn. Double-mint prevention via minted_items Table inside Game object.
- `kiosk_ext.move` — Kiosk marketplace wrapper. List items for sale, buy with automatic transfer policy confirmation, deploy transfer policies.
- `escrow.move` — Atomic barter engine. Lock items with conditions (`itemIdTarget`, `gameIdAccept`, `itemTypeAccept`, `rarityAccept`), fulfill with optional SUI value gap coverage, or cancel to return.

**Two Signing Flows:**
- **Flow A (executeAsAdmin):** Backend builds PTB → Enoki sponsors → admin (platform) signs → execute. Used for mint, claim redemption, admin operations.
- **Flow B (sponsorForUser + executeUserSigned):** Frontend builds PTB → Enoki sponsors → user signs via Enoki keypair → execute. Used for create publisher, publish game, list for sale, buy, all escrow operations.

All Enoki API calls (ZKP generation, nonce creation, JWT resolution) are proxied through server actions using the private key — no client-side EnokiFlow dependency, zero configuration issues.

**11 PTB Builders:** mint, burn, createPublisher, publish (2-step initiate + finalize), listForSale, buyItem, lockForAny, lockForTarget, fulfill, fulfillWithValue, cancel, createKiosk.

### 7. Built for Real-World Testing

- **18 frontend pages** — Developer dashboard (overview, games, items, API keys, analytics, activity) + Player hub (inventory, item detail, marketplace, barter, claim, history)
- **29 server actions** — Thin wrappers over 6 business logic services
- **11 database tables** — gamedevs, publishers, games, item_templates, claim_codes, api_keys, user_kiosks, kiosk_listings, escrow_index, item_cache, tx_events
- **15 automated tests** — Covering all PTB builders, Enoki client exports, and marketplace services
- **0 `any` types, 0 `useEffect` cascades** — Clean TypeScript throughout

---

## Why Sui

Morita was built specifically for Sui because no other chain provides this combination:

| Primitive | How Morita Uses It |
|-----------|-------------------|
| **Enoki (zkLogin)** | Google OAuth → instant Sui wallet. No extension, no seed phrase. |
| **Enoki (Sponsored Tx)** | Platform pays all gas. Users never touch SUI. |
| **Sui Kiosk** | Royalties enforced at protocol layer. Cannot be bypassed. |
| **Programmable Transaction Blocks** | Atomic cross-game barter in 1 transaction. |
| **Walrus** | Decentralized item metadata. Immutable, permanent, millisecond access. |
| **Object Model** | Every GameItem is a first-class object. Safety guaranteed by Move. |
| **gRPC + GraphQL** | Modern data access. No deprecated JSON-RPC. |

---

## Links

- **GitHub:** https://github.com/Rezacrown/morita-sui
- **Testnet Package:** `0x68145a7f8c14ba84c250b81277b4e0060be65ca13242052d26a18e5e0cc977b3`
