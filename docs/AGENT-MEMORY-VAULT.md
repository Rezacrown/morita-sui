# Morita — Agent Memory Vault

> Structured knowledge for LLM agents. Maps every wiring file, its purpose, and relationships.

---

## Repository Map

```
morita/
├── contract/sources/          # Sui Move smart contracts
├── application/
│   ├── actions/               # Server actions (thin wrappers)
│   ├── services/              # Business logic layer
│   ├── lib/
│   │   ├── sui/               # Enoki + PTB + blockchain client
│   │   ├── walrus/            # Walrus storage (upload + getBlobUrl)
│   │   └── db/                # Drizzle schema + connection
│   ├── stores/                # Zustand state
│   ├── __tests__/             # Bun tests
│   ├── app/                   # Next.js pages + providers
│   └── components/            # React components
├── docker-compose.yml         # PostgreSQL
└── docs/                      # Documentation
```

---

## Smart Contracts (`contract/sources/`)

### `registry.move` — morita::registry
**Purpose:** Publisher registration, game publishing, admin controls.
**Structs:** AdminCap, Publisher, Game (shared), GameCapability, PublishTicket (hot potato)
**Init:** OTW pattern → package::claim → Publisher + AdminCap to deployer
**Key functions:**
| Function | Auth | Notes |
|----------|------|-------|
| `create_publisher(name, ctx)` | Anyone | Returns Publisher to sender |
| `verify_publisher(cap, pub_)` | AdminCap | Updates is_verified=true (fixed) |
| `initiate_publish(pub_, name, ctx)` | Publisher owner | Returns (Game, PublishTicket) |
| `finalize_publish(game, ticket, platform_addr, ctx)` | Hot potato consumer | Shares Game, transfers GameCapability |
| `update_game(cap, game, new_name)` | GameCapability | Auth guard added |
| `pause/resume(cap, game)` | AdminCap | Emergency controls |
| `contains_minted_item / add/remove` | Cross-module | For item.move |

### `item.move` — morita::item
**Purpose:** GameItem type, mint/burn.
**Key function:** `mint(game, cap, item_id, type, rarity, blob_id, supply, recipient, ctx)` → GameItem
**Double-mint prevention:** game.minted_items Table

### `kiosk_ext.move` — morita::kiosk_ext
**Purpose:** Kiosk marketplace wrapper.
**Functions:** `list_for_sale(item, kiosk, cap, price, royalty?)`, `buy_item(kiosk, policy, item_id, payment, ctx)`, `create_transfer_policy(publisher, ctx)`
**Requires:** TransferPolicy<GameItem> for buy_item to work

### `escrow.move` — morita::escrow
**Purpose:** Atomic barter with full lock.
**Functions:** `lock_item_for_any`, `lock_item_for_target`, `fulfill_escrow` (returns both items — no trap), `fulfill_escrow_with_value`, `cancel_escrow`

---

## Backend Files

### `actions/user-transaction.ts`
**Purpose:** Generic Flow B server actions — frontend calls these for user-owned transactions.
**Exports:** `sponsorTransaction(txBytes, userAddress, targets)`, `executeTransaction(digest, signature)`
**Wiring:** Calls `enoki-client.ts` → `sponsorForUser()` / `executeUserSigned()`
**Flow:** Frontend build PTB → sponsor → user sign → execute

### `actions/marketplace.ts`
**Purpose:** Marketplace + escrow operations.
**Exports:** `sponsorTxBytes`, `executeSignedTx`, `getMarketplaceListings`, `getListingDetail`
**Wiring:** `enoki-client.ts` + `marketplace-service.ts`

### `actions/publisher.ts`
**Purpose:** Publisher and session management.
**Exports:** `getSession(suiAddress)`, `createPublisher(suiAddress, suiPublisherId, name, logoUrl?)`
**Wiring:** `publisher-service.ts` (DB only)

### `actions/game.ts`
**Purpose:** Game CRUD + publish.
**Exports:** `create`, `update`, `del`, `list`, `detail`, `publish`
**Wiring:** `game-service.ts` (DB only)

### `actions/item.ts`
**Purpose:** Item template CRUD + claim info.
**Exports:** `save`, `del`, `list`, `detail`, `claimInfo`
**Wiring:** `item-service.ts` (DB only)

### `actions/claim.ts`
**Purpose:** Claim code redemption.
**Exports:** `redeemCode`
**Wiring:** `claim-service.ts` → `executeAsAdmin(mint)` — real Flow A on-chain call

