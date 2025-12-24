import { getFollowersForLeader, getFollower, isSubscribed, getLeaders } from "../services/follower.service.js";
import { FastifyRequest, FastifyReply } from "fastify";
import prisma from "../db/prisma";

export const listFollowers = async (req: any, reply: any) => {
  const leaderId = Number(req.params.leaderId);
  const followers = await getFollowersForLeader(leaderId);
  return reply.send(followers);
};

export const getFollowerByLeader = async (req: any, reply: any) => {
  const leaderId = Number(req.params.leaderId);
  const address = req.params.address;
  const follower = await getFollower(leaderId, address);
  if (!follower) return reply.status(404).send({ error: "not found" });
  return reply.send(follower);
};

export const subscribeLeader = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  const { leaderId } = req.params as { leaderId: string };
  const { address, amount } = req.body as {
    address: string;
    amount: string;
  };

  const parsedLeaderId = Number(leaderId);

  const leader = await prisma.leader.findUnique({
    where: { leaderId: parsedLeaderId },
  });

  if (!leader) {
    return reply.status(404).send({ error: "Leader not found" });
  }

  // Check existing follower (subscription)
  const existingFollower = await prisma.follower.findUnique({
    where: {
      leaderId_address: {
        leaderId: parsedLeaderId,
        address,
      },
    },
  });

  if (existingFollower) {
    return reply.status(400).send({
      error: "Already subscribed to this leader",
    });
  }

  // Create follower = subscribe
  const follower = await prisma.follower.create({
    data: {
      leaderId: parsedLeaderId,
      address,
      deposit: amount,
    },
  });

  // Update leader stats
  await prisma.leader.update({
    where: { leaderId: parsedLeaderId },
    data: {
      totalFollowers: { increment: 1 },
      totalDeposits: { increment: amount },
    },
  });

  return reply.send({
    success: true,
    follower,
  });


};

export const checkSubscription = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  const { leaderId, address } = req.params as any;

  const result = await isSubscribed(
    Number(leaderId),
    address
  );

  reply.send(result);
};

export const getLeadersUserFollowed = async(
  req: any,
  reply: FastifyReply
) => {
  const address = req.params.address as string;
  const leaders = await getLeaders(address);
  return reply.send(leaders);
}