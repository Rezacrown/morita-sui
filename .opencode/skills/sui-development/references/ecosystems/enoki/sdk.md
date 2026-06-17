# Enoki TypeScript SDK

Install: `npm install @mysten/enoki`

## Register Enoki Wallets

Uses wallet-standard. Adds a wallet for each configured auth provider. Enoki wallets are network-bound — re-register when switching networks.

```typescript
import { registerEnokiWallets } from '@mysten/enoki'

const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') })

registerEnokiWallets({
    client: suiClient,
    network: 'testnet',
    apiKey: 'YOUR_PUBLIC_ENOKI_API_KEY',
    providers: {
        google: { clientId: 'YOUR_GOOGLE_CLIENT_ID' },
        facebook: { clientId: 'YOUR_FACEBOOK_CLIENT_ID' },
        twitch: { clientId: 'YOUR_TWITCH_CLIENT_ID' },
    },
})
```

When `standard:connect` is called, Enoki opens a pop-up for OAuth flow. Once complete, the wallet is connected and can sign transactions or personal messages.

### React Integration

```tsx
import { useSuiClientContext } from '@mysten/dapp-kit'
import { isEnokiNetwork, registerEnokiWallets } from '@mysten/enoki'
import { useEffect } from 'react'

function RegisterEnokiWallets() {
    const { client, network } = useSuiClientContext()

    useEffect(() => {
        if (!isEnokiNetwork(network)) return
        const { unregister } = registerEnokiWallets({
            apiKey: 'YOUR_PUBLIC_ENOKI_API_KEY',
            providers: {
                google: { clientId: 'YOUR_GOOGLE_CLIENT_ID' },
            },
            client,
            network,
        })
        return unregister
    }, [client, network])

    return null
}
```

## Signing In

### Using ConnectButton

```tsx
import { ConnectButton } from '@mysten/dapp-kit'

export function YourApp() {
    return <ConnectButton />
}
```

The Connect modal shows entries for each configured auth provider. Selecting one triggers the OAuth popup automatically.

### Custom Login Buttons

```tsx
import { useConnectWallet, useWallets } from '@mysten/dapp-kit'
import { isEnokiWallet, type EnokiWallet, type AuthProvider } from '@mysten/enoki'

function YourLoginComponent() {
    const { connect } = useConnectWallet()
    const wallets = useWallets().filter(isEnokiWallet)
    const walletsByProvider = new Map<AuthProvider, EnokiWallet>()
    wallets.forEach(w => walletsByProvider.set(w.provider, w))

    const googleWallet = walletsByProvider.get('google')

    if (!googleWallet) return null
    return <button onClick={() => connect({ wallet: googleWallet })}>Sign in with Google</button>
}
```

### Hiding Enoki from ConnectButton Modal

```tsx
<ConnectButton walletFilter={(wallet) => !isEnokiWallet(wallet)} />
```

## Signing Transactions

Uses wallet-standard, compatible with dapp-kit's `useSignAndExecuteTransaction`. **Important:** Unlike other wallets, signing does NOT require user confirmation. Always inform users before executing.

```tsx
import { Transaction } from '@mysten/sui/transactions'
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit'

function Demo() {
    const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction()

    async function handleClick() {
        const transaction = new Transaction()
        const { digest } = await signAndExecuteTransaction({ transaction })
    }

    return <button onClick={handleClick}>Execute</button>
}
```

## Sponsored Transactions

Requires private API keys through a backend service.

### Client-Side Flow

```typescript
// Client: build transaction kind bytes
const tx = new Transaction()
tx.moveCall({
    target: '0x2::kiosk::set_owner_custom',
    arguments: [tx.object(kioskId), tx.object(user.kioskOwnerCapId), tx.pure.address(recipient)],
})
tx.transferObjects([tx.object(user.kioskOwnerCapId)], recipient)

const txBytes = await tx.build({ client: suiClient, onlyTransactionKind: true })
// Send txBytes to your backend
```

```typescript
// Backend: sponsor transaction
import { EnokiClient } from '@mysten/enoki'

const enokiClient = new EnokiClient({ apiKey: process.env.ENOKI_SECRET_KEY! })

const resp = await enokiClient.createSponsoredTransaction({
    network: 'testnet',
    transactionKindBytes: toB64(txBytes),
    sender: userAddress,
    allowedMoveCallTargets: ['0x2::kiosk::set_owner_custom'],
    allowedAddresses: [recipient],
})
// Return bytes + digest to client
```

```tsx
// Client: sign
import { useSignTransaction } from '@mysten/dapp-kit'

const { mutateAsync: signTransaction } = useSignTransaction()
const { signature } = await signTransaction({ transaction: bytes })
// Send signature + digest back to backend
```

```typescript
// Backend: execute
await enokiClient.executeSponsoredTransaction({ digest, signature })
```

### Full Backend Flow (No Client Signing)

```typescript
const tx = new Transaction()
tx.moveCall({
    target: '0x2::kiosk::set_owner_custom',
    arguments: [tx.object(kioskId), tx.object(kioskOwnerCapId), tx.pure.address(address)],
})
tx.transferObjects([tx.object(kioskOwnerCapId)], address)

const txBytes = await tx.build({ client: suiClient, onlyTransactionKind: true })
const sponsored = await enokiClient.createSponsoredTransaction({
    network: 'testnet',
    transactionKindBytes: toB64(txBytes),
    sender: getAddress(process.env.ADMIN_SECRET_KEY!),
    allowedMoveCallTargets: ['0x2::kiosk::set_owner_custom'],
    allowedAddresses: [address],
})
const signer = getSigner(process.env.ADMIN_SECRET_KEY!)
const { signature } = await signer.signTransaction(fromB64(sponsored.bytes))
await enokiClient.executeSponsoredTransaction({ digest: sponsored.digest, signature })
```

## Migrating to Mainnet

- Set `network: 'mainnet'` in all Enoki parameters
- Enable Mainnet in Enoki Portal for all API keys
- Update auth provider redirect URIs if needed

## Sources

- https://docs.enoki.mystenlabs.com/ts-sdk
- https://docs.enoki.mystenlabs.com/ts-sdk/register
- https://docs.enoki.mystenlabs.com/ts-sdk/sign-in
- https://docs.enoki.mystenlabs.com/ts-sdk/transactions
- https://docs.enoki.mystenlabs.com/ts-sdk/sponsored-transactions
- https://docs.enoki.mystenlabs.com/ts-sdk/examples
