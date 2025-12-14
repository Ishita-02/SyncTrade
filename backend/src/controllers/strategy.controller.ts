import { FastifyRequest, FastifyReply } from "fastify";
import { strategyService } from "../services/strategy.service.js";

export const createStrategy = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  const { leaderAddress, meta, feeBps } = req.body as any;
  const strategy = await strategyService.createStrategy(
    leaderAddress,
    meta,
    feeBps
  );
  reply.send(strategy);
};

export const getMyStrategies = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  const { address } = req.params as any;
  const strategies = await strategyService.getByLeader(address);
  reply.send(strategies);
};

export const openPosition = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  const { leaderId } = req.params as any;
  const { sizeUsd, isLong, indexToken } = req.body as any;

  await strategyService.openPosition(
    Number(leaderId),
    sizeUsd,
    isLong,
    indexToken
  );

  reply.send({ success: true });
};

export const closePosition = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  const { leaderId } = req.params as any;
  await strategyService.closePosition(Number(leaderId));
  reply.send({ success: true });
};
