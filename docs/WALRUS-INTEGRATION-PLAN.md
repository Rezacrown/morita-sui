# Walrus Integration Plan — Item Images & Metadata

## Status
- ✅ Walrus SDK (`@mysten/walrus`) installed via `$extend` plugin pattern
- ✅ `suiClient` extended with walrus client pointing at `upload-relay.testnet.walrus.space`
- ✅ `lib/walrus/index.ts` — `uploadItemImage(buffer)` and `getBlobUrl(blobId)` implemented
- ✅ `itemTemplates.imageBlobId` + `metadataBlobId` columns in DB
- ✅ `NEXT_PUBLIC_WALRUS_AGGREGATOR` env var set
- ✅ `next.config.ts` has `serverExternalPackages: ['@mysten/walrus', '@mysten/walrus-wasm']`
- ❌ **No UI or server action wired yet** — upload never called

## Flow to Implement

### 1. Server Action (`actions/walrus.ts` — NEW)
```
uploadItemFile(formData: FormData) → Promise<{ blobId: string }>
```
- Parse file from FormData
- Convert to Uint8Array buffer
- Call `uploadItemImage(buffer)` (admin keypair signs, pays WAL storage)
- Return blobId

### 2. Item Create/Edit Page
Add file input to `app/(dashboard)/dashboard/games/[game_id]/items/[item_id]/page.tsx`:
- File picker (accept="image/*")
- Preview before upload
- On save: upload to Walrus first → get blobId → save draft with `imageBlobId`
- Show existing image from `getBlobUrl(imageBlobId)` when editing

### 3. Display Everywhere
| Component | Field | Where to Render |
|-----------|-------|-----------------|
| `ItemCard` | `imageBlobId` | `<img src={getBlobUrl(imageBlobId)} />` |
| `ItemDetail` | `imageBlobId` | Hero image section |
| `EscrowCard` | `offerItemBlobId` | Thumbnail fallback (lookup itemCache) |
| `ListingRow` | Via itemCache | Thumbnail fallback |

### 4. Metadata (Future)
JSON metadata can also be uploaded to Walrus:
- Store at `metadataBlobId`
- Include name, description, attributes, image reference
- Mint function reads `blob_id` from GameItem → client fetches metadata from Walrus aggregator

## Files to Edit/Create

| File | Action | Lines |
|------|--------|-------|
| `actions/walrus.ts` | NEW | ~20 |
| `actions/item.ts` | Add `saveWithImage(formData)` | ~10 |
| `app/(dashboard)/.../items/[item_id]/page.tsx` | Add file input + preview | ~40 |
| `components/shared/item-card.tsx` | Render image from blobId | ~5 |
| `components/shared/item-detail.tsx` | Render hero image from blobId | ~5 |

## Risk
- Walrus upload requires **admin wallet to have WAL tokens** for storage fees. Currently `sendTip: { max: 1_000 }` (1,000 MIST ≈ minimal).
- Upload is synchronous (waits for storage confirmation). For large images, could add loading state.
- `writeBlob` returns storage confirmation — verify before saving blobId to DB.

## Why Not Done Yet
Walrus upload needs admin wallet funded with WAL tokens on testnet. The admin wallet (`0x8aabd8...`) currently has testnet SUI but may not have WAL. Need to either:
1. Get WAL from testnet faucet, or
2. Use alternative storage (IPFS via Piñata) as fallback