### `actions/api-keys.ts`
**Purpose:** API key management for game servers.
**Exports:** `createKey`, `revokeKey`, `getKeys`
**Wiring:** `api-key-service.ts` (DB only)

### `services/publisher-service.ts`
**DB tables:** `gamedevs`, `publishers`
**Key:** Creates dev record by suiAddress, manages publisher records

### `services/game-service.ts`
**DB tables:** `games`, `api_keys`, `item_templates`
**Key:** `finalizePublish` updates DB after on-chain success

### `services/item-service.ts`
**DB tables:** `item_templates`, `claim_codes`
**Key:** `getClaimInfo` — public endpoint for claim page preview

### `services/claim-service.ts`
**DB tables:** `claim_codes`, `games`, `item_templates`
**Key:** `redeem()` — validates → builds PTB → calls `executeAsAdmin(mint)` → updates DB
**Only service making real on-chain calls via executeAsAdmin**

### `services/marketplace-service.ts`
**DB tables:** `escrow_index`
**Key:** CRUD for escrow-index table (mirrors on-chain Escrow shared objects)

### `services/api-key-service.ts`
**DB tables:** `api_keys`
**Key:** SHA-256 hash validation for Bearer token auth

### `lib/sui/enoki-client.ts`
**3 exports:** `executeAsAdmin(tx, targets)` — admin signs, `sponsorForUser(txBytes, user, targets)` — sponsor only, `executeUserSigned(digest, sig)` — finalize
**Key detail:** executeAsAdmin uses ADMIN_PRIVATE_KEY + admin address. sponsorForUser uses user address but Enoki pays gas.

### `lib/sui/client.ts`
**Purpose:** Singleton SuiGrpcClient for testnet/devnet/local. Extended with Walrus plugin via `$extend(walrus({uploadRelay}))`.

### `lib/sui/ptb.ts`
**11 exports + createKiosk:** `mint`, `burn`, `createPublisher`, `publish`, `listForSale`, `buyItem`, `lockForAny`, `lockForTarget`, `fulfill`, `fulfillWithValue`, `cancel`, `createKiosk`
**Key detail:** All functions now capture return values + transferObjects to correct recipient. `publish` handles 2-step initiate+finalize. `createKiosk` calls `0x2::kiosk::new`.

### `lib/sui/client.ts`
**Purpose:** Singleton SuiGrpcClient for testnet/devnet/local. Extended with Walrus plugin via `$extend(walrus({uploadRelay}))`.

### `lib/db/schema.ts`
**11 tables:** `gamedevs`, `publishers`, `games`, `user_kiosks`, `kiosk_listings`, `api_keys`, `item_templates`, `claim_codes`, `escrow_index`, `item_cache`, `tx_events`
**Relations:** v1 relations with `one`/`many`

### `lib/db/index.ts`
**Purpose:** Drizzle singleton connected to PostgreSQL via `DATABASE_URL`.

### `lib/walrus/index.ts`
**Exports:** `uploadItemImage(buffer)` — admin wallet signs, writes blob to Walrus. `getBlobUrl(blobId)` — returns aggregator URL.
**Note:** Uses admin keypair directly (not Enoki-sponsored). Admin wallet must have WAL tokens.

### `actions/zkp.ts`
**Purpose:** Proxy all Enoki ZKP + OAuth + nonce calls server-side (uses private key).
**Exports:** `getZkp(input)` — generate ZK proof, `getNonce(ephemeralPublicKey, network)` — create OAuth nonce, `getZkLoginInfo(jwt)` — resolve JWT to Sui address.
**Why:** Enoki public key lacks testnet access. All Enoki API calls proxied through private key.

### `actions/publish-game.ts`
**Purpose:** After PTB confirms, parse tx effects to find Game + GameCapability, then update DB via `finalizePublish`.

### `actions/kiosk.ts`
**Purpose:** Kiosk creation + listing management.
**Exports:** `getMyKiosk(suiAddress)`, `finalizeCreateKiosk(suiAddress, digest)`, `finalizeListForSale(data, digest)`, `finalizeBuy(itemObjectId, digest)`, `getActiveListings()`

### `actions/inventory.ts`
**Purpose:** Query on-chain GameItem objects owned by address.
**Exports:** `getInventory(address)` — calls `suiClient.listOwnedObjects()` filter by `GameItem` type, returns enriched data. `getInventoryItem(objectId)` — single item detail.

