# Morita UI Full Buildout — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build all 15+ pages and shared components for Morita platform — Gamer Hub (6 pages), Developer Dashboard (10 pages), and shared Neo-Brutalist components. All static state first (mock data, no live Sui/Enoki/backend integration).

**Architecture:** Next.js App Router with route groups `(hub)` and `(dashboard)`. Components follow the Swiss Neo-Brutalist design system (Space Grotesk headings, Inter body, JetBrains Mono metadata, thick `border-3 border-[#1E2044]`, block shadows). Zustand stores for mock state, Zod schemas for form validation types, `cn()` utility for class merging. All pages use `'use client'` with mock data; real integration comes later.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, motion/react, Zustand, Zod, TypeScript

**Design System:** See `application/DESIGN.md` for full color palette, typography, card recipes, button formulas.

**Existing files:** Landing page at `app/page.tsx` is complete. `components/landing/` has 10 components. `lib/utils.ts` has `cn()`. `hooks/use-mobile.ts` exists.

---

## File Structure Map

```
application/
+-- app/
�   +-- layout.tsx                    # [MODIFY] Add Providers wrapper
�   +-- page.tsx                      # [UNCHANGED] Landing page
�   +-- providers.tsx                 # [CREATE] QueryClient + DAppKit providers (skeleton, hooks disabled)
�   +-- globals.css                   # [UNCHANGED]
�   +-- (hub)/                        # Gamer-facing routes
�   �   +-- layout.tsx                # [CREATE] Hub shell: topbar + content
�   �   +-- inventory/page.tsx        # [CREATE] Inventory grid
�   �   +-- marketplace/page.tsx      # [CREATE] Marketplace with tabs + filters
�   �   +-- barter/[id]/page.tsx      # [CREATE] Barter detail view
�   �   +-- claim/page.tsx            # [CREATE] Claim code redemption
�   �   +-- history/page.tsx          # [CREATE] Transaction timeline
�   +-- (dashboard)/                  # Developer-facing routes
�       +-- layout.tsx                # [CREATE] Dashboard shell: sidebar + content
�       +-- page.tsx                  # [CREATE] Dashboard home
�       +-- [publisher_id]/
�       �   +-- page.tsx              # [CREATE] Publisher workspace
�       �   +-- layout.tsx            # [CREATE] Workspace layout with sidebar
�       �   +-- games/page.tsx        # [CREATE] Games manager list
�       �   +-- games/[game_id]/
�       �   �   +-- page.tsx          # [CREATE] Game detail (tabs: overview, items, API keys, analytics, activity)
�       �   �   +-- api-keys/page.tsx # [CREATE] API keys table
�       �   �   +-- items/
�       �   �       +-- page.tsx      # [CREATE] Items list for a game
�       �   �       +-- [item_id]/page.tsx # [CREATE] Item detail/edit (draft vs published)
�       �   +-- analytics/page.tsx    # [CREATE] Publisher analytics
�       �   +-- activity/page.tsx     # [CREATE] Activity log
�       �   +-- settings/page.tsx     # [CREATE] Publisher settings
+-- components/
�   +-- landing/                      # [UNCHANGED] 10 existing landing components
�   +-- shared/                       # Shared Neo-Brutalist components
�       +-- item-card.tsx             # [CREATE] GameItem preview card
�       +-- item-detail.tsx           # [CREATE] Full item view
�       +-- listing-row.tsx           # [CREATE] Marketplace sale row
�       +-- escrow-card.tsx           # [CREATE] Barter listing card
�       +-- status-badge.tsx          # [CREATE] Draft/Published/Verified/Paused badges
�       +-- rarity-badge.tsx          # [CREATE] Color-coded rarity chip
�       +-- game-badge.tsx            # [CREATE] Game name tag
�       +-- empty-state.tsx           # [CREATE] No-data placeholder
�       +-- confirm-modal.tsx         # [CREATE] Confirmation dialog
�       +-- filter-bar.tsx            # [CREATE] Dropdown + search filters
�       +-- metric-card.tsx           # [CREATE] Analytics stat card
�       +-- topbar.tsx                # [CREATE] Hub top navigation bar
�       +-- sidebar.tsx               # [CREATE] Dashboard sidebar nav
�       +-- publisher-switcher.tsx    # [CREATE] Workspace switcher dropdown
�       +-- publish-progress-bar.tsx  # [CREATE] Publish progress stepper
+-- stores/
�   +-- auth-store.ts                 # [CREATE] Mock auth state (user, mode: gamer/dev)
�   +-- inventory-store.ts            # [CREATE] Mock player items
�   +-- marketplace-store.ts          # [CREATE] Mock listings + escrows
�   +-- publisher-store.ts            # [CREATE] Mock publishers + games + items
�   +-- claim-store.ts                # [CREATE] Mock claim codes
+-- lib/
�   +-- utils.ts                      # [UNCHANGED] cn() helper
�   +-- mock-data.ts                  # [CREATE] All mock data (items, games, publishers, listings, etc.)
+-- schemas/
    +-- item-schema.ts                # [CREATE] Zod schemas for item/game/publisher form validation

---

## Phase 0: Foundation � Mock Data, Stores, Schemas

### Task 1: Create mock data file

**Files:**
- Create: `application/lib/mock-data.ts`

- [ ] **Step 1: Write mock data module**

```typescript
// application/lib/mock-data.ts

export const MOCK_PLAYERS = [
  { address: "0xabc123...def", name: "CryptoGamer99" },
  { address: "0x789ghi...jkl", name: "Web3Warrior" },
  { address: "0x456mno...pqr", name: "PixelKnight" },
];

export const MOCK_PUBLISHERS = [
  {
    id: "pub-001",
    suiPublisherId: "0xpub001",
    name: "IndieQuest Studios",
    logoUrl: null,
    isVerified: true,
    createdAt: "2026-06-10T00:00:00Z",
    gameCount: 2,
  },
  {
    id: "pub-002",
    suiPublisherId: "0xpub002",
    name: "Elden Realms Inc.",
    logoUrl: null,
    isVerified: false,
    createdAt: "2026-06-15T00:00:00Z",
    gameCount: 1,
  },
  {
    id: "pub-003",
    suiPublisherId: "0xpub003",
    name: "Pixelverse Games",
    logoUrl: null,
    isVerified: true,
    createdAt: "2026-06-12T00:00:00Z",
    gameCount: 1,
  },
];

export const MOCK_GAMES = [
  {
    id: 1,
    suiGameId: "0xgame001",
    publisherId: "pub-001",
    publisherName: "IndieQuest Studios",
    name: "Astral Quest RPG",
    description: "An epic fantasy RPG where every dungeon drop is truly yours.",
    genre: "RPG",
    websiteUrl: "https://astralquest.game",
    status: "published" as const,
    gameCapabilityId: "0xcap001",
    itemCount: 15,
    draftItemCount: 3,
    publishedItemCount: 12,
    createdAt: "2026-06-10T00:00:00Z",
  },
  {
    id: 2,
    suiGameId: null,
    publisherId: "pub-001",
    publisherName: "IndieQuest Studios",
    name: "CyberForge Online",
    description: "Cyberpunk MMO with true asset ownership.",
    genre: "MMO",
    websiteUrl: null,
    status: "draft" as const,
    gameCapabilityId: null,
    itemCount: 5,
    draftItemCount: 5,
    publishedItemCount: 0,
    createdAt: "2026-06-18T00:00:00Z",
  },
  {
    id: 3,
    suiGameId: "0xgame003",
    publisherId: "pub-002",
    publisherName: "Elden Realms Inc.",
    name: "Elden Realms",
    description: "Dark fantasy universe with legendary loot.",
    genre: "Action RPG",
    websiteUrl: "https://eldenrealms.game",
    status: "published" as const,
    gameCapabilityId: "0xcap003",
    itemCount: 8,
    draftItemCount: 0,
    publishedItemCount: 8,
    createdAt: "2026-06-15T00:00:00Z",
  },
  {
    id: 4,
    suiGameId: "0xgame004",
    publisherId: "pub-003",
    publisherName: "Pixelverse Games",
    name: "PixelCraft Arena",
    description: "Retro-style arena battler with tradable pixel cosmetics.",
    genre: "Battle Arena",
    websiteUrl: null,
    status: "published" as const,
    gameCapabilityId: "0xcap004",
    itemCount: 6,
    draftItemCount: 0,
    publishedItemCount: 6,
    createdAt: "2026-06-12T00:00:00Z",
  },
];

export const MOCK_ITEMS = [
  {
    id: "item-001",
    suiItemId: "0xitem001",
    gameId: 1,
    gameName: "Astral Quest RPG",
    name: "Legendary Void Sword",
    itemType: "Weapon",
    rarity: "Legendary",
    description: "Forged in the void between stars. Cuts through any armor.",
    imageUrl: null,
    blobId: "blob_abc123",
    supply: null as null | number,
    isNft: true,
    attributes: { strength: "18", element: "void", durability: "95" },
    status: "published" as const,
    owner: "0xabc123...def",
    createdAt: "2026-06-11T00:00:00Z",
  },
  {
    id: "item-002",
    suiItemId: "0xitem002",
    gameId: 1,
    gameName: "Astral Quest RPG",
    name: "Aetherial Staff of Wisdom",
    itemType: "Staff",
    rarity: "Epic",
    description: "Channeled with ancient aether energy. Boosts magic by 40%.",
    imageUrl: null,
    blobId: "blob_def456",
    supply: null as null | number,
    isNft: true,
    attributes: { magic: "40", element: "aether", wisdom: "12" },
    status: "published" as const,
    owner: "0xabc123...def",
    createdAt: "2026-06-11T00:00:00Z",
  },
  {
    id: "item-003",
    suiItemId: "0xitem003",
    gameId: 1,
    gameName: "Astral Quest RPG",
    name: "Health Potion",
    itemType: "Consumable",
    rarity: "Common",
    description: "Restores 100 HP. Essential for any adventurer.",
    imageUrl: null,
    blobId: "blob_ghi789",
    supply: 1000,
    isNft: false,
    attributes: { heal: "100", weight: "0.5" },
    status: "published" as const,
    owner: "0xabc123...def",
    createdAt: "2026-06-11T00:00:00Z",
  },
  {
    id: "item-004",
    suiItemId: "0xitem004",
    gameId: 3,
    gameName: "Elden Realms",
    name: "Divine Bow of Light",
    itemType: "Bow",
    rarity: "Legendary",
    description: "Blessed by the ancients. Arrows pierce darkness.",
    imageUrl: null,
    blobId: "blob_jkl012",
    supply: null as null | number,
    isNft: true,
    attributes: { attack: "25", element: "light", range: "300" },
    status: "published" as const,
    owner: "0x789ghi...jkl",
    createdAt: "2026-06-16T00:00:00Z",
  },
  {
    id: "item-005",
    suiItemId: "0xitem005",
    gameId: 3,
    gameName: "Elden Realms",
    name: "Iron Shield of Grom",
    itemType: "Shield",
    rarity: "Rare",
    description: "Standard-issue dwarven shield. Reliable and sturdy.",
    imageUrl: null,
    blobId: "blob_mno345",
    supply: null as null | number,
    isNft: true,
    attributes: { defense: "60", weight: "15", durability: "200" },
    status: "published" as const,
    owner: "0x789ghi...jkl",
    createdAt: "2026-06-16T00:00:00Z",
  },
  {
    id: "item-006",
    suiItemId: "0xitem006",
    gameId: 4,
    gameName: "PixelCraft Arena",
    name: "Chronos Pixel Mirror",
    itemType: "Cosmetic",
    rarity: "Epic",
    description: "Reflects your past victories. Purely cosmetic flex.",
    imageUrl: null,
    blobId: "blob_pqr678",
    supply: null as null | number,
    isNft: true,
    attributes: { effect: "time_warp", tier: "3" },
    status: "published" as const,
    owner: "0x456mno...pqr",
    createdAt: "2026-06-13T00:00:00Z",
  },
];

export const MOCK_DRAFT_ITEMS = [
  {
    id: "draft-001",
    suiItemId: null,
    gameId: 1,
    gameName: "Astral Quest RPG",
    name: "Thunder Gauntlets",
    itemType: "Gauntlets",
    rarity: "Epic",
    description: "Shock your enemies with electrifying punches.",
    imageUrl: null,
    blobId: null,
    supply: null as null | number,
    isNft: true,
    attributes: { element: "thunder", attack: "15", speed: "8" },
    status: "draft" as const,
    owner: null,
    createdAt: "2026-06-18T00:00:00Z",
  },
  {
    id: "draft-002",
    suiItemId: null,
    gameId: 1,
    gameName: "Astral Quest RPG",
    name: "Shadow Cloak",
    itemType: "Armor",
    rarity: "Rare",
    description: "Become one with the shadows.",
    imageUrl: null,
    blobId: null,
    supply: null as null | number,
    isNft: true,
    attributes: { defense: "10", effect: "stealth" },
    status: "draft" as const,
    owner: null,
    createdAt: "2026-06-18T00:00:00Z",
  },
  {
    id: "draft-003",
    suiItemId: null,
    gameId: 2,
    gameName: "CyberForge Online",
    name: "Neon Katana",
    itemType: "Weapon",
    rarity: "Legendary",
    description: "A blade forged from pure neon light.",
    imageUrl: null,
    blobId: null,
    supply: null as null | number,
    isNft: true,
    attributes: { element: "neon", attack: "30", speed: "20" },
    status: "draft" as const,
    owner: null,
    createdAt: "2026-06-19T00:00:00Z",
  },
];

export const MOCK_LISTINGS = [
  {
    id: "listing-001",
    item: MOCK_ITEMS[1],
    price: 12.5,
    seller: "0xabc123...def",
    sellerName: "CryptoGamer99",
    listingType: "sale" as const,
    royaltyBps: 300,
    createdAt: "2026-06-17T00:00:00Z",
  },
  {
    id: "listing-002",
    item: MOCK_ITEMS[3],
    price: 28.0,
    seller: "0x789ghi...jkl",
    sellerName: "Web3Warrior",
    listingType: "sale" as const,
    royaltyBps: null,
    createdAt: "2026-06-18T00:00:00Z",
  },
];

export const MOCK_ESCROWS = [
  {
    id: "escrow-001",
    offeredItem: MOCK_ITEMS[0],
    initiator: "0xabc123...def",
    initiatorName: "CryptoGamer99",
    conditions: {
      itemTypeAccept: "Weapon",
      rarityAccept: "Legendary",
      gameIdAccept: null as null | number,
      itemIdTarget: null as null | string,
    },
    counterparty: null,
    isActive: true,
    createdAt: "2026-06-18T00:00:00Z",
  },
  {
    id: "escrow-002",
    offeredItem: MOCK_ITEMS[4],
    initiator: "0x789ghi...jkl",
    initiatorName: "Web3Warrior",
    conditions: {
      itemTypeAccept: "Cosmetic",
      rarityAccept: "Epic",
      gameIdAccept: null as null | number,
      itemIdTarget: null as null | string,
    },
    counterparty: null,
    isActive: true,
    createdAt: "2026-06-19T00:00:00Z",
  },
];

export const MOCK_CLAIM_CODES = [
  {
    code: "XK92-BH4M",
    gameId: 1,
    gameName: "Astral Quest RPG",
    itemTemplate: MOCK_ITEMS[0],
    expiresAt: "2026-06-21T00:00:00Z",
    claimedAt: null as string | null,
    claimedBy: null as string | null,
  },
  {
    code: "ZZ00-XXXX",
    gameId: 3,
    gameName: "Elden Realms",
    itemTemplate: MOCK_ITEMS[3],
    expiresAt: "2026-06-10T00:00:00Z",
    claimedAt: "2026-06-09T00:00:00Z",
    claimedBy: "0xabc123...def",
  },
];

export const MOCK_API_KEYS = [
  {
    id: 1,
    prefix: "morita_sk_****abcd",
    isActive: true,
    lastUsedAt: "2026-06-18T00:00:00Z",
    createdAt: "2026-06-10T00:00:00Z",
  },
  {
    id: 2,
    prefix: "morita_sk_****efgh",
    isActive: false,
    lastUsedAt: null,
    createdAt: "2026-06-12T00:00:00Z",
  },
];

export const MOCK_TX_EVENTS = [
  {
    id: 1,
    txHash: "0xeea01a...",
    eventType: "ItemMinted",
    description: "Minted Legendary Void Sword to 0xabc1...def",
    timestamp: "2026-06-17T14:30:00Z",
  },
  {
    id: 2,
    txHash: "0xbb02bb...",
    eventType: "ItemSold",
    description: "Sold Aetherial Staff for 12.5 SUI",
    timestamp: "2026-06-17T15:45:00Z",
  },
  {
    id: 3,
    txHash: "0xcc03cc...",
    eventType: "EscrowFulfilled",
    description: "Barter complete: Void Katana ? Divine Bow",
    timestamp: "2026-06-18T09:20:00Z",
  },
  {
    id: 4,
    txHash: "0xdd04dd...",
    eventType: "ItemMinted",
    description: "Minted Iron Shield to 0x789g...jkl",
    timestamp: "2026-06-18T11:00:00Z",
  },
  {
    id: 5,
    txHash: "0xee05ee...",
    eventType: "ItemListed",
    description: "Listed Chronos Mirror for 5 SUI",
    timestamp: "2026-06-18T16:30:00Z",
  },
  {
    id: 6,
    txHash: "0xff06ff...",
    eventType: "EscrowCreated",
    description: "Created barter: Legendary Void Sword ? any Legendary Weapon",
    timestamp: "2026-06-19T08:00:00Z",
  },
  {
    id: 7,
    txHash: "0xgg07gg...",
    eventType: "ItemClaimed",
    description: "Claimed Health Potion from Astral Quest RPG",
    timestamp: "2026-06-19T10:15:00Z",
  },
];

