import { getFollowersForLeader, getFollower } from "../services/follower.service.js";

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
