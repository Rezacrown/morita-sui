"use client";

import { DAppKitProvider, createDAppKit } from "@mysten/dapp-kit-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SuiGrpcClient } from "@mysten/sui/grpc";
import { EnokiFlowProvider } from "@mysten/enoki/react";
import { AuthWatcher } from "@/components/auth/auth-watcher";
import React from "react";

const queryClient = new QueryClient();
const NETWORK = (process.env.NEXT_PUBLIC_SUI_NETWORK as string) || "testnet";
const enokiKey = process.env.NEXT_PUBLIC_ENOKI_PUBLIC_KEY || "";

const dappKit = createDAppKit({
  networks: [NETWORK],
  defaultNetwork: NETWORK,
  createClient: (network: string) =>
    new SuiGrpcClient({
      network,
      baseUrl: `https://rpc.${network}.sui.io:443`,
    }),
  autoConnect: true,
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {enokiKey ? (
        <EnokiFlowProvider apiKey={enokiKey}>
          <DAppKitProvider dAppKit={dappKit}>
            <AuthWatcher />
            {children}
          </DAppKitProvider>
        </EnokiFlowProvider>
      ) : (
        <DAppKitProvider dAppKit={dappKit}>
          <AuthWatcher />
          {children}
        </DAppKitProvider>
      )}
    </QueryClientProvider>
  );
}
