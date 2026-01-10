

export default async function internalRoutes(app: any) {
  app.post("/internal/run-indexer", async (req: any, reply: any) => {
    try {
      const secret = req.headers["x-cron-secret"];
      if (secret !== process.env.CRON_SECRET) {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      const { startIndexer } = await import("../services/indexer.service.js");

      await startIndexer();

      return { ok: true };
    } catch (err) {
      console.error("Indexer run failed:", err);
      return reply.status(500).send({ error: "Indexer failed" });
    }
  });
}
