'use client'

import { DAppKitProvider, createDAppKit } from '@mysten/dapp-kit-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SuiGrpcClient } from '@mysten/sui/grpc'
import React from 'react'

const queryClient = new QueryClient()

const NETWORK = (process.env.NEXT_PUBLIC_SUI_NETWORK as string) || 'testnet'

const dappKit = createDAppKit({
  networks: [NETWORK],
  defaultNetwork: NETWORK,
  createClient: (network: string) => new SuiGrpcClient({
    network,
    baseUrl: `https://rpc.${network}.sui.io:443`,
  }),
})

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <DAppKitProvider dAppKit={dappKit}>
        {children}
      </DAppKitProvider>
    </QueryClientProvider>
  )
}
