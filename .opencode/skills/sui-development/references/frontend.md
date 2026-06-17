# Sui Frontend / dApp Kit

Browser Sui apps fail for a consistent set of reasons. This covers the correct patterns.

## Setup

### Package Choice

| Package | Status |
|---------|--------|
| `@mysten/dapp-kit-react` | ✅ Current — React |
| `@mysten/dapp-kit-core` | ✅ Current — Vue, Svelte, vanilla |
| `@mysten/dapp-kit` | ❌ Deprecated — JSON-RPC only |

### React Setup

```typescript
// dapp-kit.ts
import { createDAppKit } from '@mysten/dapp-kit-react'
import { SuiGrpcClient } from '@mysten/sui/grpc'

export const dAppKit = createDAppKit({
    networks: [
        { name: 'testnet', url: 'https://rpc.testnet.sui.io:443' },
        { name: 'mainnet', url: 'https://rpc.mainnet.sui.io:443' },
    ],
    createClient: (name, { url }) =>
        new SuiGrpcClient({ network: name, baseUrl: url }),
})
```

```tsx
// app.tsx
import { DAppKitProvider } from '@mysten/dapp-kit-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { dAppKit } from './dapp-kit'

const queryClient = new QueryClient()

export function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <DAppKitProvider dAppKit={dAppKit}>
                <YourApp />
            </DAppKitProvider>
        </QueryClientProvider>
    )
}
```

### TypeScript Augmentation

For typed hooks without passing instance:

```typescript
// dapp-kit.d.ts
import { type DAppKit } from '@mysten/dapp-kit-react'
import { dAppKit } from './dapp-kit'

declare module '@mysten/dapp-kit-react' {
    interface Register {
        dAppKit: typeof dAppKit
    }
}
```

### Next.js Setup

```tsx
// app/providers.tsx — 'use client'
'use client'

import { DAppKitProvider } from '@mysten/dapp-kit-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { dAppKit } from '@/lib/dapp-kit'

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient())

    return (
        <QueryClientProvider client={queryClient}>
            <DAppKitProvider dAppKit={dAppKit}>
                {children}
            </DAppKitProvider>
        </QueryClientProvider>
    )
}
```

```tsx
// app/layout.tsx
import { Providers } from './providers'

export default function RootLayout({ children }) {
    return (
        <html>
            <body>
                <Providers>{children}</Providers>
            </body>
        </html>
    )
}
```

## React Hooks

### Current Hooks (v2)

| Hook | Returns | Use |
|------|---------|-----|
| `useCurrentAccount()` | `WalletAccount \| null` | Connected account |
| `useCurrentWallet()` | `Wallet \| null` | Active wallet |
| `useCurrentNetwork()` | `{ name, url }` | Active network |
| `useCurrentClient()` | `SuiGrpcClient` | Query onchain data |
| `useDAppKit()` | `{ signAndExecuteTransaction, connectWallet, disconnectWallet, switchNetwork }` | Actions |
| `useWallets()` | `Wallet[]` | All detected wallets |
| `useWalletConnection()` | Connection state | Auto-reconnect status |

### Removed Hooks (v1 — do NOT use)

`useSuiClientQuery`, `useSuiClientInfiniteQuery`, `useSuiClientContext`, `useSuiClient`, `useSignAndExecuteTransaction` (mutation hook), `useConnectWallet`, `useDisconnectWallet`.

### Wallet Connect Button

```tsx
import { ConnectButton } from '@mysten/dapp-kit-react/ui'

export function Header() {
    return <ConnectButton />
}
```

## Queries

Use `useCurrentClient()` + TanStack `useQuery`. Never use the removed `useSuiClientQuery`.

```tsx
import { useCurrentAccount, useCurrentClient } from '@mysten/dapp-kit-react'
import { useQuery } from '@tanstack/react-query'

export function Balance() {
    const account = useCurrentAccount()
    const client = useCurrentClient()

    const { data: balance } = useQuery({
        queryKey: ['balance', account?.address],
        queryFn: async () => {
            return client.core.getBalance({ owner: account!.address })
        },
        enabled: !!account, // Critical — prevents firing with undefined owner
    })

    if (!account) return <div>Connect wallet to see balance</div>
    if (!balance) return <div>Loading...</div>

    return <div>Balance: {balance.totalBalance}</div>
}
```

### Owned Objects

