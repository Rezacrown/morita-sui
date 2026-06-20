# Morita — Remaining Tasks for Team

> Tasks sorted by priority. Pick one, claim it, ship it.

---

## 🔴 HIGH PRIORITY — Core Functionality Gaps

### 1. Walrus Image Upload (Frontend + Server Action)

| | |
|---|---|
| **What** | Add file upload for item images in the item create/edit page. Upload to Walrus, store blobId in DB. |
| **Files** | NEW `actions/walrus.ts`, `app/(dashboard)/dashboard/games/[game_id]/items/[item_id]/page.tsx` |
| **Existing** | `lib/walrus/index.ts` (upload + getBlobUrl ready), `itemTemplates.imageBlobId` field ready, Walrus plugin via `$extend` ready |
| **TODO** | Create server action that accepts FormData → converts to buffer → calls `uploadItemImage()` → returns blobId. Add file input + preview in item form. On save, upload first then save draft with imageBlobId. |
| **Guide** | `docs/WALRUS-INTEGRATION-PLAN.md` |
| **Estimate** | ~2 hours |

### 2. Item Display Images (Frontend)

| | |
|---|---|
| **What** | Show item images from Walrus in ItemCard, ItemDetail, EscrowCard, ListingRow components |
| **Files** | `components/shared/item-card.tsx`, `components/shared/item-detail.tsx`, `components/shared/escrow-card.tsx`, `components/shared/listing-row.tsx` |
| **Existing** | `getBlobUrl(blobId)` ready |
| **TODO** | Check if `imageBlobId` or `offerItemBlobId` exists → render `<img src={getBlobUrl(blobId)} />` instead of placeholder SVG |
| **Estimate** | ~30 minutes |

### 3. Hono API Stubs → Real Implementations

| | |
|---|---|
| **What** | 3 Hono API endpoints return empty data. Implement real on-chain queries. |
| **Files** | `app/api/[[...route]]/route.ts` |
| **Stubs remaining** | `POST /burn` (call `ptb.burn()` via `executeAsAdmin`), `GET /inventory/:address` (call `suiClient.listOwnedObjects()` filter by GameItem), `GET /item/:itemId` (call `suiClient.getObject()`) |
| **Existing** | `ptb.burn()`, `executeAsAdmin()`, `suiClient` all ready |
| **Estimate** | ~1 hour |

---

## 🟡 MEDIUM PRIORITY — UX & Polish

### 4. Fulfill Barter — Item Picker Upgrade

| | |
|---|---|
| **What** | Fulfill barter page currently has a text input for item object ID. Replace with a dropdown of user's on-chain GameItems. |
| **Files** | `app/(hub)/barter/[id]/page.tsx`, `actions/inventory.ts` |
| **Existing** | `getInventory(suiAddress)` already queries owned GameItems |
| **TODO** | Fetch user's inventory on mount → render `<select>` with item options → use selected objectId for `fulfill()` PTB |
| **Estimate** | ~30 minutes |

### 5. Dashboard Analytics — Fix Placeholder Zeroes

| | |
|---|---|
| **What** | Analytics page shows `Total Items: 0` and `Tx Volume: 0 SUI`. Query real data from DB. |
| **Files** | `app/(dashboard)/dashboard/analytics/page.tsx` |
| **TODO** | `Total Items` → count `itemTemplates` where `gameId` IN user's games. `Items per game` → same per-row. `Tx Volume` stays 0 (needs event indexer). |
| **Estimate** | ~30 minutes |

### 6. Dashboard Activity — Show Real DB Events

| | |
|---|---|
| **What** | Activity page says "Coming soon". Show recent claim redemptions + escrow changes from existing DB tables. |
| **Files** | `app/(dashboard)/dashboard/activity/page.tsx`, `services/game-service.ts` or new `services/activity-service.ts` |
| **Existing** | `claimCodes` table has `claimedAt`, `claimedBy`. `escrowIndex` has `fulfilledAt`, `cancelledAt`. |
| **TODO** | Query recent activity from these tables → render table with timestamp, event type, details |
| **Estimate** | ~1 hour |

---

## 🟢 LOW PRIORITY — Nice to Have

### 7. Create Publisher Button in Dashboard Settings

| | |
|---|---|
| **What** | Currently workspace creation is auto-triggered on first login. Add a manual button in Settings to create additional publishers. |
| **Files** | `app/(dashboard)/dashboard/settings/page.tsx` |
| **Existing** | `createPublisher()` PTB builder ready, `CreateWorkspaceModal` component ready |
| **Estimate** | ~30 minutes |

### 8. Event Indexing for Activity Log

| | |
|---|---|
| **What** | Set up gRPC subscription to capture on-chain events (ItemMinted, ItemSold, EscrowFulfilled, etc.) and write to `tx_events` table. |
| **Files** | NEW background worker (Hono route or standalone script) |
| **Existing** | `tx_events` table schema ready, `subscriptionService.subscribeEvents()` from gRPC client |
| **TODO** | Create subscription → filter by Package ID → parse event json → insert into `tx_events` |
| **Estimate** | ~2 hours |

### 9. Loading States & Error Boundaries

| | |
|---|---|
| **What** | Some pages lack loading skeletons or error boundaries. Add Suspense fallbacks and error.tsx pages. |
| **Files** | Various pages in `app/` |
| **Estimate** | ~1 hour |

### 10. Migrate from Neon to Local PostgreSQL (or Keep Neon)

| | |
|---|---|
| **What** | Current DB is on Neon (hosted). Team needs access — either share Neon credentials or switch to docker-compose PostgreSQL. |
| **Files** | `.env.local` |
| **Existing** | `docker-compose.yml` has PostgreSQL ready |
| **Estimate** | ~15 minutes |

---

## 🏗️ DONE — Don't Touch

These are already implemented:

- ✅ Auth: Google OAuth + zkLogin (server-side ZKP proxy, no EnokiFlow on client)
- ✅ Create Workspace (auto-modal on first login, Flow B)
- ✅ Game CRUD (create, update, delete — draft in DB)
- ✅ Publish Game (Flow B + on-chain Game + GameCapability + API key generation)
- ✅ Item Templates CRUD (save, edit, delete drafts)
- ✅ Claim URL Flow (Hono API generate → player opens → executeAsAdmin mint)
- ✅ Marketplace (sale + barter tabs, create barter, buy, list for sale with kiosk)
- ✅ Cancel/Fulfill Escrow (Flow B, on-chain cancel & fulfill)
- ✅ Inventory (on-chain GameItem query via `suiClient.listOwnedObjects`)
- ✅ On-Chain Items Dashboard Tab (table of minted items per game)
- ✅ Tx Status Toast + Suiscan Links (all tx digests link to suiscan.xyz)
- ✅ 11 PTB Builders (all capture return values + transferObjects)
- ✅ Landing Page (hero, how-it-works, sandbox, marketplace preview, tech bento, FAQ)
- ✅ Docs (BUSINESS-FLOW, TECHNICAL-ARCHITECTURE, AGENT-MEMORY-VAULT, TESTNET-DEPLOY, WALRUS-INTEGRATION-PLAN)
- ✅ README updated
- ✅ Tests: 15 pass, `bun run build` 0 error
