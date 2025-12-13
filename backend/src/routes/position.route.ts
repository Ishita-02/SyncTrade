import { FastifyInstance } from "fastify";
import { listPositionsForLeader, listPositionsForFollower } from "../controllers/position.controller.js";

export default async function positionRoutes(app: FastifyInstance) {
  app.get("/leaders/:leaderId/positions", listPositionsForLeader);
  app.get("/leaders/:leaderId/followers/:follower/positions", listPositionsForFollower);
}
