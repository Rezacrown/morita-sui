# SuiPlay0X1 — Best Practices

## Handling Transactions

### The Core Principle: Minimize Player Friction

Blockchain transactions on a gaming device present a unique UX challenge: **self-custody wallet signing interrupts gameplay flow**. Every time a transaction requires user approval, a wallet UI pops up, pulling the player out of the game.

### When to Request User Approval

| Action Type | Requires Approval? | Rationale |
|-------------|-------------------|-----------|
| Dropping in-game rewards | **No** | Low-value, frequent, expected by player |
| Incrementing in-game currency | **No** | Game state progression, not a player-initiated trade |
| Tracking game state changes | **No** | State management, not a financial action |
| Trading/selling assets | **Yes** | Involves transfer of owned value |
| Purchasing items | **Yes** | Player-initiated financial transaction |
| Transferring assets to another player | **Yes** | Irreversible transfer of ownership |
| Approving marketplace listing | **Yes** | Delegates authority over owned assets |

### Self-Custody vs Custodial Wallets

```typescript
// Pattern: Determine wallet type and adjust transaction strategy
interface TransactionStrategy {
  requireUserApproval: boolean;
  maxBatchSize: number;
  signingMode: 'inline' | 'background';
}

function getTransactionStrategy(
  walletType: 'self-custody' | 'custodial' | 'playtron-zklogin',
  actionType: 'reward' | 'trade' | 'purchase' | 'state_change'
): TransactionStrategy {
  // Rewards and state changes: always background
  if (actionType === 'reward' || actionType === 'state_change') {
    return {
      requireUserApproval: false,
      maxBatchSize: 50,
      signingMode: 'background'
    };
  }

  // Financial actions: depends on wallet type
  if (walletType === 'custodial') {
    return {
      requireUserApproval: false,
      maxBatchSize: 100,
      signingMode: 'background'
    };
  }

  // Self-custody: must involve the player
  return {
    requireUserApproval: true,
    maxBatchSize: 1,
    signingMode: 'inline'
  };
}
```

### Batching Background Operations

When using custodial or Playtron zkLogin wallets, batch non-critical transactions:

```typescript
import { Transaction } from '@mysten/sui/transactions';

async function batchBackgroundRewards(
  rewards: Array<{ recipient: string; amount: bigint; coinType: string }>,
  provider: SuiClient
) {
  const tx = new Transaction();
  const CHUNK_SIZE = 20; // Avoid hitting transaction size limits

  for (let i = 0; i < rewards.length; i += CHUNK_SIZE) {
    const chunk = rewards.slice(i, i + CHUNK_SIZE);
    const batchTx = new Transaction();

    for (const reward of chunk) {
      batchTx.transferObjects(
        [batchTx.object(reward.coinType)],
        batchTx.pure.address(reward.recipient)
      );
    }

    // Execute batch without user prompt (custodial/Playtron)
    const result = await provider.signAndExecuteTransaction({
      transaction: batchTx,
    });

    console.log(`Batch ${Math.floor(i / CHUNK_SIZE) + 1}: ${result.digest}`);
  }
}
```

## Managing Gas

### Strategy Selection Matrix

| Strategy | Use Case | Pros | Cons |
|----------|----------|------|------|
| **Gas Sponsorship** | Custodial wallets, Playtron zkLogin | Zero friction for players | Operational cost for developer |
| **Aggregated Wallet** | Shared economy across players | Simplified gas management | No per-user on-chain identity |
| **Individual Wallets** | Per-player on-chain identity | Full on-chain activity traceability | Higher management complexity |
| **Batch Transactions** | Bulk operations, rewards | Reduced gas costs overall | Limited by transaction size caps |

### Gas Sponsorship Pattern

```typescript
import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';

async function executeSponsoredTransaction(
  client: SuiClient,
  userAddress: string,
  sponsorKeypair: Ed25519Keypair, // Your sponsor key
  buildTx: (tx: Transaction) => void
) {
  const tx = new Transaction();

  // Set the sender (player)
  tx.setSender(userAddress);

  // Build the game-specific transaction
  buildTx(tx);

  // Sponsor the gas
  tx.setGasPayment([]); // Clear gas objects — sponsor pays
  tx.setGasOwner(sponsorKeypair.getPublicKey().toSuiAddress());

  // Sponsor signs with their key, user signs with theirs
  const sponsoredBytes = await tx.build({ client });

  // ... pass to user for signature, then sponsor signs and executes
}
```

### Batch Transaction Aggregation

```typescript
async function processGameRewards(
  client: SuiClient,
  adminKeypair: Ed25519Keypair,
  pendingRewards: Map<string, BigInt> // address -> amount
) {
  const tx = new Transaction();
  const coinType = '0x2::sui::SUI';

  for (const [recipient, amount] of pendingRewards) {
    const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amount)]);
    tx.transferObjects([coin], tx.pure.address(recipient));
  }

  const result = await client.signAndExecuteTransaction({
    transaction: tx,
    signer: adminKeypair,
  });

  return result.digest;
}
```

## Data Management

### On-Chain vs Off-Chain Decision Framework

```
Player Action
    │
    ├── Does the asset need to be TRADABLE or SELLABLE?
    │   └── YES → On-Chain
    │       Examples: NFTs, game currency tokens, tradable skins
    │
    ├── Does the asset need to be VERIFIABLY OWNED across games?
    │   └── YES → On-Chain
    │       Examples: Cross-game items, membership badges, achievements
    │
    └── Is this internal game state that only matters within THIS game?
        └── YES → Off-Chain
            Examples: Level progress, quest state, settings, high scores
```

### Data Storage Implementation

