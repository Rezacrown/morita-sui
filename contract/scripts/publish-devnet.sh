#!/bin/bash
# Publish Morita contracts to Sui Devnet
# Jalankan dari WSL: bash scripts/publish-devnet.sh

SUI=/home/linuxbrew/.linuxbrew/bin/sui

echo "=== Building contracts ==="
$SUI move build --build-env testnet || exit 1

echo ""
echo "=== Active env ==="
$SUI client active-env

echo ""
echo "=== Balance ==="
$SUI client gas

echo ""
echo "=== Publishing... ==="
$SUI client publish --gas-budget 50000000
