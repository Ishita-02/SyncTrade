"use client";

import { WagmiProvider, createConfig, http } from "wagmi";
import { hardhat } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, getDefaultWallets } from "@rainbow-me/rainbowkit";

// import "@rainbow-me/rainbowkit/dist/index.css";

const { wallets } = getDefaultWallets({
  appName: "SyncTrade",
  projectId: "demo-project-id", // OK for local
});

const config = createConfig({
  chains: [hardhat],
  transports: {
    [hardhat.id]: http("http://localhost:8545"),
  },
});

const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
