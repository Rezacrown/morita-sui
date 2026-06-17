# SuiPlay0X1 — Migration Strategies

SuiPlay0X1 is part of the broader Sui gaming ecosystem. Players should be able to move seamlessly between on-device (handheld) and off-device (web, desktop, other platforms) play while maintaining access to their assets and progress.

## Migration Direction Matrix

```
                      TO On-Device           TO Off-Device
                      ─────────────          ──────────────
FROM On-Device    │    N/A                  Automatic (same wallet)
FROM Off-Device   │    Wallet-dependent     N/A
```

---

## On-Device → Off-Device (Automatic)

When players move from the SuiPlay0X1 to playing on the web or another device, the transition is **automatic** — no transfers, no linking, no extra steps required.

### Why It's Automatic

The Playtron wallet is the **primary identity**. When you integrate the Sui dApp Kit in your off-device experience and include Playtron zkLogin as a sign-in option, the player signs in with the **same wallet credentials** they use on their SuiPlay0X1 device. All assets are already there.

```
┌─────────────────────────┐         ┌─────────────────────────┐
│   On-Device (SuiPlay)     │         │   Off-Device (Browser)    │
│                           │         │                           │
│  Playtron Wallet          │ ──────► │  "Sign in with Playtron" │
│  Address: 0xabc...        │         │  Address: 0xabc...        │
│                           │         │                           │
│  Assets:                  │         │  Assets:                  │
│  • Sword NFT #42          │         │  • Sword NFT #42          │
│  • 500 GOLD tokens        │         │  • 500 GOLD tokens        │
│  • Achievement Badge #7   │         │  • Achievement Badge #7   │
└─────────────────────────┘         └─────────────────────────┘
              Same wallet, same assets — automatic
```

### Implementation

```typescript
// On-device (Playtron SDK)
const wallet = await PlaytronWallet.getDefault();
await game.startSession(wallet.address);

// Off-device (dApp Kit) — same wallet, no migration code needed
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';

function OffDeviceGame() {
  const account = useCurrentAccount();

  useEffect(() => {
    if (account?.address) {
      game.startSession(account.address);
    }
  }, [account]);

  return (
    <>
      <ConnectButton />
      {/* Player clicks "Sign in with Playtron" → same wallet */}
    </>
  );
}
```

### Requirements
- Your off-device build must support Playtron zkLogin in dApp Kit
- No additional migration logic required — it's the same wallet
- Always run **session start protocol** (fresh chain query) when player connects

---

## Off-Device → On-Device

Migration in this direction depends entirely on what wallet type the player uses off-device.

### Scenario 1: Read-Only Asset Linking

Use when transferring **ownership** is not required — the player just wants their existing assets to be recognized on the device.

**Good for**:
- Soulbound assets (non-transferable achievements, reputation)
- Membership NFTs (community access, beta passes)
- Cosmetic/skin NFTs that grant access or visual benefits

**Process**:
1. Player visits `wallet.playtron.one` (companion web app)
2. Player links their existing wallet to their Playtron wallet via **SuiLink**
3. Playtron wallet now has **read-only** visibility into the linked wallet's assets
4. Your game queries both the Playtron wallet and linked wallet assets

```typescript
// Query assets from both Playtron AND linked wallets
async function getPlayerAssets(playtronAddress: string): Promise<Asset[]> {
  const [playtronAssets, linkedAssets] = await Promise.all([
    fetchOwnedObjects(playtronAddress),
    fetchLinkedWalletAssets(playtronAddress), // Via SuiLink / companion app
  ]);

  return [
    ...playtronAssets.map(a => ({ ...a, source: 'playtron' as const })),
    ...linkedAssets.map(a => ({ ...a, source: 'linked' as const, transferable: false })),
  ];
}

// Grant in-game benefits based on linked asset ownership
function applyLinkedAssetBenefits(playerAssets: Asset[]) {
  for (const asset of playerAssets) {
    if (asset.source === 'linked') {
      switch (asset.type) {
        case 'membership_nft':
          grantMembershipPerks(asset);
          break;
        case 'soulbound_badge':
          grantAchievementDisplay(asset);
          break;
        case 'skin_nft':
          unlockCosmetic(asset);
          break;
      }
    }
  }
}
```

#### Wallet Compatibility for Linking

| Off-Device Wallet Type | Can Link via Companion App? | Requirements |
|------------------------|---------------------------|--------------|
| Self-Custody (Phantom, Backpack, Slush) | ✅ Yes | Visit wallet.playtron.one |
| Custodial | ❌ No | Backend tracks across devices via user ID |
| Game-Specific zkLogin | ✅ Yes (with Enoki Connect) | Requires Enoki Connect enabled |
| Playtron zkLogin | N/A | Already the same wallet |

### Scenario 2: Full Asset Transfer

Use when assets need to be **fully accessible** (tradable, spendable) on the device.

**Good for**:
- Game currency tokens (must be in wallet to spend)
- Tradable NFTs (must own on-chain to list/trade)
- Any asset the player needs to actively use on-device

**Process**:
1. Player visits `wallet.playtron.one`
2. Player approves transfer of specific assets from existing wallet to Playtron wallet
3. Comprehensive web app provides user-friendly transfer flows
4. Assets now fully owned by Playtron wallet, all on-chain operations available

