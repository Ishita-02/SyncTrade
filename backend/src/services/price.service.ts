import axios from "axios";

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

const CACHE = new Map<string, { ts: number; data: Candle[] }>();
const CACHE_TTL = 5 * 60 * 1000; 

export class PriceService {
  async getCandles(
    symbol: string,
    _interval: string,
    limit: number
  ): Promise<Candle[]> {
    const cached = CACHE.get(symbol);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return cached.data.slice(-limit);
    }

    try {
      const data = await this.fetchFromCoinGecko(symbol);
      CACHE.set(symbol, { ts: Date.now(), data });
      return data.slice(-limit);
    } catch (err) {
      console.error("❌ CoinGecko failed:", err);
      return cached?.data.slice(-limit) ?? [];
    }
  }

  private async fetchFromCoinGecko(symbol: string): Promise<Candle[]> {
    const id = COINGECKO_MAP[symbol];
    if (!id) throw new Error("Unsupported symbol");

    const res = await axios.get(
      `https://api.coingecko.com/api/v3/coins/${id}/market_chart`,
      {
        params: {
          vs_currency: "usd",
          days: 365,
        },
        timeout: 10_000,
        headers: {
          "User-Agent": "SyncTrade/1.0",
          Accept: "application/json",
        },
      }
    );

    const prices = res.data.prices;
    if (!Array.isArray(prices) || prices.length === 0) {
      throw new Error("Empty market chart");
    }

    const candles: Candle[] = [];

    for (let i = 1; i < prices.length; i++) {
      const [time, price] = prices[i];
      const prevPrice = prices[i - 1][1];

      const open = prevPrice;
      const close = price;
      const high = Math.max(open, close);
      const low = Math.min(open, close);

      candles.push({
        time: Math.floor(time / 1000),
        open,
        high,
        low,
        close,
      });
    }

    return candles;
  }
}


export const priceService = new PriceService();
