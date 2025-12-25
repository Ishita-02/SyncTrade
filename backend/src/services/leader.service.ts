import prisma from "../db/prisma.js";

/**
 * Leader service: DB operations related to leaders
 */

export const getAllLeaders = async () => {
  return prisma.leader.findMany({
    include: { followers: true },
    orderBy: { createdAt: "desc" },
  });
};

export const getLeaderById = async (leaderId: number) => {
  return prisma.leader.findUnique({
    where: { leaderId },
    include: { followers: true, positions: true, events: true },
  });
};

export const upsertLeaderMeta = async (leaderId: number, address: string, meta?: string, feeBps?: number) => {
  return prisma.leader.upsert({
    where: { leaderId },
    update: { address, meta, feeBps: feeBps ?? 0, updatedAt: new Date() },
    create: { leaderId, address, meta, feeBps: feeBps ?? 0, totalFollowers: 0, totalDeposits: "0", feesAccrued: "0" },
  });
};

export const leaderByAddress = async (address: string) => {
  return prisma.leader.findMany({
    where: { address: address }
  });
};
