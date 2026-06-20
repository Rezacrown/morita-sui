# Morita — Session Knowledge Vault

> Generated: June 21, 2026
> Branch: `rewrite-clean`
> Target: Sui Overflow 2026 — DeFi & Payments Track

---

## 1. User Preferences & Taste

### Communication
- **Bahasa Indonesia** untuk komunikasi sehari-hari
- **English** untuk README dan dokumen juri
- Jangan pakai istilah rumit/"flow B"/"Flow A" — langsung bilang platform-executed atau gamedev/player signed
- Jelas, langsung ke point, gak bertele-tele

### Code Preferences
- **No `any` types** — semua TypeScript harus proper type
- **No `useEffect` → `setState` cascade** — pake TanStack Query + `key`-based re-mount pattern
- **No MOCK data** di production pages — pake TanStack Query + server actions
- **Clean, minimal comments** — comment cuma untuk menjelaskan *logic* dalam fungsi, bukan tiap baris
- **Service Layer pattern** — `services/*.ts` untuk business logic, `actions/*.ts` untuk thin server action wrappers
- **Flat is better** — gak usah nested folder berlebihan
- **Praktis untuk MVP** — gak overengineer, kalo ada 2 opsi pilih yang lebih simpel

### Architecture Principles
- Semua transaksi disponsori Enoki (gas gratis untuk user)
- Platform (`ADMIN_PRIVATE_KEY`) bisa execute transaksi sendiri untuk admin-only operations
- Gamedev/Player sign untuk transaksi yang touch owned objects mereka
- DB for drafts/metadata, on-chain for ownership

---

## 2. Project Identity

| Attribute | Value |
|-----------|-------|
| **Name** | Morita |
| **Hackathon** | Sui Overflow 2026 |
| **Track** | DeFi & Payments |
| **Three Actors** | Platform (admin), Gamedev (game developer), Player (gamer) |
| **Tagline** | Cross-game inventory & commerce protocol |

---

## 3. Smart Contracts — `contract/sources/`

### `registry.move` (110 lines) — `morita::registry`
| Concept | Detail |
|---------|--------|
| **OTW** | `REGISTRY` struct → `package::claim()` → `Publisher` + `AdminCap` ke deployer |
| **AdminCap** | `key, store` — verify publisher, pause/resume game |
| **Publisher** | `key, store` — name, owner, is_verified. Dibuat via `create_publisher()` |
| **Game** | `key, store` — **shared object**. name, publisher_id, is_active, minted_items Table |
| **GameCapability** | `key, store` — game_id. Di-transfer ke platform_addr di `finalize_publish()` |
| **PublishTicket** | **Hot potato (0 abilities)** — MUST be consumed in same PTB |
| **Key fix** | `verify_publisher()` sekarang bener-bener update `is_verified = true` |
| **Key fix** | `update_game()` butuh `&GameCapability` — auth guard added |
| **Functions** | `create_publisher`, `verify_publisher`, `initiate_publish`, `finalize_publish`, `update_game`, `pause_game`, `resume_game`, + 4 accessors |

### `item.move` (60 lines) — `morita::item`
| Concept | Detail |
|---------|--------|
| **GameItem** | `key, store` — game_id, item_id, item_type, rarity, blob_id, supply |
| **Double-mint prevention** | `game.minted_items: Table<u64, bool>` — trustless |
| **Functions** | `mint(game, cap, item_id, type, rarity, blob_id, supply, recipient, ctx)`, `burn(item, game, cap)`, + 4 accessors |

### `kiosk_ext.move` (51 lines) — `morita::kiosk_ext`
| Concept | Detail |
|---------|--------|
| **Purpose** | Kiosk marketplace wrapper |
| **Functions** | `list_for_sale(item, kiosk, cap, price, royalty?)`, `buy_item(kiosk, policy, item_id, payment, ctx)`, `create_transfer_policy(publisher, ctx)` |

### `escrow.move` (94 lines) — `morita::escrow`
| Concept | Detail |
|---------|--------|
| **Escrow** | `key, store` — **shared object** — offer_item, initiator, counterparty, conditions, is_active |
| **EscrowConditions** | `store, drop` — item_id_target, game_id_accept, item_type_accept, rarity_accept |
| **Key fix** | `fulfill_escrow()` returns **offered** item to fulfiller, **transfers my_item to initiator** — no item trapped |
| **Functions** | `lock_item_for_any`, `lock_item_for_target`, `fulfill_escrow`, `fulfill_escrow_with_value`, `cancel_escrow` |

---

## 4. Backend Architecture

### Signing Model

| Fungsi | Sender | Signer | Untuk |
|--------|--------|--------|-------|
| `executeAsAdmin()` | Platform (ADMIN_ADDR) | `ADMIN_PRIVATE_KEY` | Mint, claim, verify, pause, resume — semua yang platform punya capability |
| `sponsorForUser()` | Gamedev/Player | Gamedev/Player (via Enoki Flow) | Create publisher, publish game, list for sale, escrow |
| `executeUserSigned()` | — | — | Backend finalisasi setelah user sign |

### File Map — `lib/`

