import { FastifyInstance } from "fastify";
import { startIndexer } from "../services/indexer.service.js";

export default async function internalRoutes(app: FastifyInstance) {
  app.post("/internal/run-indexer", async (req, reply) => {
    try {
      const secret = req.headers["x-cron-secret"];

      if (secret !== process.env.CRON_SECRET) {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      console.log("🚀 Indexer trigger received");

      await startIndexer();

      return { ok: true };
    } catch (err) {
      console.error("Indexer trigger failed:", err);
      return reply.status(500).send({ error: "Indexer failed" });
    }
  });
}
