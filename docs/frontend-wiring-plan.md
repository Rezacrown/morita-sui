# Implementation Plan: Frontend Wiring (Bertahap)

> Goal: Replace all MOCK data + mock behavior in pages with real server actions + on-chain transactions.
> Pattern: Setiap fase selesai → build verify → aku report apa yang berubah + impact.

---

## Phase 1 — Dashboard: Game + Item + API Key CRUD (DB only, no PTB)

**Target:** 4 halaman dashboard — semua operasi yang **tidak** butuh PTB/transaksi.

| Step | File | Perubahan | Impact |
|------|------|-----------|--------|
| 1 | `app/(dashboard)/dashboard/games/page.tsx` | Ganti `MOCK_GAMES` → panggil `list(publisherId)` dari `actions/game.ts`. Tombol "Create Game" panggil `create()` | Game list & create jadi real DB |
| 2 | `app/(dashboard)/dashboard/games/[game_id]/items/page.tsx` | Ganti `MOCK_ITEMS` + `MOCK_DRAFT_ITEMS` → panggil `list(gameId)` dari `actions/item.ts` | Item list jadi real DB |
| 3 | `app/(dashboard)/dashboard/games/[game_id]/items/[item_id]/page.tsx` | Ganti MOCK → panggil `detail(itemId)`. Tombol "Save" panggil `save()`. Tombol "Delete" panggil `del()` | Draft CRUD jadi real DB |
| 4 | `app/(dashboard)/dashboard/games/[game_id]/api-keys/page.tsx` | Ganti `MOCK_API_KEYS` → panggil `getKeys()`. Tombol "Generate" panggil `createKey()`. Tombol "Revoke" panggil `revokeKey()` | API key management jadi real |

---

## Phase 2 — Game Detail + Publish Game (PTB via `executeAsPlatform`)

**Target:** Game detail page + publish flow.

| Step | File | Perubahan | Impact |
|------|------|-----------|--------|
| 5 | `app/(dashboard)/dashboard/games/[game_id]/page.tsx` | Ganti MOCK → panggil `detail(gameId)`, `listItems(gameId)`. Tombol "Publish" panggil `publish()` dari `actions/game.ts` | Game detail real, publish flow real |

**Catatan:** Publish game butuh `executeAsPlatform` (admin sign) karena platform yang punya `GameCapability`. Tapi publisnya sendiri adalah 2-step PTB (`initiate_publish` + `finalize_publish`) yang di-sign oleh **gamedev** (publisher owner). Jadi ini hybrid — butuh `useTransaction`.

---

## Phase 3 — Claim Flow (Flow Platform-Execute)

**Target:** Halaman claim — validasi code + mint item.

| Step | File | Perubahan | Impact |
|------|------|-----------|--------|
| 6 | `app/(hub)/claim/page.tsx` | Ganti `MOCK_CLAIM_CODES` → panggil `claimInfo(code)` dari `actions/item.ts`. Tombol "Claim" panggil `redeemCode(code, address)` dari `actions/claim.ts` | Claim flow real — item beneran di-mint ke player |
| 7 | `stores/claim-store.ts` | Hapus mock `claim()`, sisakan state aja (loading/success/error) | Store jadi pure state container |

---

## Phase 4 — Marketplace + Inventory (DB query + User-Signed PTB)

**Target:** 3 halaman hub — browsing, listing, escrow.

| Step | File | Perubahan | Impact |
|------|------|-----------|--------|
| 8 | `app/(hub)/marketplace/page.tsx` | Ganti `MOCK_LISTINGS` → panggil `getMarketplaceListings()`. Wiring "Buy Now" dengan `useTransaction` + `ptb.buyItem()` | Marketplace real |
| 9 | `app/(hub)/inventory/page.tsx` | Ganti `MOCK_ITEMS` → query on-chain. Wiring "Sell" dengan `useTransaction` + `ptb.listForSale()`. Wiring "Barter" dengan modal + `ptb.lockForAny()` | Inventory real, sell & barter from UI |
| 10 | `app/(hub)/inventory/[itemId]/page.tsx` | Sama seperti inventory page (sell/barter) | Item detail real |
| 11 | `app/(hub)/barter/[id]/page.tsx` | Ganti `MOCK_ESCROWS` → panggil `getListingDetail()`. Wiring "Fulfill" + "Cancel" dengan `useTransaction` + `ptb.fulfill()` / `ptb.cancel()` | Barter flow real |

---

## Phase 5 — Dashboard Sisa (Analytics, Activity, Settings, Overview)

**Target:** 4 halaman dashboard sisa.

| Step | File | Perubahan | Impact |
|------|------|-----------|--------|
| 12 | `app/(dashboard)/dashboard/analytics/page.tsx` | Ganti MOCK → query dari `txEvents` table | Analytics real |
| 13 | `app/(dashboard)/dashboard/activity/page.tsx` | Ganti MOCK → query dari `txEvents` table | Activity real |
| 14 | `app/(dashboard)/dashboard/settings/page.tsx` | Ganti MOCK → panggil `getSession()` + simpan settings | Settings real |
| 15 | `app/(dashboard)/dashboard/page.tsx` | Ganti MOCK games + activity → panggil `list()` + activity | Overview real |

---

## Phase 6 — History (Gamer)

**Target:** 1 halaman gamer history.

| Step | File | Perubahan | Impact |
|------|------|-----------|--------|
| 16 | `app/(hub)/history/page.tsx` | Ganti `MOCK_TX_EVENTS` → query dari `txEvents` table | History real |

---

## Summary

| Phase | Files | Sifat |
|-------|-------|-------|
| 1 — Dashboard CRUD | 4 pages | DB only, no PTB |
| 2 — Publish Game | 1 page | PTB (gamedev sign via `useTransaction`) |
| 3 — Claim Flow | 1 page + 1 store | Platform-execute (admin sign, udah di `claim-service.ts`) |
| 4 — Marketplace | 4 pages | DB query + PTB (player sign via `useTransaction`) |
| 5 — Dashboard Sisa | 4 pages | DB query |
| 6 — History | 1 page | DB query |

**Total: 16 pages**

---

## Cara Kerja

Setiap fase:
1. Aku bilang "Mulai Phase X"
2. Aku kerjain semua file di fase itu
3. `bun run build` — verify
4. Aku report: file apa yang berubah, apa impact-nya
5. Kamu test di browser
6. Kalau ok, lanjut fase berikutnya

Mau mulai Phase 1?
