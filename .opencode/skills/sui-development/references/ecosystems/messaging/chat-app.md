# Messaging SDK Chat App Example

End-to-end encrypted group chat app using React + Rust relayer + Move contracts + Seal + Walrus.

## Architecture

React frontend handles wallet connection, message encryption/decryption, group management. Rust/Axum relayer stores encrypted messages, verifies signatures, checks permissions via cached membership, batches to Walrus. Move contracts manage groups, permissions, DEK history, and Seal access control.

## Prerequisites

- Sui CLI, Node.js 18+, Rust toolchain
- Sui wallet (Slush recommended — zkLogin NOT supported)
- Groups SDK package IDs: Testnet `0xba8a26...de79`, Mainnet `0x541840...ba8`

## Setup

```bash
git clone https://github.com/MystenLabs/sui-stack-messaging.git
cd sui-stack-messaging

# Build TS SDK
cd ts-sdks && pnpm install && pnpm build

# Configure frontend
cd ../chat-app && pnpm install && cp .env.example .env
# Fill: VITE_SUI_NETWORK, VITE_SUI_RPC_URL, VITE_RELAYER_URL
# Fill: VITE_WALRUS_PUBLISHER_URL, VITE_WALRUS_AGGREGATOR_URL
# Fill: VITE_WALRUS_EPOCHS, VITE_SEAL_KEY_SERVER_OBJECT_IDS (>=2)

# Start relayer
cd ../relayer && cp .env.example .env
# Fill: SUI_RPC_URL, GROUPS_PACKAGE_ID
cargo run  # localhost:3000

# Start frontend (separate terminal)
cd ../chat-app && npm run dev  # localhost:5173
```

## Usage

1. Open `localhost:5173`, connect Slush wallet (passphrase/imported, NOT zkLogin)
2. Click **+ New** to create group (add your address as member)
3. Type message + Enter to send
4. Click **Attach files** for encrypted file uploads (max 10 files, 5MB each)

## Key Code Highlights

- **Seal access control:** `seal_approve_reader` checks MessagingReader permission + encryption history belongs to correct group
- **Key rotation:** `rotate_encryption_key` appends new DEK version onchain (requires EncryptionKeyRotator permission)
- **Encryption history:** `EncryptionHistory` struct stores versioned encrypted DEKs as TableVec on shared object
- **useMessages hook:** Manages full lifecycle — send (encrypt → sign → POST to relayer), receive (poll → decrypt), error states

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| Permission denied (403) | Membership cache stale | Restart relayer, verify onchain |
| Decryption fails | Session key expired (10min TTL) | Refresh page |
| Group not in sidebar | GraphQL event indexer lag | Wait, refresh, check GraphQL URL |
| File attachment fails | Size >5MB or publisher unreachable | Check limits, check publisher URL |
| Invalid key servers (threshold) | Need >=2 Seal server IDs | Add more IDs |
| zkLogin signature flag error | zkLogin wallet not supported | Use passphrase wallet |
| App disappears after connect | Unsupported wallet | Restart, use Slush |

## Sources

- https://docs.sui.io/sui-stack/messaging/chat-app
- https://github.com/MystenLabs/sui-stack-messaging
