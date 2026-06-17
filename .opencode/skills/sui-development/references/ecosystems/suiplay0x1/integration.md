# SuiPlay0X1 — Integration

Integration with SuiPlay0X1 spans two distinct development domains: **on-device** (native integration through the Playtron GameOS SDK) and **off-device** (web-based integration through the Sui dApp Kit).

## Integration Paths Overview

```
┌──────────────────────────────────────────────────────────┐
│                    INTEGRATION PATHS                        │
├───────────────────────┬──────────────────────────────────┤
│    ON-DEVICE           │    OFF-DEVICE                      │
│    (Playtron GameOS)    │    (Web / Cross-Platform)          │
├───────────────────────┼──────────────────────────────────┤
│ • Native SDK access    │ • Sui dApp Kit                    │
│ • C++, C#, Node.js     │ • TypeScript / React              │
│ • OS-level features    │ • Browser-based games              │
│ • Pre-authenticated    │ • Companion web apps               │
│   wallet               │ • Cross-platform continuity        │
│ • Hardware attestation │ • Self-custody wallet support     │
└───────────────────────┴──────────────────────────────────┘
```

---

## On-Device: Playtron GameOS SDK

The Playtron GameOS SDK provides native integration with the SuiPlay0X1 operating system. It is the primary integration path for games running directly on the device.

### Accessing the SDK

```
Repository: github.com/playtron-os/playtron-sdk
```

### SDK Capabilities

| Feature | Description |
|---------|-------------|
| **Environment Detection** | Determine if code is running on SuiPlay0X1 hardware |
| **PACT Attestation** | Hardware-backed proof that a device is genuine SuiPlay0X1 |
| **Virtual Keyboard** | OS-managed text input overlay for game UIs |
| **Virtual Browser** | Embedded browser for web content within native games |
| **Sui Wallet Integration** | Direct, authenticated access to the Playtron wallet |

### Language Support

The SDK is available across three language ecosystems:

| Language | Package Format | Import Method |
|----------|---------------|---------------|
| **C++** | `.dll` (dynamic library) | Direct link against provided DLLs |
| **C#** | NuGet packages | `dotnet add package Playtron.SDK` |
| **Node.js** | npm packages | `npm install @playtron/sdk` |

### Environment Detection (C++ Example)

```cpp
#include <playtron/sdk.h>

bool isRunningOnSuiPlay0x1() {
    PlaytronEnvironment env = playtron_detect_environment();
    return env == PLAYTRON_ENV_SUIPLAY0X1;
}

void initializeGame() {
    if (isRunningOnSuiPlay0x1()) {
        // Enable Sui wallet features
        playtron_wallet_initialize();
        // Enable hardware attestation
        playtron_pact_initialize();
    }
    // Proceed with normal game initialization
}
```

### Environment Detection (Node.js Example)

```typescript
import { detectEnvironment, initializeWallet } from '@playtron/sdk';

async function bootstrap() {
  const env = await detectEnvironment();

  if (env.type === 'suiplay0x1') {
    const wallet = await initializeWallet();
    console.log(`Playtron wallet ready: ${wallet.address}`);
  }

  // Start game
}
```

### Wallet Access (C# Example)

```csharp
using Playtron.SDK;
using Playtron.SDK.Wallet;

public class GameWalletManager
{
    private ISuiWallet _wallet;

    public async Task InitializeAsync()
    {
        // Automatic — wallet is pre-authenticated on device
        _wallet = await PlaytronWallet.GetDefaultAsync();

        Console.WriteLine($"Connected: {_wallet.Address}");
    }

    public async Task<TransactionResult> SendRewardAsync(string recipient, ulong amount)
    {
        return await _wallet.SignAndExecuteTransactionAsync(tx =>
        {
            tx.TransferSui(recipient, amount);
        });
    }
}
```

### PACT Attestation (C++ Example)

```cpp
#include <playtron/pact.h>

bool verifyDeviceAuthenticity() {
    PACTChallenge challenge = pact_generate_challenge();

    // Send challenge to your backend
    std::string response = sendToBackend(challenge.data, challenge.length);

    // Backend verifies with Pact service and returns attestation proof
    PACTVerificationResult result = pact_verify_response(
        response.c_str(),
        response.length()
    );

    return result.verified && !result.revoked;
}
```

