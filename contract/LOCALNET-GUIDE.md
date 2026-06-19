# Localnet Development Guide

## Architecture

```
Windows (Next.js Backend)                WSL (Sui CLI)
        │                                      │
        │  http://172.30.x.x:9000              │  sui start --force-regenesis
        │  (Sui JSON-RPC / gRPC)              │  --with-faucet
        │                                      │
        └──────────────────┬───────────────────┘
                           │
                    Sui Local Network
                    (running in WSL)
```

Karena Sui localnet berjalan di WSL, dan WSL punya IP sendiri (bukan `localhost`), backend Windows harus connecting ke IP WSL, bukan `127.0.0.1`.

## Quick Start (1x Setup)

```bash
# 1. Masuk ke WSL
wsl

# 2. Build + Start localnet
cd /mnt/c/Users/aryhi/Desktop/hackathons/sui-overflow/contract
make localnet-setup

# 3. Tunggu ~6 detik, lalu publish
make localnet-publish
```

## Connecting Backend (Windows)

Setelah localnet running, di `.env.local` file backend:

```env
NEXT_PUBLIC_SUI_NETWORK=local
SUI_RPC_URL=http://172.30.252.247:9000
SUI_GRPC_URL=http://172.30.252.247:9000
```

IP WSL bisa dicek dengan:
```bash
wsl.exe hostname -I
```

Atau langsung dari Makefile:
```bash
cd contract && make localnet-env
```

## Faucet

```bash
# Dari WSL
make localnet-faucet

# Atau dari Windows (via curl)
curl -X POST http://172.30.252.247:9123/gas ^
  -H "Content-Type: application/json" ^
  -d "{\"FixedAmountRequest\":{\"recipient\":\"<YOUR_ADDRESS>\"}}"
```

## Publish Ulang (Localnet Reset)

Localnet dengan `--force-regenesis` **menghapus semua state** setiap restart.
Package ID akan berubah setiap kali restart.

```bash
make localnet-setup     # Stop → Start → Faucet
make localnet-publish   # Deploy ulang
```

Kalau dapat error "Package already published":
```bash
rm -f Published.toml
make localnet-publish
```

## Test Publish (No State)

```bash
make localnet-test-publish
```
Ini dry-run tanpa menyimpan apapun — cocok buat cek gas estimate.

## Yang Perlu Diingat

| Item | Detail |
|---|---|
| **RPC URL (from WSL)** | `http://127.0.0.1:9000` |
| **RPC URL (from Windows)** | `http://172.30.x.x:9000` |
| **Faucet URL** | `http://172.30.x.x:9123/gas` |
| **gRPC port** | Port 9000 (same as RPC) |
| **State persistence** | ❌ Tidak persist (kecuali tanpa `--force-regenesis`) |
| **Package ID** | Berubah setiap restart localnet |
| **Chain ID** | Random setiap kali `--force-regenesis` |
| **Default epoch** | 60 detik |
