import { FastifyInstance } from "fastify";
import {
  createStrategy,
  openPosition,
  closePosition,
  getMyStrategies,
} from "../controllers/strategy.controller.js";

export default async function strategyRoutes(app: FastifyInstance) {
  app.post("/strategies", createStrategy);
  app.get("/strategies/me/:address", getMyStrategies);

  app.post("/strategies/:leaderId/open", openPosition);
  app.post("/strategies/:leaderId/close", closePosition);
}
