/**
 * Indexer service: watches Core contract events and persists to Prisma
 *
 * Note: coreAbi must exist at backend/abi/Core.json
 */

import { publicClient } from "../utils/viem.js";
import prisma from "../db/prisma.js";
import coreAbi from "../../../artifacts/contracts/Core.sol/Core.json";
import { config } from "../config.js";
import { parseAbi } from 'viem'

const safeHash = (hash: `0x${string}` | null | undefined): string | undefined =>
  hash ? String(hash) : undefined;

const safeBlock = (b: bigint | null): number | undefined =>
  b !== null ? Number(b) : undefined;


/**
 * Helper: safe store event log
 */
async function persistEvent(event: string, args: any, txHash?: string, blockNumber?: number) {
  try {
    await prisma.eventLog.create({
      data: {
        event,
        args: args ? args : {},
        txHash: txHash ?? null,
        blockNumber: blockNumber ?? null,
        leaderId: args?.leaderId != null ? Number(args.leaderId) : null,
        follower: args?.follower ?? null,
      },
    });
  } catch (err) {
    console.error("persistEvent error", err);
  }
}

export const startIndexer = async () => {
  console.log("Starting indexer for Core:", config.CORE_CONTRACT);

  const watch = publicClient.watchContractEvent.bind(publicClient);

  // LeaderRegistered(uint256 indexed leaderId, address indexed leader, string meta)
  watch({
    address: config.CORE_CONTRACT as `0x${string}`,
    abi:  parseAbi(['event LeaderRegistered(uint256 leaderId, address leader, string meta)']),
    eventName: "LeaderRegistered",
    onLogs: async (logs) => {
      for (const l of logs) {
        const args = l.args as any;
        const leaderId = Number(args.leaderId);
        const leaderAddr = args.leader;
        const meta = args.meta ?? null;

        await prisma.leader.upsert({
          where: { leaderId },
          update: {
            address: leaderAddr,
            meta,
            updatedAt: new Date(),
          },
          create: {
            leaderId,
            address: leaderAddr,
            meta,
            feeBps: 0,
            totalFollowers: 0,
            totalDeposits: "0",
            feesAccrued: "0",
          },
        });

        await persistEvent("LeaderRegistered", args, safeHash(l.transactionHash), safeBlock(l.blockNumber));
      }
    },
  });

  // Subscribed(uint256 leaderId, address follower, uint256 amount)
  watch({
    address: config.CORE_CONTRACT as `0x${string}`,
    abi: parseAbi(['event Subscribed(uint256 leaderId, address follower, uint256 amount)']),
    eventName: 'Subscribed',
    onLogs: async (logs) => {
      for (const l of logs) {
        const args = l.args as any;
        const leaderId = Number(args.leaderId);
        const followerAddr = args.follower;
        const amount = args.amount?.toString?.() ?? String(args.amount);

        // upsert follower
        const existing = await prisma.follower.findUnique({
          where: { leaderId_address: { leaderId, address: followerAddr } as any },
        });

        if (!existing) {
          await prisma.follower.create({
            data: {
              leaderId,
              address: followerAddr,
              deposit: amount,
            } as any,
          });

          // increment counters on leader
          await prisma.leader.updateMany({
            where: { leaderId },
            data: {
              totalFollowers: { increment: 1 } as any,
              totalDeposits: { increment: amount } as any,
            },
          });
        } else {
          // increment deposit
          await prisma.follower.updateMany({
            where: { leaderId, address: followerAddr },
            data: { deposit: { increment: amount } as any, updatedAt: new Date() } as any,
          });

          await prisma.leader.updateMany({
            where: { leaderId },
            data: { totalDeposits: { increment: amount } as any },
          });
        }

        await persistEvent("Subscribed", args, safeHash(l.transactionHash), safeBlock(l.blockNumber));
      }
    },
  });

  // Unsubscribed
  watch({
    address: config.CORE_CONTRACT as `0x${string}`,
    abi: parseAbi(['event Unsubscribed(uint256 leaderId, address follower, uint256 amount)']),
    eventName: "Unsubscribed",
    onLogs: async (logs) => {
      for (const l of logs) {
        const args = l.args;
        const leaderId = Number(args.leaderId);
        const followerAddr = args.follower;
        const amount = args.amount?.toString?.() ?? String(args.amount);

        // set deposit = 0
        await prisma.follower.updateMany({
          where: { leaderId, address: followerAddr },
          data: { deposit: "0", updatedAt: new Date() } as any,
        });

        await prisma.leader.updateMany({
          where: { leaderId },
          data: { totalDeposits: { decrement: amount } as any, totalFollowers: { decrement: 1 } as any },
        });

        await persistEvent("Unsubscribed", args, safeHash(l.transactionHash), safeBlock(l.blockNumber));
      }
    },
  });

  // FollowerMirrored: create position record
  watch({
    address: config.CORE_CONTRACT as `0x${string}`,
    abi: parseAbi(['event FollowerMirrored(uint256 leaderId, address follower, string action, uint256 sizeUsd, bool isLong, uint256 entryPrice, address indexToken)']),
    eventName: "FollowerMirrored",
    strict: true,
    onLogs: async (logs) => {
      for (const l of logs) {
        const a = l.args ;
        // create a Position row for follower
        await prisma.position.create({
          data: {
            leaderId: Number(a.leaderId),
            follower: a.follower,
            action: a.action,
            isLong: Boolean(a.isLong),
            entryPrice: a.entryPrice.toString(),
            sizeUsd: a.sizeUsd.toString(),
            isOpen: true,
            indexToken: a.indexToken,
            txHash: safeHash(l.transactionHash) ?? undefined,
            timestamp: new Date(),
          } as any,
        });

        await persistEvent("FollowerMirrored", a, safeHash(l.transactionHash), safeBlock(l.blockNumber));
      }
    },
  });

  // FollowerPnLSettled: update position and follower deposit reading from chain
  watch({
    address: config.CORE_CONTRACT as `0x${string}`,
    abi: parseAbi(['event FollowerPnLSettled(uint256 leaderId, address follower, int256 pnlUsd)']),
    eventName: "FollowerPnLSettled",
    onLogs: async (logs) => {
      for (const l of logs) {
        const a = l.args as any;
        const leaderId = Number(a.leaderId);
        const followerAddr = a.follower;

        // Find latest open position for follower
        const pos = await prisma.position.findFirst({
          where: { leaderId, follower: followerAddr, isOpen: true },
          orderBy: { id: "desc" },
        });

        if (pos) {
          await prisma.position.update({
            where: { id: pos.id },
            data: {
              pnlUsd: a.pnlUsd.toString(),
              isOpen: false,
              exitPrice: pos.entryPrice, // we didn't emit exitPrice; keep entry if unknown
            } as any,
          });
        }

        // Reconcile follower deposit from on-chain value
        try {
          const depositOnChain = await publicClient.readContract({
            address: config.CORE_CONTRACT as `0x${string}`,
            abi: parseAbi(['function deposits(uint256 leaderId, address user) view returns (uint256)']),
            functionName: "deposits",
            args: [BigInt(leaderId), followerAddr],
          });

          await prisma.follower.updateMany({
            where: { leaderId, address: followerAddr },
            data: { deposit: depositOnChain.toString(), updatedAt: new Date() } as any,
          });
        } catch (err) {
          console.warn("Failed to read deposits on-chain:", err);
        }

        await persistEvent("FollowerPnLSettled", a, safeHash(l.transactionHash), safeBlock(l.blockNumber));
      }
    },
  });

  // LeaderFeesAccrued
  watch({
    address: config.CORE_CONTRACT as `0x${string}`,
    abi: parseAbi(['event LeaderFeesAccrued(uint256 leaderid, uint256 amount)']),
    eventName: "LeaderFeesAccrued",
    onLogs: async (logs) => {
      for (const l of logs) {
        const a = l.args as any;
        const leaderId = Number(a.leaderId);
        const amount = a.amount?.toString?.() ?? String(a.amount);
        // increment feesAccrued
        await prisma.leader.updateMany({
          where: { leaderId },
          data: { feesAccrued: { increment: amount } as any },
        });
        await persistEvent("LeaderFeesAccrued", a, safeHash(l.transactionHash), safeBlock(l.blockNumber));
      }
    },
  });

  // LeaderWithdraw
  watch({
    address: config.CORE_CONTRACT as `0x${string}`,
    abi: parseAbi(['event LeaderWithdraw(uint256 leaderId, address to, uint256 amount)']),
    eventName: "LeaderWithdraw",
    onLogs: async (logs) => {
      for (const l of logs) {
        const a = l.args as any;
        const leaderId = Number(a.leaderId);
        const amount = a.amount?.toString?.() ?? String(a.amount);
        await prisma.leader.updateMany({
          where: { leaderId },
          data: { feesAccrued: { decrement: amount } as any },
        });
        await persistEvent("LeaderWithdraw", a, safeHash(l.transactionHash), safeBlock(l.blockNumber));
      }
    },
  });

  // PositionClosed (generic)
  watch({
    address: config.CORE_CONTRACT as `0x${string}`,
    abi: parseAbi(['event PositionClosed(uint256 leaderId, address follower)']),
    eventName: "PositionClosed",
    onLogs: async (logs) => {
      for (const l of logs) {
        await persistEvent("PositionClosed", l.args, safeHash(l.transactionHash), safeBlock(l.blockNumber));
      }
    },
  });

  console.log("✅ Indexer watchers registered.");
};
