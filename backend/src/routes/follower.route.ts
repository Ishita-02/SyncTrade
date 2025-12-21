import { FastifyInstance } from "fastify";
import { listFollowers, getFollowerByLeader, subscribeLeader, checkSubscription } from "../controllers/follower.controller.js";

export default async function followerRoutes(app: FastifyInstance) {
  app.get("/leaders/:leaderId/followers", listFollowers);
  app.get("/leaders/:leaderId/followers/:address", getFollowerByLeader);
  app.post("/leaders/:leaderId/subscribe", subscribeLeader);
  app.get("/leaders/:leaderId/subscription/:address", checkSubscription);
}