### `actions/onchain-items.ts`
**Purpose:** Dashboard tab showing minted GameItems for a specific game.
**Exports:** `getOnChainItems(gameId)` — queries admin wallet's GameItems filtered by game_id.

### `app/api/[[...route]]/route.ts`
**Purpose:** Hono external API (4 endpoints). Mounted on Next.js catch-all route.
**Auth:** Bearer token validation via `api-key-service.validate()`
**Stubs:** Burn, inventory, item detail return empty data.

---

## Frontend Files

### `app/providers.tsx`
**Purpose:** Root provider — `QueryClientProvider` + `DAppKitProvider` (Sui client). No more `EnokiFlowProvider` — auth is handled server-side via `actions/zkp.ts` with private key.

### `app/auth/callback/page.tsx`
**Purpose:** OAuth callback — parse `id_token` from URL hash → call `getZkLoginInfo(jwt)` server action → call `getZkp(...)` server action → store proof + address in sessionStorage → redirect.

### `components/auth/auth-watcher.tsx`
**Purpose:** Reads `sessionStorage('morita_address')` → sets Zustand `auth-store` on mount. No longer depends on `useZkLogin()`.

### `components/landing/login-modal.tsx`
**Purpose:** Google OAuth modal — generates ephemeral keypair client-side, calls `getNonce()` server action, constructs OAuth URL manually (no `EnokiFlow.createAuthorizationURL`), stores ephemeral key in sessionStorage, redirects to Google.

### `components/tx/use-transaction.ts`
**Purpose:** Reusable hook for Flow B transactions (user signs, Enoki sponsors).
**Flow:** `buildTx()` → `tx.setSender(suiAddress)` → `tx.build({ client: suiClient, onlyTransactionKind: true })` → `sponsorTransaction()` → `readSession()` reconstruct keypair → `getZkp()` if no cached proof → `EnokiKeypair.signTransaction()` → `executeTransaction()`.
**No `EnokiFlow.getKeypair()`** — all ZKP calls proxied server-side via `actions/zkp.ts`.

### `components/tx/transaction-button.tsx`
**Purpose:** Reusable button wrapping `useTransaction()` with loading spinner + `TxStatusToast`.

### `stores/auth-store.ts`
**Purpose:** Zustand store for auth state. Synced by `AuthWatcher` from sessionStorage.
**Keys:** `isLoggedIn`, `suiAddress`, `displayName`

### `components/dashboard/create-workspace-modal.tsx`
**Purpose:** First-time user sees this in dashboard layout. Calls `createPublisherTx(name, suiAddress)` PTB → `finalizeCreatePublisher()` DB insert.

---

## Key Patterns & Conventions

### Signing Flow Selection
```
User owns the objects (items, publisher) → sponsorForUser + executeUserSigned
Admin owns the objects (GameCapability, AdminCap) → executeAsAdmin
```

### EscrowConditions BCS Serialization
Always use `bcs.struct(...).serialize(data)` — return `SerializedBcs`, NOT cast to `Uint8Array`.
`tx.pure()` handles `SerializedBcs` correctly via `isSerializedBcs()` check.

### Gas Sponsorship
All transactions are sponsored by Enoki. Gas is paid by the platform, not users.
- Flow A: Enoki sponsor → admin signs → execute
- Flow B: Enoki sponsor → user signs (via frontend) → execute

### Error Handling Pattern
```typescript
try { const result = await executeAsAdmin(tx, targets); return { success: true, txDigest: result.digest } }
catch (err: unknown) { return { success: false, error: err instanceof Error ? err.message : 'UNKNOWN' } }
```

---

## Pending Items (MVP Gaps — Updated)

| Priority | Task | File | Details |
|----------|------|------|---------|
| 🟡 | Walrus image upload UI | `actions/walrus.ts` (NEW), item edit page | Server action + file input + preview. See `WALRUS-INTEGRATION-PLAN.md` |
| 🟡 | Walrus metadata upload | Item edit page | Upload JSON metadata alongside image |
| 🟡 | Implement Hono stubs (burn, inventory, item detail) | `route.ts` | Calls `ptb.burn()` via `executeAsAdmin` |
| 🟢 | Admin actions (verify, pause, resume) | New actions | Flow A via `executeAsAdmin` |
| 🟢 | Activity log + analytics | Dashboard pages | Query `tx_events` table + on-chain data |

---

## Tests

| File | Coverage | How to Run |
|------|----------|------------|
| `__tests__/marketplace.test.ts` | 15 tests — all PTB functions + enoki exports + service exports | `bun test` |
