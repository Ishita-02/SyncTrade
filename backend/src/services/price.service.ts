
type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

class PriceService {
  async getCandles(
    symbol: string,
    interval: string,
    limit: number
  ): Promise<Candle[]> {
    const url =
      `https://api.binance.com/api/v3/klines` +
      `?symbol=${symbol}&interval=${interval}&limit=${limit}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    let res: Response;

    try {
      res = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "application/json",
        },
      });
    } catch (err) {
      console.error("Fetch failed:", err);
      throw new Error("Binance fetch failed (network / blocked)");
    } finally {
      clearTimeout(timeout);
    }

    if (!res.ok) {
      const text = await res.text();
      console.error("Binance response error:", res.status, text);
      throw new Error(`Binance error ${res.status}: ${text}`);
    }

    const data = (await res.json()) as any[];

    return data.map((candle) => ({
      time: Math.floor(candle[0] / 1000),
      open: Number(candle[1]),
      high: Number(candle[2]),
      low: Number(candle[3]),
      close: Number(candle[4]),
    }));
  }
}


export const priceService = new PriceService();
