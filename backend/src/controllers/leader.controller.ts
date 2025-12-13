import { getAllLeaders, getLeaderById } from "../services/leader.service.js";
import { computeLeaderStats } from "../services/pnl.service.js";

export const listLeaders = async (req: any, reply: any) => {
  const leaders = await getAllLeaders();
  return reply.send(leaders);
};

export const getLeader = async (req: any, reply: any) => {
  const id = Number(req.params.id);
  const leader = await getLeaderById(id);
  if (!leader) return reply.status(404).send({ error: "not found" });
  return reply.send(leader);
};

export const getLeaderStats = async (req: any, reply: any) => {
  const id = Number(req.params.id);
  const stats = await computeLeaderStats(id);
  return reply.send(stats);
};
