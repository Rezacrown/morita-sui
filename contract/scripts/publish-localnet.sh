#!/bin/bash
# Publish Morita contracts to Sui Localnet
# Jalankan dari WSL setelah localnet running: bash scripts/publish-localnet.sh

SUI=/home/linuxbrew/.linuxbrew/bin/sui

echo "=== Building contracts ==="
$SUI move build --build-env testnet || exit 1

echo ""
echo "=== Switching to localnet ==="
$SUI client switch --env localnet

echo ""
echo "=== Balance ==="
$SUI client gas

echo ""
echo "=== Publishing... ==="
$SUI client publish --gas-budget 50000000
