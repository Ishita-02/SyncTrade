import { publicClient } from "../utils/viem.js";
import prisma from "../db/prisma.js";
import {coreABI} from "../abi/core.js";
import { config } from "../config.js";
import { parseAbi, decodeEventLog } from 'viem'
// import { Prisma } from "@prisma/client";
import { walletClient } from "./web3.service.js";
import { Decimal } from "@prisma/client/runtime/library";

const safeHash = (hash: `0x${string}` | null | undefined): string | undefined =>
  hash ? String(hash) : undefined;

const safeBlock = (b: bigint | null): number | undefined =>
  b !== null ? Number(b) : undefined;


async function persistEvent(event: string, args: any, txHash?: string, blockNumber?: number) {
  try {
    const safeArgs = JSON.parse(JSON.stringify(args, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));

    const rawLeaderId = args?.leaderId ? Number(args.leaderId) : null;

    await prisma.eventLog.create({
      data: {
        event,
        args: safeArgs, 
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

  watch({
    address: config.CORE_CONTRACT as `0x${string}`,
    abi:  parseAbi(['event LeaderRegistered(uint256 leaderId, address leader, string meta)']),
    eventName: "LeaderRegistered",
    onLogs: async (logs) => {
      for (const l of logs) {
        const txHash = safeHash(l.transactionHash);

        const alreadyIndexed = await prisma.eventLog.findFirst({
          where: {
            event: "LeaderSignal",
            txHash: txHash,
          },
        });

        if (alreadyIndexed) {
          console.log(`Skipping duplicate LeaderSignal tx ${txHash}`);
          continue;
        }
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

  watch({
    address: config.CORE_CONTRACT as `0x${string}`,
    abi: parseAbi(['event Subscribed(uint256 leaderId, address follower, uint256 amount)']),
    eventName: 'Subscribed',
    onLogs: async (logs) => {
      for (const l of logs) {
        const txHash = safeHash(l.transactionHash);

        const alreadyIndexed = await prisma.eventLog.findFirst({
          where: {
            event: "LeaderSignal",
            txHash: txHash,
          },
        });

        if (alreadyIndexed) {
          console.log(`Skipping duplicate LeaderSignal tx ${txHash}`);
          continue;
        }
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

          await prisma.leader.updateMany({
            where: { leaderId },
            data: {
              totalFollowers: { increment: 1 } as any,
              totalDeposits: { increment: amount } as any,
            },
          });
        } else {
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

  watch({
  address: config.CORE_CONTRACT as `0x${string}`,
  abi: parseAbi(['event Unsubscribed(uint256 leaderId, address follower, uint256 amount)']),
  eventName: "Unsubscribed",
  onLogs: async (logs) => {
    for (const l of logs) {
      const txHash = safeHash(l.transactionHash);

        const alreadyIndexed = await prisma.eventLog.findFirst({
          where: {
            event: "LeaderSignal",
            txHash: txHash,
          },
        });

        if (alreadyIndexed) {
          console.log(`Skipping duplicate LeaderSignal tx ${txHash}`);
          continue;
        }
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

      await persistEvent("Unsubscribed", args, safeHash(l.transactionHash), safeBlock(l.blockNumber));
    }
  },
});

  watch({
    address: config.CORE_CONTRACT as `0x${string}`,
    abi: parseAbi(['event FollowerMirrored(uint256 indexed leaderId, address indexed follower, string action, uint256 sizeUsd, bool isLong, uint256 entryPrice, address indexToken)']),
    eventName: "FollowerMirrored",
    strict: true,
    onLogs: async (logs) => {
      for (const l of logs) {
        const txHash = safeHash(l.transactionHash);

        let args = l.args as any;
        if (!args || Object.keys(args).length === 0) {
            console.log("A undefined, attempting manual decode...");
            const decoded = decodeEventLog({
              abi: coreABI,
              data: l.data,
              topics: l.topics,
            });
            args = decoded.args;
            console.log(args)
          }
          console.log("args", args);
          const followerAddress = args.follower.toLowerCase() ;
          const leaderId = Number(args.leaderId);

          const alreadyIndexed = await prisma.position.findFirst({
            where: {
              txHash: txHash,      
              leaderId: leaderId, 
              follower: { address: followerAddress } 
            },
          });

          if (alreadyIndexed) {
            console.log(`⏭️ Skipping duplicate FollowerMirrored event for ${followerAddress} (Tx: ${txHash})`);
            continue;
          }
           const follower = await prisma.follower.upsert({
            where: { leaderId_address: { leaderId: Number(args.leaderId), address: followerAddress } },
            update: {},
            create: { leaderId: Number(args.leaderId), address: followerAddress, deposit: "0" }
          });
 

          const entryPrice = new Decimal(
              args.entryPrice.toString()
            ).div("1e18");

            const sizeUsd = new Decimal(
              args.sizeUsd.toString()
            ).div("1e18");
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

  watch({
    address: config.CORE_CONTRACT as `0x${string}`,
    abi: parseAbi(['event FollowerPnLSettled(uint256 leaderId, address follower, int256 pnlUsd)']),
    eventName: "FollowerPnLSettled",
    onLogs: async (logs) => {
      for (const l of logs) {
        const txHash = safeHash(l.transactionHash);

        const alreadyIndexed = await prisma.eventLog.findFirst({
          where: {
            event: "LeaderSignal",
            txHash: txHash,
          },
        });

        if (alreadyIndexed) {
          console.log(`Skipping duplicate LeaderSignal tx ${txHash}`);
          continue;
        }
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
        const followerAddr = args.follower.toLowerCase();

        const pos = await prisma.position.findFirst({
          where: { leaderId, follower: {address: followerAddr}, isOpen: true },
          orderBy: { id: "desc" },
        });

        if (pos) {
          await prisma.position.update({
            where: { id: pos.id },
            data: {
              pnlUsd: new Decimal(
              args.pnlUsd.toString()
            ).div("1e18"),
              isOpen: false,
              exitPrice: pos.entryPrice, 
            } as any,
          });
        }

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

  watch({
    address: config.CORE_CONTRACT as `0x${string}`,
    abi: parseAbi(['event LeaderFeesAccrued(uint256 leaderid, uint256 amount)']),
    eventName: "LeaderFeesAccrued",
    onLogs: async (logs) => {
      for (const l of logs) {
        const txHash = safeHash(l.transactionHash);

        const alreadyIndexed = await prisma.eventLog.findFirst({
          where: {
            event: "LeaderSignal",
            txHash: txHash,
          },
        });

        if (alreadyIndexed) {
          console.log(`Skipping duplicate LeaderSignal tx ${txHash}`);
          continue;
        }
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
        const amount = new Decimal(
              args.amount.toString()
            ).div("1e18");
        await prisma.leader.updateMany({
          where: { leaderId },
          data: { feesAccrued: { increment: amount  } as any },
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
        const txHash = safeHash(l.transactionHash);

        const alreadyIndexed = await prisma.eventLog.findFirst({
          where: {
            event: "LeaderSignal",
            txHash: txHash,
          },
        });

        if (alreadyIndexed) {
          console.log(`Skipping duplicate LeaderSignal tx ${txHash}`);
          continue;
        }
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

  watch({
    address: config.CORE_CONTRACT as `0x${string}`,
    abi: parseAbi(['event LeaderSignal(uint256 leaderId, string action, uint256 sizeUsd, bool isLong, address indexToken, uint256 entryPrice)']),
    eventName: "LeaderSignal",
    onLogs: async (logs) => {
      for (const l of logs) {
        const txHash = safeHash(l.transactionHash);

        const alreadyIndexed = await prisma.eventLog.findFirst({
          where: {
            event: "LeaderSignal",
            txHash: txHash,
          },
        });

        if (alreadyIndexed) {
          console.log(`Skipping duplicate LeaderSignal tx ${txHash}`);
          continue;
        }
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
        const action = args.action; 
        const sizeUsd = new Decimal(
              args.sizeUsd.toString()
            ).div("1e18");;
        const isLong = Boolean(args.isLong);
        const indexToken = args.indexToken;
        const price = args.entryPrice;

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
              entryPrice: price,
              txHash: safeHash(l.transactionHash),
              timestamp: new Date(),
            } as any,
          });
        } 
        
        else if (action === "CLOSE") {
          const openPos = await prisma.position.findFirst({
            where: {
              leaderId: leaderId,
              followerId: null, 
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

            const followerPositions = await prisma.position.findMany({
              where: {
                leaderId: leaderId,
                followerId: { not: null }, 
                isOpen: true
              },
              include: { follower: true } 
            });

            for (const fPos of followerPositions) {
              if (!fPos.follower?.address) continue;

              const entry = Number(fPos.entryPrice);
              const size = Number(fPos.sizeUsd);
              let pnl = 0;

              if (entry > 0) {
                if (fPos.isLong) {
                  pnl = ((price - entry) / entry) * size;
                } else {
                  pnl = ((entry - price) / entry) * size;
                }
              }

              try {
                console.log(`Settling ${fPos.follower.address} PnL: ${pnl}`);
                
                const tx = await walletClient.writeContract({
                  address: config.CORE_CONTRACT as `0x${string}`,
                  abi: coreABI,
                  functionName: "settleFollowerPnL",
                  args: [
                    BigInt(leaderId),
                    fPos.follower.address as `0x${string}`,
                    BigInt(Math.floor(pnl * 1e18)) 
                  ]
                });
                console.log(`✅ Settled tx: ${tx}`);
              } catch (err) {
                console.error(`❌ Failed to settle ${fPos.follower.address}`, err);
              }
            }
          } else {
            console.warn(`⚠️ Close signal for Leader #${leaderId} but no DB position found.`);
          }
        }

        await persistEvent("LeaderSignal", args, safeHash(l.transactionHash), safeBlock(l.blockNumber));
      }
    },
  });

  console.log("✅ Indexer watchers registered.");
};
