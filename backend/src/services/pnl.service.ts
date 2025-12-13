import prisma from "../db/prisma.js";

/**
 * Compute some simple PnL stats for a leader
 */
export const computeLeaderStats = async (leaderId: number) => {
  const positions = await prisma.position.findMany({ where: { leaderId }, orderBy: { timestamp: "asc" } });

  let total = 0;
  let wins = 0;
  let losses = 0;
  let count = 0;
  const equity: { timestamp: Date; cumulative: number }[] = [];

  for (const p of positions) {
    if (p.pnlUsd == null) continue;
    const v = Number(p.pnlUsd);
    total += v;
    if (v > 0) wins++;
    if (v < 0) losses++;
    count++;
    equity.push({ timestamp: p.timestamp, cumulative: total });
  }

  const avg = count > 0 ? total / count : 0;
  const winrate = count > 0 ? (wins / count) * 100 : 0;

  return { total, avg, wins, losses, count, winrate, equity };
};
