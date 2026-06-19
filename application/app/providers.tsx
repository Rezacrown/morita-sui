'use client'

import { DAppKitProvider, createDAppKit } from '@mysten/dapp-kit-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SuiGrpcClient } from '@mysten/sui/grpc'
import { enokiWalletsInitializer } from '@mysten/enoki'
import { AuthWatcher } from '@/components/auth/auth-watcher'
import React from 'react'

const queryClient = new QueryClient()

const NETWORK = (process.env.NEXT_PUBLIC_SUI_NETWORK as string) || 'testnet'
const enokiKey = process.env.NEXT_PUBLIC_ENOKI_PUBLIC_KEY
const googleId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

const walletInitializers: any[] = []
if (enokiKey && googleId) {
  walletInitializers.push(enokiWalletsInitializer({
    apiKey: enokiKey,
    providers: { google: { clientId: googleId } },
  }))
}

const dappKit = createDAppKit({
  networks: [NETWORK],
  defaultNetwork: NETWORK,
  createClient: (network: string) => new SuiGrpcClient({
    network,
    baseUrl: `https://rpc.${network}.sui.io:443`,
  }),
  walletInitializers,
  autoConnect: true,
})

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <DAppKitProvider dAppKit={dappKit}>
        <AuthWatcher />
        {children}
      </DAppKitProvider>
    </QueryClientProvider>
  )
}
