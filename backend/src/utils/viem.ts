import { createPublicClient, createWalletClient, http, Chain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { config } from "../config.js";

/**
 * Explicit Chain definition
 * IMPORTANT:
 * - Do NOT use `as any`
 * - Let TypeScript see the Chain shape
 */
const hardhatChain: Chain = {
  id: Number(config.CHAIN_ID),
  name: "Hardhat",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [config.RPC_URL],
    },
    public: {
      http: [config.RPC_URL],
    },
  },
};

/**
 * Public client (read-only)
 * Used by:
 * - indexer
 * - reads
 * - event watching
 */
export const publicClient = createPublicClient({
  chain: hardhatChain,
  transport: http(config.RPC_URL),
});

/**
 * Wallet client (state-changing)
 * Used by:
 * - writeContract
 * - strategy execution
 */
export const walletClient = config.PRIVATE_KEY
  ? createWalletClient({
      chain: hardhatChain,
      transport: http(config.RPC_URL),
      account: privateKeyToAccount(
        config.PRIVATE_KEY as `0x${string}`
      ),
    })
  : null;
