# Implementation Plan: Backend & Database Integration

> **Morita — Sui Overflow 2026**
> Status: Draft for review
> Estimated effort: ~22 files across 7 phases

---

## Phase 1 — Infrastructure (5 files)

### 1. `docker-compose.yml`
**Path:** `C:\Users\aryhi\Desktop\hackathons\sui-overflow\docker-compose.yml`

Single service: PostgreSQL 17-alpine.
- Named `morita-db`
- Port `5432:5432`
- Volume `pgdata` mounted to `/var/lib/postgresql/data`
- User: `morita`, password: `morita_pwd`, database: `morita`
- Healthcheck via `pg_isready`
- Expose port `5432` for local dev (no app container — Next.js runs on host via `bun run dev`)

**Rationale:** Next.js runs natively on Windows via `bun run dev`, not in Docker. PostgreSQL is the only container needed. Keeping it simple.

---

### 2. `.env.local`
**Path:** `C:\Users\aryhi\Desktop\hackathons\sui-overflow\application\.env.local`

```
# Sui
NEXT_PUBLIC_SUI_NETWORK=testnet
NEXT_PUBLIC_PACKAGE_ID=0x6a85f6cc987e83a92de0a59dedb06f5a5a1f4b478d270e0ab8ed5fe3582a1641
ADMIN_PRIVATE_KEY=

# Enoki
NEXT_PUBLIC_ENOKI_PUBLIC_KEY=
ENOKI_SECRET_KEY=

# OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=

# Walrus Harbor
WALRUS_HARBOR_URL=

# Database
DATABASE_URL=postgresql://morita:morita_pwd@localhost:5432/morita

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Empty values for Enoki/Walrus/AdminKey — will be filled after Enoki Portal setup + contract deployment.

---

### 3. `drizzle.config.ts`
**Path:** `C:\Users\aryhi\Desktop\hackathons\sui-overflow\application\drizzle.config.ts`

```typescript
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
```

---

### 4. `lib/db/schema.ts`
**Path:** `C:\Users\aryhi\Desktop\hackathons\sui-overflow\application\lib\db\schema.ts`

10 tables using `drizzle-orm/pg-core` with relations v1:

| Table | Key Fields | Relations |
|-------|-----------|-----------|
| `gamedevs` | `id serial PK`, `sui_address varchar UNIQUE`, `email varchar`, `name varchar`, `created_at timestamp` | hasMany publishers |
| `publishers` | `id serial PK`, `sui_publisher_id varchar UNIQUE`, `dev_id int FK→gamedevs`, `name varchar`, `logo_url varchar`, `is_verified bool default false`, `created_at timestamp` | belongsTo gamedevs, hasMany games |
| `games` | `id serial PK`, `sui_game_id varchar UNIQUE nullable`, `publisher_id int FK→publishers`, `name varchar`, `description text`, `genre varchar`, `website_url varchar`, `status varchar default 'draft'`, `game_capability_id varchar`, `created_at timestamp` | belongsTo publishers, hasMany item_templates, api_keys, claim_codes |
| `user_kiosks` | `id serial PK`, `sui_address varchar UNIQUE`, `kiosk_id varchar UNIQUE`, `kiosk_owner_cap_id varchar`, `created_at timestamp` | standalone |
| `api_keys` | `id serial PK`, `game_id int FK→games`, `key_hash varchar UNIQUE`, `key_prefix varchar`, `is_active bool default true`, `last_used_at timestamp nullable`, `created_at timestamp` | belongsTo games |
| `item_templates` | `id serial PK`, `game_id int FK→games`, `sui_item_id varchar nullable`, `name varchar`, `item_type varchar`, `rarity varchar`, `description text`, `image_blob_id varchar nullable`, `metadata_blob_id varchar nullable`, `supply int default 1`, `is_nft bool default true`, `attributes jsonb`, `status varchar default 'draft'`, `created_at timestamp` | belongsTo games, hasMany claim_codes |
| `claim_codes` | `id serial PK`, `code varchar UNIQUE`, `game_id int FK→games`, `item_template_id int FK→item_templates`, `recipient_identifier varchar`, `expires_at timestamp`, `claimed_at timestamp nullable`, `claimed_by varchar nullable`, `created_at timestamp` | belongsTo games, belongsTo item_templates |
| `escrow_index` | `id serial PK`, `escrow_id varchar UNIQUE`, `initiator_address varchar`, `offer_game_id int FK→games nullable`, `offer_item_blob_id varchar`, `conditions_json jsonb`, `is_active bool default true`, `created_at timestamp`, `fulfilled_at timestamp nullable`, `cancelled_at timestamp nullable` | belongsTo games |
| `item_cache` | `id serial PK`, `blob_id varchar UNIQUE`, `game_id int FK→games`, `name varchar`, `description text`, `image_blob_id varchar`, `tags jsonb`, `attributes jsonb`, `created_at timestamp` | belongsTo games |
| `tx_events` | `id serial PK`, `tx_hash varchar`, `event_type varchar`, `game_id int FK→games nullable`, `from_address varchar`, `to_address varchar`, `item_blob_id varchar`, `metadata jsonb`, `created_at timestamp` | belongsTo games |

Indexes:
- `gamedevs`: unique on `sui_address`
- `publishers`: unique on `sui_publisher_id`, index on `dev_id`
- `games`: unique on `sui_game_id`, index on `publisher_id`, index on `status`
- `user_kiosks`: unique on `sui_address`, unique on `kiosk_id`
- `api_keys`: unique on `key_hash`, index on `game_id`
- `item_templates`: index on `game_id`, index on `status`
- `claim_codes`: unique on `code`, index on `expires_at`
- `escrow_index`: unique on `escrow_id`, index on `is_active`
- `item_cache`: unique on `blob_id`, index on `game_id`
- `tx_events`: index on `event_type`, `game_id`, `from_address`, `to_address`, `created_at`

Relations v1:
- `gamedevsRelations`: hasMany publishers
- `publishersRelations`: belongsTo gamedevs, hasMany games
- `gamesRelations`: belongsTo publishers, hasMany itemTemplates, hasMany apiKeys, hasMany claimCodes
- `itemTemplatesRelations`: belongsTo games, hasMany claimCodes
- `claimCodesRelations`: belongsTo games, belongsTo itemTemplates
- `apiKeysRelations`: belongsTo games
- `escrowIndexRelations`: belongsTo games
- `itemCacheRelations`: belongsTo games
- `txEventsRelations`: belongsTo games

Types exported: `Gamedev`, `NewGamedev`, `Publisher`, `NewPublisher`, `Game`, `NewGame`, etc.

---

### 5. `lib/db/index.ts`
**Path:** `C:\Users\aryhi\Desktop\hackathons\sui-overflow\application\lib\db\index.ts`

```typescript
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
export const db = drizzle(pool, { schema })
```

Edit `package.json` to add scripts:
```json
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate",
"db:push": "drizzle-kit push",
"db:studio": "drizzle-kit studio"
```

---

## Phase 2 — Sui / Enoki Client Layer (3 files)

### 6. `lib/sui/client.ts`
**Path:** `C:\Users\aryhi\Desktop\hackathons\sui-overflow\application\lib\sui\client.ts`

```typescript
import { SuiGrpcClient } from '@mysten/sui/grpc'

