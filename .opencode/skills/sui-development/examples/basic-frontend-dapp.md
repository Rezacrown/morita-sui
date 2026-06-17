# Basic Frontend dApp Example

A complete Sui frontend with wallet connection, data queries, and transaction submission using `@mysten/dapp-kit-react`.

## Project Setup

```bash
npm create vite@latest my-sui-dapp -- --template react-ts
cd my-sui-dapp
npm install @mysten/dapp-kit-react @mysten/sui @tanstack/react-query
```

## File: `src/lib/dapp-kit.ts`

One-time dApp Kit setup using `SuiGrpcClient` (not deprecated `SuiClient`).

```typescript
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

## File: `src/lib/dapp-kit.d.ts`

TypeScript augmentation for typed hooks without passing instance:

```typescript
import { type DAppKit } from '@mysten/dapp-kit-react'
import { dAppKit } from './dapp-kit'

declare module '@mysten/dapp-kit-react' {
    interface Register {
        dAppKit: typeof dAppKit
    }
}
```

## File: `src/providers.tsx`

Provider setup — `QueryClientProvider` + `DAppKitProvider`.

```tsx
'use client'

import { useState } from 'react'
import { DAppKitProvider } from '@mysten/dapp-kit-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { dAppKit } from './lib/dapp-kit'

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

## File: `src/App.tsx`

Main app with wallet-aware components.

```tsx
import { Providers } from './providers'
import { Header } from './components/Header'
import { BalanceDisplay } from './components/BalanceDisplay'
import { SendSui } from './components/SendSui'

export function App() {
    return (
        <Providers>
            <Header />
            <main>
                <BalanceDisplay />
                <SendSui amount={100} />
            </main>
        </Providers>
    )
}
```

## File: `src/components/Header.tsx`

Wallet connection button.

```tsx
import { ConnectButton } from '@mysten/dapp-kit-react/ui'

export function Header() {
    return (
        <header>
            <h1>My Sui dApp</h1>
            <ConnectButton />
        </header>
    )
}
```

## File: `src/components/BalanceDisplay.tsx`

Query on-chain balance using `useCurrentClient()` + TanStack `useQuery`.

```tsx
import { useCurrentAccount, useCurrentClient } from '@mysten/dapp-kit-react'
import { useQuery } from '@tanstack/react-query'

export function BalanceDisplay() {
    const account = useCurrentAccount()
    const client = useCurrentClient()

    const { data: balance, isLoading } = useQuery({
        queryKey: ['balance', account?.address],
        queryFn: async () => {
            const result = await client.core.getBalance({
                owner: account!.address,
            })
            return Number(result.totalBalance) / 1_000_000_000
        },
        enabled: !!account, // CRITICAL: prevents firing with undefined owner
    })

    if (!account) return <p>Connect wallet to see balance</p>
    if (isLoading) return <p>Loading...</p>

    return <p>Balance: {balance} SUI</p>
}
```

## File: `src/components/SendSui.tsx`

Transaction submission using `useDAppKit()` + `Transaction`.

```tsx
import { useState } from 'react'
import { Transaction } from '@mysten/sui/transactions'
import { useCurrentAccount, useCurrentClient, useDAppKit } from '@mysten/dapp-kit-react'
import { useQueryClient } from '@tanstack/react-query'

export function SendSui({ amount }: { amount: number }) {
    const account = useCurrentAccount()
    const client = useCurrentClient()
    const { signAndExecuteTransaction } = useDAppKit()
    const queryClient = useQueryClient()
    const [recipient, setRecipient] = useState('')
    const [status, setStatus] = useState('')

    const handleSend = async () => {
        if (!account || !recipient) return
        setStatus('Sending...')

        const tx = new Transaction()
        const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amount)])
        tx.transferObjects([coin], tx.pure.address(recipient))

        try {
            const result = await signAndExecuteTransaction({ transaction: tx })

            // Check for failure (v2 pattern)
            if (result.$kind === 'FailedTransaction') {
                setStatus('Transaction failed')
                return
            }

            // Wait for indexing before cache invalidation
            const digest = result.Transaction.digest
            await client.waitForTransaction({ digest })

            // Now invalidate caches
            queryClient.invalidateQueries({ queryKey: ['balance'] })
            setStatus(`Sent! Digest: ${digest}`)
        } catch (e) {
            setStatus(`Error: ${e}`)
        }
    }

    if (!account) return <p>Connect wallet to send SUI</p>

    return (
        <div>
            <input
                placeholder="Recipient address"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
            />
            <button onClick={handleSend}>Send {amount} SUI</button>
            {status && <p>{status}</p>}
        </div>
    )
}
```

## Key Patterns Demonstrated

- **dApp Kit v2**: `createDAppKit` + `DAppKitProvider`, NOT the old `SuiClientProvider` + `WalletProvider`
- **SuiGrpcClient**: Default client, NOT deprecated `SuiClient` or JSON-RPC
- **useCurrentClient() + useQuery**: Replaces removed `useSuiClientQuery`
- **enabled: !!account**: Prevents queries firing without a connected wallet
- **Transaction (not TransactionBlock)**: PTB construction in v2
- **tx.pure.u64(n)**: Typed pure values, not `tx.pure(value)`
- **result.$kind !== 'FailedTransaction'**: v2 status check, not v1's `result.effects?.status?.status`
- **result.Transaction.digest**: Correct digest access in v2
- **waitForTransaction before invalidateQueries**: Prevents stale data refetch
- **ConnectButton from @mysten/dapp-kit-react/ui**: Correct import path
