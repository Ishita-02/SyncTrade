import { createPublicClient, createWalletClient, http } from "viem";
// import { custom } from "viem/chains";
import { config } from "../config.js";

export const publicClient = createPublicClient({
  chain: {
    id: config.CHAIN_ID,
    name: "hardhat",
    network: "hardhat",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: [config.RPC_URL] } },
  } as any,
  transport: http(config.RPC_URL),
});

export const walletClient = config.PRIVATE_KEY
  ? createWalletClient({
      chain: {
        id: config.CHAIN_ID,
        name: "hardhat",
        network: "hardhat",
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        rpcUrls: { default: { http: [config.RPC_URL] } },
      } as any,
      transport: http(config.RPC_URL),
      account: { type: "privateKey", privateKey: config.PRIVATE_KEY },
    } as any)
  : null;
