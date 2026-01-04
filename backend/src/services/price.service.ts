type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

const COINGECKO_MAP: Record<string, string> = {
  BTCUSDT: "bitcoin",
  ETHUSDT: "ethereum",
  ARBUSDT: "arbitrum",
  LINKUSDT: "chainlink",
  UNIUSDT: "uniswap",
  WBTCUSDT: "wrapped-bitcoin",
};

function mapIntervalToDays(interval: string): number {
  switch (interval) {
    case "1m":
    case "5m":
    case "15m":
    case "1h":
      return 1;
    case "4h":
      return 7;
    case "1d":
      return 365;
    default:
      return 30;
  }
}

const CACHE = new Map<string, { ts: number; data: Candle[] }>();
const CACHE_TTL = 60_000; 

export class PriceService {
  async getCandles(
    symbol: string,
    interval: string,
    limit: number
  ): Promise<Candle[]> {
    const cacheKey = `${symbol}-${interval}-${limit}`;
    const cached = CACHE.get(cacheKey);

    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return cached.data;
    }

    try {
      const data = await this.getCoinGeckoCandles(symbol, interval, limit);
      CACHE.set(cacheKey, { ts: Date.now(), data });
      return data;
    } catch (err) {
      console.error("❌ CoinGecko failed:", err);
      return [];
    }
  }

  private async getCoinGeckoCandles(
    symbol: string,
    interval: string,
    limit: number
  ): Promise<Candle[]> {
    const id = COINGECKO_MAP[symbol];
    if (!id) throw new Error(`Unsupported symbol ${symbol}`);

    const days = mapIntervalToDays(interval);

    const url =
      `https://api.coingecko.com/api/v3/coins/${id}/ohlc` +
      `?vs_currency=usd&days=${days}`;

    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      throw new Error(`CoinGecko ${res.status}`);
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("Empty CoinGecko data");
    }

    return data.slice(-limit).map((c: any[]) => ({
      time: Math.floor(c[0] / 1000),
      open: c[1],
      high: c[2],
      low: c[3],
      close: c[4],
    }));
  }
}

export const priceService = new PriceService();
