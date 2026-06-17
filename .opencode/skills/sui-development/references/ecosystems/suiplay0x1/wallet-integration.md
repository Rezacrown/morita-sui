# SuiPlay0X1 — Wallet Integration

## Wallet Options Overview

SuiPlay0X1 supports four distinct wallet approaches. The right choice depends on your game's design, target audience, and cross-platform requirements.

| Type | Who Controls Keys | Gas Payer | Seed Phrases | Portability |
|------|------------------|-----------|-------------|-------------|
| **Self-Custodial** | Player | Player (or sponsor) | Yes | Highest |
| **zkLogin** | Ephemeral (derived) | Developer (sponsored) | No | Per-app silo |
| **Playtron zkLogin** | Playtron (managed) | Developer (sponsored) | No | Via Enoki Connect |
| **Custodial** | Developer | Developer | N/A | Developer-managed |

---

## Self-Custodial Wallets

### Characteristics
- Players generate and control their own private keys
- Familiar experience for existing Web3 wallet users (Phantom, Backpack, Slush)
- Most portable across platforms and ecosystems
- Players can sponsor their own gas, or developer can sponsor

### Use Cases
- Games targeting existing Web3 audiences
- Cross-ecosystem asset portability without extra infrastructure
- When players expect full control over their assets

### Implementation

```tsx
import { ConnectButton, useCurrentWallet } from '@mysten/dapp-kit';

function SelfCustodyGame() {
  const { connectionStatus } = useCurrentWallet();

  if (connectionStatus !== 'connected') {
    return <ConnectButton />;
  }

  return <GameCanvas />;
}
```

### Considerations
- Transaction signing pops up wallet UI — breaks gameplay flow
- Requires careful transaction batching (see [Best Practices](./best-practices.md))
- Players must manage seed phrases — onboarding friction for non-crypto users
- Use gas sponsorship to reduce player friction

---

## zkLogin (Standard)

### Characteristics
- Players authenticate with Web2 credentials (Google, Facebook, Twitch)
- Ephemeral key pair generated on the client — effectively self-custodial
- **Siloed per application** — wallet is not shared across different games
- No seed phrases to manage
- Zero onboarding friction for Web2-native players

### Flow

```
Player → "Sign in with Google" → Ephemeral key generated → Ready to play
```

### Implementation

```tsx
import { useZkLogin } from '@mysten/dapp-kit';
import { GoogleAuthProvider } from '@mysten/zklogin';

function ZkLoginGame() {
  const zkLogin = useZkLogin();

  const signInWithGoogle = async () => {
    await zkLogin.connect({
      provider: GoogleAuthProvider,
    });
  };

  return (
    <div>
      <button onClick={signInWithGoogle}>
        Play with Google
      </button>
    </div>
  );
}
```

### Considerations
- Wallet is siloed — same Google account creates a **different** wallet address per game
- No cross-game asset portability without additional infrastructure
- Use **Enoki Connect** to add portability (see below)

---

## Enoki

Enoki is a SaaS solution layered on top of zkLogin that adds production features:

| Feature | Description |
|---------|-------------|
| **zkLogin + Sponsored TX** | Same seamless login + developer pays gas |
| **API Key Management** | Managed authentication through API keys |
| **Enoki Connect** | Make game-specific zkLogin wallets **portable** across the ecosystem |

### When to Use Enoki
- You want zkLogin simplicity but need cross-game asset portability
- You want managed infrastructure instead of running your own zkLogin setup
- Your game exists within a broader ecosystem of titles

### Enoki Connect

Enoki Connect enables game-specific zkLogin wallets to be recognized across multiple applications:

```typescript
// Game A uses Enoki Connect — wallet is portable
import { EnokiClient } from '@mysten/enoki';

const enoki = new EnokiClient({
  apiKey: process.env.ENOKI_API_KEY,
});

// Other games/apps can discover this wallet via Enoki Connect
```

**Limitation**: Other applications must **manually add support** for Enoki Connect wallets — they are not auto-discovered by dApp Kit.

### Recommended Hybrid Approach

```typescript
// Strategy: dApp Kit as primary, Enoki Connect as secondary
function createWalletStrategy() {
  return {
    primary: 'dapp-kit',       // Direct wallet connections (Playtron, Phantom, etc.)
    secondary: 'enoki-connect', // Bridge for game-specific zkLogin wallets
    // This ensures maximum compatibility with both standard wallets
    // and game-specific zkLogin users who want portability
  };
}
```

---

## Playtron zkLogin Wallet