### Key Advantage: Zero Setup for Players

When running on-device, players **already have an account**. No wallet creation, no seed phrase backup, no external app installation — the Playtron wallet is available immediately through the SDK:

```typescript
// No user interaction needed — wallet is already authenticated
const wallet = await PlaytronSDK.getWallet();
const address = wallet.getAddress();
const balance = await wallet.getBalance();
```

---

## Off-Device: Sui dApp Kit

For web-based games, companion applications, and cross-platform experiences, use the Sui dApp Kit.

### Accessing the dApp Kit

```
Documentation: sdk.mystenlabs.com/dapp-kit
```

### Core Capabilities

| Feature | Description |
|---------|-------------|
| **Wallet Connection** | Connect Playtron zkLogin wallet + external wallets (Phantom, Backpack, Slush) |
| **Transaction Building** | Construct and execute Sui transactions from browser environments |
| **Asset Management** | Query and display on-chain assets |
| **TypeScript Processing** | All interactions require TypeScript/JavaScript processing |

### dApp Kit Setup (React Example)

```tsx
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();
const networks = {
  mainnet: { url: getFullnodeUrl('mainnet') },
  testnet: { url: getFullnodeUrl('testnet') },
};

export function DAppProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networks} defaultNetwork="mainnet">
        <WalletProvider autoConnect>
          {children}
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
```

### Connecting the Playtron Wallet Off-Device

The Playtron zkLogin wallet works with dApp Kit. Players authenticate with their Playtron credentials from any browser:

```tsx
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';

function GameHeader() {
  const account = useCurrentAccount();

  return (
    <header>
      <ConnectButton />
      {account && <span>Playing as: {account.address}</span>}
    </header>
  );
}
```

### Alternative: Asset Transfer to Playtron

If dApp Kit integration is not desired, provide a flow to send assets to the player's Playtron wallet address:

```typescript
import { Transaction } from '@mysten/sui/transactions';

async function transferToPlaytron(
  client: SuiClient,
  signer: Ed25519Keypair,
  playerPlaytronAddress: string,
  assetId: string
): Promise<string> {
  const tx = new Transaction();
  tx.transferObjects(
    [tx.object(assetId)],
    tx.pure.address(playerPlaytronAddress)
  );

  const result = await client.signAndExecuteTransaction({
    transaction: tx,
    signer,
  });

  return result.digest;
}
```

### Companion Web App

The official companion web app at `wallet.playtron.one` provides:
- Playtron wallet management
- Asset viewing and transfer
- Wallet linking between Playtron and external wallets
- User-friendly transfer flows

---

## Supported Wallet Types on Device

| Wallet Type | SDK Access | dApp Kit Access | Notes |
|-------------|-----------|----------------|-------|
| **Playtron Wallet** | Native, automatic | Yes (zkLogin) | Primary on-device wallet |
| **Self-Custody** (Slush, Phantom, Backpack, etc.) | Via Playtron SDK | Yes | May not always be available on device |

---

## Choosing Your Integration Path

```
Is the game running natively on SuiPlay0X1?
    │
    ├── YES → Use Playtron GameOS SDK
    │   ├── Native game engine (C++)       → C++ SDK
    │   ├── Unity / .NET game engine (C#)  → NuGet packages
    │   └── Electron / Node.js game        → npm SDK
    │
    └── NO (web / cross-platform) → Use Sui dApp Kit
        ├── React web app                  → @mysten/dapp-kit
        ├── Vanilla JS web app             → @mysten/dapp-kit + @mysten/sui
        └── Companion / admin app          → @mysten/dapp-kit
```

## Navigation

- [Overview](./overview.md) — Platform introduction and architecture
- [Best Practices](./best-practices.md) — Transaction handling, gas management, data storage strategies
- [Wallet Integration](./wallet-integration.md) — Wallet types, strategies, and requirements
- [Migration Strategies](./migration-strategies.md) — Moving users between on-device and off-device play
