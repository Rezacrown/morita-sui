# Enoki Identity Subnames

Identity Subnames create human-readable identities (`alice@yourapp.sui`) using SuiNS on the Sui blockchain.

## How It Works

Subnames are built on SuiNS domains that you own. Once you link a domain to your app in the Enoki Portal, you can create subnames through the API. These subnames resolve to user addresses onchain.

## Key Features

- Human-readable addresses instead of hex
- Built on SuiNS for onchain resolution
- Simple REST API for create, query, delete

## Prerequisites

1. **SuiNS domain** (.sui) on the target network (testnet or mainnet)
2. **Enoki Portal setup** — Link domain in Subnames section:
   - Connect wallet → select domain → transfer to Enoki contract
   - Domain is held in secure onchain contract (reclaimable anytime)
   - Click "Publish Domain" to make it LIVE
3. **API Key** with SUBNAMES feature enabled

**Important:** Domains must be in **LIVE** status before creating subnames.

## Domain Linking

When you transfer your domain to Enoki, it enters a secure onchain contract. Enoki can only borrow the domain (to register/delete subnames) and then return it. You retain the ability to reclaim at any time.

## Creating Subnames

### Public API Key (Recommended for user-facing)

Each user gets 1 subname per domain:

```typescript
const response = await fetch('https://api.enoki.mystenlabs.com/v1/subnames', {
    method: 'POST',
    headers: {
        Authorization: `Bearer ${publicApiKey}`,
        'zklogin-jwt': userJwt,
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        domain: 'yourapp.sui',
        network: 'mainnet',
        subname: 'alice',
    }),
})
// { name: 'alice@yourapp.sui', status: 'PENDING', createdAt: '...' }
```

### Private API Key (Backend)

Must specify targetAddress:

```typescript
const response = await fetch('https://api.enoki.mystenlabs.com/v1/subnames', {
    method: 'POST',
    headers: {
        Authorization: `Bearer ${privateApiKey}`,
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        domain: 'yourapp.sui',
        network: 'mainnet',
        subname: 'alice',
        targetAddress: '0x1234567890abcdef...',
    }),
})
```

## Querying Subnames

```typescript
const response = await fetch(
    `https://api.enoki.mystenlabs.com/v1/subnames?network=mainnet&address=0x1234...&domain=yourapp.sui`,
    { headers: { Authorization: `Bearer ${apiKey}` } }
)
// { subnames: [{ name: 'alice@yourapp.sui', status: 'ACTIVE', ... }] }
```

## Deleting Subnames

DELETE requires private API key:

```typescript
const response = await fetch('https://api.enoki.mystenlabs.com/v1/subnames', {
    method: 'DELETE',
    headers: {
        Authorization: `Bearer ${privateApiKey}`,
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        domain: 'yourapp.sui',
        network: 'mainnet',
        subname: 'alice',
    }),
})
```

## Subname Status

- **PENDING** — Submitted, processing (seconds)
- **ACTIVE** — Live and resolving onchain
- **FAILED** — Filtered from API responses

## Domain Renewals

SuiNS domains expire and must be renewed:

- **Before expiration:** Renew at any time via SuiNS platform
- **After expiration:** Cannot create/delete subnames, existing stop resolving
- **Grace period:** 30 days to renew and restore
- **After grace period:** Domain becomes available for anyone

### Auto-Renewals

Enable in Enoki Portal. Domains auto-renew ~30 days before expiry. Fees charged to billing account (mainnet only). Renews for 1 year.

### Manual Renewal

1. Reclaim domain to your wallet (Portal → Reclaim Domain)
2. Go to SuiNS and renew
3. Transfer back to Enoki

**Warning:** Subname operations blocked during reclaim period.

## Best Practices

1. Check status after creation (poll GET endpoint until ACTIVE)
2. Handle async nature — subnames process asynchronously
3. Validate subname format client-side before API call
4. Use public keys for user actions, private keys for admin
5. Monitor domain expiration — set reminders before grace period ends

## Network Support

Available on Testnet and Mainnet. Domain must be on same network as subname creation.

## Sources

- https://docs.enoki.mystenlabs.com/subnames
