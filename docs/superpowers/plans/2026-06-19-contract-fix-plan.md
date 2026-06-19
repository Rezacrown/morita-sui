# Smart Contract Fix Plan — Morita

## Issues

### C-1: `finalize_publish` — GameCapability & GameShared event
- Tambah `platform_addr: address` param
- `GameCapability` → `platform_addr` via `transfer::public_transfer`
- `GameShared.publisher_id` → gunakan `ticket.publisher_id` (di-read sebelum ticket di-destroy)

### C-2: TransferPolicy<GameItem> missing
- Tambah `init()` function di `kiosk_ext.move` yang create default `TransferPolicy<GameItem>`
- Deployer akan hold `TransferPolicyCap<GameItem>` untuk future config

### C-3: Royalty rule tidak di-install
- Di `list_for_sale`: kalau `royalty_bps` Some, panggil `kiosk_extension::add_royalty_rule(kiosk, kiosk_owner_cap, bps, ctx)`

### C-4: Escrow conditions tidak divalidasi
- Di `fulfill_escrow` & `fulfill_escrow_with_value`: validasi `EscrowConditions` terhadap item fulfiller

### C-5: `share_escrow` terpisah → inline
- `lock_item_for_any` dan `lock_item_for_target` langsung `transfer::share_object` di dalam function

### C-6: Value-based barter SUI direction salah
- `fulfill_escrow_with_value`: SUI harus ke `escrow.initiator`, bukan di-return ke fulfiller