```tsx
const { data: objects } = useQuery({
    queryKey: ['owned', account?.address, objectType],
    queryFn: () =>
        client.core.listOwnedObjects({
            owner: account!.address,
            type: objectType,
        }),
    enabled: !!account,
})
```

### Infinite Query (Pagination)

```tsx
import { useInfiniteQuery } from '@tanstack/react-query'

const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ['coins', account?.address],
    queryFn: ({ pageParam }) =>
        client.core.listCoins({
            owner: account!.address,
            coinType: '0x2::sui::SUI',
            cursor: pageParam,
        }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!account,
})
```

## Transactions

### Sign and Execute

```tsx
import { Transaction } from '@mysten/sui/transactions'
import { useDAppKit, useCurrentClient } from '@mysten/dapp-kit-react'
import { useQueryClient } from '@tanstack/react-query'

export function SendButton({ amount, recipient }: { amount: number; recipient: string }) {
    const { signAndExecuteTransaction } = useDAppKit()
    const client = useCurrentClient()
    const queryClient = useQueryClient()

    const handleSend = async () => {
        const tx = new Transaction()
        const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amount)])
        tx.transferObjects([coin], tx.pure.address(recipient))

        const result = await signAndExecuteTransaction({ transaction: tx })

        // Check for failure
        if (result.$kind === 'FailedTransaction') {
            console.error('Transaction failed')
            return
        }

        // Wait for indexing
        const digest = result.Transaction.digest
        await client.waitForTransaction({ digest })

        // Now invalidate caches
        queryClient.invalidateQueries({ queryKey: ['balance'] })
    }

    return <button onClick={handleSend}>Send {amount} SUI</button>
}
```

### Sign Transaction (without executing)

```tsx
const { signTransaction } = useDAppKit()

const result = await signTransaction({ transaction: tx })
// result.bytes — signed transaction bytes
// Use for sponsored flows where another party submits
```

### Sign Personal Message

```tsx
const { signPersonalMessage } = useDAppKit()

const result = await signPersonalMessage({
    message: new TextEncoder().encode('Hello Sui'),
})
```

## Code Review Checklist

When reviewing Sui frontend code, check every item:

**Imports:**
- No `@mysten/sui.js` — use `@mysten/sui`
- No `@mysten/dapp-kit` (no suffix) — use `-react` or `-core`
- `ConnectButton` from `@mysten/dapp-kit-react/ui` (not `-react` directly)
- No `SuiClient` — use `SuiGrpcClient` or `useCurrentClient()`
- No `TransactionBlock` — use `Transaction`

**Removed hooks (any = bug):**
- `useSuiClientQuery`, `useSuiClientInfiniteQuery`, `useSuiClient`, `useSignAndExecuteTransaction`, `useConnectWallet`, `useDisconnectWallet`

**Provider stack:**
- No `SuiClientProvider` + `WalletProvider` — use `createDAppKit` + `DAppKitProvider`

**Client:**
- No `new SuiGrpcClient()` inside component — use `useCurrentClient()`
- `enabled: !!account` on queries needing wallet

**Transactions:**
- `tx.pure.u64(n)` not `tx.pure(value)`
- Pass `Transaction` instance (or `tx.serialize()`) to wallet, not `tx.build()` bytes
- `signAndExecuteTransaction({ transaction: tx })` not `{ transactionBlock: tx }`
- `result.$kind !== 'FailedTransaction'` not `result.effects?.status?.status`
- `result.Transaction.digest` not `result.digest` directly
- `waitForTransaction` before cache invalidation

**SSR:**
- Wallet-aware components marked `'use client'`

## Rules

1. Use `@mysten/dapp-kit-react` or `@mysten/dapp-kit-core` — never bare `@mysten/dapp-kit`
2. Use `SuiGrpcClient` in `createClient`, not `SuiJsonRpcClient`
3. Use `createDAppKit` + `DAppKitProvider`, not the old three-provider stack
4. Include TypeScript augmentation for typed hooks
5. Do not use removed v1 hooks
6. Null-check `useCurrentAccount()` — returns null before connection
7. `waitForTransaction` before `queryClient.invalidateQueries`
8. Pass `Transaction` instance to wallet, not `tx.build()` bytes
9. Check `result.$kind !== 'FailedTransaction'` before accessing digest
10. Wallet-gated UI must be client-rendered (`'use client'` in Next.js)