const NETWORK = process.env.NEXT_PUBLIC_SUI_NETWORK || 'testnet'
const BASE_URL = NETWORK === 'testnet'
  ? 'https://rpc.testnet.sui.io:443'
  : `http://127.0.0.1:9000`

export const suiClient = new SuiGrpcClient({ network: NETWORK, baseUrl: BASE_URL })
```

> **Note:** `@mysten/sui` v2 (installed) — `SuiGrpcClient` replaces deprecated `SuiClient`.

### 7. `lib/sui/enoki-client.ts`
**Path:** `C:\Users\aryhi\Desktop\hackathons\sui-overflow\application\lib\sui\enoki-client.ts`

Backend-only EnokiClient instance:
```typescript
import { EnokiClient } from '@mysten/enoki'

export const enokiClient = new EnokiClient({
  apiKey: process.env.ENOKI_SECRET_KEY!,
})
```

Flow A helper (backend-only mint, admin actions):
```typescript
export async function sponsoredTx(txBytes: Uint8Array, sender: string) {
  const { bytes, digest } = await enokiClient.createSponsoredTransaction({
    network: 'testnet',
    transactionKindBytes: txBytes,
    sender,
  })
  // Sign with ADMIN_PRIVATE_KEY
  // Execute
}
```

### 8. `lib/sui/ptb-builder.ts`
**Path:** `C:\Users\aryhi\Desktop\hackathons\sui-overflow\application\lib\sui\ptb-builder.ts`

Helper functions that construct `Transaction` objects for each Move function:

| Function | PTB Content |
|----------|-------------|
| `buildMintPTB(gameId, capId, itemId, itemType, rarity, blobId, supply, recipient)` | Single `item::mint` call |
| `buildPublishPTB(publisherId, gameName)` | `initiate_publish` + `finalize_publish` in sequence |
| `buildListForSalePTB(itemId, kioskId, capId, price, royaltyBps)` | `kiosk_ext::list_for_sale` |
| `buildBuyItemPTB(kioskId, tpId, itemId, payment)` | `kiosk_ext::buy_item` |
| `buildLockEscrowPTB(itemId, conditions)` | `escrow::lock_item_for_any` or `lock_item_for_target` |
| `buildFulfillEscrowPTB(escrowId, myItemId)` | `escrow::fulfill_escrow` |
| `buildCancelEscrowPTB(escrowId)` | `escrow::cancel_escrow` |

All use `import { Transaction } from '@mysten/sui/transactions'` with PACKAGE_ID from env.

---

## Phase 3 — Provider + Auth (2 files)

### 9. `app/providers.tsx`
**Path:** `C:\Users\aryhi\Desktop\hackathons\sui-overflow\application\app\providers.tsx`

Replace current stub with:

```
'use client'
→ CreateQueryClientProvider
→ SuiGrpcClient
→ DAppKitProvider (network: testnet)
→ registerEnokiWallets({ google clientId, apiKey })
→ Wrap children
```

Structure:
```tsx
'use client'

