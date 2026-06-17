# Morita — Integration Guide

Auto-generated from `smart-contract.blueprint.yaml`, `backend.blueprint.yaml`, `database.blueprint.yaml`, `ui.blueprint.yaml`.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                         │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │ Gamer Hub    │  │ Dev Dashboard│  │ Enoki Wallet (dApp)  │ │
│  │ /inventory   │  │ /dashboard   │  │ registerEnokiWallets │ │
│  │ /marketplace │  │ /.../games   │  │ ConnectButton        │ │
│  │ /barter/:id  │  │ /.../items   │  │ auto-sign (Flow B)   │ │
│  │ /claim       │  │ /.../analytics│ │                      │ │
│  │ /history     │  │ /.../activity │  │                      │ │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘ │
│         │                  │                      │             │
│         └──────────────────┼──────────────────────┘             │
│                    SERVER ACTIONS                               │
│               (Next.js use server directive)                    │
└────────────────────────────┬───────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────┐
│                    BACKEND (Next.js + Hono)                    │
│  ┌──────────────────────┐  ┌────────────────┐                │
│  │ Server Actions        │  │ Hono API Routes│                │
│  │ (internal frontend)   │  │ (game servers) │                │
│  │ Flow A: backend-only  │  │ /api/v1/*      │                │
│  │ Flow B: client-sign   │  │                │                │
│  └──────────┬────────────┘  └───────┬────────┘                │
│             │                       │                          │
│             ▼                       ▼                          │
│  ┌──────────────────────┐  ┌────────────────┐                │
│  │ EnokiClient           │  │ gRPC Stream    │                │
│  │ (sponsor + execute)   │  │ (event indexer)│                │
│  └──────────┬────────────┘  └───────┬────────┘                │
│             │                       │                          │
└─────────────┼───────────────────────┼──────────────────────────┘
              │                       │
              ▼                       ▼
┌────────────────────┐    ┌────────────────────┐
│   SUI BLOCKCHAIN   │    │    POSTGRESQL      │
│  ┌──────────────┐  │    │  ┌──────────────┐  │
│  │ registry.move│  │    │  │ gamedevs     │  │
│  │ item.move    │  │    │  │ publishers   │  │
│  │ kiosk_ext    │  │    │  │ games        │  │
│  │ escrow.move  │──┼────┼──│ item_cache   │  │
│  └──────────────┘  │    │  │ claim_codes  │  │
│  ┌──────────────┐  │    │  │ escrow_index │  │
│  │ Walrus        │  │    │  │ tx_events    │  │
│  │ (blob store)  │  │    │  │ user_kiosks  │  │
│  └──────────────┘  │    │  │ api_keys     │  │
└────────────────────┘    │  │ item_templat.│  │
                          │  └──────────────┘  │
                          └────────────────────┘
```

---

## Layer Connections

| UI Action | Server Action | Enoki Flow | SC Function | SDK |
|---|---|---|---|---|
| connectWallet | loginWithEnoki | — | — | `@mysten/enoki` + `@mysten/dapp-kit-react` |
| createPublisher | createPublisher | Flow B | `registry::create_publisher` | Enoki auto-sign |
| createGame | createGame | — (DB only) | — | Drizzle ORM |
| publishGame | publishGame | Flow B | `registry::create_game` | Enoki auto-sign |
| saveItemDraft | saveItemDraft | — (DB only) | — | Drizzle ORM |
| listForSale | listForSale (→ buyItem) | Flow B | `kiosk_ext::list_with_royalty` | Enoki auto-sign |
| buyItem | buyItem | Flow B | `kiosk_ext::buy_item` | Enoki auto-sign |
| createBarterEscrow | createEscrow | Flow B | `escrow::lock_item_for_any` | Enoki auto-sign |
| fulfillBarter | fulfillEscrow | Flow B | `escrow::fulfill_escrow` | Enoki auto-sign |
| fulfillBarterValue | fulfillEscrowWithValue | Flow B | `escrow::fulfill_escrow_with_value` | Enoki auto-sign |
| cancelEscrow | cancelEscrow | Flow B | `escrow::cancel_escrow` | Enoki auto-sign |
| redeemClaimCode | redeemClaimCode | Flow A | `item::mint` | EnokiClient (backend) |
| generateApiKey | generateApiKey | — (DB only) | — | Drizzle ORM |
| verifyPublisher | verifyPublisher | Flow A | `registry::verify_publisher` | EnokiClient (backend) |
| pauseGame | pauseGame | Flow A | `registry::pause_game` | EnokiClient (backend) |
| resumeGame | resumeGame | Flow A | `registry::resume_game` | EnokiClient (backend) |

**External API (Hono — game servers):**

| External Caller | API Endpoint | Server Action Called | Notes |
|---|---|---|---|
| Game Server | POST `/api/v1/game/:id/item/mint` | — (creates claim_code in DB) | Does NOT mint on-chain |
| Game Server | POST `/api/v1/game/:id/item/burn` | — | Flow A: platform burns |
| Game Server | GET `/api/v1/game/:id/inventory/:addr` | — | Queries on-chain + item_cache |
| Game Server | GET `/api/v1/game/:id/item/:id` | — | Queries on-chain + item_cache |

---

## Data Flow: Publish Game (Most Complex Flow)

```
1. GameDev clicks "Publish Game" on Game Detail page
   → UI shows: ConfirmModal with item count
   
2. Frontend calls publishGame server action
   → Backend validates: game in draft, has items, user owns publisher
   
3. Backend uploads all item images to Walrus Harbor
   → POST to Harbor API for each image
   → Returns blob_id_image for each
   → Progress streamed to UI via PublishProgressBar
   
4. Backend builds metadata JSON per item
   → JSON: { name, description, image: blob_id_image, tags, attributes }
   → Uploads each JSON to Walrus Harbor
   → Returns blob_id_metadata for each
   
5. Backend stores all blob_ids in item_templates table
   → Returns item configs to frontend
   
6. Frontend builds PTB (Transaction):
   tx.moveCall({
     target: `${PACKAGE_ID}::registry::create_game`,
     arguments: [publisher, tx.pure.string(gameName)]
   })
   // Get GameCapability result → transfer to platform address
   tx.transferObjects([gameCapability], PLATFORM_ADDRESS)
   
7. Frontend: tx.build({ onlyTransactionKind: true })
   → POST txBytes to backend (publishGame server action)
   
8. Backend: EnokiClient.createSponsoredTransaction({
     network: 'testnet',
     transactionKindBytes: txBytes,
     sender: gameDevAddress,
     allowedMoveCallTargets: [`${PACKAGE_ID}::registry::create_game`],
     allowedAddresses: [PLATFORM_ADDRESS],
   })
   → Returns { bytes, digest }
   
9. Backend → Frontend: { bytes, digest }
   
10. Frontend: Enoki wallet auto-signs bytes
    → useSignTransaction({ transaction: bytes })
    → Gets signature (no user confirmation needed)
    
11. Frontend → Backend: { digest, signature }
    
12. Backend: EnokiClient.executeSponsoredTransaction({ digest, signature })
    → Transaction executes on Sui
    
13. On success — DB updates:
    → game.sui_game_id = result.game_id
    → game.game_capability_id = result.capability_id  
    → game.status = 'published'
    → item_templates.status = 'published' (all items)
    → Generate API key → store hashed in api_keys
    
14. Redirect to Game Detail with TxStatusToast "Game published!"
```

---

## Data Flow: Claim Item (Flow A)

```
1. Player opens claim URL: /claim?code=XK92-BH4M
   
2. If not logged in → Enoki wallet connect
   
3. getClaimInfo(code) fetches item preview from DB
   → UI shows: "You earned: Legendary Sword from Astral Quest"
   
4. Player clicks "Claim Item"
   
5. Frontend calls redeemClaimCode(code, playerAddress)
   
6. Backend (Flow A):
   a. BEGIN TRANSACTION
   b. SELECT ... FOR UPDATE claim_codes WHERE code = 'XK92-BH4M'
   c. Validate: exists, not expired, not claimed
   d. For NFT: check no other claim for this item_template_id
   e. Fetch item_template from DB for config
   f. Build PTB:
      tx.moveCall({
        target: `${PACKAGE_ID}::item::mint`,
        arguments: [
          gameCapability,
          tx.pure.u64(item_id),
          tx.pure.string(item_type),
          tx.pure.string(rarity),
          tx.pure.string(blob_id),
          supply_arg,
          tx.pure.address(playerAddress)
        ]
      })
   g. tx.build({ onlyTransactionKind: true })
   h. EnokiClient.createSponsoredTransaction(...)
   i. Sign with ADMIN_PRIVATE_KEY
   j. EnokiClient.executeSponsoredTransaction(...)
   k. UPDATE claim_codes SET claimed_at=now(), claimed_by=playerAddress
   l. COMMIT TRANSACTION
   
7. Return { success: true, txDigest, itemId }
   
8. UI shows: TxStatusToast → redirect to inventory
```

---

## Data Flow: Atomic Barter (Flow B)

```
1. Gamer A clicks "Barter" on Legendary Sword in inventory
   → createEscrow(itemId, conditions, counterparty?)
   
2. Flow B starts:
   a. Frontend builds PTB:
      tx.moveCall({
        target: `${PACKAGE_ID}::escrow::lock_item_for_any`,
        arguments: [item, conditions]
      })
   b. tx.build({ onlyTransactionKind: true }) → txBytes
   c. Backend: EnokiClient.createSponsoredTransaction(...)
   d. Frontend: Enoki auto-signs
   e. Backend executes
   
3. gRPC event listener picks up EscrowCreated
   → Inserts into escrow_index table
   
4. Gamer B browses marketplace → escrow_index query returns listing
   
5. Gamer B clicks "Fulfill Barter" → selects own item → confirm
   
6. fulfillEscrow(escrowId, myItemId) — same Flow B
   → PTB: escrow::fulfill_escrow(escrow_id, my_item)
   → Atomic swap executes
   
7. gRPC event: EscrowFulfilled
   → escrow_index.is_active = false
   → tx_events: both swap directions logged
```

---

## SDK / Library Requirements

| Layer | Library | Purpose |
|---|---|---|
| Frontend | `@mysten/enoki` | Enoki wallet registration + signing |
| Frontend | `@mysten/dapp-kit-react` | Wallet connection UI + hooks |
| Frontend | `@mysten/sui/transactions` | PTB construction (Flow B) |
| Frontend | `@mysten/sui/grpc` | On-chain queries (inventory, objects) |
| Frontend | `@tanstack/react-query` | Data fetching + cache |
| Frontend | `shadcn/ui` + `tailwindcss` | UI components |
| Backend | `@mysten/enoki` (EnokiClient) | Sponsored transactions (Flow A + B) |
| Backend | `@mysten/sui/transactions` | PTB construction (Flow A) |
| Backend | `@mysten/sui/grpc` | gRPC streaming + on-chain queries |
| Backend | `hono` | External API routes |
| Backend | `drizzle-orm` + `pg` | Database |
| Backend | Walrus Harbor API (HTTP) | Asset upload |
| Contracts | Sui Move (std + sui framework) | Smart contracts |
| Contracts | `0x2::kiosk` | Kiosk integration |

---

## Environment Requirements

### Enoki Setup (Before Any Code)
1. Register at https://portal.enoki.mystenlabs.com
2. Create app → get Public API Key + Private API Key
3. Configure OAuth providers (Google + Twitch) in Enoki Portal
4. Get Google OAuth Client ID from Google Cloud Console
5. Get Twitch OAuth Client ID from Twitch Developer Console

### Sui Network
- Network: `testnet`
- gRPC endpoint: `https://rpc.testnet.sui.io:443`
- Faucet: https://faucet.testnet.sui.io (for pre-funding demo players)

### Move Contracts
1. Install Sui CLI (v1.63+)
2. Create Move project with `edition = "2024"`
3. Add `0x2` dependency (Sui framework, includes Kiosk)
4. Deploy to testnet → get Package ID

### PostgreSQL
- Docker Compose: `docker compose up -d`
- Connection string in `.env.local`

### Walrus Harbor
- Harbor API endpoint (from Walrus docs)
- HTTP POST for blob upload

### .env.local
```
NEXT_PUBLIC_SUI_NETWORK=testnet
ADMIN_PRIVATE_KEY=            # Platform key for Flow A signing
NEXT_PUBLIC_ENOKI_PUBLIC_KEY=
ENOKI_SECRET_KEY=
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
NEXT_PUBLIC_TWITCH_CLIENT_ID=
WALRUS_HARBOR_URL=
DATABASE_URL=postgresql://postgres:password@localhost:5432/morita
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_PACKAGE_ID=       # After contract deployment
```