| File | Exports | Purpose |
|------|---------|---------|
| `lib/sui/client.ts` | `suiClient` (SuiGrpcClient + $extend walrus) | Blockchain + Walrus client singleton |
| `lib/sui/enoki-client.ts` | `enokiClient`, `executeAsAdmin()`, `sponsorForUser()`, `executeUserSigned()` | Enoki sponsored transaction helpers |
| `lib/sui/ptb.ts` | 11 functions: mint, burn, createPublisher, publish, listForSale, buyItem, lockForAny, lockForTarget, fulfill, fulfillWithValue, cancel | PTB builders — semua aligned dengan contract signatures |
| `lib/walrus/index.ts` | `uploadItemImage(buffer)`, `getBlobUrl(blobId)` | Walrus blob upload + aggregator URL |
| `lib/db/schema.ts` | 10 tables with relations v1 | Drizzle ORM schema |
| `lib/db/index.ts` | `db` (drizzle instance) | DB connection singleton |

### File Map — `services/`

| File | DB Tables | On-Chain? | Key Functions |
|------|-----------|-----------|---------------|
| `publisher-service.ts` | gamedevs, publishers | DB only | getOrCreateDev, getMyPublishers, getPublisherDetail, createPublisherRecord |
| `game-service.ts` | games, api_keys, item_templates | DB only | createGame, updateGame, deleteGame, listGames, getGame, finalizePublish |
| `item-service.ts` | item_templates, claim_codes | DB only | saveDraft, deleteDraft, listItems, getItem, getClaimInfo |
| `claim-service.ts` | claim_codes, games, item_templates | ✅ `executeAsAdmin(mint)` | generateClaimCode, createClaimCode, redeem |
| `marketplace-service.ts` | escrow_index | DB only | getListings, getListingDetail, createEscrowRecord, markFulfilled, markCancelled |
| `api-key-service.ts` | api_keys | DB only | generate, revoke, list, validate |

### File Map — `actions/`

| File | Imports | Purpose |
|------|---------|---------|
| `publisher.ts` | publisher-service | `getSession`, `createPublisher` |
| `game.ts` | game-service | `create`, `update`, `del`, `list`, `detail`, `publish` |
| `item.ts` | item-service | `save`, `del`, `list`, `detail`, `claimInfo` |
| `claim.ts` | claim-service | `redeemCode` |
| `marketplace.ts` | marketplace-service + enoki-client | `sponsorTxBytes`, `executeSignedTx`, `getMarketplaceListings`, `getListingDetail` |
| `api-keys.ts` | api-key-service | `createKey`, `revokeKey`, `getKeys` |
| `user-transaction.ts` | enoki-client | `sponsorTransaction`, `executeTransaction` |

### Hono API — `app/api/[[...route]]/route.ts`

| Endpoint | Method | Auth | Status |
|----------|--------|------|--------|
| `/api/v1/game/:gameId/item/mint` | POST | API Key | ✅ Real — creates claim code in DB |
| `/api/v1/game/:gameId/item/burn` | POST | API Key | ❌ Stub — returns `{ tx_digest: '' }` |
| `/api/v1/game/:gameId/inventory/:address` | GET | API Key | ❌ Stub — returns `{ items: [], total: 0 }` |
| `/api/v1/game/:gameId/item/:itemId` | GET | API Key | ❌ Stub — returns `{ item: null }` |

---

## 5. Frontend Architecture

### Providers — `app/providers.tsx`
```
QueryClientProvider → EnokiFlowProvider → DAppKitProvider → AuthWatcher
```

### Auth Flow
1. `login-modal.tsx` → save `morita_redirect` to `sessionStorage` → `EnokiFlow.createAuthorizationURL()` → Google OAuth
2. `auth/callback/page.tsx` → `handleAuthCallback()` → read `morita_redirect` → redirect to intended path
3. `auth-watcher.tsx` → `useZkLogin()` → sync to `auth-store.ts`

### Store — `stores/`

| Store | State | Notes |
|-------|-------|-------|
| `auth-store.ts` | `isLoggedIn`, `suiAddress`, `displayName` | Clean — no workspaceName/hasSetWorkspace |
| `claim-store.ts` | claim state | Masih ada tapi gak dipake — claim page pake TanStack Query langsung |
| `marketplace-store.ts` | listings, escrows, filters | Pure state — pages isi data via TanStack Query |
| `inventory-store.ts` | items | Pure state |
| `publisher-store.ts` | isPublishing, publishProgress | Cuma state publishing progress |

### Reusable Components

| File | Purpose |
|------|---------|
| `components/tx/use-transaction.ts` | **Hook** — build PTB → `sponsorTransaction` → `EnokiFlow.getKeypair().signTransaction()` → `executeTransaction`. Returns `{ state, digest, error, execute, reset }` |
| `components/tx/transaction-button.tsx` | **Button wrapper** — loading spinner + `TxStatusToast` |

### Pages (18 routes, all wired)