import { createNetworkConfig, SuiClientProvider } from '@mysten/dapp-kit-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { registerEnokiWallets } from '@mysten/enoki'

registerEnokiWallets({
  apiKey: process.env.NEXT_PUBLIC_ENOKI_PUBLIC_KEY!,
  providers: { google: { clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID! } },
})

const queryClient = new QueryClient()

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider network="testnet">
        {children}
      </SuiClientProvider>
    </QueryClientProvider>
  )
}
```

> **Note:** This requires `NEXT_PUBLIC_ENOKI_PUBLIC_KEY` and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` to be filled. Until then, providers will still work (just wallet connect won't function).

### 10. `actions/auth.ts`
**Path:** `C:\Users\aryhi\Desktop\hackathons\sui-overflow\application\actions\auth.ts`

```
'use server'

- getCurrentSession(): reads session from Enoki → queries DB for gamedev + publishers → returns { suiAddress, publishers }
- No explicit login/logout needed — Enoki handles JWT session client-side
```

---

## Phase 4 — Server Actions (8 files)

All server actions follow the same pattern:
```
'use server'
1. Validate input (Zod)
2. Auth check (Enoki session / publisher ownership)
3. DB operations via Drizzle
4. Sui PTB operations via suiClient + enokiClient
5. Revalidation + return result
```

### 11. `actions/publisher.ts`
| Action | Type | Enoki | DB Ops |
|--------|------|-------|--------|
| `createPublisher(name, logoUrl)` | Flow B | GameDev signs | Insert into `publishers` + `gamedevs` |
| `getMyPublishers()` | Query | Session | SELECT publishers WHERE dev_id = session gamedev |
| `getPublisherDetail(id)` | Query | — | SELECT publisher + gameCount |

### 12. `actions/game.ts`
| Action | Type | Enoki | DB Ops |
|--------|------|-------|--------|
| `createGame(publisherId, data)` | — | — | INSERT INTO games (draft) |
| `updateGame(gameId, data)` | — | — | UPDATE games WHERE draft |
| `publishGame(gameId, txBytes)` | Flow B | GameDev signs PTB | UPDATE game status=published, generate API key |
| `deleteGame(gameId)` | — | — | DELETE games + item_templates WHERE draft |
| `getGames(publisherId)` | Query | — | SELECT games |
| `getGameDetail(gameId)` | Query | — | SELECT game + item counts |

### 13. `actions/item.ts`
| Action | Type | DB Ops |
|--------|------|--------|
| `saveItemDraft(gameId, data)` | — | INSERT/UPDATE item_templates |
| `deleteItemDraft(itemId)` | — | DELETE item_templates WHERE draft |
| `getItems(gameId)` | Query | SELECT item_templates |
| `getItemDetail(itemId)` | Query | SELECT item_template |

### 14. `actions/claim.ts`
| Action | Type | Enoki | DB Ops |
|--------|------|-------|--------|
| `getClaimInfo(code)` | Query | — | SELECT claim_codes + item_templates |
| `redeemClaimCode(code, playerAddress)` | Flow A | Platform signs | `SELECT ... FOR UPDATE` → validate → mint PTB → UPDATE claimed_at |

### 15. `actions/marketplace.ts`
| Action | Type | Enoki |
|--------|------|-------|
| `listForSale(itemId, price, royaltyBps)` | Flow B | GameDev signs |
| `buyItem(kioskId, itemId, price)` | Flow B | Buyer signs |
| `createEscrow(itemId, conditions, counterparty?)` | Flow B | Initiator signs |
| `fulfillEscrow(escrowId, myItemId)` | Flow B | Fulfiller signs |
| `fulfillEscrowWithValue(escrowId, myItemId, topup)` | Flow B | Fulfiller signs |
| `cancelEscrow(escrowId)` | Flow B | Initiator signs |
| `getMarketplaceListings(filters)` | Query | — |
| `getListingDetail(listingId)` | Query | — |

### 16. `actions/api-keys.ts`
| Action | Type | DB Ops |
|--------|------|--------|
| `generateApiKey(gameId)` | — | Generate random key → hash → INSERT api_keys → return raw key (shown once) |
| `revokeApiKey(keyId)` | — | UPDATE is_active = false |
| `getApiKeys(gameId)` | — | SELECT keys (masked prefixes only) |

### 17. `actions/analytics.ts`
| Action | DB Ops |
|--------|--------|
| `getPublisherAnalytics(publisherId, timeRange)` | Aggregated queries on tx_events + claim_codes |
| `getPublisherActivity(publisherId, filters)` | Paginated tx_events with filters |

### 18. `actions/admin.ts`
| Action | Enoki | Contract |
|--------|-------|----------|
| `verifyPublisher(publisherId)` | Flow A | `registry::verify_publisher` |
| `pauseGame(gameId)` | Flow A | `registry::pause_game` |
| `resumeGame(gameId)` | Flow A | `registry::resume_game` |

---

## Phase 5 — Hono External API (1 file)

### 19. `app/api/[[...route]]/route.ts`
**Path:** `C:\Users\aryhi\Desktop\hackathons\sui-overflow\application\app\api\[[...route]]\route.ts`

Hono app mounted on Next.js API route catch-all:

| Endpoint | Method | Validation | Action |
|----------|--------|------------|--------|
| `/api/v1/game/:gameId/item/mint` | POST | API Key → game active → template exists | Create claim_code → return `{ claim_url }` |
| `/api/v1/game/:gameId/item/burn` | POST | API Key → game active | Flow A: burn item on-chain |
| `/api/v1/game/:gameId/inventory/:address` | GET | API Key | Query on-chain items for this game |
| `/api/v1/game/:gameId/item/:itemId` | GET | API Key | Query on-chain item detail |

API Key validation:
```typescript
async function validateApiKey(gameId: string, bearer: string) {
  // SELECT api_keys WHERE game_id = gameId AND key_hash = hash(bearer) AND is_active = true
  // If not found → 401
}
```

Claim URL format: `http://localhost:3000/claim?code=XK92-BH4M`

---

## Phase 6 — Event Indexer (1 file)

### 20. `lib/sui/event-indexer.ts`
**Path:** `C:\Users\aryhi\Desktop\hackathons\sui-overflow\application\lib\sui\event-indexer.ts`

Background process (started at server boot or as separate script):

```typescript
export async function startEventIndexer() {
  for await (const event of suiClient.subscriptionService.subscribeEvents({
    filter: { MoveEventModule: { package: PACKAGE_ID, module: '*' } },
  })) {
    // Parse event type
    // Upsert to tx_events
    // If EscrowCreated → INSERT escrow_index
    // If EscrowFulfilled/Cancelled → UPDATE escrow_index
    // If ItemMinted → UPSERT item_cache (fetch metadata from Walrus by blob_id)
  }
}
```

Started via:
```typescript
// app/indexer/route.ts or server.ts
if (process.env.START_INDEXER === 'true') startEventIndexer()
```

---

## Phase 7 — Walrus (1 file, optional for MVP)

### 21. `lib/walrus/harbor.ts`
**Path:** `C:\Users\aryhi\Desktop\hackathons\sui-overflow\application\lib\walrus\harbor.ts`

Server-side Walrus upload/download via Harbor HTTP API:
```typescript
export async function uploadBlob(data: Buffer): Promise<string> {
  const res = await fetch(WALRUS_HARBOR_URL + '/v1/blobs', {
    method: 'PUT',
    body: data,
    headers: { 'Content-Type': 'application/octet-stream' },
  })
  const { blobId } = await res.json()
  return blobId // Used as blob_id in GameItem
}

export async function readBlob(blobId: string): Promise<Buffer> {
  const res = await fetch(WALRUS_HARBOR_URL + `/v1/blobs/${blobId}`)
  return Buffer.from(await res.arrayBuffer())
}
```

---

## Execution Order

```
Phase 1: docker-compose.yml → .env.local → drizzle.config.ts → schema.ts → db/index.ts
              ↓
        docker compose up -d → bun run db:generate → bun run db:migrate
              ↓
Phase 2: sui/client.ts → enoki-client.ts → ptb-builder.ts
              ↓ (PACKAGE_ID + ENOKI_KEY needed for full function)
Phase 3: providers.tsx → auth.ts
              ↓ (ENOKI_PUBLIC_KEY + GOOGLE_CLIENT_ID needed)
Phase 4: publisher.ts → game.ts → item.ts → claim.ts → marketplace.ts → api-keys.ts → analytics.ts → admin.ts
              ↓
Phase 5: Hono route.ts
              ↓
Phase 6: event-indexer.ts
              ↓
Phase 7: walrus/harbor.ts
```

## Key Decisions for Implementation

| # | Decision | Rationale |
|---|----------|-----------|
| BD1 | No app Dockerfile — `bun run dev` on host | Windows + WSL localnet; simpler dev loop |
| BD2 | PostgreSQL standalone container | Only infra dep needed; Start with `docker compose up -d` |
| BD3 | Server Actions at `actions/*.ts` (flat) | Flat structure is simpler; no nested `/actions/auth/` |
| BD4 | Flow A helper in `enoki-client.ts` | Reuse across claim, admin, publish server actions |
| BD5 | `suiClient` singleton from `SuiGrpcClient` | Switchable between testnet/localnet via env |
| BD6 | relations v1 (stable) in schema | `drizzle-orm@0.45.2` installed; v1 is stable |
| BD7 | Hono mounted on Next.js catch-all route | Single `route.ts` for all external endpoints |
| BD8 | Event indexer as optional startup flag | Non-blocking for MVP; skip if gRPC not available |
| BD9 | No Walrus upload in MVP phase 1 | Publish flow not needed immediately; claim flow uses stored blob_ids |
| BD10 | `SELECT ... FOR UPDATE` for claim code | Race condition prevention; within transaction |
