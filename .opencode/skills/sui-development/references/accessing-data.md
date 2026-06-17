# Accessing Data on Sui

## Key Fact: JSON-RPC is Deprecated

JSON-RPC deprecation is targeted for **July 2026**. All new code must use gRPC or GraphQL RPC.

The four canonical data surfaces:

1. **gRPC** — Low-latency, real-time, code-gen-friendly. Served by full nodes. Supports streaming/subscriptions. Default for backends and ingestion pipelines.
2. **GraphQL RPC** — Flexible composable queries over the General-Purpose Indexer's Postgres + full node + Archival Store. Best for frontends and dashboards.
3. **Archival Store** — Long-term historical storage beyond full-node pruning. Accessed via GraphQL RPC (operator-configured routing) or Archival Service gRPC directly.
4. **Custom indexer (`sui-indexer-alt`)** — Your own data pipeline writing to any storage layer. For when hosted APIs don't fit.

## gRPC

### TypeScript Client

```typescript
import { SuiGrpcClient } from '@mysten/sui/grpc'

const client = new SuiGrpcClient({
    network: 'testnet',
    baseUrl: 'https://rpc.testnet.sui.io:443',
})

// Core read APIs
const obj = await client.core.getObject({ id: objectId, include: { type: true, content: true } })
const owned = await client.core.listOwnedObjects({ owner: address })
const coins = await client.core.listCoins({ owner: address, coinType: '0x2::sui::SUI' })
const balance = await client.core.getBalance({ owner: address })

// Wait for transaction indexing
await client.waitForTransaction({ digest })

// Streaming subscriptions
for await (const event of client.subscriptionService.subscribeEvents({
    filter: { MoveEventModule: { package: PACKAGE_ID, module: 'my_module' } },
})) {
    // Handle real-time events
}
```

### When to Use gRPC

- Backend services, indexers, exchanges, market makers
- Real-time event streaming
- Transaction simulation (dry run)
- Any typed systems language (Rust, Go, etc. — code-gen from protobuf)

### Endpoint URLs

| Network | gRPC URL |
|---------|----------|
| Mainnet | `https://rpc.mainnet.sui.io:443` |
| Testnet | `https://rpc.testnet.sui.io:443` |
| Devnet | `https://rpc.devnet.sui.io:443` |

## GraphQL RPC

### TypeScript Client

```typescript
import { SuiGraphQLClient } from '@mysten/sui/graphql'

const client = new SuiGraphQLClient({
    network: 'testnet',
    baseUrl: 'https://rpc.testnet.sui.io/graphql',
})
```

### When to Use GraphQL RPC

- Frontends needing flexible, composable queries
- Dashboard UIs joining multiple entity types
- Historical queries with filters
- Transaction submission and dry-run via GraphQL
- Dynamic language apps (Python, etc.)

### Read-After-Write Consistency

GraphQL RPC queries nested under `executeTransaction` or `simulateTransaction` are evaluated in a special scope just after the executed transaction, without waiting for indexing. Prefer selecting these fields in the same GraphQL request rather than making a separate follow-up query.

## Archival Store

For data older than full-node retention:
- **GraphQL RPC**: Routes to archival automatically when operator-configured
- **gRPC**: Must query Archival Service directly at `archive.mainnet.sui.io:443`

gRPC does NOT fall back to archival. If you need historical data over gRPC, query the Archival Service endpoint directly.

## Custom Indexers (`sui-indexer-alt`)

Build when hosted APIs don't fit — filtered sorts over millions of rows, app-specific indexes, custom storage backends.

Pipeline model:
1. **Backfill**: Ingest checkpoints from GCS buckets (e.g., `gs://mysten-mainnet-checkpoints-use4`)
2. **Steady state**: Ingest from full node gRPC streaming
3. **Storage**: Write to Postgres, ClickHouse, or custom backend via `Store` and `Connection` traits

## Walrus (Off-Chain Blob Storage)

**Do NOT store large files on Sui.** Move objects have a 250 KB size limit. Walrus is the decentralized blob storage for Sui.

### When to Use Walrus

- Images, audio, video, models, documents, large JSON
- Any file >250 KB
- NFT metadata images
- dApp assets

### Using Walrus

```typescript
import { walrus } from '@mysten/walrus'

const client = new SuiGrpcClient({ ... })
const walrusClient = client.$extend(walrus())

// Upload blob
const blobId = await walrusClient.writeBlob({ data: fileBuffer })

// Read blob
const data = await walrusClient.readBlob({ blobId })
```

Sui stores blob **metadata** (availability certificates); Walrus storage nodes store the actual content with erasure coding.

## Use Case → Method Mapping

| Use Case | Method |
|----------|--------|
| Live balance / owned-object / coin list | gRPC `client.core.*` |
| Flexible multi-entity query for frontend | GraphQL RPC |
| Transaction subscription / real-time effects | gRPC streaming |
| Historical transaction > N days old | GraphQL RPC (archival routing) |
| Custom leaderboard / analytics | Custom indexer |
| Store image / audio / large file | Walrus |
| Dry run / simulation | gRPC `devInspectTransactionBlock` |
| Transaction submission | gRPC or GraphQL RPC |

## Rules

1. Absolutely no JSON-RPC for new code — deprecated
2. Choose API based on what you're building: frontend → GraphQL RPC, backend → gRPC
3. Archival routing: GraphQL → automatic (operator-configured), gRPC → query Archival Service directly
4. Build custom indexer only when hosted APIs don't fit
5. Put large files on Walrus, never in Move objects (250 KB limit)
6. Read-after-write: GraphQL → prefer execution-attached fields, gRPC → `waitForTransaction`
7. Do NOT use v1 method names: `client.getObject` → `client.core.getObject`, `client.getOwnedObjects` → `client.core.listOwnedObjects`

## Common Mistakes

- Using `client.getObject` / `client.getOwnedObjects` (v1 names) → use `client.core.*`
- Recommending "the Sui API" without specifying which (gRPC vs GraphQL vs JSON-RPC)
- Telling users to "use the indexer" for simple queries gRPC covers
- Storing images or large JSON "on Sui" → use Walrus
- Assuming all three APIs return the same shape → protobuf vs GraphQL vs JSON
- Polling for events via JSON-RPC → use gRPC streaming
- Cross-node read-after-write without `waitForTransaction` → inconsistent results
- Conflating "storage fund" (tokenomics) with "storage service" (API)
- Assuming gRPC falls back to archival for pruned data → it doesn't
- Assuming GraphQL archival routing is automatic → it's operator-configured
