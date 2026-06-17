# SuiNS — Sui Name Service

Sui Name Service (SuiNS) is a decentralized naming service on Sui that maps human-readable `.sui` names to wallet addresses. Apps use SuiNS for address display, name-based transfers, and identity in social and messaging features.

> Source constraint: Information sourced from [docs.sui.io/sui-stack/suins](https://docs.sui.io/sui-stack/suins), [docs.suins.io/developer](https://docs.suins.io/developer), and [SuiNS contracts](https://github.com/MystenLabs/suins-contracts/).

## Core Concepts

### Three Main Use Cases

| Use Case | Description | Example |
|----------|-------------|---------|
| **Address display** | Show human-readable names in UI instead of raw addresses | `alice.sui` instead of `0xfe9c7a...` |
| **Name-based transfers** | Send assets to a name rather than a raw address | Transfer coins to `bob.sui` |
| **App-specific subnames** | Create subnames under a domain you control as per-user identifiers | `alice.myapp.sui` |

Sui Messenger uses app-specific subnames under `sui-stack.sui` to give every participant a unique identity that the channel UI displays in place of their wallet address.

### Resolution Architecture

```
                         ┌─ Lookup (name → address)
                         │
    YOUR APP ────────────┼─ Reverse lookup (address → name)
                         │
                         └─ Subname provisioning (Enoki)

    ┌───────────────────────────────────────────────────────┐
    │  ONCHAIN (Move)                                       │
    │  ┌─────────────┐     ┌──────────────────┐            │
    │  │ SuiNS Core   │────▶│ Registry         │            │
    │  │ send_to_name │     │ lookup()         │            │
    │  └─────────────┘     └────────┬─────────┘            │
    │                               │                       │
    │                     target_address or error            │
    └───────────────────────────────┼───────────────────────┘
                                    │
    ┌───────────────────────────────┼───────────────────────┐
    │  OFFCHAIN (RPC/GraphQL)       │                       │
    │  ┌──────────────────────┐     │                       │
    │  │ suix_resolveName-    │─────┘                       │
    │  │ ServiceAddress       │                             │
    │  └──────────────────────┘                             │
    │  ┌──────────────────────┐                             │
    │  │ suix_resolveName-    │                             │
    │  │ ServiceNames         │                             │
    │  └──────────────────────┘                             │
    │  ┌──────────────────────┐                             │
    │  │ GraphQL              │                             │
    │  │ resolveSuinsAddress  │                             │
    │  │ defaultSuinsName     │                             │
    │  └──────────────────────┘                             │
    └───────────────────────────────────────────────────────┘
                                    │
    ┌───────────────────────────────┼───────────────────────┐
    │  SUBNAMES (Enoki)             │                       │
    │  ┌──────────────────────┐     │                       │
    │  │ POST /v1/subnames    │─────┘                       │
    │  │ GET  /v1/subnames    │                             │
    │  │ DELETE /v1/subnames  │                             │
    │  └──────────────────────┘                             │
    │  ┌──────────────────────┐                             │
    │  │ Leaf subname         │────▶ SuiNS Registry         │
    │  │ alice.myapp.sui      │     (onchain)               │
    │  └──────────────────────┘                             │
    └───────────────────────────────────────────────────────┘
```

## Resolution Types

SuiNS supports two resolution directions:

- **Lookup (name → address):** Resolves a name like `example.sui` to its target address. Use this when sending assets or looking up what address a name points to.
- **Reverse lookup (address → name):** Finds the default name associated with an address. Use this when displaying a human-readable name for a known address.

Both types are available onchain (Move) and offchain (RPC/GraphQL).

## Address Types

Lookups work with two types of addresses:

- **Target address:** The address that a SuiNS name resolves to. The NFT holder sets this. Example: `example.sui` points to `0x2`, making `0x2` the target address.
- **Default address:** The SuiNS name that a wallet owner has designated to represent their address. The owner must sign a set-default transaction to establish this connection. The default address resets any time the target address changes.

> **Warning:** Do NOT use SuiNS NFT ownership as a resolution method. A SuiNS NFT acts as a capability to change the target address, but it does not identify any specific address. Use target address for lookup resolution and default address for reverse lookup resolution.

## Onchain Resolution (Move)

### Dependency Setup

Add the SuiNS core package to your `Move.toml`:

**Mainnet:**
```toml
[dependencies]
suins = { git = "https://github.com/MystenLabs/suins-contracts/", subdir = "packages/suins", rev = "releases/mainnet/core/v3" }
```

**Testnet:**
```toml
[dependencies]
suins = { git = "https://github.com/MystenLabs/suins-contracts/", subdir = "packages/suins", rev = "releases/testnet/core/v2" }
```

> **Warning:** Use the **core package only**. The utility packages (registration, renewal, setup) are subject to replacement and may break your logic without warning.

### Move Module Example

```move
module demo::demo {
    use std::string::String;
    use sui::clock::Clock;
    use suins::{
        suins::SuiNS,
        registry::Registry,
        domain
    };

    const ENameNotFound: u64 = 0;
    const ENameNotPointingToAddress: u64 = 1;
    const ENameExpired: u64 = 2;

    public fun send_to_name<T: key + store>(
        suins: &SuiNS,
        obj: T,
        name: String,
        clock: &Clock
    ) {
        let mut optional = suins.registry<Registry>().lookup(domain::new(name));
        assert!(optional.is_some(), ENameNotFound);
        let name_record = optional.extract();
        assert!(!name_record.has_expired(clock), ENameExpired);
        assert!(name_record.target_address().is_some(), ENameNotPointingToAddress);
        transfer::public_transfer(obj, name_record.target_address().extract())
    }
}
```

### Error Constants

| Constant | Value | Cause | Resolution |
|----------|-------|-------|------------|
| `ENameNotFound` | `0` | Name not registered or expired and released | Check name exists at [suins.io](https://suins.io/) |
| `ENameNotPointingToAddress` | `1` | Name exists but holder has not set a target address | Holder must call set-target-address |
| `ENameExpired` | `2` | Storage epoch passed; name resolves as expired | Holder must renew at [suins.io](https://suins.io/) |

The `lookup` call takes a `Domain` value constructed from the name string. `has_expired` takes a `Clock` reference. `target_address` returns an `Option<address>` — extract it after verifying it is set.

Pass the `SuiNS` shared object as an argument to any function performing onchain resolution.

### SuiNS Shared Object IDs

#### Mainnet Active Constants

**Package IDs:**

| Kind | Package ID |
|------|-----------|
| SuiNS Core V3 | `0x00c2f85e07181b90c140b15c5ce27d863f93c4d9159d2a4e7bdaeb40e286d6f5` |
| SuiNS Core V2 | `0xb7004c7914308557f7afbaf0dca8dd258e18e306cb7a45b28019f3d0a693f162` |
| SuiNS Core V1 | `0xd22b24490e0bae52676651b4f56660a5ff8022a2576e0089f79b3c88d44e08f0` |
| Subnames | `0xe177697e191327901637f8d2c5ffbbde8b1aaac27ec1024c4b62d1ebd1cd7430` |
| Registration | `0x9d451fa0139fef8f7c1f0bd5d7e45b7fa9dbb84c2e63c2819c7abd0a7f7d749d` |
| Renewal | `0xd5e5f74126e7934e35991643b0111c3361827fc0564c83fa810668837c6f0b0f` |
| Utilities (setup) | `0xdac22652eb400beb1f5e2126459cae8eedc116b73b8ad60b71e3e8d7fdb317e2` |
| Discounts | `0x6a6ea140e095ddd82f7c745905054b3203129dd04a09d0375416c31161932d2d` |

**Object IDs:**

| Kind | Object ID |
|------|----------|
| SuiNS Core Object | `0x6e0ddefc0ad98889c04bab9639e512c21766c5e6366f89e696956d9be6952871` |
| SuiNS Discounts | `0x7fdd883c0b7427f18cdb498c4c87a4a79d6bec4783cb3f21aa3816bbc64ce8ef` |
| Registry Table | `0xe64cd9db9f829c6cc405d9790bd71567ae07259855f4fba6f02c84f52298c106` |

#### Testnet Active Constants

**Package IDs:**

| Kind | Package ID |
|------|-----------|
| SuiNS Core | `0x22fa05f21b1ad71442491220bb9338f7b7095fe35000ef88d5400d28523bdd93` |
| Registration | `0x4255184a0143c0ce4394a3f16a6f5aa5d64507269e54e51ea396d569fe8f1ba5` |
| Renewal | `0x54800ebb4606fd0c03b4554976264373b3374eeb3fd63e7ff69f31cac786ba8c` |
| Utilities (setup) | `0x6ed81fd808a23eae2da488052334d50478b36527474fc99707c1aed0e43104b1` |
| Subnames | `0x3c272bc45f9157b7818ece4f7411bdfa8af46303b071aca4e18c03119c9ff636` |
| Subnames Proxy | `0x3489ab5dcd346afee8b681267bcab2583a5eba9855680ec9931355e50e21c148` |

**Object IDs:**

| Kind | Object ID |
|------|----------|
| SuiNS Core Object | `0x300369e8909b9a6464da265b9a5a9ab6fe2158a040e84e808628cde7a07ee5a3` |

> Always check [docs.suins.io/developer](https://docs.suins.io/developer) for the latest active constants — the core package and core object cannot change, but auxiliary packages may be updated.

## Offchain Resolution (TypeScript)

No additional package is required beyond `@mysten/sui`.

### Lookup (Name → Address)

```ts
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

const client = new SuiClient({ url: getFullnodeUrl('mainnet') });

const address = await client.resolveNameServiceAddress({
  name: 'example.sui',
});
// Returns: '0x2' or null if the name does not exist
```

### Reverse Lookup (Address → Default Name)

```ts
const names = await client.resolveNameServiceNames({
  address: '0x2',
});
// Returns: { data: ['example.sui'], hasNextPage: false, nextCursor: null }
```

### GraphQL Equivalent

```graphql
# Lookup (name → address)
query ResolveName($name: String!) {
  resolveSuinsAddress(domain: $name) {
    address
  }
}

# Reverse lookup (address → default name)
query DefaultName($address: SuiAddress!) {
  address(address: $address) {
    defaultSuinsName: defaultNameRecord {
      name
    }
  }
}
```

## SuiNS SDK (@mysten/suins)

The SuiNS SDK provides a higher-level TypeScript wrapper around the SuiNS contracts and RPC endpoints.

### Installation

```bash
npm install @mysten/suins
```

For older TypeScript SDK versions (pre-1.x / 0.54.1):
```bash
npm install @mysten/suins@0.0.3
```

### Initialization (by Network)

```ts
import { SuinsClient } from '@mysten/suins';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

const client = new SuiClient({ url: getFullnodeUrl('testnet') });
const suinsClient = new SuinsClient({
  client,
  network: 'testnet', // 'mainnet' or 'testnet'
});
```

### Initialization (with Custom Constants)

For custom networks or fine-grained control:

```ts
const suinsClient = new SuinsClient({
  client,
  packageIds: {
    suinsPackageId: {
      latest: '0xb7004c7914308557f7afbaf0dca8dd258e18e306cb7a45b28019f3d0a693f162',
      v1: '0xd22b24490e0bae52676651b4f56660a5ff8022a2576e0089f79b3c88d44e08f0',
    },
    suinsObjectId: '0x6e0ddefc0ad98889c04bab9639e512c21766c5e6366f89e696956d9be6952871',
    utilsPackageId: '0xdac22652eb400beb1f5e2126459cae8eedc116b73b8ad60b71e3e8d7fdb317e2',
    registrationPackageId: '0x9d451fa0139fef8f7c1f0bd5d7e45b7fa9dbb84c2e63c2819c7abd0a7f7d749d',
    renewalPackageId: '0xd5e5f74126e7934e35991643b0111c3361827fc0564c83fa810668837c6f0b0f',
    registryTableId: '0xe64cd9db9f829c6cc405d9790bd71567ae07259855f4fba6f02c84f52298c106',
  },
});
```

> **Important:** Keep `@mysten/suins` updated to get the latest constants. Outdated constants may cause transactions to fail to build.

> **Best practice:** Keep a single `SuinsClient` instance throughout your dApp. In React, use a context to provide the client.

### SDK Docs

Full SDK reference at [docs.suins.io/developer/sdk](https://docs.suins.io/developer/sdk).

## Enoki Subname API

When your app provisions subnames on behalf of users rather than letting users register their own names, use the Enoki subname API. Enoki holds your SuiNS domain in a managed contract and handles subname creation, deletion, and renewal through a REST API.

### When to Use Enoki vs SuiNS SDK

| Scenario | Enoki Subname API | SuiNS SDK / RPC |
|----------|-------------------|-----------------|
| Auto-provision subnames per user on login | Yes | No |
| App-controlled subnames (not user-registered) | Yes | No |
| zkLogin authentication | Yes | Manual |
| Users register/own their own names | No | Yes |
| Query or resolve existing names | No | Yes |
| Self-hosted bulk domain queries | No | Yes (via suins-indexer) |
| User-specified arbitrary target addresses | Private key only | Yes |
| Multiple subnames per user | Private key only | Yes |

> **Limitation (public key):** Each user gets at most 1 subname per domain when using a public API key with zkLogin. Use a private API key for arbitrary target addresses or multiple subnames per user.

### API Flow

```ts
// 1. Create a subname (public key + zkLogin JWT)
const createRes = await fetch('https://api.enoki.mystenlabs.com/v1/subnames', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${publicApiKey}`,
    'zklogin-jwt': userJwt,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    domain: 'myapp.sui',
    network: 'mainnet',
    subname: 'alice',
  }),
});
// { name: 'alice@myapp.sui', status: 'PENDING', createdAt: '...' }

// 2. Poll until ACTIVE
const getRes = await fetch(
  `https://api.enoki.mystenlabs.com/v1/subnames?network=mainnet&address=${userAddress}&domain=myapp.sui`,
  { headers: { Authorization: `Bearer ${apiKey}` } }
);
// { subnames: [{ name: 'alice@myapp.sui', status: 'ACTIVE', ... }] }

// 3. Delete (private key)
await fetch('https://api.enoki.mystenlabs.com/v1/subnames', {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${privateApiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ domain: 'myapp.sui', network: 'mainnet', subname: 'alice' }),
});
```

### Enoki Domain Lifecycle

1. **Link domain** in Enoki Portal → domain transferred to Enoki-managed contract
2. **Publish domain** → status changes to `LIVE` (required before API calls)
3. **Create subnames** → API returns `PENDING`, polls until `ACTIVE`
4. **Reclaim domain** → return domain to your wallet (blocks all subname operations while reclaimed)
5. **Auto-renewal** → optionally enable in Portal; renews ~30 days before expiration

### Subname Statuses

| Status | Meaning |
|--------|---------|
| `PENDING` | Submitted, processing (typically a few seconds) |
| `ACTIVE` | Live and resolving on-chain |
| `FAILED` | Creation failed (filtered out from API responses) |

## Indexing (suins-indexer)

For bulk queries beyond single name/address lookups, run your own [`suins-indexer`](https://github.com/MystenLabs/sui/tree/main/crates/suins-indexer) instance. See the [custom indexer docs](https://docs.sui.io/develop/accessing-data/custom-indexer) for setup.

Queries the indexer enables:

- **All subnames under a parent domain:** Retrieve every subdomain linked to a parent, enabling domain structure management and analytics.
- **All names pointing to a given address:** Identify all domain names associated with a specific wallet for ownership tracking.
- **Complex domain state queries** beyond what onchain resolution supports.

## Sui Messenger Pattern: Multi-Service Client Composition

Sui Messenger composes `SealClient`, `WalrusStorageAdapter`, and `SuiStackMessagingClient` onto a single `SuiClient` via `$extend`:

```ts
const extendedClient = new SuiClient({
  url: 'https://fullnode.testnet.sui.io:443',
})
  .$extend(
    SealClient.asClientExtension({
      serverConfigs: SEAL_SERVERS.map((id) => ({ objectId: id, weight: 1 })),
    }),
  )
  .$extend(
    SuiStackMessagingClient.experimental_asClientExtension({
      storage: (client) =>
        new WalrusStorageAdapter(client, {
          publisher: 'https://publisher.walrus-testnet.walrus.space',
          aggregator: 'https://aggregator.testnet.walrus.mirai.cloud',
          epochs: 10,
        }),
      sessionKey,
    }),
  );
