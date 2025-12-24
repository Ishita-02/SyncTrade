import { FastifyInstance } from "fastify";
import { listLeaders, getLeader, getLeaderStats, getLeaderByAddress } from "../controllers/leader.controller.js";

export default async function leaderRoutes(app: FastifyInstance) {
  app.get("/leaders", listLeaders);
  app.get("/leaders/:id", getLeader);
  app.get("/leaders/:id/stats", getLeaderStats);
  app.get("/leaders/address/:address", getLeaderByAddress);
}
