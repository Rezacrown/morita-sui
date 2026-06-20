# Testnet Deployment Guide — Morita (Updated)

## Prerequisites
- Sui CLI v1.73.0 (installed via linuxbrew di WSL)
- Admin wallet: `0x8aabd8a2fe756e6a13744382d193541ea4be72e022d61b130bea7c7df017bb47` (harus di-fund)
- Neon DB udah connect (`bun run db:push` sukses)

---

## Step 1 — Setup WSL + Testnet

```bash
# Masuk WSL
wsl
cd ~/Desktop/hackathons/sui-overflow/contract

# Cek current env, pastiin testnet
sui client active-env

# Kalau belum testnet:
sui client new-env --alias testnet --rpc https://rpc.testnet.sui.io:443
sui client switch --env testnet
```

---

## Step 2 — Uncomment Testnet di Move.toml

Edit `contract/Move.toml`:

```toml
[environments]
testnet = "testnet"       # <- uncomment ini
devnet = "devnet"
local = "local"
```

---

## Step 3 — Get Testnet SUI untuk Admin Wallet

```bash
# Cek balance
sui client gas --address 0x8aabd8a2fe756e6a13744382d193541ea4be72e022d61b130bea7c7df017bb47

# Kalo 0, faucet (repeat 2-3x)
curl -X POST https://faucet.testnet.sui.io/v1/gas \
  -H "Content-Type: application/json" \
  -d '{"FixedAmountRequest":{"recipient":"0x8aabd8a2fe756e6a13744382d193541ea4be72e022d61b130bea7c7df017bb47"}}'
```

---

## Step 4 — Build + Publish Contract

```bash
# Build dulu
sui move build

# Publish ke testnet
sui client publish --gas-budget 50000000
```

**Output — catat ini:**
```
Package ID: 0x<NEW_PACKAGE_ID>
...
Created Objects:
  - 0x<ADMIN_CAP_ID> (AdminCap)
  - 0x<PUBLISHER_ID> (Publisher — dari OTW init)
```

3 IDs yang dicatat:
| ID | Variable `.env.local` |
|----|----------------------|
| `Package ID` | `NEXT_PUBLIC_PACKAGE_ID` |
| `AdminCap ID` | `NEXT_PUBLIC_ADMIN_CAP` |
| `Publisher ID` | (dipakai di Step 5) |

---

## Step 5 — Deploy TransferPolicy for GameItem

```bash
# Ganti <NEW_PACKAGE_ID> dan <PUBLISHER_ID> sesuai hasil publish
sui client ptb \
  --move-call <NEW_PACKAGE_ID>::kiosk_ext::create_transfer_policy <PUBLISHER_ID> \
  --gas-budget 20000000
```

Catat **TransferPolicy ID** (dari `Created Objects`) → `NEXT_PUBLIC_TRANSFER_POLICY_ID`

---

## Step 6 — Update `.env.local`

Buka `application/.env.local`, ganti:

```env
NEXT_PUBLIC_PACKAGE_ID=<NEW_PACKAGE_ID>
NEXT_PUBLIC_ADMIN_CAP=<ADMIN_CAP_ID>
NEXT_PUBLIC_TRANSFER_POLICY_ID=<TRANSFER_POLICY_ID>
```

---

## Step 7 — Update Enoki Portal Whitelist

Buka https://portal.enoki.mystenlabs.com

**Allowed Move Call Targets** — tambah 18 target (ganti `<PACKAGE>` dengan Package ID baru):

```
<PACKAGE>::registry::create_publisher
<PACKAGE>::registry::initiate_publish
<PACKAGE>::registry::finalize_publish
<PACKAGE>::registry::update_game
<PACKAGE>::registry::verify_publisher
<PACKAGE>::registry::pause_game
<PACKAGE>::registry::resume_game
<PACKAGE>::item::mint
<PACKAGE>::item::burn
<PACKAGE>::kiosk_ext::list_for_sale
<PACKAGE>::kiosk_ext::buy_item
<PACKAGE>::kiosk_ext::create_transfer_policy
<PACKAGE>::escrow::lock_item_for_any
<PACKAGE>::escrow::lock_item_for_target
<PACKAGE>::escrow::fulfill_escrow
<PACKAGE>::escrow::fulfill_escrow_with_value
<PACKAGE>::escrow::cancel_escrow
0x2::kiosk::new
```

**Allowed Addresses** — tambah:
```
0x8aabd8a2fe756e6a13744382d193541ea4be72e022d61b130bea7c7df017bb47
```

---

## Step 8 — Jalanin App

```bash
cd application
bun run dev
```

Buka http://localhost:3000 → login → modal "Create Workspace" muncul → sukses.

---

## Kalau Gagal

| Error | Kemungkinan | Fix |
|-------|-------------|-----|
| `403` dari Enoki | Whitelist belum keupdate | Cek Step 7 |
| `InsufficientGas` | Admin wallet kosong | Faucet lagi (Step 3) |
| `Package not found` | Package ID salah | Cek Step 4 output |
| `db:push` error | `.env` gak kebaca | `bun --env-file=.env.local run db:push` |