### Characteristics
- **Deeply integrated** with Playtron GameOS
- Seamless on-device signing without interrupting gameplay
- Enoki Connect included out of the box
- Companion web app (`wallet.playtron.one`) for off-device management
- **Default wallet** for all on-device experiences

### On-Device Access (Automatic)

```typescript
// Playtron SDK — wallet is pre-authenticated, no user action needed
import { PlaytronWallet } from '@playtron/sdk';

const wallet = await PlaytronWallet.getDefault();
// wallet.address — ready to use
// wallet.signAndExecuteTransaction — seamless, no popup
```

### Off-Device Access (dApp Kit)

```tsx
import { ConnectButton } from '@mysten/dapp-kit';

// Players authenticate with Playtron credentials in any browser
function OffDeviceExperience() {
  return (
    <>
      <ConnectButton />
      {/* Playtron zkLogin appears as a wallet option */}
    </>
  );
}
```

---

## Custodial Wallets

### Characteristics
- **You manage wallets** on behalf of players
- Similar to traditional database-backed accounts, but on-chain
- Players never see seed phrases, keys, or signing prompts
- Complete control over transaction flow and gas management

### Two Approaches

#### Aggregated Wallet

| Aspect | Detail |
|--------|--------|
| **Wallet Count** | Single wallet for all players |
| **Ownership Tracking** | Off-chain database mapping player ID → asset |
| **Transfers Between Players** | Update database, no on-chain transaction |
| **On-Chain Activity** | Not visible per-player (obfuscates metrics) |

```typescript
// Aggregated wallet: track ownership off-chain
class AggregatedGameEconomy {
  private wallet: Ed25519Keypair; // Single wallet for all players
  private ownership: Map<string, Set<string>>; // playerId → assetIds

  async transferBetweenPlayers(
    fromId: string,
    toId: string,
    assetId: string
  ): Promise<void> {
    // Just update our internal tracking — no on-chain tx needed
    const fromAssets = this.ownership.get(fromId)!;
    const toAssets = this.ownership.get(toId)!;
    fromAssets.delete(assetId);
    toAssets.add(assetId);
  }
}
```

#### Individual Wallets

| Aspect | Detail |
|--------|--------|
| **Wallet Count** | One wallet per player |
| **Ownership Tracking** | On-chain, verifiable by anyone |
| **Transfers Between Players** | On-chain transaction |
| **On-Chain Activity** | Full traceability per player |

```typescript
// Individual wallets: one-per-player, managed by backend
class IndividualWalletManager {
  private wallets: Map<string, Ed25519Keypair> = new Map();

  async getOrCreateWallet(playerId: string): Promise<Ed25519Keypair> {
    if (!this.wallets.has(playerId)) {
      this.wallets.set(playerId, new Ed25519Keypair());
      // Fund this wallet with gas
      await this.fundWallet(this.wallets.get(playerId)!);
    }
    return this.wallets.get(playerId)!;
  }

  async playerToPlayerTransfer(
    fromId: string,
    toId: string,
    assetId: string
  ): Promise<string> {
    const fromWallet = await this.getOrCreateWallet(fromId);
    const toWallet = await this.getOrCreateWallet(toId);

    const tx = new Transaction();
    tx.transferObjects(
      [tx.object(assetId)],
      tx.pure.address(toWallet.getPublicKey().toSuiAddress())
    );

    const result = await this.client.signAndExecuteTransaction({
      transaction: tx,
      signer: fromWallet,
    });

    return result.digest;
  }
}
```

### Custodial Risks
- **Vendor lock-in**: Players cannot interact with third-party apps using custodial wallets
- **Trust centralization**: Players must trust you with their assets
- **Regulatory considerations**: Custodial wallets may trigger financial services regulations

---

## Requirements

### On-Device Requirements (MUST)

| Requirement | Reason |
|-------------|--------|
| Support **Playtron zkLogin** as default | All SuiPlay0X1 devices ship with this |
| Cannot require off-device signing | Breaks the handheld gaming experience |
| No guarantee of other wallet access | Self-custody wallets may not be installed on device |

### Off-Device Requirements (MUST)

| Requirement | Reason |
|-------------|--------|
| Use **Sui dApp Kit** for all wallet connections | Standard cross-platform wallet interface |
| Support Playtron zkLogin in dApp Kit | Continuity for players moving between device and web |

---

## Wallet Strategies

### Option 1: Playtron zkLogin + dApp Kit (RECOMMENDED)

