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

export const isSubscribed = async(leaderId: number, address: string) => {
    const follower = await prisma.follower.findUnique({
      where: {
        leaderId_address: {
          leaderId,
          address: address.toLowerCase(),
        },
      },
    });

    return {
      subscribed: Boolean(follower),
      deposit: follower?.deposit?.toString() ?? "0",
    };
  };

export const getLeaders = async (address: string) => {
  return prisma.follower.findMany({ where: { address }, orderBy: { updatedAt: "desc" } });
};