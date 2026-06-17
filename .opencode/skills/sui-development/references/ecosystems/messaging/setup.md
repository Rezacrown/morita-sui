# Messaging SDK Setup

## Quick Setup

```typescript
import { createSuiStackMessagingClient } from '@mysten/sui-stack-messaging'
import { SuiGrpcClient } from '@mysten/sui/grpc'

const client = createSuiStackMessagingClient(
    new SuiGrpcClient({
        baseUrl: 'https://fullnode.testnet.sui.io:443',
        network: 'testnet',
    }),
    {
        seal: {
            serverConfigs: [
                { objectId: '0x...', weight: 1 },
                { objectId: '0x...', weight: 1 },
            ],
        },
        encryption: { sessionKey: { signer: keypair } },
        relayer: { relayerUrl: 'https://your-relayer.example.com' },
    },
)
```

## Namespaces

| Namespace | Purpose |
|-----------|---------|
| `client.messaging` | E2EE messaging, group creation, key rotation |
| `client.groups` | Permission management |
| `client.seal` | Seal encryption/decryption |
| `client.core` | Base Sui RPC methods |

## Manual Extension Chain

```typescript
const base = new SuiGrpcClient({...})
const withGroupsAndSeal = base.$extend(
    suiGroups({ witnessType: `${PACKAGE_ID}::messaging::Messaging` }),
    {
        name: 'seal' as const,
        register: (c) => new SealClient({ suiClient: c, serverConfigs: [...] }),
    },
)
const client = withGroupsAndSeal.$extend(
    suiStackMessaging({
        encryption: { sessionKey: { signer: keypair } },
        relayer: { relayerUrl: '...' },
    }),
)
```

## Session Key Tiers

| Tier | Pattern | Use Case |
|------|---------|----------|
| 1 (Recommended) | `{ signer: keypair }` | dapp-kit, Keypair, Enoki |
| 2 (Callback) | `{ address, onSign }` | Only signPersonalMessage surface |
| 3 (Managed) | `{ getSessionKey }` | Full control over lifecycle |

Options: ttlMin (default 10), refreshBufferMs (60000), mvrName.

## Relayer Config

```typescript
relayer: {
    relayerUrl: 'https://your-relayer.example.com',
    pollingIntervalMs: 3000,
    timeout: 30_000,
    onError: (err) => console.error(err),
}
```

No public canonical relayer — fork https://github.com/MystenLabs/sui-stack-messaging

## Attachments

```typescript
attachments: {
    storageAdapter: new WalrusHttpStorageAdapter({
        publisherUrl: 'https://publisher.walrus-testnet.walrus.space',
        aggregatorUrl: 'https://aggregator.walrus-testnet.walrus.space',
        epochs: 5,
    }),
    maxAttachments: 10,
    maxFileSizeBytes: 10_485_760,      // 10 MB
    maxTotalFileSizeBytes: 52_428_800, // 50 MB
}
```

## Sub-modules

| Module | Purpose |
|--------|---------|
| `call` | PTB thunks for composing operations |
| `tx` | Full transactions ready to sign |
| `view` | Read-only queries (no gas) |
| `bcs` | BCS type definitions for parsing |
| `derive` | Deterministic address derivation |
| `encryption` | Low-level encrypt/decrypt |
| `transport` | Direct relayer access |

## GroupRef Pattern

```typescript
// By UUID (recommended)
client.messaging.sendMessage({ signer, groupRef: { uuid: 'my-group-uuid' }, text: 'Hello!' })

// By explicit IDs
client.messaging.sendMessage({
    signer,
    groupRef: { groupId: '0x...', encryptionHistoryId: '0x...' },
    text: 'Hello!',
})
```

## Sources

- https://docs.sui.io/sui-stack/messaging/setup
- https://docs.sui.io/sui-stack/messaging
