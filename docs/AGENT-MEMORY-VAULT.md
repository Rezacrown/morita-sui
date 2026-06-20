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
│   │   ├── walrus/            # Walrus storage (deleted — not needed yet)
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

### `lib/sui/ptb.ts`
**11 exports:** `mint`, `burn`, `createPublisher`, `publish`, `listForSale`, `buyItem`, `lockForAny`, `lockForTarget`, `fulfill`, `fulfillWithValue`, `cancel`
**Key detail:** All produce `Transaction` objects. `lockForAny`/`lockForTarget` use `tx.pure(SerializedBcs)` — must NOT cast to Uint8Array.

### `lib/sui/client.ts`
**Purpose:** Singleton SuiGrpcClient for testnet/devnet/local. Used by Hono API and event indexer.

### `lib/db/schema.ts`
**10 tables:** `gamedevs`, `publishers`, `games`, `user_kiosks`, `api_keys`, `item_templates`, `claim_codes`, `escrow_index`, `item_cache`, `tx_events`
**Relations:** v1 relations with `one`/`many`

### `lib/db/index.ts`
**Purpose:** Drizzle singleton connected to PostgreSQL via `DATABASE_URL`.

### `app/api/[[...route]]/route.ts`
**Purpose:** Hono external API (4 endpoints). Mounted on Next.js catch-all route.
**Auth:** Bearer token validation via `api-key-service.validate()`
**Stubs:** Burn, inventory, item detail return empty data.

---

## Frontend Files

### `app/providers.tsx`
**Purpose:** Root provider — `QueryClientProvider` + `EnokiFlowProvider` (auth) + `DAppKitProvider` (Sui client)

### `app/auth/callback/page.tsx`
**Purpose:** OAuth callback — calls `flow.handleAuthCallback()`, redirects to `/inventory`

### `components/auth/auth-watcher.tsx`
**Purpose:** Syncs `useZkLogin()` address → Zustand `auth-store`
**Impact:** All components reading `useAuthStore()` get real-time auth state

### `components/landing/login-modal.tsx`
**Purpose:** Google OAuth modal — calls `flow.createAuthorizationURL()` → redirect to Google

### `stores/auth-store.ts`
**Purpose:** Zustand store for auth state. Synced by `AuthWatcher`.
**Keys:** `isLoggedIn`, `suiAddress`, `displayName`, `hasSetWorkspace`, `workspaceName`

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

## Pending Items (MVP Gaps)

| Priority | Task | File | Details |
|----------|------|------|---------|
| 🔴 | Wire Flow B frontend signing | `user-transaction.ts` + component | Frontend must build PTB → call sponsor → sign → call execute |
| 🔴 | Deploy TransferPolicy | CLI | `sui client ptb --assign pub @PUBLISHER --move-call PACKAGE::kiosk_ext::create_transfer_policy pub` |
| 🟡 | Implement burn endpoint | `route.ts` | Calls `ptb.burn()` via `executeAsAdmin` |
| 🟡 | Implement inventory query | `route.ts` | Uses `suiClient.getOwnedObjects()` filter by GameItem type |
| 🟡 | Implement item detail query | `route.ts` | Uses `suiClient.getObject()` |
| 🟢 | Admin actions (verify, pause, resume) | New actions | Flow A via `executeAsAdmin` |
| 🟢 | Analytics actions | New actions | DB query + event indexer |

---

## Tests

| File | Coverage | How to Run |
|------|----------|------------|
| `__tests__/marketplace.test.ts` | 15 tests — all PTB functions + enoki exports + service exports | `bun test` |
