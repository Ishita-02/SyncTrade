import Fastify from "fastify";
import leaderRoutes from "./routes/leader.route.js";
import followerRoutes from "./routes/follower.route.js";
import positionRoutes from "./routes/position.route.js";
import { config } from "./config.js";

export const startServer = async () => {
  const app = Fastify({ logger: true });

  // Register routes
  app.register(leaderRoutes, { prefix: "/api" });
  app.register(followerRoutes, { prefix: "/api" });
  app.register(positionRoutes, { prefix: "/api" });

  const port = config.PORT;
  await app.listen({ port });
  console.log(`🚀 Server running at http://localhost:${port}`);
};