export const MOCK_PUBLISHER_ACTIVITIES = [
  ...MOCK_TX_EVENTS.filter((e) => ["ItemMinted", "ItemListed", "ItemClaimed"].includes(e.eventType)),
  {
    id: 8, txHash: "�", eventType: "GameCreated",
    description: "Published CyberForge Online (draft)",
    timestamp: "2026-06-18T10:00:00Z",
  },
  {
    id: 9, txHash: "�", eventType: "GamePublished",
    description: "Astral Quest RPG deployed to Sui Testnet",
    timestamp: "2026-06-10T00:00:00Z",
  },
];

export const MOCK_ANALYTICS = {
  totalMinted: 42,
  totalClaimed: 38,
  activePlayers: 156,
  txVolume: 1280,
  claimConversionRate: 90.5,
};
```

- [ ] **Step 2: Commit**

```bash
git add application/lib/mock-data.ts
git commit -m "feat: add mock data for all entities (items, games, publishers, listings, escrows, events)"
```

---

### Task 2: Create Zod validation schemas

**Files:**
- Create: `application/schemas/item-schema.ts`

- [ ] **Step 1: Write schema file**

```typescript
// application/schemas/item-schema.ts
import { z } from "zod";

export const itemDraftSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  itemType: z.string().min(1, "Type is required").max(50),
  rarity: z.string().min(1, "Rarity is required").max(50),
  description: z.string().max(500).optional(),
  supply: z.number().int().min(1).default(1),
  isNft: z.boolean().default(true),
  attributes: z.record(z.string(), z.string()).optional(),
});

export type ItemDraftInput = z.infer<typeof itemDraftSchema>;

export const gameDraftSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(1000).optional(),
  genre: z.string().max(100).optional(),
  websiteUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export type GameDraftInput = z.infer<typeof gameDraftSchema>;

export const publisherSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  logoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export type PublisherInput = z.infer<typeof publisherSchema>;

export const listingSchema = z.object({
  price: z.number().positive("Price must be positive"),
  royaltyBps: z.number().int().min(0).max(10000).optional(),
});

export type ListingInput = z.infer<typeof listingSchema>;

export const escrowConditionsSchema = z.object({
  itemTypeAccept: z.string().optional(),
  rarityAccept: z.string().optional(),
  gameIdAccept: z.number().optional(),
});

export type EscrowConditionsInput = z.infer<typeof escrowConditionsSchema>;
```

- [ ] **Step 2: Commit**

```bash
git add application/schemas/item-schema.ts
git commit -m "feat: add Zod schemas for item, game, publisher, listing forms"
```

---

### Task 3: Create Zustand stores

**Files:**
- Create: `application/stores/auth-store.ts`
- Create: `application/stores/inventory-store.ts`
- Create: `application/stores/marketplace-store.ts`
- Create: `application/stores/publisher-store.ts`
- Create: `application/stores/claim-store.ts`

- [ ] **Step 1: Auth store**

```typescript
// application/stores/auth-store.ts
import { create } from "zustand";

type UserMode = "gamer" | "dev" | null;

interface AuthState {
  isLoggedIn: boolean;
  userMode: UserMode;
  suiAddress: string | null;
  displayName: string | null;
  activePublisherId: string | null;
  login: (mode: UserMode) => void;
  logout: () => void;
  setActivePublisher: (id: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  userMode: null,
  suiAddress: null,
  displayName: null,
  activePublisherId: null,
  login: (mode) =>
    set({
      isLoggedIn: true,
      userMode: mode,
      suiAddress: mode === "gamer" ? "0xabc123...def" : "0xdev001...aaa",
      displayName: mode === "gamer" ? "CryptoGamer99" : "IndieQuest Dev",
      activePublisherId: mode === "dev" ? "pub-001" : null,
    }),
  logout: () =>
    set({
      isLoggedIn: false,
      userMode: null,
      suiAddress: null,
      displayName: null,
      activePublisherId: null,
    }),
  setActivePublisher: (id) => set({ activePublisherId: id }),
}));
```

- [ ] **Step 2: Inventory store**

```typescript
// application/stores/inventory-store.ts
import { create } from "zustand";
import type { GameItem } from "@/lib/mock-data";

// Reuse Item type from mock-data pattern
type InventoryItem = {
  id: string;
  suiItemId: string;
  gameId: number;
  gameName: string;
  name: string;
  itemType: string;
  rarity: string;
  description: string;
  imageUrl: string | null;
  blobId: string;
  supply: number | null;
  isNft: boolean;
  attributes: Record<string, string>;
  status: "published";
  owner: string | null;
  createdAt: string;
};

interface InventoryState {
  items: InventoryItem[];
  setItems: (items: InventoryItem[]) => void;
  removeItem: (id: string) => void;
  getItemById: (id: string) => InventoryItem | undefined;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  items: [],
  setItems: (items) => set({ items }),
  removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
  getItemById: (id) => get().items.find((i) => i.id === id),
}));
```

- [ ] **Step 3: Marketplace store**

```typescript
// application/stores/marketplace-store.ts
import { create } from "zustand";

type Listing = {
  id: string;
  item: any;
  price: number;
  seller: string;
  sellerName: string;
  listingType: "sale";
  royaltyBps: number | null;
  createdAt: string;
};

type Escrow = {
  id: string;
  offeredItem: any;
  initiator: string;
  initiatorName: string;
  conditions: {
    itemTypeAccept: string | null;
    rarityAccept: string | null;
    gameIdAccept: number | null;
    itemIdTarget: string | null;
  };
  counterparty: string | null;
  isActive: boolean;
  createdAt: string;
};

interface MarketplaceState {
  listings: Listing[];
  escrows: Escrow[];
  setListings: (listings: Listing[]) => void;
  setEscrows: (escrows: Escrow[]) => void;
  filterType: "all" | "sale" | "barter";
  setFilterType: (t: "all" | "sale" | "barter") => void;
  filterGame: string | null;
  setFilterGame: (g: string | null) => void;
  filterRarity: string | null;
  setFilterRarity: (r: string | null) => void;
  sortBy: "newest" | "price_asc" | "price_desc";
  setSortBy: (s: "newest" | "price_asc" | "price_desc") => void;
}

export const useMarketplaceStore = create<MarketplaceState>((set) => ({
  listings: [],
  escrows: [],
  setListings: (listings) => set({ listings }),
  setEscrows: (escrows) => set({ escrows }),
  filterType: "all",
  setFilterType: (filterType) => set({ filterType }),
  filterGame: null,
  setFilterGame: (filterGame) => set({ filterGame }),
  filterRarity: null,
  setFilterRarity: (filterRarity) => set({ filterRarity }),
  sortBy: "newest",
  setSortBy: (sortBy) => set({ sortBy }),
}));
```

- [ ] **Step 4: Publisher store**

```typescript
// application/stores/publisher-store.ts
import { create } from "zustand";

interface PublisherState {
  isPublishing: boolean;
  publishProgress: { step: string; done: boolean }[];
  setPublishing: (v: boolean) => void;
  setProgress: (steps: { step: string; done: boolean }[]) => void;
}

export const usePublisherStore = create<PublisherState>((set) => ({
  isPublishing: false,
  publishProgress: [],
  setPublishing: (isPublishing) => set({ isPublishing }),
  setProgress: (publishProgress) => set({ publishProgress }),
}));
```

- [ ] **Step 5: Claim store**

```typescript
// application/stores/claim-store.ts
import { create } from "zustand";

type ClaimState = "idle" | "loading" | "success" | "error";

interface ClaimStore {
  state: ClaimState;
  errorMessage: string | null;
  claimedItem: any | null;
  claim: () => void;
  reset: () => void;
}

