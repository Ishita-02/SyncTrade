import { getPositionsForLeader, getPositionsForFollower } from "../services/position.service.js";

export const listPositionsForLeader = async (req: any, reply: any) => {
  const leaderId = Number(req.params.leaderId);
  const positions = await getPositionsForLeader(leaderId);
  return reply.send(positions);
};

export const listPositionsForFollower = async (req: any, reply: any) => {
  const leaderId = Number(req.params.leaderId);
  const follower = req.params.follower;
  const positions = await getPositionsForFollower(leaderId, follower);
  return reply.send(positions);
};
