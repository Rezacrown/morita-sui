# Enoki Connect — Cross-dApp zkLogin Access

Enoki Connect enables users to access their dApp-specific zkLogin accounts across multiple applications.

## How It Works

Three components:

1. **Enoki Connect Wallet** — Lightweight wallet interface for zkLogin accounts
2. **Source dApp Setup** — Enable in Enoki Portal
3. **Other dApps Integration** — Register wallet with source dApp's public app slug

## Prerequisites

- Source dApp must use **Enoki zkLogin** (default salt — custom zkLogin not supported)
- Enoki zkLogin API key required
- Public App Slug chosen carefully (cannot change, must be globally unique)

## Source dApp Configuration

1. Sign in to Enoki Portal (https://portal.enoki.mystenlabs.com)
2. Select your application
3. Click **Enoki Connect** → Enable
4. Fill in details, choose **Public App Slug** (cannot change later)
5. Add callback URL to each Auth Provider: `https://[YOUR_SLUG].connect.enoki.mystenlabs.com/auth/callback`

## Other dApp Registration

Any dApp wanting to accept the source dApp's wallet:

```typescript
import { registerEnokiConnectWallets } from '@mysten/enoki-connect'

registerEnokiConnectWallets({
    publicAppSlugs: ['Source_Public_App_Slug'],
    dappName: 'My dApp Name',
})
```

Reference dApp: https://github.com/MystenLabs/ts-sdks/tree/main/packages/enoki-connect/demo-dapp

## Sources

- https://docs.enoki.mystenlabs.com/enoki-connect
