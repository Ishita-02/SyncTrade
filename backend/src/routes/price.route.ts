import { FastifyInstance } from "fastify";
import { priceService } from "../services/price.service.js";

export default async function priceRoutes(app: FastifyInstance) {
  app.get("/prices/candles", async (req, reply) => {
    const { symbol = "ETHUSDT", interval = "1m", limit = "200" } =
      req.query as any;

    try {
      const candles = await priceService.getCandles(
        symbol,
        interval,
        Number(limit)
      );

      reply.send(candles);
    } catch (err) {
      reply.status(500).send({ error: "Failed to fetch price data" });
    }
  });
}