export const useClaimStore = create<ClaimStore>((set) => ({
  state: "idle",
  errorMessage: null,
  claimedItem: null,
  claim: () => {
    set({ state: "loading" });
    setTimeout(() => {
      set({ state: "success", claimedItem: { name: "Legendary Void Sword", gameName: "Astral Quest RPG" } });
    }, 2000);
  },
  reset: () => set({ state: "idle", errorMessage: null, claimedItem: null }),
}));
```

- [ ] **Step 6: Commit**

```bash
git add application/stores/
git commit -m "feat: add Zustand stores for auth, inventory, marketplace, publisher, claim"
```

---

## Phase 1: Shared Neo-Brutalist Components

One task per component file. Each task has exact file path, and 1-3 steps with actual TSX code matching the Neo-Brutalist design system:
- `border-3 border-[#1E2044]` for thick borders
- `shadow-[4px_4px_0px_0px_var(--color-border-dark)]` for block shadows
- `font-display font-black uppercase` for headings
- `font-sans` for body, `font-mono` for metadata
- Space Grotesk, Inter, JetBrains Mono from layout.tsx CSS vars
- `bg-brand-bg` (`#FCFBF2`) for backgrounds
- `text-blueberry` for CTAs, `text-blueberry-dark` for accents
- Use `cn()` from `@/lib/utils` for class merging
- Use lucide-react icons

### Task 4: status-badge.tsx

**Files:**
- Create: `application/components/shared/status-badge.tsx`

- [ ] **Step 1: Write StatusBadge component**

```tsx
'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type StatusVariant = 'draft' | 'published' | 'paused' | 'verified';

const STATUS_CONFIG: Record<StatusVariant, { bg: string; text: string; border: string; label: string }> = {
  draft: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-400',
    label: 'Draft',
  },
  published: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-400',
    label: 'Published',
  },
  paused: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-400',
    label: 'Paused',
  },
  verified: {
    bg: 'bg-blue-100',
    text: 'text-blueberry-dark',
    border: 'border-blueberry',
    label: 'Verified',
  },
};

interface StatusBadgeProps {
  status: StatusVariant;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-md border-2',
        config.bg,
        config.text,
        config.border,
        'text-[10px] font-mono font-extrabold uppercase tracking-wider',
        className,
      )}
    >
      {status === 'verified' && <Check className="w-3 h-3" />}
      {config.label}
    </span>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add application/components/shared/status-badge.tsx
git commit -m "feat: add StatusBadge component"
```

---

### Task 5: rarity-badge.tsx

**Files:**
- Create: `application/components/shared/rarity-badge.tsx`

- [ ] **Step 1: Write RarityBadge component**

```tsx
'use client';

import React from 'react';
import { cn } from '@/lib/utils';

const RARITY_CONFIG: Record<string, { bg: string; text: string; border: string }> = {
  Legendary: {
    bg: 'bg-yellow-200',
    text: 'text-yellow-900',
    border: 'border-yellow-500',
  },
  Epic: {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    border: 'border-purple-400',
  },
  Rare: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-400',
  },
  Uncommon: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-400',
  },
  Common: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-300',
  },
};

interface RarityBadgeProps {
  rarity: string;
  className?: string;
}

export default function RarityBadge({ rarity, className }: RarityBadgeProps) {
  const config = RARITY_CONFIG[rarity] ?? RARITY_CONFIG.Common;
  return (
    <span
      className={cn(
        'inline-flex px-2 py-0.5 rounded-md border-2',
        config.bg,
        config.text,
        config.border,
        'text-[10px] font-mono font-extrabold uppercase tracking-wider',
        className,
      )}
    >
      {rarity}
    </span>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add application/components/shared/rarity-badge.tsx
git commit -m "feat: add RarityBadge component"
```

---

### Task 6: game-badge.tsx

**Files:**
- Create: `application/components/shared/game-badge.tsx`

- [ ] **Step 1: Write GameBadge component**

```tsx
'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface GameBadgeProps {
  gameName: string;
  className?: string;
}

export default function GameBadge({ gameName, className }: GameBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex px-2 py-0.5 rounded-md',
        'bg-blueberry-cream border-2 border-blueberry/30',
        'text-[10px] font-mono font-extrabold uppercase tracking-wider text-blueberry-dark',
        className,
      )}
    >
      {gameName}
    </span>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add application/components/shared/game-badge.tsx
git commit -m "feat: add GameBadge component"
```

---

### Task 7: empty-state.tsx

**Files:**
- Create: `application/components/shared/empty-state.tsx`

- [ ] **Step 1: Write EmptyState component**

```tsx
'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export default function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-20 px-6 text-center',
        className,
      )}
    >
      {/* Illustration area */}
      <div className="w-24 h-24 mb-6 rounded-2xl border-3 border-dashed border-[#1E2044]/20 bg-blueberry-cream/50 flex items-center justify-center">
        {icon ?? (
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="8" width="32" height="24" rx="3" stroke="#1E2044" strokeWidth="2.5" strokeDasharray="4 3" />
            <path d="M14 28L18 20L22 24L26 16L30 22" stroke="#5A60D3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      {/* Title */}
      <h3 className="font-display font-black text-xl uppercase tracking-tight text-[#1E2044] mb-2">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="font-sans text-sm text-[#1E2044]/60 max-w-sm mb-6">
          {description}
        </p>
      )}

      {/* Optional CTA */}
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 bg-blueberry text-white border-3 border-[#1E2044] font-display font-black rounded-xl shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_var(--color-border-dark)] transition-all uppercase text-sm cursor-pointer"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add application/components/shared/empty-state.tsx
git commit -m "feat: add EmptyState component"
```


---

### Task 8: confirm-modal.tsx

**Files:**
- Create: `application/components/shared/confirm-modal.tsx`

- [ ] **Step 1: Write ConfirmModal component**

```tsx
'use client';

import React, { useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    },
    [onCancel],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#1E2044]/40 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal card */}
      <div className="relative z-10 w-full max-w-md mx-4 bg-white border-3 border-[#1E2044] rounded-2xl shadow-[6px_6px_0px_0px_var(--color-border-dark)] p-8">
        <h3 className="font-display font-black text-xl uppercase tracking-tight text-[#1E2044] mb-3">
          {title}
        </h3>
        <p className="font-sans text-sm text-[#1E2044]/70 mb-8 leading-relaxed">
          {message}
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 bg-white text-[#1E2044] border-2 border-[#1E2044] font-mono font-black rounded-lg text-xs uppercase tracking-wider hover:bg-blueberry-cream transition-all cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              'px-5 py-2.5 font-display font-black rounded-lg text-xs uppercase tracking-wider border-3 border-[#1E2044] transition-all cursor-pointer',
              variant === 'danger'
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-blueberry text-white hover:bg-blueberry-dark',
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add application/components/shared/confirm-modal.tsx
git commit -m "feat: add ConfirmModal component"
```

---

### Task 9: filter-bar.tsx

**Files:**
- Create: `application/components/shared/filter-bar.tsx`

- [ ] **Step 1: Write FilterBar component**

```tsx
'use client';

import React from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterField {
  label: string;
  key: string;
  options: FilterOption[];
  value: string | null;
  onChange: (v: string | null) => void;
}

interface FilterBarProps {
  filters: FilterField[];
  sortBy: string;
  sortOptions?: { label: string; value: string }[];
  onSortChange: (v: string) => void;
  searchValue: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder?: string;
  className?: string;
}

export default function FilterBar({
  filters,
  sortBy,
  sortOptions = [
    { label: 'Newest', value: 'newest' },
    { label: 'Price: Low-High', value: 'price_asc' },
    { label: 'Price: High-Low', value: 'price_desc' },
  ],
  onSortChange,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  className,
}: FilterBarProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-3 p-4 bg-white border-3 border-[#1E2044] rounded-2xl shadow-[4px_4px_0px_0px_var(--color-border-dark)]',
        className,
      )}
    >
      {/* Search input */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1E2044]/40" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full bg-blueberry-cream/10 text-xs font-sans text-[#1E2044] pl-10 pr-4 py-2.5 border-2 border-[#1E2044] rounded-xl focus:outline-none focus:ring-2 focus:ring-blueberry/25 placeholder-[#1E2044]/40"
        />
      </div>

      {/* Dropdown filters */}
      {filters.map((filter) => (
        <div key={filter.key} className="relative">
          <select
            value={filter.value ?? ''}
            onChange={(e) => filter.onChange(e.target.value || null)}
            className="appearance-none bg-white text-xs font-mono font-bold text-[#1E2044] px-3 py-2.5 pr-8 border-2 border-[#1E2044] rounded-xl focus:outline-none focus:ring-2 focus:ring-blueberry/25 uppercase tracking-wider cursor-pointer"
          >
            <option value="">{filter.label}</option>
            {filter.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#1E2044]/50 pointer-events-none" />
        </div>
      ))}

      {/* Sort dropdown */}
      <div className="relative">
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="appearance-none bg-white text-xs font-mono font-bold text-[#1E2044] px-3 py-2.5 pr-8 border-2 border-[#1E2044] rounded-xl focus:outline-none focus:ring-2 focus:ring-blueberry/25 uppercase tracking-wider cursor-pointer"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              Sort: {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#1E2044]/50 pointer-events-none" />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add application/components/shared/filter-bar.tsx
git commit -m "feat: add FilterBar component"
```

---

### Task 10: metric-card.tsx

**Files:**
- Create: `application/components/shared/metric-card.tsx`

- [ ] **Step 1: Write MetricCard component**

```tsx
'use client';

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  label: string;
  value: string | number;
  delta?: string;
  className?: string;
}

export default function MetricCard({ label, value, delta, className }: MetricCardProps) {
  const isPositive = delta && !delta.startsWith('-');

  return (
    <div
      className={cn(
        'bg-white border-3 border-[#1E2044] rounded-2xl shadow-[4px_4px_0px_0px_var(--color-border-dark)] p-5 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_var(--color-border-dark)] transition-all',
        className,
      )}
    >
      <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60 block mb-1">
        {label}
      </span>
      <span className="font-display font-black text-3xl tracking-tight text-[#1E2044] block">
        {value}
      </span>
      {delta && (
        <span
          className={cn(
            'inline-flex items-center gap-0.5 mt-2 text-xs font-mono font-bold',
            isPositive ? 'text-green-600' : 'text-red-500',
          )}
        >
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {delta}
        </span>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add application/components/shared/metric-card.tsx
git commit -m "feat: add MetricCard component"
```


---

### Task 11: topbar.tsx

**Files:**
- Create: `application/components/shared/topbar.tsx`

- [ ] **Step 1: Write Topbar component**

```tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';

const NAV_LINKS = [
  { label: 'Marketplace', href: '/marketplace' },
  { label: 'Inventory', href: '/inventory' },
  { label: 'History', href: '/history' },
];

export default function Topbar() {
  const pathname = usePathname();
  const { isLoggedIn, displayName, logout } = useAuthStore();

  return (
    <header className="sticky top-0 z-[100] bg-brand-bg/90 backdrop-blur-md border-b-3 border-[#1E2044]">
      <div className="max-w-7xl mx-auto px-6 h-18 sm:h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <span className="font-display font-black text-2xl sm:text-3xl tracking-tighter text-blueberry-dark uppercase">
            MORITA
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-3 sm:gap-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'text-[10px] sm:text-sm font-display font-black uppercase tracking-tight transition-colors',
                pathname.startsWith(link.href)
                  ? 'text-blueberry underline decoration-blueberry decoration-2 underline-offset-4'
                  : 'text-blueberry-dark hover:text-blueberry',
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Wallet / Auth area */}
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-[10px] font-mono font-bold text-[#1E2044]/60 uppercase">
                {displayName}
              </span>
              <button
                onClick={logout}
                className="px-4 py-2 bg-white border-2 border-[#1E2044] rounded-xl font-mono text-[10px] font-black uppercase tracking-wider text-[#1E2044] hover:bg-blueberry-cream transition-all cursor-pointer"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                console.log('Connect wallet');
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blueberry text-white border-3 border-[#1E2044] font-display font-black rounded-xl shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_var(--color-border-dark)] transition-all uppercase text-xs cursor-pointer"
            >
              <Wallet className="w-4 h-4" />
              <span className="hidden sm:inline">Connect Wallet</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add application/components/shared/topbar.tsx
git commit -m "feat: add Topbar component"
```

---

### Task 12: sidebar.tsx

**Files:**
- Create: `application/components/shared/sidebar.tsx`

- [ ] **Step 1: Write Sidebar component**

```tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import StatusBadge from '@/components/shared/status-badge';

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  items: SidebarItem[];
  activePath: string;
  publisherName: string;
  isVerified: boolean;
  className?: string;
}

export default function Sidebar({ items, activePath, publisherName, isVerified, className }: SidebarProps) {
  return (
    <aside
      className={cn(
        'w-64 min-h-screen bg-white border-r-3 border-[#1E2044] flex flex-col',
        className,
      )}
    >
      {/* Publisher header */}
      <div className="p-5 border-b-2 border-dashed border-[#1E2044]/15">
        <p className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60 mb-1">
          Publisher
        </p>
        <h3 className="font-display font-black text-lg uppercase tracking-tight text-[#1E2044] truncate">
          {publisherName}
        </h3>
        <div className="mt-2">
          <StatusBadge status={isVerified ? 'verified' : 'draft'} />
        </div>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {items.map((item) => {
          const isActive = activePath === item.href || activePath.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group',
                isActive
                  ? 'bg-blueberry text-white'
                  : 'text-[#1E2044]/70 hover:bg-blueberry-cream hover:text-[#1E2044]',
              )}
            >
              <span className={cn('w-5 h-5', isActive ? 'text-white' : 'text-[#1E2044]/50 group-hover:text-[#1E2044]')}>
                {item.icon}
              </span>
              <span className="font-display font-black text-sm uppercase tracking-tight">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer area */}
      <div className="p-5 border-t-2 border-dashed border-[#1E2044]/15">
        <p className="text-[10px] font-mono text-[#1E2044]/40 uppercase tracking-wider">
          Morita Dashboard v0.1
        </p>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add application/components/shared/sidebar.tsx
git commit -m "feat: add Sidebar component"
```

---

### Task 13: publisher-switcher.tsx

**Files:**
- Create: `application/components/shared/publisher-switcher.tsx`

- [ ] **Step 1: Write PublisherSwitcher component**

```tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import StatusBadge from '@/components/shared/status-badge';

interface PublisherOption {
  id: string;
  name: string;
  isVerified: boolean;
}

interface PublisherSwitcherProps {
  publishers: PublisherOption[];
  activeId: string;
  onSwitch: (id: string) => void;
  className?: string;
}

export default function PublisherSwitcher({ publishers, activeId, onSwitch, className }: PublisherSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const activePub = publishers.find((p) => p.id === activeId);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white border-3 border-[#1E2044] rounded-2xl shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all cursor-pointer"
      >
        <div className="flex-1 text-left">
          <span className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60">
            Workspace
          </span>
          <span className="block font-display font-black text-lg uppercase tracking-tight text-[#1E2044] truncate">
            {activePub?.name ?? 'Select Publisher'}
          </span>
        </div>
        <ChevronDown
          className={cn(
            'w-5 h-5 text-[#1E2044] transition-transform',
            isOpen && 'rotate-180',
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border-3 border-[#1E2044] rounded-2xl shadow-[4px_4px_0px_0px_var(--color-border-dark)] py-2 z-50">
          {publishers.map((pub) => (
            <button
              key={pub.id}
              onClick={() => {
                onSwitch(pub.id);
                setIsOpen(false);
              }}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2.5 transition-colors',
                pub.id === activeId
                  ? 'bg-blueberry-cream'
                  : 'hover:bg-blueberry-cream/50',
              )}
            >
              <div className="flex-1 text-left">
                <span className="block font-display font-black text-sm uppercase tracking-tight text-[#1E2044]">
                  {pub.name}
                </span>
              </div>
              <StatusBadge status={pub.isVerified ? 'verified' : 'draft'} />
              {pub.id === activeId && <Check className="w-4 h-4 text-blueberry" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add application/components/shared/publisher-switcher.tsx
git commit -m "feat: add PublisherSwitcher component"
```

---

### Task 14: publish-progress-bar.tsx

**Files:**
- Create: `application/components/shared/publish-progress-bar.tsx`

- [ ] **Step 1: Write PublishProgressBar component**

```tsx
'use client';

import React from 'react';
import { Check, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressStep {
  label: string;
  status: 'pending' | 'active' | 'done' | 'error';
}

interface PublishProgressBarProps {
  steps: ProgressStep[];
  className?: string;
}

export default function PublishProgressBar({ steps, className }: PublishProgressBarProps) {
  return (
    <div className={cn('flex flex-col gap-0', className)}>
      {steps.map((step, idx) => {
        const isLast = idx === steps.length - 1;
        return (
          <div key={idx} className="flex items-stretch">
            {/* Step indicator + connecting line */}
            <div className="flex flex-col items-center mr-4">
              <div
                className={cn(
                  'w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors',
                  step.status === 'done' && 'bg-green-100 border-green-400 text-green-600',
                  step.status === 'active' && 'bg-blueberry-cream border-blueberry text-blueberry',
                  step.status === 'error' && 'bg-red-100 border-red-400 text-red-500',
                  step.status === 'pending' && 'bg-white border-[#1E2044]/20 text-[#1E2044]/30',
                )}
              >
                {step.status === 'done' && <Check className="w-4 h-4" />}
                {step.status === 'active' && <Loader2 className="w-4 h-4 animate-spin" />}
                {step.status === 'error' && <X className="w-4 h-4" />}
                {step.status === 'pending' && <div className="w-2 h-2 rounded-full bg-[#1E2044]/20" />}
              </div>
              {!isLast && (
                <div
                  className={cn(
                    'w-0.5 flex-1 min-h-[20px]',
                    step.status === 'done' ? 'bg-green-400' : 'bg-[#1E2044]/10',
                  )}
                />
              )}
            </div>

            {/* Step label */}
            <div className="pb-6">
              <span
                className={cn(
                  'font-mono text-xs font-bold uppercase tracking-wider',
                  step.status === 'active' && 'text-blueberry',
                  step.status === 'done' && 'text-green-700',
                  step.status === 'error' && 'text-red-500',
                  step.status === 'pending' && 'text-[#1E2044]/40',
                )}
              >
                {step.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add application/components/shared/publish-progress-bar.tsx
git commit -m "feat: add PublishProgressBar component"
```


---

### Task 15: item-card.tsx

**Files:**
- Create: `application/components/shared/item-card.tsx`

- [ ] **Step 1: Write ItemCard component**

```tsx
'use client';

import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import GameBadge from '@/components/shared/game-badge';
import RarityBadge from '@/components/shared/rarity-badge';
import StatusBadge from '@/components/shared/status-badge';

interface ItemCardData {
  name: string;
  gameName: string;
  itemType: string;
  rarity: string;
  imageUrl?: string | null;
  status?: 'draft' | 'published' | 'paused' | 'verified';
  price?: number;
}

interface ItemCardProps {
  item: ItemCardData;
  variant?: 'grid' | 'compact';
  onClick?: () => void;
  children?: React.ReactNode;
  className?: string;
}

export default function ItemCard({ item, variant = 'grid', onClick, children, className }: ItemCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      onClick={onClick}
      className={cn(
        'bg-white border-3 border-[#1E2044] rounded-2xl overflow-hidden shadow-[4px_4px_0px_0px_var(--color-border-dark)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_var(--color-border-dark)] transition-all',
        onClick && 'cursor-pointer',
        variant === 'compact' ? 'flex items-center p-3 gap-3' : 'flex flex-col',
        className,
      )}
    >
      {/* Image area */}
      <div
        className={cn(
          'bg-blueberry-cream/50 flex items-center justify-center overflow-hidden',
          variant === 'compact' ? 'w-16 h-16 shrink-0 rounded-xl border-2 border-[#1E2044]/20' : 'w-full h-48 border-b-3 border-[#1E2044]',
        )}
      >
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <svg width={variant === 'compact' ? '32' : '56'} height={variant === 'compact' ? '32' : '56'} viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="4" width="48" height="48" rx="8" stroke="#1E2044" strokeWidth="2.5" strokeDasharray="6 4" />
            <rect x="16" y="16" width="24" height="24" rx="4" stroke="#5A60D3" strokeWidth="2" />
            <circle cx="28" cy="28" r="6" fill="#5A60D3" fillOpacity="0.2" />
          </svg>
        )}
      </div>

      {/* Content */}
      <div className={cn('flex-1', variant === 'compact' ? '' : 'p-4')}>
        {/* Badges row */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <GameBadge gameName={item.gameName} />
          <RarityBadge rarity={item.rarity} />
          {item.status && item.status !== 'published' && (
            <StatusBadge status={item.status} />
          )}
        </div>

        {/* Name */}
        <h3
          className={cn(
            'font-display font-black uppercase tracking-tight text-[#1E2044]',
            variant === 'compact' ? 'text-base' : 'text-lg',
          )}
        >
          {item.name}
        </h3>

        {/* Price overlay */}
        {item.price !== undefined && (
          <div className={cn(variant === 'compact' ? 'mt-1' : 'mt-3')}>
            <span className="text-xs font-mono font-extrabold text-blueberry">
              {item.price} SUI
            </span>
          </div>
        )}

        {/* Custom children (e.g., action buttons) */}
        {children}
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add application/components/shared/item-card.tsx
git commit -m "feat: add ItemCard component"
```

---

### Task 16: item-detail.tsx

**Files:**
- Create: `application/components/shared/item-detail.tsx`

- [ ] **Step 1: Write ItemDetail component**

```tsx
'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import GameBadge from '@/components/shared/game-badge';
import RarityBadge from '@/components/shared/rarity-badge';

interface ItemDetailData {
  name: string;
  gameName: string;
  itemType: string;
  rarity: string;
  description?: string;
  imageUrl?: string | null;
  suiItemId?: string | null;
  supply?: number | null;
  isNft?: boolean;
  attributes?: Record<string, string>;
  status?: string;
}

interface ItemDetailProps {
  item: ItemDetailData;
  className?: string;
  children?: React.ReactNode;
}

export default function ItemDetail({ item, className, children }: ItemDetailProps) {
  return (
    <div
      className={cn(
        'bg-white border-3 border-[#1E2044] rounded-2xl shadow-[4px_4px_0px_0px_var(--color-border-dark)] overflow-hidden',
        className,
      )}
    >
      {/* Large image area */}
      <div className="w-full h-72 sm:h-96 bg-blueberry-cream/50 border-b-3 border-[#1E2044] flex items-center justify-center">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="text-center">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="6" y="6" width="68" height="68" rx="12" stroke="#1E2044" strokeWidth="3" strokeDasharray="8 6" />
              <rect x="22" y="22" width="36" height="36" rx="6" stroke="#5A60D3" strokeWidth="2.5" />
              <circle cx="40" cy="40" r="10" fill="#5A60D3" fillOpacity="0.15" />
            </svg>
            <p className="text-[10px] font-mono text-[#1E2044]/40 uppercase tracking-wider mt-3">
              No image provided
            </p>
          </div>
        )}
      </div>

      {/* Details content */}
      <div className="p-6 sm:p-8">
        {/* Badges */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <GameBadge gameName={item.gameName} />
          <RarityBadge rarity={item.rarity} />
        </div>

        {/* Name */}
        <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-[#1E2044] mb-4">
          {item.name}
        </h1>

        {/* Description */}
        {item.description && (
          <p className="font-sans text-sm text-[#1E2044]/70 leading-relaxed mb-6">
            {item.description}
          </p>
        )}

        {/* Metadata row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-blueberry-cream/50 border-2 border-[#1E2044]/10 rounded-xl p-3">
            <span className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60">Type</span>
            <span className="block font-display font-bold text-sm uppercase text-[#1E2044] mt-0.5">{item.itemType}</span>
          </div>
          <div className="bg-blueberry-cream/50 border-2 border-[#1E2044]/10 rounded-xl p-3">
            <span className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60">Rarity</span>
            <span className="block font-display font-bold text-sm uppercase text-[#1E2044] mt-0.5">{item.rarity}</span>
          </div>
          {item.suiItemId && (
            <div className="bg-blueberry-cream/50 border-2 border-[#1E2044]/10 rounded-xl p-3">
              <span className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60">On-Chain ID</span>
              <span className="block font-mono text-xs text-[#1E2044] mt-0.5 truncate">{item.suiItemId}</span>
            </div>
          )}
          <div className="bg-blueberry-cream/50 border-2 border-[#1E2044]/10 rounded-xl p-3">
            <span className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60">Supply</span>
            <span className="block font-display font-bold text-sm uppercase text-[#1E2044] mt-0.5">
              {item.isNft ? 'Unique (NFT)' : item.supply ? `${item.supply} copies` : 'N/A'}
            </span>
          </div>
        </div>

        {/* Attributes table */}
        {item.attributes && Object.keys(item.attributes).length > 0 && (
          <div className="mb-6">
            <h3 className="font-display font-black text-sm uppercase tracking-tight text-[#1E2044] mb-3">
              Attributes
            </h3>
            <div className="border-2 border-[#1E2044]/20 rounded-xl overflow-hidden">
              <table className="w-full">
                <tbody>
                  {Object.entries(item.attributes).map(([key, value]) => (
                    <tr key={key} className="border-b border-[#1E2044]/10 last:border-b-0">
                      <td className="px-4 py-2 text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60 bg-blueberry-cream/30">
                        {key}
                      </td>
                      <td className="px-4 py-2 text-xs font-mono font-bold text-[#1E2044]">
                        {value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Custom children (actions, extra info) */}
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add application/components/shared/item-detail.tsx
git commit -m "feat: add ItemDetail component"
```

---

### Task 17: listing-row.tsx

**Files:**
- Create: `application/components/shared/listing-row.tsx`

- [ ] **Step 1: Write ListingRow component**

```tsx
'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import GameBadge from '@/components/shared/game-badge';
import RarityBadge from '@/components/shared/rarity-badge';

interface ListingRowData {
  name: string;
  gameName: string;
  rarity: string;
}

interface ListingRowProps {
  item: ListingRowData;
  price: number;
  sellerName: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export default function ListingRow({ item, price, sellerName, onClick, disabled, className }: ListingRowProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 bg-white border-3 border-[#1E2044] rounded-2xl p-4 shadow-[4px_4px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_var(--color-border-dark)] transition-all',
        className,
      )}
    >
      {/* Thumbnail placeholder */}
      <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-xl border-2 border-[#1E2044]/20 bg-blueberry-cream/50 flex items-center justify-center">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="2" width="24" height="24" rx="4" stroke="#1E2044" strokeWidth="2" strokeDasharray="4 3" />
          <circle cx="14" cy="14" r="4" fill="#5A60D3" fillOpacity="0.2" />
        </svg>
      </div>

      {/* Item info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <GameBadge gameName={item.gameName} />
          <RarityBadge rarity={item.rarity} />
        </div>
        <h4 className="font-display font-black text-sm uppercase tracking-tight text-[#1E2044] truncate">
          {item.name}
        </h4>
        <p className="text-[10px] font-mono text-[#1E2044]/50 mt-0.5">
          Seller: {sellerName}
        </p>
      </div>

      {/* Price */}
      <div className="text-right shrink-0">
        <span className="block font-mono font-extrabold text-lg text-blueberry">
          {price}
        </span>
        <span className="block text-[10px] font-mono font-bold text-[#1E2044]/60 uppercase tracking-wider">
          SUI
        </span>
      </div>

      {/* Buy button */}
      <button
        onClick={onClick}
        disabled={disabled}
        className={cn(
          'shrink-0 px-5 py-2.5 font-display font-black text-xs uppercase rounded-xl border-3 border-[#1E2044] transition-all cursor-pointer',
          disabled
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-blueberry text-white shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_var(--color-border-dark)]',
        )}
      >
        Buy Now
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add application/components/shared/listing-row.tsx
git commit -m "feat: add ListingRow component"
```

---

### Task 18: escrow-card.tsx

**Files:**
- Create: `application/components/shared/escrow-card.tsx`

- [ ] **Step 1: Write EscrowCard component**

```tsx
'use client';

import React from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import GameBadge from '@/components/shared/game-badge';
import RarityBadge from '@/components/shared/rarity-badge';

interface EscrowItemData {
  name: string;
  gameName: string;
  rarity: string;
}

interface EscrowConditions {
  itemTypeAccept?: string | null;
  rarityAccept?: string | null;
}

interface EscrowCardProps {
  escrow: {
    offeredItem: EscrowItemData;
    initiatorName: string;
    conditions: EscrowConditions;
    isActive: boolean;
  };
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export default function EscrowCard({ escrow, onClick, disabled, className }: EscrowCardProps) {
  const { offeredItem, initiatorName, conditions, isActive } = escrow;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={cn(
        'bg-white border-3 border-[#1E2044] rounded-2xl p-5 shadow-[4px_4px_0px_0px_var(--color-border-dark)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_var(--color-border-dark)] transition-all',
        className,
      )}
    >
      {/* Offered item section */}
      <div className="mb-4">
        <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60 block mb-2">
          Offering
        </span>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <GameBadge gameName={offeredItem.gameName} />
          <RarityBadge rarity={offeredItem.rarity} />
        </div>
        <h3 className="font-display font-black text-lg uppercase tracking-tight text-[#1E2044]">
          {offeredItem.name}
        </h3>
        <p className="text-[10px] font-mono text-[#1E2044]/50 mt-1">
          by {initiatorName}
        </p>
      </div>

      {/* Divider with swap icon */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 border-t-2 border-dashed border-[#1E2044]/15" />
        <ArrowLeftRight className="w-5 h-5 text-blueberry" />
        <div className="flex-1 border-t-2 border-dashed border-[#1E2044]/15" />
      </div>

      {/* Wants section */}
      <div className="mb-5">
        <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60 block mb-2">
          Wants
        </span>
        <div className="flex flex-wrap gap-2">
          {conditions.itemTypeAccept && (
            <span className="px-2 py-1 bg-blueberry-cream border-2 border-blueberry/30 rounded-md text-[10px] font-mono font-bold text-blueberry-dark uppercase">
              Type: {conditions.itemTypeAccept}
            </span>
          )}
          {conditions.rarityAccept && (
            <span className="px-2 py-1 bg-blueberry-cream border-2 border-blueberry/30 rounded-md text-[10px] font-mono font-bold text-blueberry-dark uppercase">
              Rarity: {conditions.rarityAccept}
            </span>
          )}
          {!conditions.itemTypeAccept && !conditions.rarityAccept && (
            <span className="text-[10px] font-mono text-[#1E2044]/40 uppercase">
              Any item
            </span>
          )}
        </div>
      </div>

      {/* Action button */}
      <button
        onClick={onClick}
        disabled={disabled || !isActive}
        className={cn(
          'w-full px-5 py-3 font-display font-black text-xs uppercase rounded-xl border-3 border-[#1E2044] transition-all cursor-pointer',
          disabled || !isActive
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-blueberry text-white shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_var(--color-border-dark)]',
        )}
      >
        {isActive ? 'Fulfill Barter' : 'Completed'}
      </button>
    </motion.div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add application/components/shared/escrow-card.tsx
git commit -m "feat: add EscrowCard component"
```


---

## Phase 2: Gamer Hub Pages (6 pages)

All pages use `'use client'`. All pages load mock data from Zustand stores on mount.

### Task 19: Create Hub layout `app/(hub)/layout.tsx`

**Files:**
- Create: `application/app/(hub)/layout.tsx`

- [ ] **Step 1: Write Hub layout**

```tsx
import React from 'react';
import Topbar from '@/components/shared/topbar';

export default function HubLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-bg">
      <Topbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(hub)/layout.tsx"
git commit -m "feat: add Hub layout with Topbar"
```

---

### Task 20: Inventory page `app/(hub)/inventory/page.tsx`

**Files:**
- Create: `application/app/(hub)/inventory/page.tsx`

- [ ] **Step 1: Write Inventory page**

```tsx
'use client';

import React, { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useInventoryStore } from '@/stores/inventory-store';
import { MOCK_ITEMS } from '@/lib/mock-data';
import ItemCard from '@/components/shared/item-card';
import EmptyState from '@/components/shared/empty-state';

export default function InventoryPage() {
  const { isLoggedIn, suiAddress } = useAuthStore();
  const { items, setItems } = useInventoryStore();

  useEffect(() => {
    // Load mock items owned by the current user
    if (isLoggedIn && suiAddress) {
      const owned = MOCK_ITEMS.filter((item) => item.owner === suiAddress);
      setItems(owned);
    }
  }, [isLoggedIn, suiAddress, setItems]);

  // Not logged in
  if (!isLoggedIn) {
    return (
      <EmptyState
        title="Connect Wallet"
        description="Connect your wallet to view your inventory of cross-game items."
        action={{
          label: 'Go to Landing',
          onClick: () => { window.location.href = '/'; },
        }}
      />
    );
  }

  // Empty inventory
  if (items.length === 0) {
    return (
      <EmptyState
        title="No Items Yet"
        description="Your inventory is empty. Head to the marketplace to find items, or claim a code from a participating game."
        action={{
          label: 'Browse Marketplace',
          onClick: () => { window.location.href = '/marketplace'; },
        }}
      />
    );
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-[#1E2044]">
          My Inventory
        </h1>
        <p className="font-sans text-sm text-[#1E2044]/60 mt-1">
          {items.length} item{items.length !== 1 ? 's' : ''} owned
        </p>
      </div>

      {/* Items grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {items.map((item) => (
          <ItemCard
            key={item.id}
            item={{
              name: item.name,
              gameName: item.gameName,
              itemType: item.itemType,
              rarity: item.rarity,
              imageUrl: item.imageUrl,
              status: item.status,
            }}
            onClick={() => { console.log('View item:', item.id); }}
          >
            {/* Action buttons */}
            <div className="flex gap-2 mt-3 pt-3 border-t-2 border-dashed border-[#1E2044]/15">
              <button
                onClick={(e) => { e.stopPropagation(); console.log('Sell item:', item.id); }}
                className="flex-1 px-3 py-2 bg-blueberry text-white border-2 border-[#1E2044] font-display font-black rounded-lg text-[10px] uppercase shadow-[2px_2px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                Sell
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); console.log('Barter item:', item.id); }}
                className="flex-1 px-3 py-2 bg-white text-[#1E2044] border-2 border-[#1E2044] font-display font-black rounded-lg text-[10px] uppercase hover:bg-blueberry-cream transition-all cursor-pointer"
              >
                Barter
              </button>
            </div>
          </ItemCard>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(hub)/inventory/page.tsx"
git commit -m "feat: add Hub Inventory page"
```

---

### Task 21: Marketplace page `app/(hub)/marketplace/page.tsx`

**Files:**
- Create: `application/app/(hub)/marketplace/page.tsx`

- [ ] **Step 1: Write Marketplace page**

```tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useMarketplaceStore } from '@/stores/marketplace-store';
import { MOCK_LISTINGS, MOCK_ESCROWS } from '@/lib/mock-data';
import FilterBar from '@/components/shared/filter-bar';
import ListingRow from '@/components/shared/listing-row';
import EscrowCard from '@/components/shared/escrow-card';
import EmptyState from '@/components/shared/empty-state';

type Tab = 'sale' | 'barter' | 'all';

export default function MarketplacePage() {
  const { isLoggedIn } = useAuthStore();
  const {
    listings, setListings,
    escrows, setEscrows,
    sortBy, setSortBy,
  } = useMarketplaceStore();

  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [searchValue, setSearchValue] = useState('');
  const [rarityFilter, setRarityFilter] = useState<string | null>(null);

  useEffect(() => {
    setListings(MOCK_LISTINGS);
    setEscrows(MOCK_ESCROWS);
  }, [setListings, setEscrows]);

  // Filter and sort listings
  const filteredListings = listings
    .filter((l) => {
      if (activeTab === 'barter') return false;
      if (activeTab === 'sale') return l.listingType === 'sale';
      return true;
    })
    .filter((l) => {
      if (searchValue) {
        const q = searchValue.toLowerCase();
        return l.item.name.toLowerCase().includes(q) || l.item.gameName.toLowerCase().includes(q);
      }
      return true;
    })
    .filter((l) => {
      if (rarityFilter && l.item.rarity !== rarityFilter) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const filteredEscrows = escrows
    .filter((e) => {
      if (activeTab === 'sale') return false;
      return true;
    })
    .filter((e) => {
      if (searchValue) {
        const q = searchValue.toLowerCase();
        return e.offeredItem.name.toLowerCase().includes(q) || e.offeredItem.gameName.toLowerCase().includes(q);
      }
      return true;
    })
    .filter((e) => {
      if (rarityFilter && e.offeredItem.rarity !== rarityFilter) return false;
      return true;
    });

  const showListings = activeTab === 'all' || activeTab === 'sale';
  const showEscrows = activeTab === 'all' || activeTab === 'barter';

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-[#1E2044]">
          Marketplace
        </h1>
        <p className="font-sans text-sm text-[#1E2044]/60 mt-1">
          Browse items for sale and barter escrows
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['all', 'sale', 'barter'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 font-display font-black text-xs uppercase rounded-xl border-3 border-[#1E2044] transition-all cursor-pointer ${
              activeTab === tab
                ? 'bg-blueberry text-white shadow-[3px_3px_0px_0px_var(--color-border-dark)]'
                : 'bg-white text-[#1E2044] hover:bg-blueberry-cream'
            }`}
          >
            {tab === 'sale' ? 'For Sale' : tab === 'barter' ? 'For Barter' : 'All'}
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <FilterBar
        filters={[
          {
            label: 'Rarity',
            key: 'rarity',
            options: [
              { label: 'Legendary', value: 'Legendary' },
              { label: 'Epic', value: 'Epic' },
              { label: 'Rare', value: 'Rare' },
              { label: 'Uncommon', value: 'Uncommon' },
              { label: 'Common', value: 'Common' },
            ],
            value: rarityFilter,
            onChange: setRarityFilter,
          },
        ]}
        sortBy={sortBy}
        onSortChange={setSortBy}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        className="mb-6"
      />

      {/* Listings section */}
      {showListings && filteredListings.length > 0 && (
        <div className="mb-10">
          {activeTab === 'all' && (
            <h2 className="font-display font-black text-lg uppercase tracking-tight text-[#1E2044] mb-4">
              For Sale
            </h2>
          )}
          <div className="space-y-4">
            {filteredListings.map((listing) => (
              <ListingRow
                key={listing.id}
                item={{
                  name: listing.item.name,
                  gameName: listing.item.gameName,
                  rarity: listing.item.rarity,
                }}
                price={listing.price}
                sellerName={listing.sellerName}
                disabled={!isLoggedIn}
                onClick={() => { console.log('Buy item:', listing.id); }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Escrows section */}
      {showEscrows && filteredEscrows.length > 0 && (
        <div className="mb-10">
          {activeTab === 'all' && (
            <h2 className="font-display font-black text-lg uppercase tracking-tight text-[#1E2044] mb-4">
              For Barter
            </h2>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredEscrows.map((escrow) => (
              <EscrowCard
                key={escrow.id}
                escrow={{
                  offeredItem: {
                    name: escrow.offeredItem.name,
                    gameName: escrow.offeredItem.gameName,
                    rarity: escrow.offeredItem.rarity,
                  },
                  initiatorName: escrow.initiatorName,
                  conditions: escrow.conditions,
                  isActive: escrow.isActive,
                }}
                disabled={!isLoggedIn}
                onClick={() => { window.location.href = `/barter/${escrow.id}`; }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state for both */}
      {filteredListings.length === 0 && filteredEscrows.length === 0 && (
        <EmptyState
          title="No Listings Found"
          description="No items match your current filters. Try adjusting your search or check back later."
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(hub)/marketplace/page.tsx"
git commit -m "feat: add Hub Marketplace page"
```


---

### Task 22: Barter detail page `app/(hub)/barter/[id]/page.tsx`

**Files:**
- Create: `application/app/(hub)/barter/[id]/page.tsx`

- [ ] **Step 1: Write Barter detail page**

```tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useMarketplaceStore } from '@/stores/marketplace-store';
import { MOCK_ESCROWS } from '@/lib/mock-data';
import ItemDetail from '@/components/shared/item-detail';
import StatusBadge from '@/components/shared/status-badge';
import ConfirmModal from '@/components/shared/confirm-modal';
import EmptyState from '@/components/shared/empty-state';

export default function BarterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isLoggedIn, suiAddress } = useAuthStore();
  const { escrows, setEscrows } = useMarketplaceStore();

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'cancel' | 'fulfill'>('cancel');

  useEffect(() => {
    if (escrows.length === 0) {
      setEscrows(MOCK_ESCROWS);
    }
  }, [escrows.length, setEscrows]);

  const escrowId = typeof params.id === 'string' ? params.id : '';
  const escrow = escrows.find((e) => e.id === escrowId);

  if (!escrow) {
    return (
      <EmptyState
        title="Escrow Not Found"
        description="This barter escrow does not exist or may have been removed."
        action={{ label: 'Back to Marketplace', onClick: () => router.push('/marketplace') }}
      />
    );
  }

  const isOwner = isLoggedIn && suiAddress === escrow.initiator;
  const isActive = escrow.isActive;

  const handleCancel = () => { setConfirmAction('cancel'); setIsConfirmOpen(true); };
  const handleFulfill = () => { setConfirmAction('fulfill'); setIsConfirmOpen(true); };

  const confirmActionHandler = () => {
    console.log(`${confirmAction} escrow:`, escrow.id);
    setIsConfirmOpen(false);
    if (confirmAction === 'cancel') { router.push('/marketplace'); }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => router.push('/marketplace')}
        className="font-mono text-[10px] font-extrabold uppercase tracking-wider text-blueberry hover:text-blueberry-dark mb-6 cursor-pointer"
      >
        &larr; Back to Marketplace
      </button>

      <div className="flex items-center gap-3 mb-6">
        <StatusBadge status={isActive ? 'published' : 'paused'} />
        <span className="font-sans text-sm text-[#1E2044]/60">
          {isActive ? 'Active — Awaiting counterparty' : 'Completed or Cancelled'}
        </span>
      </div>

      <ItemDetail
        item={{
          name: escrow.offeredItem.name,
          gameName: escrow.offeredItem.gameName,
          itemType: escrow.offeredItem.itemType,
          rarity: escrow.offeredItem.rarity,
          description: escrow.offeredItem.description,
          imageUrl: escrow.offeredItem.imageUrl,
          suiItemId: escrow.offeredItem.suiItemId,
          supply: escrow.offeredItem.supply,
          isNft: escrow.offeredItem.isNft,
          attributes: escrow.offeredItem.attributes,
        }}
        className="mb-8"
      />

      <div className="bg-white border-3 border-[#1E2044] rounded-2xl p-6 shadow-[4px_4px_0px_0px_var(--color-border-dark)] mb-8">
        <h2 className="font-display font-black text-lg uppercase tracking-tight text-[#1E2044] mb-4">
          Barter Conditions
        </h2>
        <p className="font-sans text-sm text-[#1E2044]/60 mb-4">
          <span className="font-mono font-bold text-[#1E2044]">{escrow.initiatorName}</span> is looking for:
        </p>
        <div className="flex flex-wrap gap-3">
          {escrow.conditions.itemTypeAccept && (
            <div className="px-4 py-2 bg-blueberry-cream border-2 border-blueberry/30 rounded-xl">
              <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-blueberry-dark">
                Item Type: {escrow.conditions.itemTypeAccept}
              </span>
            </div>
          )}
          {escrow.conditions.rarityAccept && (
            <div className="px-4 py-2 bg-blueberry-cream border-2 border-blueberry/30 rounded-xl">
              <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-blueberry-dark">
                Rarity: {escrow.conditions.rarityAccept}
              </span>
            </div>
          )}
          {!escrow.conditions.itemTypeAccept && !escrow.conditions.rarityAccept && (
            <span className="text-sm font-sans text-[#1E2044]/50">Open to any item</span>
          )}
        </div>
      </div>

      {isActive && (
        <div className="flex gap-3">
          {isOwner ? (
            <button
              onClick={handleCancel}
              className="px-6 py-3 bg-white text-red-500 border-3 border-[#1E2044] font-display font-black rounded-xl shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all uppercase text-sm cursor-pointer"
            >
              Cancel Escrow
            </button>
          ) : (
            isLoggedIn && (
              <button
                onClick={handleFulfill}
                className="px-6 py-3 bg-blueberry text-white border-3 border-[#1E2044] font-display font-black rounded-xl shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all uppercase text-sm cursor-pointer"
              >
                Fulfill Barter
              </button>
            )
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={isConfirmOpen}
        title={confirmAction === 'cancel' ? 'Cancel Escrow' : 'Fulfill Barter'}
        message={
          confirmAction === 'cancel'
            ? 'Are you sure you want to cancel this escrow? The offered item will be returned to your inventory.'
            : 'Confirm that you want to fulfill this barter with an item from your inventory.'
        }
        confirmLabel={confirmAction === 'cancel' ? 'Yes, Cancel' : 'Fulfill'}
        variant={confirmAction === 'cancel' ? 'danger' : 'default'}
        onConfirm={confirmActionHandler}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(hub)/barter/[id]/page.tsx"
git commit -m "feat: add Hub Barter detail page"
```

---

### Task 23: Claim page `app/(hub)/claim/page.tsx`

**Files:**
- Create: `application/app/(hub)/claim/page.tsx`

- [ ] **Step 1: Write Claim page**

```tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useClaimStore } from '@/stores/claim-store';
import { MOCK_CLAIM_CODES } from '@/lib/mock-data';
import EmptyState from '@/components/shared/empty-state';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function ClaimPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();
  const { state, errorMessage, claimedItem, claim, reset } = useClaimStore();

  const code = searchParams.get('code');
  const [validated, setValidated] = useState(false);

  useEffect(() => {
    reset();
    if (code) {
      const found = MOCK_CLAIM_CODES.find((c) => c.code === code);
      setValidated(true); // Validate that we checked
    }
  }, [code, reset]);

  const handleClaim = () => { claim(); };

  // No code provided
  if (!code) {
    return (
      <EmptyState
        title="No Code Provided"
        description="Enter a claim code to redeem your in-game item."
        action={{ label: 'Back to Marketplace', onClick: () => router.push('/marketplace') }}
      />
    );
  }

  // Code invalid or already claimed
  const foundCode = MOCK_CLAIM_CODES.find((c) => c.code === code);
  if (validated && (!foundCode || foundCode.claimedAt)) {
    return (
      <div className="max-w-md mx-auto mt-20">
        <div className="bg-white border-3 border-[#1E2044] rounded-2xl p-8 shadow-[4px_4px_0px_0px_var(--color-border-dark)] text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="font-display font-black text-xl uppercase tracking-tight text-[#1E2044] mb-2">
            {!foundCode ? 'Invalid Code' : 'Already Claimed'}
          </h2>
          <p className="font-sans text-sm text-[#1E2044]/60 mb-6">
            {!foundCode
              ? 'This claim code does not exist or has expired.'
              : `This code was claimed on ${new Date(foundCode.claimedAt!).toLocaleDateString()}.`}
          </p>
          <button
            onClick={() => router.push('/marketplace')}
            className="px-6 py-3 bg-blueberry text-white border-3 border-[#1E2044] font-display font-black rounded-xl shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all uppercase text-sm cursor-pointer"
          >
            Browse Marketplace
          </button>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!isLoggedIn) {
    return (
      <EmptyState
        title="Connect Wallet"
        description="Connect your wallet to claim this item."
        action={{ label: 'Go to Landing', onClick: () => router.push('/') }}
      />
    );
  }

  // Claim flow states
  return (
    <div className="max-w-md mx-auto mt-20">
      <div className="bg-white border-3 border-[#1E2044] rounded-2xl p-8 shadow-[4px_4px_0px_0px_var(--color-border-dark)] text-center">
        {state === 'idle' && (
          <>
            <div className="w-16 h-16 rounded-2xl border-3 border-dashed border-[#1E2044]/20 bg-blueberry-cream/50 flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect x="2" y="2" width="28" height="28" rx="6" stroke="#1E2044" strokeWidth="2.5" strokeDasharray="5 3" />
                <circle cx="16" cy="16" r="5" fill="#5A60D3" fillOpacity="0.2" />
              </svg>
            </div>
            <h2 className="font-display font-black text-xl uppercase tracking-tight text-[#1E2044] mb-2">
              {foundCode?.itemTemplate.name}
            </h2>
            <p className="font-sans text-sm text-[#1E2044]/60 mb-2">from {foundCode?.gameName}</p>
            <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-blueberry-dark block mb-6">
              Code: {code}
            </span>
            <button
              onClick={handleClaim}
              className="px-8 py-4 bg-blueberry text-white border-3 border-[#1E2044] font-display font-black rounded-xl shadow-[4px_4px_0px_0px_var(--color-border-dark)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_var(--color-border-dark)] transition-all uppercase text-sm cursor-pointer"
            >
              Claim Item
            </button>
          </>
        )}

        {state === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 text-blueberry animate-spin mx-auto mb-4" />
            <h2 className="font-display font-black text-xl uppercase tracking-tight text-[#1E2044] mb-2">
              Minting to Your Wallet
            </h2>
            <p className="font-sans text-sm text-[#1E2044]/60">
              Please wait while the item is being minted on Sui...
            </p>
          </>
        )}

        {state === 'success' && claimedItem && (
          <>
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="font-display font-black text-xl uppercase tracking-tight text-[#1E2044] mb-2">Claimed!</h2>
            <p className="font-sans text-sm text-[#1E2044]/60 mb-1">{claimedItem.name}</p>
            <p className="font-sans text-sm text-[#1E2044]/60 mb-6">from {claimedItem.gameName}</p>
            <button
              onClick={() => router.push('/inventory')}
              className="px-6 py-3 bg-blueberry text-white border-3 border-[#1E2044] font-display font-black rounded-xl shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all uppercase text-sm cursor-pointer"
            >
              View Inventory
            </button>
          </>
        )}

        {state === 'error' && (
          <>
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="font-display font-black text-xl uppercase tracking-tight text-[#1E2044] mb-2">Claim Failed</h2>
            <p className="font-sans text-sm text-[#1E2044]/60 mb-6">
              {errorMessage ?? 'Something went wrong. Please try again.'}
            </p>
            <button
              onClick={handleClaim}
              className="px-6 py-3 bg-blueberry text-white border-3 border-[#1E2044] font-display font-black rounded-xl shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all uppercase text-sm cursor-pointer"
            >
              Retry
            </button>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(hub)/claim/page.tsx"
git commit -m "feat: add Hub Claim page"
```

---

### Task 24: History page `app/(hub)/history/page.tsx`

**Files:**
- Create: `application/app/(hub)/history/page.tsx`

- [ ] **Step 1: Write History page**

```tsx
'use client';

import React, { useMemo } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { MOCK_TX_EVENTS } from '@/lib/mock-data';
import EmptyState from '@/components/shared/empty-state';
import { Package, Tag, ArrowLeftRight, ShoppingCart, Gift, FileText, ExternalLink } from 'lucide-react';

const EVENT_ICONS: Record<string, React.ReactNode> = {
  ItemMinted: <Package className="w-4 h-4" />,
  ItemSold: <ShoppingCart className="w-4 h-4" />,
  ItemListed: <Tag className="w-4 h-4" />,
  EscrowCreated: <FileText className="w-4 h-4" />,
  EscrowFulfilled: <ArrowLeftRight className="w-4 h-4" />,
  ItemClaimed: <Gift className="w-4 h-4" />,
};

const EVENT_COLORS: Record<string, string> = {
  ItemMinted: 'bg-purple-100 text-purple-700 border-purple-300',
  ItemSold: 'bg-green-100 text-green-700 border-green-300',
  ItemListed: 'bg-blue-100 text-blue-700 border-blue-300',
  EscrowCreated: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  EscrowFulfilled: 'bg-orange-100 text-orange-700 border-orange-300',
  ItemClaimed: 'bg-pink-100 text-pink-700 border-pink-300',
};

export default function HistoryPage() {
  const { isLoggedIn } = useAuthStore();

  const groupedEvents = useMemo(() => {
    const groups: Record<string, typeof MOCK_TX_EVENTS> = {};
    MOCK_TX_EVENTS.forEach((event) => {
      const date = new Date(event.timestamp).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(event);
    });
    return groups;
  }, []);

  if (!isLoggedIn) {
    return (
      <EmptyState
        title="Connect Wallet"
        description="Connect your wallet to view your transaction history."
        action={{ label: 'Go to Landing', onClick: () => { window.location.href = '/'; } }}
      />
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-[#1E2044]">
          Transaction History
        </h1>
        <p className="font-sans text-sm text-[#1E2044]/60 mt-1">{MOCK_TX_EVENTS.length} events recorded</p>
      </div>

      <div className="relative max-w-2xl">
        <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-[#1E2044]/10" />

        {Object.entries(groupedEvents).map(([date, events]) => (
          <div key={date} className="mb-8">
            <div className="flex items-center gap-4 mb-4 relative">
              <div className="w-10 h-10 rounded-full bg-blueberry border-3 border-[#1E2044] flex items-center justify-center shadow-[2px_2px_0px_0px_var(--color-border-dark)] z-10">
                <span className="w-2 h-2 rounded-full bg-white" />
              </div>
              <h3 className="font-display font-black text-sm uppercase tracking-tight text-[#1E2044]">{date}</h3>
            </div>

            <div className="ml-14 space-y-3">
              {events.map((event) => (
                <div key={event.id} className="bg-white border-3 border-[#1E2044] rounded-xl p-4 shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 shrink-0 rounded-lg border-2 flex items-center justify-center ${EVENT_COLORS[event.eventType] ?? 'bg-gray-100 text-gray-500 border-gray-300'}`}>
                      {EVENT_ICONS[event.eventType] ?? <FileText className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60">{event.eventType}</span>
                        <span className="text-[10px] font-mono text-[#1E2044]/40">{new Date(event.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="font-sans text-sm text-[#1E2044]/80 leading-relaxed">{event.description}</p>
                      {event.txHash && event.txHash !== '-' && (
                        <a href={`https://suiscan.xyz/testnet/tx/${event.txHash}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-[10px] font-mono font-extrabold text-blueberry hover:text-blueberry-dark uppercase tracking-wider transition-colors">
                          <ExternalLink className="w-3 h-3" /> View on Sui Explorer
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(hub)/history/page.tsx"
git commit -m "feat: add Hub History page"
```


---

## Phase 3: Developer Dashboard Pages (10 pages)

All pages use `'use client'`.

### Task 25: Dashboard layout `app/(dashboard)/layout.tsx`

**Files:**
- Create: `application/app/(dashboard)/layout.tsx`

- [ ] **Step 1: Write Dashboard layout**

```tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { MOCK_PUBLISHERS } from '@/lib/mock-data';
import { Swords, BarChart3, Activity, Settings } from 'lucide-react';
import Sidebar from '@/components/shared/sidebar';
import PublisherSwitcher from '@/components/shared/publisher-switcher';
import StatusBadge from '@/components/shared/status-badge';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isLoggedIn, userMode, displayName, activePublisherId, setActivePublisher, login } = useAuthStore();

  // Not logged in as dev
  if (!isLoggedIn || userMode !== 'dev') {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center p-6">
        <div className="bg-white border-3 border-[#1E2044] rounded-2xl shadow-[4px_4px_0px_0px_var(--color-border-dark)] p-8 text-center max-w-md">
          <h1 className="font-display font-black text-xl uppercase tracking-tight text-[#1E2044] mb-3">
            Developer Dashboard
          </h1>
          <p className="font-sans text-sm text-[#1E2044]/60 mb-6">
            Connect as a developer to access your publisher workspace.
          </p>
          <button
            onClick={() => login('dev')}
            className="px-6 py-3 bg-blueberry text-white border-3 border-[#1E2044] font-display font-black rounded-xl shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all uppercase text-sm cursor-pointer"
          >
            Login as Developer
          </button>
        </div>
      </div>
    );
  }

  const activePub = MOCK_PUBLISHERS.find((p) => p.id === activePublisherId);
  const publisherName = activePub?.name ?? 'Unknown Publisher';
  const isVerified = activePub?.isVerified ?? false;

  const sidebarItems = [
    { label: 'Games', href: `/dashboard/${activePublisherId}/games`, icon: <Swords className="w-5 h-5" /> },
    { label: 'Analytics', href: `/dashboard/${activePublisherId}/analytics`, icon: <BarChart3 className="w-5 h-5" /> },
    { label: 'Activity', href: `/dashboard/${activePublisherId}/activity`, icon: <Activity className="w-5 h-5" /> },
    { label: 'Settings', href: `/dashboard/${activePublisherId}/settings`, icon: <Settings className="w-5 h-5" /> },
  ];

  // Determine active path for sidebar highlighting - use client-side pathname
  const [activePath, setActivePath] = React.useState('');
  React.useEffect(() => {
    setActivePath(window.location.pathname);
  }, []);

  return (
    <div className="min-h-screen bg-brand-bg flex">
      {/* Sidebar */}
      <Sidebar
        items={sidebarItems}
        activePath={activePath}
        publisherName={publisherName}
        isVerified={isVerified}
        className="hidden lg:flex"
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Publisher switcher + user info bar */}
        <header className="sticky top-0 z-50 bg-brand-bg/90 backdrop-blur-md border-b-3 border-[#1E2044] px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 max-w-xs">
              <PublisherSwitcher
                publishers={MOCK_PUBLISHERS}
                activeId={activePublisherId ?? ''}
                onSwitch={(id) => setActivePublisher(id)}
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-[10px] font-mono font-bold text-[#1E2044]/60 uppercase">
                {displayName}
              </span>
              <StatusBadge status={isVerified ? 'verified' : 'draft'} />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(dashboard)/layout.tsx"
git commit -m "feat: add Dashboard layout with Sidebar and PublisherSwitcher"
```

---

### Task 26: Dashboard home `app/(dashboard)/page.tsx`

**Files:**
- Create: `application/app/(dashboard)/page.tsx`

- [ ] **Step 1: Write Dashboard home page**

```tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { MOCK_PUBLISHERS, MOCK_GAMES, MOCK_ITEMS, MOCK_PUBLISHER_ACTIVITIES } from '@/lib/mock-data';
import MetricCard from '@/components/shared/metric-card';
import EmptyState from '@/components/shared/empty-state';
import StatusBadge from '@/components/shared/status-badge';

export default function DashboardHomePage() {
  const router = useRouter();
  const { displayName, activePublisherId, setActivePublisher } = useAuthStore();

  if (!activePublisherId) {
    return (
      <EmptyState
        title="No Publishers Yet"
        description="Create your first publisher to start managing games and items."
      />
    );
  }

  const activePub = MOCK_PUBLISHERS.find((p) => p.id === activePublisherId);
  const pubGames = MOCK_GAMES.filter((g) => g.publisherId === activePublisherId);
  const totalItems = MOCK_ITEMS.filter((i) => pubGames.some((g) => g.id === i.gameId)).length;
  const publishedCount = pubGames.filter((g) => g.status === 'published').length;
  const recentActivity = MOCK_PUBLISHER_ACTIVITIES.slice(0, 5);

  return (
    <div>
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-[#1E2044]">
          Welcome back, {displayName ?? 'Dev'}
        </h1>
        <p className="font-sans text-sm text-[#1E2044]/60 mt-1">
          Manage your publishers, games, and cross-game items
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Total Games" value={pubGames.length} />
        <MetricCard label="Published" value={`${publishedCount}/${pubGames.length}`} />
        <MetricCard label="Total Items" value={totalItems} />
        <MetricCard label="Verification" value={activePub?.isVerified ? 'Verified' : 'Pending'} />
      </div>

      {/* Publisher cards */}
      <div className="mb-8">
        <h2 className="font-display font-black text-lg uppercase tracking-tight text-[#1E2044] mb-4">Your Publishers</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOCK_PUBLISHERS.map((pub) => (
            <div
              key={pub.id}
              className="bg-white border-3 border-[#1E2044] rounded-2xl p-5 shadow-[4px_4px_0px_0px_var(--color-border-dark)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_var(--color-border-dark)] transition-all cursor-pointer"
              onClick={() => { setActivePublisher(pub.id); router.push(`/dashboard/${pub.id}/games`); }}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-display font-black text-base uppercase tracking-tight text-[#1E2044]">{pub.name}</h3>
                <StatusBadge status={pub.isVerified ? 'verified' : 'draft'} />
              </div>
              <div className="flex gap-4">
                <div>
                  <span className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60">Games</span>
                  <span className="block font-display font-bold text-lg text-[#1E2044]">{pub.gameCount}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60">Created</span>
                  <span className="block font-mono text-xs text-[#1E2044]/60">{new Date(pub.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div>
        <h2 className="font-display font-black text-lg uppercase tracking-tight text-[#1E2044] mb-4">Recent Activity</h2>
        <div className="bg-white border-3 border-[#1E2044] rounded-2xl shadow-[4px_4px_0px_0px_var(--color-border-dark)] divide-y-2 divide-dashed divide-[#1E2044]/10">
          {recentActivity.map((event) => (
            <div key={event.id} className="p-4 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-blueberry shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-sans text-sm text-[#1E2044]/80">{event.description}</p>
                <p className="text-[10px] font-mono text-[#1E2044]/40 mt-0.5">{new Date(event.timestamp).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(dashboard)/page.tsx"
git commit -m "feat: add Dashboard home page"
```


---

### Task 27: Games manager `app/(dashboard)/[publisher_id]/games/page.tsx`

**Files:**
- Create: `application/app/(dashboard)/[publisher_id]/games/page.tsx`

- [ ] **Step 1: Write Games manager page**

```tsx
'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MOCK_GAMES } from '@/lib/mock-data';
import StatusBadge from '@/components/shared/status-badge';
import EmptyState from '@/components/shared/empty-state';

export default function GamesManagerPage() {
  const params = useParams();
  const router = useRouter();

  const publisherId = typeof params.publisher_id === 'string' ? params.publisher_id : '';
  const games = MOCK_GAMES.filter((g) => g.publisherId === publisherId);

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-[#1E2044]">Games</h1>
          <p className="font-sans text-sm text-[#1E2044]/60 mt-1">{games.length} game{games.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => console.log('Create game')}
          className="px-5 py-3 bg-blueberry text-white border-3 border-[#1E2044] font-display font-black rounded-xl shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all uppercase text-sm cursor-pointer"
        >
          Create Game
        </button>
      </div>

      {games.length === 0 ? (
        <EmptyState title="No Games Yet" description="Create your first game to start designing cross-game items." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {games.map((game) => (
            <div key={game.id} className="bg-white border-3 border-[#1E2044] rounded-2xl p-5 shadow-[4px_4px_0px_0px_var(--color-border-dark)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_var(--color-border-dark)] transition-all">
              <div className="w-full h-40 bg-blueberry-cream/50 rounded-xl border-2 border-[#1E2044]/20 mb-4 flex items-center justify-center">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="4" y="4" width="40" height="40" rx="8" stroke="#1E2044" strokeWidth="2.5" strokeDasharray="5 4" />
                  <path d="M16 24L20 18L22 22L26 14L30 20" stroke="#5A60D3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <StatusBadge status={game.status} className="mb-2" />
              <h3 className="font-display font-black text-lg uppercase tracking-tight text-[#1E2044] mb-1">{game.name}</h3>
              <p className="font-sans text-xs text-[#1E2044]/50 mb-3 leading-relaxed line-clamp-2">{game.description}</p>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60">Items</span>
                  <span className="block font-mono text-sm font-bold text-[#1E2044]">
                    {game.status === 'published' ? game.publishedItemCount : game.draftItemCount}
                    {game.status === 'draft' && <span className="text-[#1E2044]/40 text-xs"> (draft)</span>}
                  </span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60">Created</span>
                  <span className="block font-mono text-xs text-[#1E2044]/60">{new Date(game.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              {game.status === 'draft' ? (
                <button
                  onClick={() => router.push(`/dashboard/${publisherId}/games/${game.id}`)}
                  className="w-full px-4 py-2.5 bg-blueberry text-white border-2 border-[#1E2044] font-display font-black rounded-lg text-xs uppercase shadow-[2px_2px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all cursor-pointer"
                >
                  Continue Editing
                </button>
              ) : (
                <button
                  onClick={() => router.push(`/dashboard/${publisherId}/games/${game.id}`)}
                  className="w-full px-4 py-2.5 bg-white text-[#1E2044] border-2 border-[#1E2044] font-display font-black rounded-lg text-xs uppercase hover:bg-blueberry-cream transition-all cursor-pointer"
                >
                  View Game
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(dashboard)/[publisher_id]/games/page.tsx"
git commit -m "feat: add Dashboard Games manager page"
```

---

### Task 28: Game detail `app/(dashboard)/[publisher_id]/games/[game_id]/page.tsx`

**Files:**
- Create: `application/app/(dashboard)/[publisher_id]/games/[game_id]/page.tsx`

- [ ] **Step 1: Write Game detail page**

```tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MOCK_GAMES, MOCK_ITEMS, MOCK_DRAFT_ITEMS, MOCK_API_KEYS, MOCK_ANALYTICS, MOCK_PUBLISHER_ACTIVITIES } from '@/lib/mock-data';
import { usePublisherStore } from '@/stores/publisher-store';
import StatusBadge from '@/components/shared/status-badge';
import ItemCard from '@/components/shared/item-card';
import MetricCard from '@/components/shared/metric-card';
import ConfirmModal from '@/components/shared/confirm-modal';
import PublishProgressBar from '@/components/shared/publish-progress-bar';
import EmptyState from '@/components/shared/empty-state';

type TabType = 'overview' | 'items' | 'api-keys' | 'analytics' | 'activity';

export default function GameDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isPublishing, publishProgress, setPublishing, setProgress } = usePublisherStore();

  const publisherId = typeof params.publisher_id === 'string' ? params.publisher_id : '';
  const gameId = parseInt(typeof params.game_id === 'string' ? params.game_id : '0', 10);

  const game = MOCK_GAMES.find((g) => g.id === gameId);

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);

  const [name, setName] = useState(game?.name ?? '');
  const [description, setDescription] = useState(game?.description ?? '');
  const [genre, setGenre] = useState(game?.genre ?? '');
  const [websiteUrl, setWebsiteUrl] = useState(game?.websiteUrl ?? '');

  useEffect(() => {
    if (game) {
      setName(game.name); setDescription(game.description ?? ''); setGenre(game.genre ?? ''); setWebsiteUrl(game.websiteUrl ?? '');
    }
  }, [game]);

  if (!game) {
    return (
      <EmptyState
        title="Game Not Found"
        description="This game does not exist or may have been removed."
        action={{ label: 'Back to Games', onClick: () => router.push(`/dashboard/${publisherId}/games`) }}
      />
    );
  }

  const isDraft = game.status === 'draft';
  const isPublished = game.status === 'published';
  const gameItems = [...MOCK_ITEMS, ...MOCK_DRAFT_ITEMS].filter((i) => i.gameId === gameId);

  const handlePublish = () => {
    setShowPublishConfirm(false);
    setPublishing(true);
    setProgress([{ step: 'Upload Assets', done: false }, { step: 'Deploy on-chain', done: false }, { step: 'Done', done: false }]);
    setTimeout(() => setProgress([{ step: 'Upload Assets', done: true }, { step: 'Deploy on-chain', done: false }, { step: 'Done', done: false }]), 1500);
    setTimeout(() => setProgress([{ step: 'Upload Assets', done: true }, { step: 'Deploy on-chain', done: true }, { step: 'Done', done: false }]), 3000);
    setTimeout(() => { setProgress([{ step: 'Upload Assets', done: true }, { step: 'Deploy on-chain', done: true }, { step: 'Done', done: true }]); setPublishing(false); }, 4500);
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <button onClick={() => router.push(`/dashboard/${publisherId}/games`)} className="font-mono text-[10px] font-extrabold uppercase tracking-wider text-blueberry hover:text-blueberry-dark cursor-pointer">
            &larr; Games
          </button>
          {isDraft && (
            <div className="bg-yellow-100 border-2 border-yellow-400 rounded-xl px-4 py-2">
              <p className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-yellow-800">
                This game is in draft mode. Review all items before publishing.
              </p>
            </div>
          )}
          {isPublished && <StatusBadge status="published" />}
        </div>
        <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-[#1E2044]">{game.name}</h1>
      </div>

      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {(['overview', 'items', 'api-keys', 'analytics', 'activity'] as TabType[]).map((tab) => {
          const isDisabled = !isPublished && (tab === 'api-keys' || tab === 'analytics');
          return (
            <button
              key={tab}
              onClick={() => !isDisabled && setActiveTab(tab)}
              className={`px-5 py-2.5 font-display font-black text-xs uppercase rounded-xl border-3 border-[#1E2044] transition-all shrink-0 ${
                isDisabled ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                  : activeTab === tab ? 'bg-blueberry text-white shadow-[3px_3px_0px_0px_var(--color-border-dark)]' : 'bg-white text-[#1E2044] hover:bg-blueberry-cream cursor-pointer'
              }`}
            >
              {tab === 'overview' && 'Overview'}
              {tab === 'items' && `Items (${gameItems.length})`}
              {tab === 'api-keys' && 'API Keys'}
              {tab === 'analytics' && 'Analytics'}
              {tab === 'activity' && 'Activity'}
            </button>
          );
        })}
      </div>

      {isDraft && (
        <div className="mb-6 flex justify-end">
          <button onClick={() => setShowPublishConfirm(true)} disabled={isPublishing}
            className="px-6 py-3 bg-green-500 text-white border-3 border-[#1E2044] font-display font-black rounded-xl shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all uppercase text-sm cursor-pointer disabled:opacity-50">
            {isPublishing ? 'Publishing...' : 'Publish Game'}
          </button>
        </div>
      )}

      {isPublishing && (
        <div className="mb-8 p-6 bg-white border-3 border-[#1E2044] rounded-2xl shadow-[4px_4px_0px_0px_var(--color-border-dark)]">
          <h3 className="font-display font-black text-lg uppercase tracking-tight text-[#1E2044] mb-4">Publishing in Progress</h3>
          <PublishProgressBar
            steps={publishProgress.map((p, i) => ({
              label: p.step,
              status: p.done ? 'done' as const : i === publishProgress.findIndex((s) => !s.done) ? 'active' as const : 'pending' as const,
            }))}
          />
        </div>
      )}

      {activeTab === 'overview' && (
        <div className="bg-white border-3 border-[#1E2044] rounded-2xl p-6 shadow-[4px_4px_0px_0px_var(--color-border-dark)] max-w-2xl">
          <h2 className="font-display font-black text-lg uppercase tracking-tight text-[#1E2044] mb-6">Game Details</h2>
          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60 mb-1.5">Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} disabled={isPublished}
                className="w-full bg-blueberry-cream/10 text-sm font-sans text-[#1E2044] px-4 py-3 border-2 border-[#1E2044] rounded-xl focus:outline-none focus:ring-2 focus:ring-blueberry/25 disabled:opacity-50" />
            </div>
            <div>
              <label className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60 mb-1.5">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} disabled={isPublished} rows={4}
                className="w-full bg-blueberry-cream/10 text-sm font-sans text-[#1E2044] px-4 py-3 border-2 border-[#1E2044] rounded-xl focus:outline-none focus:ring-2 focus:ring-blueberry/25 disabled:opacity-50 resize-none" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60 mb-1.5">Genre</label>
                <input type="text" value={genre} onChange={(e) => setGenre(e.target.value)} disabled={isPublished}
                  className="w-full bg-blueberry-cream/10 text-sm font-sans text-[#1E2044] px-4 py-3 border-2 border-[#1E2044] rounded-xl focus:outline-none focus:ring-2 focus:ring-blueberry/25 disabled:opacity-50" />
              </div>
              <div>
                <label className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60 mb-1.5">Website URL</label>
                <input type="text" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} disabled={isPublished}
                  className="w-full bg-blueberry-cream/10 text-sm font-sans text-[#1E2044] px-4 py-3 border-2 border-[#1E2044] rounded-xl focus:outline-none focus:ring-2 focus:ring-blueberry/25 disabled:opacity-50" />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'items' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-black text-lg uppercase tracking-tight text-[#1E2044]">Items</h2>
            <button onClick={() => router.push(`/dashboard/${publisherId}/games/${gameId}/items`)}
              className="px-5 py-2.5 bg-blueberry text-white border-3 border-[#1E2044] font-display font-black rounded-xl shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all uppercase text-xs cursor-pointer">
              Manage Items
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {gameItems.map((item) => (
              <ItemCard key={item.id} item={{ name: item.name, gameName: item.gameName, itemType: item.itemType, rarity: item.rarity, imageUrl: item.imageUrl, status: item.status }}
                onClick={() => router.push(`/dashboard/${publisherId}/games/${gameId}/items/${item.id}`)} />
            ))}
          </div>
          {gameItems.length === 0 && <EmptyState title="No Items" description="Create your first item for this game." />}
        </div>
      )}

      {activeTab === 'api-keys' && isPublished && (
        <div>
          <h2 className="font-display font-black text-lg uppercase tracking-tight text-[#1E2044] mb-4">API Keys</h2>
          <div className="bg-white border-3 border-[#1E2044] rounded-2xl shadow-[4px_4px_0px_0px_var(--color-border-dark)] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-[#1E2044]/20 bg-blueberry-cream/30">
                  <th className="px-4 py-3 text-left text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60">Key</th>
                  <th className="px-4 py-3 text-left text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60">Status</th>
                  <th className="px-4 py-3 text-left text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60">Last Used</th>
                  <th className="px-4 py-3 text-left text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60">Created</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_API_KEYS.map((key) => (
                  <tr key={key.id} className="border-b border-[#1E2044]/10 last:border-b-0">
                    <td className="px-4 py-3 font-mono text-xs text-[#1E2044]">{key.prefix}</td>
                    <td className="px-4 py-3"><StatusBadge status={key.isActive ? 'published' : 'paused'} /></td>
                    <td className="px-4 py-3 text-xs font-mono text-[#1E2044]/60">{key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : '---'}</td>
                    <td className="px-4 py-3 text-xs font-mono text-[#1E2044]/60">{new Date(key.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={() => router.push(`/dashboard/${publisherId}/games/${gameId}/api-keys`)}
            className="mt-4 px-5 py-2.5 bg-blueberry text-white border-3 border-[#1E2044] font-display font-black rounded-xl shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all uppercase text-xs cursor-pointer">
            Manage API Keys
          </button>
        </div>
      )}

      {activeTab === 'analytics' && isPublished && (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <MetricCard label="Total Minted" value={MOCK_ANALYTICS.totalMinted} />
            <MetricCard label="Claimed" value={MOCK_ANALYTICS.totalClaimed} />
            <MetricCard label="Active Players" value={MOCK_ANALYTICS.activePlayers} />
            <MetricCard label="Tx Volume" value={`${MOCK_ANALYTICS.txVolume} SUI`} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border-3 border-[#1E2044] rounded-2xl p-6 shadow-[4px_4px_0px_0px_var(--color-border-dark)]">
              <h3 className="font-display font-black text-sm uppercase tracking-tight text-[#1E2044] mb-4">Items Minted Over Time</h3>
              <div className="h-48 bg-blueberry-cream/30 rounded-xl border-2 border-dashed border-[#1E2044]/20 flex items-center justify-center">
                <span className="text-xs font-mono text-[#1E2044]/40 uppercase">Chart Placeholder</span>
              </div>
            </div>
            <div className="bg-white border-3 border-[#1E2044] rounded-2xl p-6 shadow-[4px_4px_0px_0px_var(--color-border-dark)]">
              <h3 className="font-display font-black text-sm uppercase tracking-tight text-[#1E2044] mb-4">Claims Over Time</h3>
              <div className="h-48 bg-blueberry-cream/30 rounded-xl border-2 border-dashed border-[#1E2044]/20 flex items-center justify-center">
                <span className="text-xs font-mono text-[#1E2044]/40 uppercase">Chart Placeholder</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div>
          <h2 className="font-display font-black text-lg uppercase tracking-tight text-[#1E2044] mb-4">Activity</h2>
          <div className="bg-white border-3 border-[#1E2044] rounded-2xl shadow-[4px_4px_0px_0px_var(--color-border-dark)] divide-y-2 divide-dashed divide-[#1E2044]/10">
            {MOCK_PUBLISHER_ACTIVITIES.map((event) => (
              <div key={event.id} className="p-4 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blueberry shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-sm text-[#1E2044]/80">{event.description}</p>
                  <p className="text-[10px] font-mono text-[#1E2044]/40 mt-0.5">{new Date(event.timestamp).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmModal isOpen={showPublishConfirm} title="Publish Game"
        message="Are you sure you want to publish this game? This action will deploy the game on-chain and lock item configurations."
        confirmLabel="Publish Now" onConfirm={handlePublish} onCancel={() => setShowPublishConfirm(false)} />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(dashboard)/[publisher_id]/games/[game_id]/page.tsx"
git commit -m "feat: add Dashboard Game detail page with tabs"
```


---

### Task 29: API Keys page `app/(dashboard)/[publisher_id]/games/[game_id]/api-keys/page.tsx`

**Files:**
- Create: `application/app/(dashboard)/[publisher_id]/games/[game_id]/api-keys/page.tsx`

- [ ] **Step 1: Write API Keys page**

```tsx
'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MOCK_API_KEYS } from '@/lib/mock-data';
import StatusBadge from '@/components/shared/status-badge';
import ConfirmModal from '@/components/shared/confirm-modal';
import { Copy, Key } from 'lucide-react';

export default function ApiKeysPage() {
  const params = useParams();
  const router = useRouter();
  const [keys, setKeys] = useState(MOCK_API_KEYS);
  const [showGeneratedKey, setShowGeneratedKey] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<number | null>(null);

  const publisherId = typeof params.publisher_id === 'string' ? params.publisher_id : '';
  const gameId = typeof params.game_id === 'string' ? params.game_id : '';

  const handleGenerate = () => { setShowGeneratedKey('morita_sk_live_9x8y7z6w5v4u3t2s1'); };

  const handleCopy = (text: string) => { navigator.clipboard.writeText(text); console.log('Copied:', text); };

  const handleRevoke = () => {
    if (revokeTarget !== null) {
      setKeys((prev) => prev.map((k) => (k.id === revokeTarget ? { ...k, isActive: false } : k)));
      setRevokeTarget(null);
    }
  };

  return (
    <div className="max-w-4xl">
      <button onClick={() => router.push(`/dashboard/${publisherId}/games/${gameId}`)}
        className="font-mono text-[10px] font-extrabold uppercase tracking-wider text-blueberry hover:text-blueberry-dark mb-6 cursor-pointer">
        &larr; Back to Game
      </button>

      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-[#1E2044]">API Keys</h1>
        <button onClick={handleGenerate}
          className="px-5 py-3 bg-blueberry text-white border-3 border-[#1E2044] font-display font-black rounded-xl shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all uppercase text-sm cursor-pointer">
          Generate New Key
        </button>
      </div>

      {showGeneratedKey && (
        <div className="mb-6 p-5 bg-yellow-100 border-3 border-yellow-400 rounded-2xl shadow-[4px_4px_0px_0px_var(--color-border-dark)]">
          <div className="flex items-center gap-2 mb-2">
            <Key className="w-5 h-5 text-yellow-700" />
            <span className="font-display font-black text-sm uppercase text-yellow-800">New API Key Created</span>
          </div>
          <p className="font-sans text-xs text-yellow-700 mb-3">Copy this key now. You will not be able to see it again.</p>
          <div className="flex items-center gap-3">
            <code className="flex-1 bg-white border-2 border-yellow-400 rounded-lg px-3 py-2 font-mono text-xs text-[#1E2044] break-all">{showGeneratedKey}</code>
            <button onClick={() => handleCopy(showGeneratedKey)}
              className="shrink-0 px-3 py-2 bg-white border-2 border-[#1E2044] rounded-lg font-mono text-[10px] font-black uppercase hover:bg-blueberry-cream transition-all cursor-pointer">
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border-3 border-[#1E2044] rounded-2xl shadow-[4px_4px_0px_0px_var(--color-border-dark)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#1E2044]/20 bg-blueberry-cream/30">
              <th className="px-4 py-3 text-left text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60">API Key</th>
              <th className="px-4 py-3 text-left text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60">Status</th>
              <th className="px-4 py-3 text-left text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60">Last Used</th>
              <th className="px-4 py-3 text-left text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60">Created</th>
              <th className="px-4 py-3 text-left text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60">Actions</th>
            </tr>
          </thead>
          <tbody>
            {keys.map((key) => (
              <tr key={key.id} className="border-b border-[#1E2044]/10 last:border-b-0">
                <td className="px-4 py-3"><code className="font-mono text-xs text-[#1E2044]">{key.prefix}</code></td>
                <td className="px-4 py-3"><StatusBadge status={key.isActive ? 'published' : 'paused'} /></td>
                <td className="px-4 py-3 text-xs font-mono text-[#1E2044]/60">{key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : '---'}</td>
                <td className="px-4 py-3 text-xs font-mono text-[#1E2044]/60">{new Date(key.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  {key.isActive ? (
                    <button onClick={() => setRevokeTarget(key.id)}
                      className="px-3 py-1.5 bg-red-100 text-red-600 border border-red-300 rounded-lg text-[10px] font-mono font-extrabold uppercase tracking-wider hover:bg-red-200 transition-all cursor-pointer">Revoke</button>
                  ) : (
                    <span className="text-[10px] font-mono text-[#1E2044]/30 uppercase tracking-wider">Revoked</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        isOpen={revokeTarget !== null}
        title="Revoke API Key"
        message="Are you sure you want to revoke this API key? Any integration using this key will stop working immediately."
        confirmLabel="Yes, Revoke" variant="danger"
        onConfirm={handleRevoke} onCancel={() => setRevokeTarget(null)} />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(dashboard)/[publisher_id]/games/[game_id]/api-keys/page.tsx"
git commit -m "feat: add Dashboard API Keys page"
```

---

### Task 30: Items list page `app/(dashboard)/[publisher_id]/games/[game_id]/items/page.tsx`

**Files:**
- Create: `application/app/(dashboard)/[publisher_id]/games/[game_id]/items/page.tsx`

- [ ] **Step 1: Write Items list page**

```tsx
'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MOCK_ITEMS, MOCK_DRAFT_ITEMS } from '@/lib/mock-data';
import ItemCard from '@/components/shared/item-card';
import FilterBar from '@/components/shared/filter-bar';
import EmptyState from '@/components/shared/empty-state';

export default function ItemsListPage() {
  const params = useParams();
  const router = useRouter();

  const publisherId = typeof params.publisher_id === 'string' ? params.publisher_id : '';
  const gameId = parseInt(typeof params.game_id === 'string' ? params.game_id : '0', 10);

  const allItems = [...MOCK_ITEMS, ...MOCK_DRAFT_ITEMS].filter((i) => i.gameId === gameId);

  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [rarityFilter, setRarityFilter] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const filteredItems = allItems
    .filter((i) => {
      if (statusFilter && statusFilter !== 'all' && i.status !== statusFilter) return false;
      return true;
    })
    .filter((i) => {
      if (typeFilter && i.itemType !== typeFilter) return false;
      return true;
    })
    .filter((i) => {
      if (rarityFilter && i.rarity !== rarityFilter) return false;
      return true;
    })
    .filter((i) => {
      if (searchValue) {
        const q = searchValue.toLowerCase();
        return i.name.toLowerCase().includes(q) || i.itemType.toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });

  const uniqueTypes = [...new Set(allItems.map((i) => i.itemType))];
  const uniqueRarities = [...new Set(allItems.map((i) => i.rarity))];

  return (
    <div>
      <button onClick={() => router.push(`/dashboard/${publisherId}/games/${gameId}`)}
        className="font-mono text-[10px] font-extrabold uppercase tracking-wider text-blueberry hover:text-blueberry-dark mb-6 cursor-pointer">
        &larr; Back to Game
      </button>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-[#1E2044]">Items</h1>
        <button onClick={() => { console.log('Create item'); router.push(`/dashboard/${publisherId}/games/${gameId}/items/draft-new`); }}
          className="px-5 py-3 bg-blueberry text-white border-3 border-[#1E2044] font-display font-black rounded-xl shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all uppercase text-sm cursor-pointer">
          Create Item
        </button>
      </div>

      <FilterBar
        filters={[
          { label: 'Status', key: 'status', options: [{ label: 'All', value: 'all' }, { label: 'Draft', value: 'draft' }, { label: 'Published', value: 'published' }], value: statusFilter, onChange: setStatusFilter },
          { label: 'Type', key: 'type', options: uniqueTypes.map((t) => ({ label: t, value: t })), value: typeFilter, onChange: setTypeFilter },
          { label: 'Rarity', key: 'rarity', options: uniqueRarities.map((r) => ({ label: r, value: r })), value: rarityFilter, onChange: setRarityFilter },
        ]}
        sortBy={sortBy}
        sortOptions={[{ label: 'Newest', value: 'newest' }, { label: 'Name', value: 'name' }]}
        onSortChange={setSortBy}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        searchPlaceholder="Search items..."
        className="mb-6"
      />

      {filteredItems.length === 0 ? (
        <EmptyState title="No Items Found" description="No items match your current filters. Try adjusting them." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredItems.map((item) => (
            <ItemCard key={item.id}
              item={{ name: item.name, gameName: item.gameName, itemType: item.itemType, rarity: item.rarity, imageUrl: item.imageUrl, status: item.status }}
              onClick={() => router.push(`/dashboard/${publisherId}/games/${gameId}/items/${item.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(dashboard)/[publisher_id]/games/[game_id]/items/page.tsx"
git commit -m "feat: add Dashboard Items list page"
```

---

### Task 31: Item detail page `app/(dashboard)/[publisher_id]/games/[game_id]/items/[item_id]/page.tsx`

**Files:**
- Create: `application/app/(dashboard)/[publisher_id]/games/[game_id]/items/[item_id]/page.tsx`

- [ ] **Step 1: Write Item detail page**

```tsx
'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MOCK_ITEMS, MOCK_DRAFT_ITEMS } from '@/lib/mock-data';
import ItemDetail from '@/components/shared/item-detail';
import ConfirmModal from '@/components/shared/confirm-modal';
import EmptyState from '@/components/shared/empty-state';
import StatusBadge from '@/components/shared/status-badge';
import { Plus, Trash2 } from 'lucide-react';

export default function ItemDetailPage() {
  const params = useParams();
  const router = useRouter();

  const publisherId = typeof params.publisher_id === 'string' ? params.publisher_id : '';
  const gameId = typeof params.game_id === 'string' ? params.game_id : '';
  const itemId = typeof params.item_id === 'string' ? params.item_id : '';

  const allItems = [...MOCK_ITEMS, ...MOCK_DRAFT_ITEMS];
  const item = allItems.find((i) => i.id === itemId);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Draft form state
  const [name, setName] = useState(item?.name ?? '');
  const [itemType, setItemType] = useState(item?.itemType ?? '');
  const [rarity, setRarity] = useState(item?.rarity ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [isNft, setIsNft] = useState(item?.isNft ?? true);
  const [supply, setSupply] = useState(item?.supply ?? 1);
  const [attributes, setAttributes] = useState<[string, string][]>(
    item?.attributes ? Object.entries(item.attributes) : [],
  );

  if (!item) {
    return (
      <EmptyState title="Item Not Found"
        description="This item does not exist or may have been removed."
        action={{ label: 'Back to Items', onClick: () => router.push(`/dashboard/${publisherId}/games/${gameId}/items`) }} />
    );
  }

  const isDraft = item.status === 'draft';
  const isPublished = item.status === 'published';

  const addAttribute = () => { setAttributes((prev) => [...prev, ['', '']]); };
  const removeAttribute = (idx: number) => { setAttributes((prev) => prev.filter((_, i) => i !== idx)); };
  const updateAttribute = (idx: number, key: string, value: string) => {
    setAttributes((prev) => { const next = [...prev]; next[idx] = [key, value]; return next; });
  };

  return (
    <div className="max-w-4xl">
      <button onClick={() => router.push(`/dashboard/${publisherId}/games/${gameId}/items`)}
        className="font-mono text-[10px] font-extrabold uppercase tracking-wider text-blueberry hover:text-blueberry-dark mb-6 cursor-pointer">
        &larr; Items
      </button>

      {/* Status banner */}
      {isPublished && (
        <div className="mb-6 p-4 bg-blueberry-cream border-2 border-blueberry/30 rounded-xl flex items-center gap-2">
          <StatusBadge status="published" />
          <span className="text-xs font-mono font-bold text-blueberry-dark uppercase">Published — Immutable</span>
        </div>
      )}

      {isPublished ? (
        /* Read-only ItemDetail view */
        <ItemDetail
          item={{
            name: item.name, gameName: item.gameName, itemType: item.itemType, rarity: item.rarity,
            description: item.description, imageUrl: item.imageUrl, suiItemId: item.suiItemId,
            supply: item.supply, isNft: item.isNft, attributes: item.attributes, status: item.status,
          }}
        >
          {/* Stats row */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-blueberry-cream/50 border-2 border-[#1E2044]/10 rounded-xl p-4 text-center">
              <span className="block font-display font-black text-2xl text-[#1E2044]">---</span>
              <span className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60 mt-1">Total Minted</span>
            </div>
            <div className="bg-blueberry-cream/50 border-2 border-[#1E2044]/10 rounded-xl p-4 text-center">
              <span className="block font-display font-black text-2xl text-[#1E2044]">---</span>
              <span className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60 mt-1">Claimed</span>
            </div>
            <div className="bg-blueberry-cream/50 border-2 border-[#1E2044]/10 rounded-xl p-4 text-center">
              <span className="block font-display font-black text-2xl text-[#1E2044]">---</span>
              <span className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60 mt-1">Circulation</span>
            </div>
          </div>
        </ItemDetail>
      ) : (
        /* Draft edit form */
        <div className="bg-white border-3 border-[#1E2044] rounded-2xl shadow-[4px_4px_0px_0px_var(--color-border-dark)] overflow-hidden">
          <div className="w-full h-48 bg-blueberry-cream/50 border-b-3 border-[#1E2044] flex items-center justify-center cursor-pointer">
            <div className="text-center">
              <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="4" width="48" height="48" rx="8" stroke="#1E2044" strokeWidth="2.5" strokeDasharray="6 4" />
                <path d="M28 22V34M22 28H34" stroke="#5A60D3" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              <p className="text-[10px] font-mono text-[#1E2044]/40 uppercase tracking-wider mt-3">Upload Image</p>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-5">
            <h2 className="font-display font-black text-lg uppercase tracking-tight text-[#1E2044] mb-4">Edit Item Draft</h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60 mb-1.5">Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full bg-blueberry-cream/10 text-sm font-sans text-[#1E2044] px-4 py-3 border-2 border-[#1E2044] rounded-xl focus:outline-none focus:ring-2 focus:ring-blueberry/25" />
              </div>
              <div>
                <label className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60 mb-1.5">Type</label>
                <input type="text" value={itemType} onChange={(e) => setItemType(e.target.value)}
                  className="w-full bg-blueberry-cream/10 text-sm font-sans text-[#1E2044] px-4 py-3 border-2 border-[#1E2044] rounded-xl focus:outline-none focus:ring-2 focus:ring-blueberry/25" />
              </div>
              <div>
                <label className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60 mb-1.5">Rarity</label>
                <input type="text" value={rarity} onChange={(e) => setRarity(e.target.value)}
                  className="w-full bg-blueberry-cream/10 text-sm font-sans text-[#1E2044] px-4 py-3 border-2 border-[#1E2044] rounded-xl focus:outline-none focus:ring-2 focus:ring-blueberry/25" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60 mb-1.5">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                className="w-full bg-blueberry-cream/10 text-sm font-sans text-[#1E2044] px-4 py-3 border-2 border-[#1E2044] rounded-xl focus:outline-none focus:ring-2 focus:ring-blueberry/25 resize-none" />
            </div>

            {/* Supply toggle */}
            <div>
              <label className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60 mb-2">Supply Type</label>
              <div className="flex gap-3">
                <button onClick={() => setIsNft(true)}
                  className={`px-4 py-2.5 font-display font-black text-xs uppercase rounded-xl border-3 transition-all cursor-pointer ${
                    isNft ? 'bg-blueberry text-white border-[#1E2044] shadow-[3px_3px_0px_0px_var(--color-border-dark)]' : 'bg-white text-[#1E2044] border-[#1E2044]/30'
                  }`}>Unique (NFT)</button>
                <button onClick={() => setIsNft(false)}
                  className={`px-4 py-2.5 font-display font-black text-xs uppercase rounded-xl border-3 transition-all cursor-pointer ${
                    !isNft ? 'bg-blueberry text-white border-[#1E2044] shadow-[3px_3px_0px_0px_var(--color-border-dark)]' : 'bg-white text-[#1E2044] border-[#1E2044]/30'
                  }`}>Multiple Copies</button>
              </div>
              {!isNft && (
                <div className="mt-3 max-w-[200px]">
                  <label className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60 mb-1.5">Count</label>
                  <input type="number" value={supply} min={1} onChange={(e) => setSupply(parseInt(e.target.value) || 1)}
                    className="w-full bg-blueberry-cream/10 text-sm font-sans text-[#1E2044] px-4 py-3 border-2 border-[#1E2044] rounded-xl focus:outline-none focus:ring-2 focus:ring-blueberry/25" />
                </div>
              )}
            </div>

            {/* Dynamic attributes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60">Attributes</label>
                <button onClick={addAttribute}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-blueberry-cream border-2 border-blueberry/30 rounded-lg text-[10px] font-mono font-extrabold uppercase text-blueberry-dark hover:bg-blueberry-cream/80 transition-all cursor-pointer">
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>
              {attributes.length === 0 ? (
                <p className="text-xs font-mono text-[#1E2044]/30 uppercase">No attributes defined</p>
              ) : (
                <div className="space-y-2">
                  {attributes.map(([key, value], idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input type="text" value={key} onChange={(e) => updateAttribute(idx, e.target.value, value)}
                        placeholder="Key" className="flex-1 bg-blueberry-cream/10 text-xs font-mono font-bold text-[#1E2044] px-3 py-2 border-2 border-[#1E2044]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blueberry/25" />
                      <input type="text" value={value} onChange={(e) => updateAttribute(idx, key, e.target.value)}
                        placeholder="Value" className="flex-1 bg-blueberry-cream/10 text-xs font-mono font-bold text-[#1E2044] px-3 py-2 border-2 border-[#1E2044]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blueberry/25" />
                      <button onClick={() => removeAttribute(idx)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t-2 border-dashed border-[#1E2044]/15">
              <button onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2.5 bg-white text-red-500 border-2 border-red-300 font-display font-black rounded-lg text-xs uppercase hover:bg-red-50 transition-all cursor-pointer">
                Delete Draft
              </button>
              <button onClick={() => console.log('Save draft:', { name, itemType, rarity, description, isNft, supply, attributes })}
                className="px-6 py-3 bg-blueberry text-white border-3 border-[#1E2044] font-display font-black rounded-xl shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all uppercase text-sm cursor-pointer">
                Save Draft
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Item Draft"
        message="Are you sure you want to delete this item draft? This action cannot be undone."
        confirmLabel="Delete" variant="danger"
        onConfirm={() => { console.log('Delete:', itemId); setShowDeleteConfirm(false); router.push(`/dashboard/${publisherId}/games/${gameId}/items`); }}
        onCancel={() => setShowDeleteConfirm(false)} />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(dashboard)/[publisher_id]/games/[game_id]/items/[item_id]/page.tsx"
git commit -m "feat: add Dashboard Item detail/edit page"
```


---

### Task 32: Analytics page `app/(dashboard)/[publisher_id]/analytics/page.tsx`

**Files:**
- Create: `application/app/(dashboard)/[publisher_id]/analytics/page.tsx`

- [ ] **Step 1: Write Analytics page**

```tsx
'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { MOCK_ANALYTICS, MOCK_GAMES } from '@/lib/mock-data';
import MetricCard from '@/components/shared/metric-card';

type TimeRange = '7d' | '30d' | 'all';

export default function AnalyticsPage() {
  const params = useParams();
  const publisherId = typeof params.publisher_id === 'string' ? params.publisher_id : '';

  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const pubGames = MOCK_GAMES.filter((g) => g.publisherId === publisherId);

  return (
    <div>
      <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-[#1E2044] mb-6">Analytics</h1>

      {/* Time range filter */}
      <div className="flex gap-2 mb-8">
        {(['7d', '30d', 'all'] as TimeRange[]).map((range) => (
          <button key={range}
            onClick={() => setTimeRange(range)}
            className={`px-5 py-2.5 font-display font-black text-xs uppercase rounded-xl border-3 border-[#1E2044] transition-all cursor-pointer ${
              timeRange === range
                ? 'bg-blueberry text-white shadow-[3px_3px_0px_0px_var(--color-border-dark)]'
                : 'bg-white text-[#1E2044] hover:bg-blueberry-cream'
            }`}
          >
            {range}
          </button>
        ))}
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Total Minted" value={MOCK_ANALYTICS.totalMinted} delta="+12%"/>
        <MetricCard label="Total Claimed" value={MOCK_ANALYTICS.totalClaimed} delta="+8%"/>
        <MetricCard label="Active Players" value={MOCK_ANALYTICS.activePlayers} delta="+24%"/>
        <MetricCard label="Tx Volume" value={`${MOCK_ANALYTICS.txVolume} SUI`} delta="+15%"/>
      </div>

      {/* Chart areas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border-3 border-[#1E2044] rounded-2xl p-6 shadow-[4px_4px_0px_0px_var(--color-border-dark)]">
          <h3 className="font-display font-black text-sm uppercase tracking-tight text-[#1E2044] mb-4">Items Minted Over Time</h3>
          <div className="h-64 bg-blueberry-cream/30 rounded-xl border-2 border-dashed border-[#1E2044]/20 flex items-center justify-center">
            <span className="text-xs font-mono text-[#1E2044]/40 uppercase">Line Chart Placeholder</span>
          </div>
        </div>
        <div className="bg-white border-3 border-[#1E2044] rounded-2xl p-6 shadow-[4px_4px_0px_0px_var(--color-border-dark)]">
          <h3 className="font-display font-black text-sm uppercase tracking-tight text-[#1E2044] mb-4">Claims Over Time</h3>
          <div className="h-64 bg-blueberry-cream/30 rounded-xl border-2 border-dashed border-[#1E2044]/20 flex items-center justify-center">
            <span className="text-xs font-mono text-[#1E2044]/40 uppercase">Bar Chart Placeholder</span>
          </div>
        </div>
      </div>

      {/* Per-game breakdown */}
      <div>
        <h3 className="font-display font-black text-lg uppercase tracking-tight text-[#1E2044] mb-4">Per-Game Breakdown</h3>
        <div className="bg-white border-3 border-[#1E2044] rounded-2xl shadow-[4px_4px_0px_0px_var(--color-border-dark)] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-[#1E2044]/20 bg-blueberry-cream/30">
                <th className="px-4 py-3 text-left text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60">Game</th>
                <th className="px-4 py-3 text-left text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60">Status</th>
                <th className="px-4 py-3 text-left text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60">Items</th>
                <th className="px-4 py-3 text-left text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60">Claim Rate</th>
              </tr>
            </thead>
            <tbody>
              {pubGames.map((game) => (
                <tr key={game.id} className="border-b border-[#1E2044]/10 last:border-b-0">
                  <td className="px-4 py-3 font-display font-bold text-sm text-[#1E2044] uppercase">{game.name}</td>
                  <td className="px-4 py-3 text-xs font-mono font-extrabold uppercase text-[#1E2044]/60">{game.status}</td>
                  <td className="px-4 py-3 font-mono text-sm text-[#1E2044]">{game.itemCount}</td>
                  <td className="px-4 py-3 font-mono text-sm text-blueberry font-bold">{MOCK_ANALYTICS.claimConversionRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(dashboard)/[publisher_id]/analytics/page.tsx"
git commit -m "feat: add Dashboard Analytics page"
```

---

### Task 33: Activity log page `app/(dashboard)/[publisher_id]/activity/page.tsx`

**Files:**
- Create: `application/app/(dashboard)/[publisher_id]/activity/page.tsx`

- [ ] **Step 1: Write Activity log page**

```tsx
'use client';

import React, { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { MOCK_PUBLISHER_ACTIVITIES } from '@/lib/mock-data';
import FilterBar from '@/components/shared/filter-bar';
import { Package, Tag, Gift, Box } from 'lucide-react';

const EVENT_ICONS: Record<string, React.ReactNode> = {
  ItemMinted: <Package className="w-4 h-4" />,
  ItemListed: <Tag className="w-4 h-4" />,
  ItemClaimed: <Gift className="w-4 h-4" />,
  GameCreated: <Box className="w-4 h-4" />,
  GamePublished: <Box className="w-4 h-4" />,
};

export default function ActivityLogPage() {
  const params = useParams();
  const publisherId = typeof params.publisher_id === 'string' ? params.publisher_id : '';

  const [eventTypeFilter, setEventTypeFilter] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const uniqueEventTypes = [...new Set(MOCK_PUBLISHER_ACTIVITIES.map((e) => e.eventType))];

  const filteredEvents = useMemo(() => {
    return MOCK_PUBLISHER_ACTIVITIES
      .filter((e) => {
        if (eventTypeFilter && e.eventType !== eventTypeFilter) return false;
        return true;
      })
      .filter((e) => {
        if (searchValue) {
          const q = searchValue.toLowerCase();
          return e.description.toLowerCase().includes(q) || e.eventType.toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      });
  }, [eventTypeFilter, searchValue, sortBy]);

  return (
    <div>
      <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-[#1E2044] mb-6">Activity Log</h1>

      <FilterBar
        filters={[
          {
            label: 'Event Type',
            key: 'eventType',
            options: uniqueEventTypes.map((t) => ({ label: t, value: t })),
            value: eventTypeFilter,
            onChange: setEventTypeFilter,
          },
        ]}
        sortBy={sortBy}
        sortOptions={[{ label: 'Newest', value: 'newest' }, { label: 'Oldest', value: 'oldest' }]}
        onSortChange={setSortBy}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        searchPlaceholder="Search by address or item name..."
        className="mb-6"
      />

      <div className="bg-white border-3 border-[#1E2044] rounded-2xl shadow-[4px_4px_0px_0px_var(--color-border-dark)] divide-y-2 divide-dashed divide-[#1E2044]/10">
        {filteredEvents.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-mono text-[#1E2044]/40 uppercase">No events match your filters</p>
          </div>
        ) : (
          filteredEvents.map((event) => (
            <div key={event.id} className="p-4 flex items-center gap-3">
              <div className="w-8 h-8 shrink-0 rounded-lg border-2 border-[#1E2044]/20 bg-blueberry-cream/50 flex items-center justify-center text-blueberry-dark">
                {EVENT_ICONS[event.eventType] ?? <Box className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60">{event.eventType}</span>
                </div>
                <p className="font-sans text-sm text-[#1E2044]/80">{event.description}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] font-mono text-[#1E2044]/40">
                  {new Date(event.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <br />
                <span className="text-[10px] font-mono text-[#1E2044]/30">
                  {new Date(event.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(dashboard)/[publisher_id]/activity/page.tsx"
git commit -m "feat: add Dashboard Activity log page"
```

---

### Task 34: Settings page `app/(dashboard)/[publisher_id]/settings/page.tsx`

**Files:**
- Create: `application/app/(dashboard)/[publisher_id]/settings/page.tsx`

- [ ] **Step 1: Write Settings page**

```tsx
'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { MOCK_PUBLISHERS } from '@/lib/mock-data';

export default function SettingsPage() {
  const params = useParams();
  const publisherId = typeof params.publisher_id === 'string' ? params.publisher_id : '';

  const publisher = MOCK_PUBLISHERS.find((p) => p.id === publisherId);
  const [name, setName] = useState(publisher?.name ?? '');
  const [logoUrl, setLogoUrl] = useState(publisher?.logoUrl ?? '');

  return (
    <div className="max-w-2xl">
      <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-[#1E2044] mb-8">Settings</h1>

      {/* Edit form */}
      <div className="bg-white border-3 border-[#1E2044] rounded-2xl p-6 shadow-[4px_4px_0px_0px_var(--color-border-dark)] mb-8">
        <h2 className="font-display font-black text-lg uppercase tracking-tight text-[#1E2044] mb-6">Publisher Details</h2>
        <div className="space-y-5">
          <div>
            <label className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60 mb-1.5">Publisher Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full bg-blueberry-cream/10 text-sm font-sans text-[#1E2044] px-4 py-3 border-2 border-[#1E2044] rounded-xl focus:outline-none focus:ring-2 focus:ring-blueberry/25" />
          </div>
          <div>
            <label className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60 mb-1.5">Logo URL</label>
            <input type="text" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..."
              className="w-full bg-blueberry-cream/10 text-sm font-sans text-[#1E2044] px-4 py-3 border-2 border-[#1E2044] rounded-xl focus:outline-none focus:ring-2 focus:ring-blueberry/25 placeholder-[#1E2044]/30" />
          </div>
          <button onClick={() => console.log('Save settings:', { name, logoUrl })}
            className="px-6 py-3 bg-blueberry text-white border-3 border-[#1E2044] font-display font-black rounded-xl shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all uppercase text-sm cursor-pointer">
            Save Changes
          </button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-white border-3 border-red-300 rounded-2xl p-6">
        <h2 className="font-display font-black text-lg uppercase tracking-tight text-red-600 mb-2">Danger Zone</h2>
        <p className="font-sans text-sm text-[#1E2044]/60 mb-6">
          Irreversible actions. Proceed with caution.
        </p>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border-2 border-[#1E2044]/10 rounded-xl">
            <div>
              <h3 className="font-display font-bold text-sm uppercase text-[#1E2044]">Transfer Ownership</h3>
              <p className="text-xs font-sans text-[#1E2044]/50">Transfer publisher ownership to another address.</p>
            </div>
            <button disabled title="Coming soon"
              className="px-4 py-2 bg-gray-100 text-gray-400 border-2 border-gray-200 font-display font-black rounded-lg text-xs uppercase cursor-not-allowed">
              Transfer
            </button>
          </div>
          <div className="flex items-center justify-between p-4 border-2 border-[#1E2044]/10 rounded-xl">
            <div>
              <h3 className="font-display font-bold text-sm uppercase text-red-600">Delete Publisher</h3>
              <p className="text-xs font-sans text-[#1E2044]/50">Permanently delete this publisher and all associated data.</p>
            </div>
            <button disabled title="Coming soon"
              className="px-4 py-2 bg-gray-100 text-gray-400 border-2 border-gray-200 font-display font-black rounded-lg text-xs uppercase cursor-not-allowed">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(dashboard)/[publisher_id]/settings/page.tsx"
git commit -m "feat: add Dashboard Settings page"
```


---

## Phase 4: Wire Up Layout & Navigation

### Task 35: Create providers wrapper `app/providers.tsx`

**Files:**
- Create: `application/app/providers.tsx`

- [ ] **Step 1: Write Providers wrapper**

```tsx
'use client';

import React from 'react';

// Placeholder for future DAppKit / QueryClient providers.
// No actual Sui integration yet - just passes children through.

export default function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

- [ ] **Step 2: Commit**

```bash
git add application/app/providers.tsx
git commit -m "feat: add Providers wrapper (skeleton for future DAppKit)"
```

---

### Task 36: Modify `app/layout.tsx` to use Providers

**Files:**
- Modify: `application/app/layout.tsx`

- [ ] **Step 1: Wrap children in Providers**

In `app/layout.tsx`, import `Providers` from `@/app/providers` and wrap the `{children}` inside `<body>` with `<Providers>{children}</Providers>`:

```tsx
import type {Metadata} from 'next';
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Providers from '@/app/providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Morita — Cross-Game Inventory & Commerce Protocol',
  description: 'Own your hard-earned items, trade across game boundaries, and join the trust-minimized gamedev commerce ecosystem on Sui.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased text-[#151515] bg-[#FDFDF6]" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add application/app/layout.tsx
git commit -m "feat: wrap app in Providers component"
```

---

### Task 37: Verify all routes work

- [ ] **Step 1: Start dev server**

```bash
cd application && bun run dev
```

- [ ] **Step 2: Navigate to each route and verify page renders without errors**

Routes to check:
- `http://localhost:3000/` — Landing page (already exists)
- `http://localhost:3000/marketplace` — Hub Marketplace
- `http://localhost:3000/inventory` — Hub Inventory
- `http://localhost:3000/history` — Hub History
- `http://localhost:3000/claim?code=XK92-BH4M` — Hub Claim
- `http://localhost:3000/barter/escrow-001` — Hub Barter detail
- `http://localhost:3000/dashboard` — Dashboard home
- `http://localhost:3000/dashboard/pub-001/games` — Games manager
- `http://localhost:3000/dashboard/pub-001/games/1` — Game detail
- `http://localhost:3000/dashboard/pub-001/games/1/api-keys` — API keys
- `http://localhost:3000/dashboard/pub-001/games/1/items` — Items list
- `http://localhost:3000/dashboard/pub-001/games/1/items/item-001` — Item detail (published)
- `http://localhost:3000/dashboard/pub-001/games/1/items/draft-001` — Item detail (draft)
- `http://localhost:3000/dashboard/pub-001/analytics` — Analytics
- `http://localhost:3000/dashboard/pub-001/activity` — Activity log
- `http://localhost:3000/dashboard/pub-001/settings` — Settings

No commit needed for this verification task.

---

## Style Guidelines for All Components

Follow DESIGN.md. Key class patterns:

- **Cards:** `border-3 border-[#1E2044] rounded-2xl shadow-[4px_4px_0px_0px_var(--color-border-dark)]`
- **Section headers:** `font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-[#1E2044]`
- **Meta labels:** `text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60`
- **Buttons:** `bg-blueberry text-white border-3 border-[#1E2044] font-display font-black rounded-xl shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all`
- **Inputs:** `border-2 border-[#1E2044] rounded-xl focus:ring-2 focus:ring-blueberry/25`
- **Body text:** `font-sans text-sm text-[#1E2044]/70`
- **Page bg:** `min-h-screen bg-brand-bg`

---

## Summary

| Phase | Tasks | Files Created | Description |
|-------|-------|---------------|-------------|
| Phase 0 | 1–3 | 7 | Mock data, Zod schemas, Zustand stores |
| Phase 1 | 4–18 | 15 | Shared Neo-Brutalist UI components |
| Phase 2 | 19–24 | 6 | Gamer Hub pages (layout + 5 pages) |
| Phase 3 | 25–34 | 10 | Developer Dashboard pages (layout + 9 pages) |
| Phase 4 | 35–37 | 2 | Providers, layout wiring, dev verification |
| **Total** | **37** | **40** | Complete Morita frontend buildout |
