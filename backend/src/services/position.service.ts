import prisma from "../db/prisma.js";

export const getPositionsForLeader = async (leaderId: number) => {
  return prisma.position.findMany({ where: { leaderId, followerId: null }, orderBy: { timestamp: "desc" } });
};

export const getOpenPositionsForLeader = async (leaderId: number) => {
  return prisma.position.findMany({ where: { leaderId, isOpen: true } });
};

export const getPositionsForFollower = async (leaderId: number, followerAddress: string) => {
  return prisma.position.findMany({ where: { leaderId, follower: {address: followerAddress} }, orderBy: { timestamp: "desc" } });
};