```

Each extension adds its methods to the client without affecting others. The `useUserSubname` hook resolves the wallet's subname independently:

```ts
const { data: subname } = useQuery({
  queryKey: ['subname', walletAddress],
  queryFn: async () => {
    const res = await fetch(
      `https://api.enoki.mystenlabs.com/v1/subnames?network=testnet&address=${walletAddress}&domain=sui-stack.sui`,
      { headers: { Authorization: `Bearer ${enokiApiKey}` } }
    );
    const data = await res.json();
    return data.subnames?.[0]?.name ?? null;
  },
  staleTime: 5 * 60 * 1000,
});
```

## Failure Modes

| Error | Cause | Resolution |
|-------|-------|------------|
| Name not found (`null` / `ENameNotFound`) | Not registered, or expired and released | Check at [suins.io](https://suins.io/); renew if expired |
| Target address not set (`ENameNotPointingToAddress`) | Holder has not set a target address | Holder must call set-target-address |
| Name expired (`ENameExpired`) | Storage epoch passed | Holder must renew at [suins.io](https://suins.io/) |
| Wrong network | Name queried on wrong network client | Match `SuiClient` URL to name's network |
| Enoki: domain not `LIVE` | Domain linked but not published | Publish domain in Enoki Portal |
| Enoki: subname not resolving | Asynchronous — status is `PENDING` | Poll `GET /v1/subnames` until `ACTIVE` |
| Domain expired, subnames stop | Past expiry or grace period | Renew before 30-day grace period ends |

## Troubleshooting

1. **Name not found:** `lookup` returns `null` or Move `ENameNotFound` aborts. Verify name exists and spelling at [suins.io](https://suins.io/). Expired names return `null` even if previously registered.

2. **Target address not set:** `target_address` returns `None` but name exists. Treat `None` as unresolvable in UI; prompt user to set target address in SuiNS portal.

3. **Wrong network:** `resolveNameServiceAddress` returns `null` when querying a name on the wrong network. Confirm `SuiClient` URL matches the network where the name is registered.

4. **Enoki creation fails:** Domain not in `LIVE` status. Publish in Enoki Portal. With public key + zkLogin, each user can only have 1 subname per domain — second attempt errors.

5. **Subname not resolving after creation:** Enoki creation is asynchronous (a few seconds). Poll `GET /v1/subnames` until status is `ACTIVE`.

6. **Subnames blocked after domain expiry:** Enoki cannot create/delete subnames and existing subnames stop resolving. Renew domain at [suins.io](https://suins.io/) before the 30-day grace period ends.

## Resources

- [SuiNS Developer Docs](https://docs.suins.io/developer)
- [SuiNS SDK](https://docs.suins.io/developer/sdk)
- [SuiNS Contracts (GitHub)](https://github.com/MystenLabs/suins-contracts/)
- [Enoki Subname API](https://docs.enoki.mystenlabs.com/subnames)
- [suins-indexer](https://github.com/MystenLabs/sui/tree/main/crates/suins-indexer)
- [Sui Messenger Example](https://github.com/MystenLabs/messaging-sdk-example)
- [Sui GraphQL Reference](https://docs.sui.io/references/sui-api/sui-graphql/reference)