```typescript
// Hybrid storage pattern for game state
interface GamePlayerState {
  address: string;
}

class GameStateManager {
  private db: TraditionalDatabase;  // PostgreSQL, DynamoDB, etc.
  private chain: SuiClient;

  // OFF-CHAIN: Game progression, quests, settings
  async getPlayerProgress(address: string): Promise<PlayerProgress> {
    return this.db.query(
      'SELECT level, xp, quests_completed FROM progress WHERE wallet = $1',
      [address]
    );
  }

  async savePlayerProgress(address: string, progress: PlayerProgress): Promise<void> {
    await this.db.query(
      'INSERT INTO progress (wallet, level, xp, quests_completed) VALUES ($1, $2, $3, $4) ON CONFLICT (wallet) DO UPDATE',
      [address, progress.level, progress.xp, progress.questsCompleted]
    );
  }

  // ON-CHAIN: Assets that have value outside the game
  async mintRewardNFT(
    address: string,
    metadata: NFTMetadata,
    signer: Ed25519Keypair
  ): Promise<string> {
    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::rewards::mint`,
      arguments: [
        tx.pure.address(address),
        tx.pure.string(metadata.name),
        tx.pure.string(metadata.uri),
      ],
    });

    const result = await this.chain.signAndExecuteTransaction({
      transaction: tx,
      signer,
    });

    return result.digest;
  }

  // ON-CHAIN: Currency that can be used across the ecosystem
  async getPlayerCurrencyBalance(address: string, coinType: string): Promise<bigint> {
    const balance = await this.chain.getBalance({
      owner: address,
      coinType,
    });
    return BigInt(balance.totalBalance);
  }
}
```

### Clear Boundaries

```typescript
// NEVER do this: storing game state on chain
// WRONG — quest completion is internal game state
async function recordQuestComplete_BAD(address: string, questId: number) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::quests::complete`,
    arguments: [tx.pure.address(address), tx.pure.u64(questId)],
  });
  // ❌ Unnecessary gas cost, no external value, bloats chain
}

// DO this: store game state off-chain, only put value-bearing items on chain
async function recordQuestComplete_GOOD(address: string, questId: number) {
  await db.quests.update({ wallet: address, questId, completed: true });

  // Only if the quest rewards a TRADABLE item:
  if (questHasTradableReward(questId)) {
    await mintQuestRewardNFT(address, questId);
  }
}
```

## Session Start Protocol

### Rule: Never Cache Wallet State Between Sessions

Blockchain assets can change at any time — another game, a marketplace transaction, or an external wallet action can alter a player's inventory while your game is closed.

```typescript
class GameSessionManager {
  private playerAssets: Map<string, AssetState> = new Map();

  async startSession(address: string): Promise<SessionState> {
    // 1. ALWAYS fetch fresh on-chain state
    const [ownedAssets, currencyBalances, soulboundNFTs] = await Promise.all([
      this.fetchOwnedAssets(address),
      this.fetchCurrencyBalances(address),
      this.fetchSoulboundAssets(address),
    ]);

    // 2. Compare against any locally persisted state to detect changes
    const changes = this.detectAssetChanges(address, ownedAssets);

    // 3. Merge with off-chain state (progress, settings, etc.)
    const offChainState = await this.fetchOffChainState(address);

    // 4. Build complete session state
    const sessionState: SessionState = {
      address,
      assets: ownedAssets,
      balances: currencyBalances,
      soulbound: soulboundNFTs,
      progress: offChainState.progress,
      changesSinceLastSession: changes,
      lastUpdated: Date.now(),
    };

    // 5. Cache ONLY for this session lifetime, never persist across sessions
    this.playerAssets.set(address, sessionState.assets);

    return sessionState;
  }

  async endSession(address: string): Promise<void> {
    // Clear session cache — force fresh fetch next time
    this.playerAssets.delete(address);

    // Sync any accumulated off-chain state
    await this.persistOffChainState(address);
  }

  private detectAssetChanges(
    address: string,
    currentAssets: OwnedAsset[]
  ): AssetChange[] {
    const previousAssets = this.lastKnownAssets.get(address);
    if (!previousAssets) return [];

    const changes: AssetChange[] = [];

    const currentIds = new Set(currentAssets.map(a => a.id));
    const previousIds = new Set(previousAssets.map(a => a.id));

    // New assets acquired (while away)
    for (const id of currentIds) {
      if (!previousIds.has(id)) {
        changes.push({
          type: 'acquired',
          assetId: id,
          source: 'external', // Acquired outside this game session
        });
      }
    }

    // Assets transferred/sold (while away)
    for (const id of previousIds) {
      if (!currentIds.has(id)) {
        changes.push({
          type: 'transferred',
          assetId: id,
        });
      }
    }

    return changes;
  }

  private lastKnownAssets: Map<string, OwnedAsset[]> = new Map();
}
```

## Summary Checklist

- [ ] **Transaction UX**: Background operations for rewards/state; user approval only for trades/purchases
- [ ] **Gas Strategy**: Sponsorship for Playtron/custodial; plan for batch transactions
- [ ] **Data Split**: On-chain for tradable assets and currencies; off-chain for game state and progress
- [ ] **Session Start**: Always fresh chain query; never persist wallet cache between sessions
- [ ] **Change Detection**: Detect and handle assets that changed externally between sessions
- [ ] **Wallet Awareness**: Adjust transaction strategy based on wallet type (custodial vs self-custody)

## Navigation

- [Overview](./overview.md) — Platform introduction and architecture
- [Integration](./integration.md) — SDK overview, on-device vs off-device development
- [Wallet Integration](./wallet-integration.md) — Wallet types, strategies, and requirements
- [Migration Strategies](./migration-strategies.md) — Moving users between on-device and off-device play
