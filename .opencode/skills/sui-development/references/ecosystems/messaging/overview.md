# Messaging SDK — E2E Encrypted Group Chat on Sui

The Messaging SDK provides end-to-end encrypted, permissioned group messaging on Sui. Messages are encrypted client-side with AES-256-GCM, keys managed through Seal threshold encryption, ciphertext archived to Walrus.

## Architecture

Four independent services:

| Service | Purpose | Who Runs It |
|---------|---------|-------------|
| Sui RPC (gRPC) | Chain reads + tx submission | Public or your own |
| Relayer | Accepts ciphertext, indexes membership, serves messages | You run it |
| Seal key servers | Threshold-encrypt/decrypt DEKs | Mysten Labs canonical allowlist |
| Walrus (optional) | Stores encrypted file bytes | Public Testnet or your own |

## Envelope Encryption

Two-layer encryption:
1. **DEK layer (Seal):** Random AES-256 Data Encryption Key, encrypted with Seal, stored onchain in EncryptionHistory. Key rotation appends new versions.
2. **Message layer (AES-256-GCM):** Fetch encrypted DEK → decrypt via Seal (verifies MessagingReader permission) → encrypt message with plaintext DEK.

## Permissioned Groups

`PermissionedGroup<Messaging>` shared objects with 7 permission types: MessagingReader, MessagingSender, MessagingEditor, MessagingDeleter, EncryptionKeyRotator, GroupManager, Admin.

## Key Rotation

Always use `removeMembersAndRotateKey()` — atomically removes member and rotates DEK. Removed members can't decrypt new messages. Old messages remain accessible.

## Package

```bash
pnpm add @mysten/sui-stack-messaging @mysten/sui-groups @mysten/seal @mysten/sui @mysten/bcs
```

Peer deps: @mysten/sui-groups, @mysten/seal (^1.1.0), @mysten/sui (^2.6.0), @mysten/bcs (^2.0.2)

## Sources

- https://docs.sui.io/sui-stack/messaging
- https://docs.sui.io/sui-stack/messaging/installation
