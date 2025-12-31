// backend/src/services/strategy.service.ts
import { walletClient, publicClient } from "../utils/viem";
import { coreABI } from "../abi/core";
import { config } from "../config";
import prisma from "../db/prisma";

function getWallet() {
  if (!walletClient) {
    throw new Error("Wallet client not configured - Check ADMIN_PRIVATE_KEY in .env");
  }
  return walletClient;
}

// Token mapping using environment variables
const TOKEN_MAP: Record<string, `0x${string}`> = {
  "USDC": config.MOCK_USDC,
  "ETH": config.MOCK_WETH,
  "WETH": config.MOCK_WETH,
  "BTC": config.MOCK_WBTC,
  "WBTC": config.MOCK_WBTC,
  "SOL": config.MOCK_USDC, 
};

class StrategyService {
  /**
   * Get token address by symbol
   */
  getTokenAddress(symbol: string): `0x${string}` {
    const upperSymbol = symbol.toUpperCase();
    
    // If already an address, return it
    if (symbol.startsWith("0x")) {
      return symbol as `0x${string}`;
    }
    
    // Look up in token map
    const address = TOKEN_MAP[upperSymbol];
    if (!address) {
      console.warn(`⚠️  Unknown token symbol: ${symbol}, defaulting to USDC`);
      return config.MOCK_USDC;
    }
    
    return address;
  }

  async createStrategy( leaderId: number, address: string, meta?: string, feeBps: number = 0) {
    return prisma.leader.create({
      data: {
        leaderId,
        address,
        meta,
        feeBps,
      },
    });
  }

  async getByLeader(address: string) {
    return prisma.leader.findMany({
      where: { address },
      orderBy: { createdAt: "desc" },
    });
  }

  async openPosition(
    leaderId: number,
    sizeUsd: string,
    isLong: boolean,
    indexTokenSymbol: string
  ) {
    try {
      const wc = getWallet();

      // Resolve token address
      const tokenAddress = this.getTokenAddress(indexTokenSymbol);

      console.log(`\n🚀 [StrategyService] Opening Position`);
      console.log(`   Leader ID: #${leaderId}`);
      console.log(`   Direction: ${isLong ? "LONG 📈" : "SHORT 📉"}`);
      console.log(`   Token: ${indexTokenSymbol} -> ${tokenAddress}`);
      console.log(`   Size: $${sizeUsd}`);

      // const hash = await wc.writeContract({
      //   address: config.CORE_CONTRACT,
      //   abi: coreABI,
      //   functionName: isLong ? "leaderOpenLong" : "leaderOpenShort",
      //   args: [
      //     BigInt(leaderId),
      //     BigInt(Math.floor(Number(sizeUsd))),
      //     tokenAddress,
      //   ],
      // });

      // console.log(`✅ Transaction sent: ${hash}`);

      // // Wait for confirmation
      // const receipt = await publicClient.waitForTransactionReceipt({ hash });
      // console.log(`✅ Confirmed in block ${receipt.blockNumber}\n`);

      return { success: true };
    } catch (error: any) {
      console.error("❌ Error opening position:", error);
      throw new Error(`Failed to open position: ${error.message}`);
    }
  }

  async closePosition(leaderId: number) {
    try {
      const wc = getWallet();

      console.log(`\n🔒 [StrategyService] Closing Position`);
      console.log(`   Leader ID: #${leaderId}`);

      // const hash = await wc.writeContract({
      //   address: config.CORE_CONTRACT,
      //   abi: coreABI,
      //   functionName: "leaderClose",
      //   args: [BigInt(leaderId)],
      // });

      // console.log(`✅ Transaction sent: ${hash}`);

      // const receipt = await publicClient.waitForTransactionReceipt({ hash });
      // console.log(`✅ Confirmed in block ${receipt.blockNumber}\n`);

      return { success: true };
    } catch (error: any) {
      console.error("❌ Error closing position:", error);
      throw new Error(`Failed to close position: ${error.message}`);
    }
  }
}

export const strategyService = new StrategyService();