| Route | Data Source | Key Actions |
|-------|-------------|-------------|
| `/` | Static | Login modal, navigation |
| `/auth/callback` | Enoki Flow | `handleAuthCallback()` |
| `/claim?code=` | `useQuery(['claim'])` + `useMutation(redeemCode)` | Claim item |
| `/inventory` | `useQuery(['inventory'])` | View items |
| `/inventory/[itemId]` | `useQuery(['item'])` | Item detail |
| `/marketplace` | `useQuery(['marketplace'])` | Browse listings |
| `/barter/[id]` | `useQuery(['escrow'])` | Fulfill/cancel escrow (console.log only) |
| `/history` | Placeholder | Coming soon |
| `/dashboard` | `useQuery(['session'])` + `useQuery(['games'])` | Overview |
| `/dashboard/games` | `useQuery(['games'])` + `useMutation(create)` | List, create game |
| `/dashboard/games/[game_id]` | `useQuery(['game'])` + `useMutation(update)` | Game detail, publish (TODO) |
| `/dashboard/games/[game_id]/items` | `useQuery(['items'])` | List items |
| `/dashboard/games/[game_id]/items/[item_id]` | `useQuery(['item'])` + `useMutation(save)` + `useMutation(del)` | Edit item draft |
| `/dashboard/games/[game_id]/api-keys` | `useQuery(['api-keys'])` + `useMutation(createKey)` + `useMutation(revokeKey)` | API key management |
| `/dashboard/analytics` | `useQuery(['games'])` | Metrics |
| `/dashboard/activity` | Placeholder | Coming soon |
| `/dashboard/settings` | `useQuery(['session'])` | Publisher info |

---

## 6. Environment Variables — `.env.local`

| Variable | Source | For |
|----------|--------|-----|
| `NEXT_PUBLIC_SUI_NETWORK` | Config | Network (testnet/devnet/local) |
| `NEXT_PUBLIC_PACKAGE_ID` | Deploy contract | PTB builders, Enoki Portal whitelist |
| `NEXT_PUBLIC_TRANSFER_POLICY_ID` | Deploy TP | buyItem PTB |
| `NEXT_PUBLIC_PLATFORM_ADDR` | `sui client new-address ed25519` | Platform address for GameCapability |
| `ADMIN_PRIVATE_KEY` | `sui keytool export` | `executeAsAdmin`, Walrus upload |
| `NEXT_PUBLIC_ENOKI_PUBLIC_KEY` | Enoki Portal | Frontend auth |
| `ENOKI_SECRET_KEY` | Enoki Portal | Backend sponsored tx |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google Cloud Console | OAuth |
| `WALRUS_AGGREGATOR_URL` | Walrus docs | Read blob URL (gak dipake) |
| `NEXT_PUBLIC_WALRUS_AGGREGATOR` | Walrus docs | Frontend image CDN URL |
| `DATABASE_URL` | Docker Compose | PostgreSQL connection |
| `NEXT_PUBLIC_APP_URL` | Config | Claim URL generation |

---

## 7. Pending Tasks

| # | Task | Priority | Kenapa Bloking | File |
|---|------|----------|----------------|------|
| 1 | **Deploy contracts** ke testnet | 🔴 | Semua transaksi butuh Package ID | CLI |
| 2 | **Deploy TransferPolicy** via CLI | 🔴 | buy_item gak work tanpa ini | CLI |
| 3 | **Update `.env.local`** + Enoki whitelist | 🔴 | #1+#2 |
| 4 | **Wire `useTransaction` ke tombol** — sell, buy, barter, publish, cancel | 🟡 | Butuh #1 buat test | `app/(hub)/marketplace/page.tsx`, `inventory/page.tsx`, `barter/[id]/page.tsx`, `dashboard/games/[game_id]/page.tsx` |
| 5 | **Fix `publishGame`** — ganti TODO dengan real PTB via `useTransaction` | 🟡 | #1 | `app/(dashboard)/dashboard/games/[game_id]/page.tsx` |
| 6 | **Hono stubs → real** — burn, inventory, item detail | 🟡 | #1 | `app/api/[[...route]]/route.ts` |
| 7 | **History + Activity page** — query dari `txEvents` table | 🟢 | Gak urgent | `app/(hub)/history/page.tsx`, `dashboard/activity/page.tsx` |
| 8 | **Merge `rewrite-clean` → `development`** | 🟡 | Biar gak ada branch terpisah | Git |
| 9 | **Walrus upload** — admin wallet butuh WAL token | 🟡 | Publish flow butuh upload gambar | Faucet |

---

## 8. Docs Reference

| File | For | Content |
|------|-----|---------|
| `docs/AGENT-MEMORY-VAULT.md` | LLM Agents | File mapping, patterns, conventions |
| `docs/BUSINESS-FLOW.md` | Judges | High-level business flows with mermaid diagrams |
| `docs/TECHNICAL-ARCHITECTURE.md` | Developers | Full architecture, file wiring, data flow |
| `docs/TESTNET-DEPLOY-GUIDE.md` | DevOps | Step-by-step testnet deployment |
| `docs/frontend-wiring-plan.md` | Developers | Phased plan for wiring frontend to backend |
| `docs/superpowers/specs/2026-06-17-morita-design.md` | All | Original design document (12 sections) |
| `developer-guide.md` | Team | Onboarding, setup, environment refs |
