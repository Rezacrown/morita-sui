# Project Context: Cross-Game Asset & Commerce Protocol (Sui Overflow Hackathon)

## 1. Project Overview

- **Project Name:** Morita
- **Target Track:** DeFi & Payment (Core Track)
- **Special Tech Integration:** Walrus Storage (Mysten Labs) & Sui zkLogin
- **Core Vision:** Shifting Web3 gaming from speculative farming to sustainable entertainment by providing a plug-and-play decentralized inventory and commerce protocol. It enables true item ownership, automated creator royalties, and cross-game atomic barter without forcing Web2 developers to write complex smart contracts.

---

## 2. Core Capabilities (What The Protocol CAN Do)

- **On-Chain Schema Registry:** Allows Game Developers (Gamedevs) to define item blueprints (Rarity, Mutability, Attributes) on-chain via a registered `GameCapability`.
- **Decentralized Media Storage:** Offloads heavy assets (sprites, 3D models) to **Walrus Storage** using `Blob ID` integrated directly into the Sui Object metadata.
- **Sui Kiosk Commerce Engine:** Enforces immutable secondary market creator royalties at the protocol level for all P2P direct sales.
- **Cross-Game Atomic Barter (Escrow):** A secure swap module allowing players to trade _Item A (Game 1)_ for _Item B (Game 2)_ in a single, trustless atomic transaction.
- **Gasless / Sponsored Transactions:** Abstracting blockchain complexities via a wrapper API so gamedevs can sponsor user gas fees during in-game actions (mint/burn).

---

## 3. System Boundaries (What The Protocol CANNOT Do)

- **No Frontend Rendering:** The protocol does not render textures or UI inside the game. It only stores and serves metadata/Blob IDs.
- **No In-Game Anti-Cheat:** Gameplay verification (e.g., speedhacks, damage calculation) remains the responsibility of the centralized game server.
- **No Centralized Game Database:** Does not store player accounts, passwords, matchmaking data, or chat history. It strictly maps `Sui Wallet Address <—> Sui Objects (Items)`.

---

## 4. Technical Architecture & Data Flow

### A. Developer Onboarding (Off-Chain to On-Chain)

1. Gamedev registers their game on our Dashboard -> Generates `GameCapability` (Sui) and `API_KEY` (Backend).
2. Gamedev uploads item image/metadata.
3. Backend uploads image to **Walrus via Harbor API** -> Returns `Blob ID`.
4. Protocol mints the item schema on Sui, binding the `Blob ID` to the object blueprint.

### B. In-Game Session (Seamless Web2.5 UX)

1. Player logs into the game using **Sui zkLogin** (Google/Twitch OAuth) -> Generates a native Sui Wallet address.
2. Game Client syncs inventory via `GET /v1/inventory?wallet={address}&game_id={id}`.
3. When player earns an item: Game Server triggers `POST /v1/item/mint` -> Protocol executes a **Sponsored Transaction** on Sui -> Item lands in Player's Sui Kiosk.

### C. Hub & Marketplace (DeFi Layer)

1. Player logs into our Web Hub using the **SAME zkLogin account** (Wallet addresses match perfectly).
2. **Direct Sale:** Player lists item via Sui Kiosk. Buyer pays SUI -> Contract auto-splits funds: 95% to Seller, 5% to Gamedev (Royalty).
3. **Atomic Barter:** Player locks _Item A_ in Escrow Contract with conditions -> Another player fulfills the condition with _Item B_ -> Contract performs an instant, scam-free swap.

---

## 5. Development Component Breakdown (MVP Scope)

### 1. Smart Contracts (Sui Move)

- `registry.move`: Handles game registration and `GameCapability` issuance.
- `item.move`: Defines the core `GameItem` object structure, incorporating `game_id`, `item_id`, and Walrus `blob_id`.
- `marketplace.move`: Wraps Sui Kiosk for direct sales with enforced royalties.
- `escrow.move`: Implements the lock-and-swap logic for item-to-item barter.

### 2. Backend Bridge (Node.js / TypeScript)

- REST API endpoints for Gamedevs (`/v1/item/mint`, `/v1/item/burn`, `/v1/inventory`).
- Walrus Harbor API integration layer for automated asset uploading.
- Transaction builder with Gas Station integration for sponsoring user transactions.

### 3. Unified Frontend (Next.js - Institutional Dark Mode)

- **Developer Dashboard:** Analytics on item circulation, minting tools, and API key management.
- **Gamer Hub & Marketplace:** Clean, high-fidelity UI (Stripe/Linear aesthetic) for inventory viewing, direct listing, and cross-game barter matching.

---
