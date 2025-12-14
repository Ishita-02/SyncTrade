import Fastify from "fastify";
import leaderRoutes from "./routes/leader.route.js";
import followerRoutes from "./routes/follower.route.js";
import positionRoutes from "./routes/position.route.js";
import strategyRoutes from "./routes/strategy.route.js";
import { config } from "./config.js";
import cors from "@fastify/cors";


export const startServer = async () => {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
  });

  // Register routes
  app.register(leaderRoutes, { prefix: "/api" });
  app.register(followerRoutes, { prefix: "/api" });
  app.register(positionRoutes, { prefix: "/api" });
  app.register(strategyRoutes, { prefix: "/api" });

  

  const port = config.PORT;
  await app.listen({ port });
  console.log(`🚀 Server running at http://localhost:${port}`);
};
