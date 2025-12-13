import prisma from "../db/prisma.js";

/**
 * Follower service: operations around followers
 */

export const getFollowersForLeader = async (leaderId: number) => {
  return prisma.follower.findMany({ where: { leaderId }, orderBy: { updatedAt: "desc" } });
};

export const getFollower = async (leaderId: number, address: string) => {
  return prisma.follower.findUnique({ where: { leaderId_address: { leaderId, address } as any } });
};