```
┌─────────────────────────────────────────────────────┐
│  On-Device                    Off-Device              │
│  ┌───────────────┐           ┌──────────────────┐   │
│  │ Playtron SDK  │           │ Sui dApp Kit     │   │
│  │ (Auto wallet) │◄─────────►│ (Playtron login) │   │
│  └───────────────┘           └──────────────────┘   │
│         │                            │               │
│         └────────────┬───────────────┘               │
│                      ▼                               │
│         ┌──────────────────────────┐                │
│         │ wallet.playtron.one       │                │
│         │ (Companion app for linking)│               │
│         └──────────────────────────┘                │
└─────────────────────────────────────────────────────┘
```

**Pros**: Same wallet everywhere, no transfers, automatic cross-platform continuity
**Cons**: Requires dApp Kit integration for off-device play

### Option 2: Custodial with Per-User Allocation

```
┌─────────────────────────────────────────────────────┐
│  Backend                         Client               │
│  ┌───────────────┐              ┌──────────────────┐ │
│  │ Wallet Manager │              │ Game Client      │ │
│  │ (per-player)   │◄────────────│ (User ID login)  │ │
│  └───────────────┘              └──────────────────┘ │
│         │                               │            │
│         ▼                               ▼            │
│  ┌───────────────┐              ┌──────────────────┐ │
│  │ Individual     │              │ dApp Kit          │ │
│  │ Wallets        │              │ (asset transfer)  │ │
│  └───────────────┘              └──────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Pros**: Full control, no signing prompts, smooth Web2-like UX
**Cons**: Vendor lock-in, you pay all gas, trust centralization

### Option 3: Game-Specific zkLogin + Playtron Transfer

```
┌─────────────────────────────────────────────────────┐
│  On-Device                    Off-Device              │
│  ┌───────────────┐           ┌──────────────────┐   │
│  │ Playtron SDK  │           │ Game zkLogin     │   │
│  │ (Playtron      │           │ (Google/Facebook)│   │
│  │  wallet)       │           │ wallet)          │   │
│  └───────────────┘           └──────────────────┘   │
│         │                            │               │
│         └────────────┬───────────────┘               │
│                      ▼                               │
│         ┌──────────────────────────┐                │
│         │ wallet.playtron.one       │                │
│         │ (Link + transfer between) │                │
│         └──────────────────────────┘                │
└─────────────────────────────────────────────────────┘
```

**Pros**: Familiar Web2 login on web, Playtron wallet on device
**Cons**: Requires transfers between wallets, two different identities

---

## SuiLink

SuiLink is a cross-chain wallet verification protocol that enables:

### Capabilities

| Feature | Description |
|---------|-------------|
| **Cross-Chain Verification** | Prove ownership of assets on other chains |
| **Asset Ownership Proof** | Cryptographically verify wallet contents |
| **Asset Distributions** | Distribute rewards based on verified ownership |
| **Read-Only Access** | View linked wallet assets without transaction capability |

### Companion App Integration

The companion app (`wallet.playtron.one`) uses SuiLink to enable wallet linking:

```typescript
// Companion app flow: link external wallet to Playtron
async function linkExternalWallet(
  playtronAddress: string,
  externalWallet: WalletAccount
) {
  // Use SuiLink to verify ownership and create link
  const suiLinkProof = await createSuiLinkProof(externalWallet);

  // Register link in companion app
  await companionApp.registerLink({
    playtronAddress,
    linkedAddress: externalWallet.address,
    proof: suiLinkProof,
  });

  // Now Playtron wallet can view linked assets (read-only)
}
```

### Important Constraints
- SuiLink provides **read-only** access to linked assets
- Cannot execute transactions on behalf of linked wallets
- Used primarily for verification, proof of ownership, and asset discovery
- Not a substitute for actual asset transfer — use companion app for that

---

## Decision Flow

```
Start
 │
 ├── Is this an ON-DEVICE game?
 │   └── YES → Use Playtron zkLogin (required) ✓
 │
 ├── Is this an OFF-DEVICE (web/browser) game?
 │   └── YES → Use Sui dApp Kit
 │       ├── Want shared identity with on-device?
 │       │   └── Support Playtron zkLogin in dApp Kit
 │       └── Want separate identity?
 │           └── Game-specific zkLogin + companion app transfer
 │
 └── Both on-device AND off-device?
     └── Option 1 (Recommended): Playtron zkLogin + dApp Kit
         Player uses same wallet on both platforms automatically
```

## Navigation

- [Overview](./overview.md) — Platform introduction and architecture
- [Best Practices](./best-practices.md) — Transaction handling, gas management, data storage strategies
- [Integration](./integration.md) — SDK overview, on-device vs off-device development
- [Migration Strategies](./migration-strategies.md) — Moving users between on-device and off-device play