```typescript
// Companion app transfer flow (high-level)
async function transferAssetsToPlaytron(
  sourceWallet: WalletAccount,
  playtronAddress: string,
  assets: Asset[]
): Promise<TransferResult[]> {
  const results: TransferResult[] = [];

  for (const asset of assets) {
    const tx = new Transaction();
    tx.transferObjects(
      [tx.object(asset.objectId)],
      tx.pure.address(playtronAddress)
    );

    try {
      const result = await signAndExecuteTransaction({
        transaction: tx,
        signer: sourceWallet,
      });

      results.push({
        assetId: asset.objectId,
        status: 'transferred',
        txDigest: result.digest,
      });
    } catch (error) {
      results.push({
        assetId: asset.objectId,
        status: 'failed',
        error: (error as Error).message,
      });
    }
  }

  return results;
}
```

#### Wallet Compatibility for Transfer

| Off-Device Wallet Type | Can Transfer? | Method |
|------------------------|--------------|--------|
| Self-Custody | ✅ Yes | Sign transfer transaction in companion app |
| Game-Specific zkLogin | ✅ Yes | Requires Enoki Connect for signing |
| Custodial | N/A | Backend manages — no transfer needed |

### Scenario 3: Custodial Cross-Device

With custodial wallets, migration is entirely back-end managed:

```typescript
class CustodialCrossDeviceManager {
  private walletMap: Map<string, Ed25519Keypair> = new Map();

  // Map player identity (user ID, Steam ID, EGS login) to the SAME wallet
  async resolveWallet(playerIdentity: PlayerIdentity): Promise<Ed25519Keypair> {
    const key = this.buildIdentityKey(playerIdentity);

    if (!this.walletMap.has(key)) {
      const wallet = await this.db.findWalletByPlayerIdentity(playerIdentity);

      if (wallet) {
        // Existing wallet — same player, different device
        this.walletMap.set(key, wallet);
      } else {
        // New player — create wallet
        const newWallet = new Ed25519Keypair();
        await this.db.createWalletRecord(playerIdentity, newWallet);
        this.walletMap.set(key, newWallet);
      }
    }

    return this.walletMap.get(key)!;
  }

  private buildIdentityKey(identity: PlayerIdentity): string {
    // Use a consistent identifier across devices
    return identity.userId || identity.steamId || identity.epicId || identity.email;
  }
}

interface PlayerIdentity {
  userId?: string;
  steamId?: string;
  epicId?: string;
  email?: string;
}
```

---

## Enoki Connect for Migration

### When Enoki Connect is Required

Enoki Connect enables game-specific zkLogin wallets to participate in the linking flow through the companion app. Without Enoki Connect, a game-specific zkLogin wallet **cannot** be linked to a Playtron wallet via the companion app.

```typescript
// Without Enoki Connect: zkLogin wallet is siloed
const gameWallet = await zkLogin.signIn('google');
// gameWallet.address is unique to THIS game
// Companion app cannot recognize it for linking

// With Enoki Connect: zkLogin wallet is portable
const enokiClient = new EnokiClient({ apiKey: ENOKI_API_KEY });
const gameWallet = await enokiClient.signIn('google');
// gameWallet.address can be linked via companion app (Enoki Connect)
```

### Implementation Requirements
- Only required if you use game-specific zkLogin (not Playtron zkLogin)
- Other apps must manually add support for Enoki Connect wallets — automatic discovery is not guaranteed
- The companion app supports Enoki Connect wallets for linking

---

## Migration Implementation Checklist

### For On-Device → Off-Device (Must support)
- [ ] Support Playtron zkLogin as a sign-in option in dApp Kit
- [ ] Run session start protocol (fresh chain query) on every connection
- [ ] Handle case where assets changed since last on-device session
- [ ] No asset transfer code needed — same wallet

### For Off-Device → On-Device (Depends on wallet type)
- [ ] **If self-custody**: Companion app linking (read-only) or transfer flow
- [ ] **If game-specific zkLogin**: Enable Enoki Connect, implement companion app linking
- [ ] **If custodial**: Backend identity resolution across devices (user ID / Steam / EGS)
- [ ] Support companion app integration (`wallet.playtron.one`)
- [ ] Distinguish between linked (read-only) and owned (full access) assets

### For Companion App Integration
- [ ] Direct players to `wallet.playtron.one` for linking and transfers
- [ ] Provide clear messaging about what linking means (read-only access)
- [ ] Guide players through asset transfer when full ownership is needed
- [ ] Handle SuiLink verification for wallet linking

---

## Migration Flow Decision Tree

```
Player starts game on SuiPlay0X1
    │
    ├── First time on device?
    │   ├── YES → Do you have existing off-device assets?
    │   │   ├── YES → Guide to wallet.playtron.one
    │   │   │   ├── Soulbound/membership NFTs → LINK (read-only)
    │   │   │   └── Currency/tradable NFTs → TRANSFER to Playtron wallet
    │   │   └── NO → Fresh start with Playtron wallet
    │   └── NO → Continue session (session start protocol)
    │
    └── Moving to web/browser?
        └── "Sign in with Playtron" → Same wallet, same assets ✓
```

## Navigation

- [Overview](./overview.md) — Platform introduction and architecture
- [Best Practices](./best-practices.md) — Transaction handling, gas management, data storage strategies
- [Integration](./integration.md) — SDK overview, on-device vs off-device development
- [Wallet Integration](./wallet-integration.md) — Wallet types, strategies, and requirements
