import { walletClient } from "../utils/viem";
import { coreABI } from "../abi/core.js";
import { config } from "../config";
import prisma from "../db/prisma";

function getWallet() {
  if (!walletClient) {
    throw new Error("Wallet client not configured");
  }
  return walletClient;
}

class StrategyService {

async createStrategy(
    address: string,
    meta?: string,
    feeBps: number = 0
  ) {
    return prisma.leader.create({
      data: {
        address,
        meta,
        feeBps,
      },
    });
  }

  /**
   * Get all strategies created by a leader wallet
   */
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
    indexToken: string
  ) {
    const wc = getWallet();

    await wc.writeContract({
      address: config.CORE_CONTRACT,
      abi: coreABI,
      functionName: isLong ? "leaderOpenLong" : "leaderOpenShort",
      args: [BigInt(leaderId), BigInt(sizeUsd), `0x${indexToken}` ],
    });
  }

  async closePosition(leaderId: number) {
    const wc = getWallet();

    await wc.writeContract({
      address: config.CORE_CONTRACT,
      abi: coreABI,
      functionName: "leaderClose",
      args: [BigInt(leaderId)],
    });
  }
}

export const strategyService = new StrategyService();
