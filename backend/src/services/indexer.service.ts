/**
 * Indexer service: watches Core contract events and persists to Prisma
 *
 * Note: coreAbi must exist at backend/abi/Core.json
 */

import { publicClient } from "../utils/viem.js";
import prisma from "../db/prisma.js";
import {coreABI} from "../abi/core.js";
import { config } from "../config.js";
import { parseAbi, decodeEventLog } from 'viem'
import { Prisma } from "@prisma/client";

const safeHash = (hash: `0x${string}` | null | undefined): string | undefined =>
  hash ? String(hash) : undefined;

const safeBlock = (b: bigint | null): number | undefined =>
  b !== null ? Number(b) : undefined;


/**
 * Helper: safe store event log
 */
async function persistEvent(event: string, args: any, txHash?: string, blockNumber?: number) {
  try {
    // 1. Serialize BigInts to Strings for the JSON 'args' column
    const safeArgs = JSON.parse(JSON.stringify(args, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));

    // 2. Extract Leader ID if present
    const rawLeaderId = args?.leaderId ? Number(args.leaderId) : null;

    await prisma.eventLog.create({
      data: {
        event,
        args: safeArgs, // Save the full payload here (including follower address)
        txHash: txHash ?? null,
        blockNumber: blockNumber ?? null,

        leader: rawLeaderId ? {
          connect: { leaderId: rawLeaderId }
        } : undefined,
      },
    });

    console.log(`✅ Persisted event: ${event}`);
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
        console.log("log", l)
        let args = l.args as any;
        if (!args) {
            console.log("⚠️ Args undefined, attempting manual decode...");
            const decoded = decodeEventLog({
              abi: coreABI,
              data: l.data,
              topics: l.topics,
            });
            args = decoded.args;
            console.log(args)
          }
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
            leaderId: leaderId,
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
        let args = l.args as any;
        if (!args) {
            console.log("⚠️ Args undefined, attempting manual decode...");
            const decoded = decodeEventLog({
              abi: coreABI,
              data: l.data,
              topics: l.topics,
            });
            args = decoded.args;
            console.log(decoded)
          }
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
      let args = l.args as any;
      if (!args) {
        console.log("⚠️ Args undefined, attempting manual decode...");
        const decoded = decodeEventLog({
          abi: coreABI,
          data: l.data,
          topics: l.topics,
        });
        args = decoded.args;
      }
      
      const leaderId = Number(args.leaderId);
      const followerAddr = args.follower;
      const amount = args.amount?.toString?.() ?? String(args.amount);

      try {
        await prisma.leader.update({
          where: { leaderId: leaderId }, 
          data: {
            totalDeposits: { decrement: amount },
            totalFollowers: { decrement: 1 },
            
            followers: {
              deleteMany: {
                address: followerAddr
              }
            }
          },
        });
      } catch (error) {
        console.error(`Failed to unsubscribe follower ${followerAddr} from leader ${leaderId}:`, error);
      }
      // --- END OF UPDATE ---

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
        let args = l.args as any;
        if (!args || Object.keys(args).length === 0) {
            console.log("⚠️ a undefined, attempting manual decode...");
            const decoded = decodeEventLog({
              abi: coreABI,
              data: l.data,
              topics: l.topics,
            });
            args = decoded.args;
            console.log(args)
          }
          const followerAddress = args.follower.toLowerCase() ;
           const follower = await prisma.follower.upsert({
            where: { leaderId_address: { leaderId: Number(args.leaderId), address: followerAddress } },
            update: {},
            create: { leaderId: Number(args.leaderId), address: followerAddress, deposit: "0" }
          });
 

          const entryPrice = new Prisma.Decimal(
              args.entryPrice.toString()
            ).div("1e18");

            const sizeUsd = new Prisma.Decimal(
              args.sizeUsd.toString()
            ).div("1e18");
        // create a Position row for follower
        await prisma.position.create({
          data: {
            leaderId: Number(args.leaderId),
            followerId: follower.id,
            action: args.action,
            isLong: Boolean(args.isLong),
            entryPrice: entryPrice,
            sizeUsd: sizeUsd,
            isOpen: true,
            indexToken: args.indexToken,
            txHash: safeHash(l.transactionHash) ?? undefined,
            timestamp: new Date(),
          } as any,
        });

        await persistEvent("FollowerMirrored", args, safeHash(l.transactionHash), safeBlock(l.blockNumber));
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
        let args = l.args as any;
        if (!args) {
            console.log("⚠️ Args undefined, attempting manual decode...");
            const decoded = decodeEventLog({
              abi: coreABI,
              data: l.data,
              topics: l.topics,
            });
            args = decoded.args;
            console.log(args)
          }
        const leaderId = Number(args.leaderId);
        const followerAddr = args.follower;

        // Find latest open position for follower
        const pos = await prisma.position.findFirst({
          where: { leaderId, follower: followerAddr, isOpen: true },
          orderBy: { id: "desc" },
        });

        if (pos) {
          await prisma.position.update({
            where: { id: pos.id },
            data: {
              pnlUsd: args.pnlUsd.toString(),
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

        await persistEvent("FollowerPnLSettled", args, safeHash(l.transactionHash), safeBlock(l.blockNumber));
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
        let args = l.args as any;
        if (!args) {
            console.log("⚠️ Args undefined, attempting manual decode...");
            const decoded = decodeEventLog({
              abi: coreABI,
              data: l.data,
              topics: l.topics,
            });
            args = decoded.args as any;
            console.log(args)
          }
        const leaderId = Number(args.leaderId);
        const amount = args.amount?.toString?.() ?? String(args.amount);
        // increment feesAccrued
        await prisma.leader.updateMany({
          where: { leaderId },
          data: { feesAccrued: { increment: amount } as any },
        });
        await persistEvent("LeaderFeesAccrued", args, safeHash(l.transactionHash), safeBlock(l.blockNumber));
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
        let args = l.args as any;
        if (!args) {
            console.log("⚠️ Args undefined, attempting manual decode...");
            const decoded = decodeEventLog({
              abi: coreABI,
              data: l.data,
              topics: l.topics,
            });
            args = decoded.args;
            console.log(args)
          }
        const leaderId = Number(args.leaderId);
        const amount = args.amount?.toString?.() ?? String(args.amount);
        await prisma.leader.updateMany({
          where: { leaderId },
          data: { feesAccrued: { decrement: amount } as any },
        });
        await persistEvent("LeaderWithdraw", args, safeHash(l.transactionHash), safeBlock(l.blockNumber));
      }
    },
  });

  // PositionClosed (generic)
  // watch({
  //   address: config.CORE_CONTRACT as `0x${string}`,
  //   abi: parseAbi(['event PositionClosed(uint256 leaderId, address follower)']),
  //   eventName: "PositionClosed",
  //   onLogs: async (logs) => {
  //     for (const l of logs) {
  //       await persistEvent("PositionClosed", l.args, safeHash(l.transactionHash), safeBlock(l.blockNumber));
  //     }
  //   },
  // });

  watch({
    address: config.CORE_CONTRACT as `0x${string}`,
    abi: parseAbi(['event LeaderSignal(uint256 leaderId, string action, uint256 sizeUsd, bool isLong, address indexToken, uint256 entryPrice)']),
    eventName: "LeaderSignal",
    onLogs: async (logs) => {
      for (const l of logs) {
        let args = l.args as any;
        if (!args) {
            console.log("⚠️ Args undefined, attempting manual decode...");
            const decoded = decodeEventLog({
              abi: coreABI,
              data: l.data,
              topics: l.topics,
            });
            args = decoded.args;
            console.log(decoded)
          }
        const leaderId = Number(args.leaderId);
        const action = args.action; // "OPEN_LONG", "OPEN_SHORT", "CLOSE"
        const sizeUsd = args.sizeUsd.toString();
        const isLong = Boolean(args.isLong);
        const indexToken = args.indexToken;
        const price = Number(args.entryPrice);

        console.log(`🔔 Leader Signal: #${leaderId} - ${action}`);

        // CASE 1: Leader OPENS a position
        if (action === "OPEN_LONG" || action === "OPEN_SHORT") {
          await prisma.position.create({
            data: {
              leader: { connect: { leaderId: leaderId } },              
              action: action,
              isLong: isLong,
              sizeUsd: sizeUsd,
              isOpen: true,
              indexToken: indexToken,
              entryPrice: price, // Event doesn't emit price, you might need to fetch it or leave 0
              txHash: safeHash(l.transactionHash),
              timestamp: new Date(),
            } as any,
          });
        } 
        
        // CASE 2: Leader CLOSES a position
        else if (action === "CLOSE") {
          const openPos = await prisma.position.findFirst({
            where: {
              leaderId: leaderId,
              followerId: null, // Ensure we get the leader's row, not a follower's
              isOpen: true
            },
            orderBy: { id: 'desc' }
          });

          if (openPos) {
            await prisma.position.update({
              where: { id: openPos.id },
              data: {
                isOpen: false,
                exitPrice: price
              } as any
            });
          }
        }

        await persistEvent("LeaderSignal", args, safeHash(l.transactionHash), safeBlock(l.blockNumber));
      }
    },
  });

  console.log("✅ Indexer watchers registered.");
};
