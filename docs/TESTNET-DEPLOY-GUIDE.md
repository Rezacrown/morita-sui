# Testnet Deployment Guide — Morita Contracts

## Prerequisites
- Sui CLI v1.73.0 (installed via linuxbrew di WSL)
- Admin wallet sudah di-fund dari faucet: `0x8aabd8a2fe756e6a13744382d193541ea4be72e022d61b130bea7c7df017bb47`
- Move contracts sudah fix (6 issues resolved)

---

## Step 1 — Setup Testnet Environment

```bash
# Masuk WSL
wsl

# Cek current env
sui client active-env

# Kalau belum testnet:
sui client new-env --alias testnet --rpc https://rpc.testnet.sui.io:443
sui client switch --env testnet
```

---

## Step 2 — Update Move.toml with Testnet

```bash
# Di contract/Move.toml, pastikan [environments] punya testnet
sui move build --build-env testnet
```

> **Note:** Move.toml harus punya entry `testnet = "testnet"` di `[environments]`.

---

## Step 3 — Get Testnet SUI for Admin Wallet

```bash
# Cek balance dulu
sui client gas --address 0x8aabd8a2fe756e6a13744382d193541ea4be72e022d61b130bea7c7df017bb47

# Kalau 0, faucet
curl -X POST https://faucet.testnet.sui.io/v1/gas \
  -H "Content-Type: application/json" \
  -d '{"FixedAmountRequest":{"recipient":"0x8aabd8a2fe756e6a13744382d193541ea4be72e022d61b130bea7c7df017bb47"}}'
```

Repeat 2-3x biar dapet cukup gas (publish butuh ~50 MIST).

---

## Step 4 — Publish Contract

```bash
# Switch ke testnet
sui client switch --env testnet

# Publish
sui client publish --gas-budget 50000000
```

Output akan nampilin:

```
Transaction Digest: ...
╭──────────────────────────────────────────────────────╮
│ Package ID: 0x<new_package_id>                       │
│ Object Changes:                                       │
│   - Created: 0x<admin_cap_id> (AdminCap)             │
╰──────────────────────────────────────────────────────╯
```

**Catat:**
- `Package ID` — ganti `NEXT_PUBLIC_PACKAGE_ID` di `.env.local`
- `AdminCap ID` — simpan untuk admin operations

---

## Step 5 — Deploy TransferPolicy for GameItem

Setelah publish, TransferPolicy harus di-deploy agar `kiosk_ext::buy_item` bisa jalan:

### Create script
```bash
mkdir -p contract/scripts
```

Buat file `contract/scripts/deploy_tp.move` (atau langsung via PTB di TypeScript):

### Atau deploy via Sui CLI PTB:
```bash
# Ganti <PACKAGE_ID> dan <ADMIN_ADDR> sesuai hasil publish
sui client ptb \
  --assign tp @0x0 \
  --move-call <PACKAGE_ID>::kiosk_ext::create_transfer_policy \
  --assign admin_cap @<ADMIN_CAP_ID> \
  --gas-budget 20000000
```

> **Note:** Kalau `create_transfer_policy` belum ada di `kiosk_ext.move`, tambahkan fungsi berikut di `kiosk_ext.move`:

```move
public fun create_transfer_policy(ctx: &mut TxContext): TransferPolicy<GameItem> {
    transfer_policy::new<GameItem>(ctx)
}
```

---

## Step 6 — Update .env.local

```env
NEXT_PUBLIC_SUI_NETWORK=testnet
NEXT_PUBLIC_PACKAGE_ID=<package_id_dari_step_4>
NEXT_PUBLIC_TRANSFER_POLICY_ID=<transfer_policy_id_dari_step_5>
ADMIN_PRIVATE_KEY=suiprivkey1qp6lddxyvkrews...
NEXT_PUBLIC_PLATFORM_ADDR=0x8aabd8a2fe756e6a13744382d193541ea4be72e022d61b130bea7c7df017bb47
```

---

## Step 7 — Update Enoki Portal Whitelist

Di https://portal.enoki.mystenlabs.com, update **Allowed Move Call Targets** dengan Package ID baru:

```
<NEXT_PUBLIC_PACKAGE_ID>::registry::create_publisher
<NEXT_PUBLIC_PACKAGE_ID>::registry::initiate_publish
<NEXT_PUBLIC_PACKAGE_ID>::registry::finalize_publish
<NEXT_PUBLIC_PACKAGE_ID>::registry::update_game
<NEXT_PUBLIC_PACKAGE_ID>::registry::verify_publisher
<NEXT_PUBLIC_PACKAGE_ID>::registry::pause_game
<NEXT_PUBLIC_PACKAGE_ID>::registry::resume_game
<NEXT_PUBLIC_PACKAGE_ID>::item::mint
<NEXT_PUBLIC_PACKAGE_ID>::item::burn
<NEXT_PUBLIC_PACKAGE_ID>::kiosk_ext::list_for_sale
<NEXT_PUBLIC_PACKAGE_ID>::kiosk_ext::buy_item
<NEXT_PUBLIC_PACKAGE_ID>::escrow::lock_item_for_any
<NEXT_PUBLIC_PACKAGE_ID>::escrow::lock_item_for_target
<NEXT_PUBLIC_PACKAGE_ID>::escrow::fulfill_escrow
<NEXT_PUBLIC_PACKAGE_ID>::escrow::fulfill_escrow_with_value
<NEXT_PUBLIC_PACKAGE_ID>::escrow::cancel_escrow
```

Also add `0x8aabd8a2fe756e6a13744382d193541ea4be72e022d61b130bea7c7df017bb47` ke **Allowed Addresses**.

---

## Step 8 — Verify

```bash
# Cek object di testnet explorer
sui client object <TRANSFER_POLICY_ID>
sui client object <ADMIN_CAP_ID>

# Buka di browser:
https://testnet.suiscan.xyz/object/<PACKAGE_ID>
```

---

## Rollback (Kalau Gagal)

```bash
# Ganti env
sui client switch --env devnet

# Publish ulang dengan gas lebih besar
sui client publish --gas-budget 100000000
```
