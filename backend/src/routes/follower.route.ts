import { FastifyInstance } from "fastify";
import { listFollowers, getFollowerByLeader } from "../controllers/follower.controller.js";

export default async function followerRoutes(app: FastifyInstance) {
  app.get("/leaders/:leaderId/followers", listFollowers);
  app.get("/leaders/:leaderId/followers/:address", getFollowerByLeader);
}

