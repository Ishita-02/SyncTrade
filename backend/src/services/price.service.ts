
type Candle = {
  time: number;   // unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
};

const BINANCE_FAPI_BASE = "https://fapi.binance.com/fapi/v1/klines";

const COINCAP_ASSET_MAP: Record<string, string> = {
  BTCUSDT: "bitcoin",
  ETHUSDT: "ethereum",
  ARBUSDT: "arbitrum",
  LINKUSDT: "chainlink",
  UNIUSDT: "uniswap",
  WBTCUSDT: "wrapped-bitcoin",
};

// Supported interval mapping
const INTERVAL_MAP: Record<string, string> = {
  "1m": "1m",
  "5m": "5m",
  "15m": "15m",
  "1h": "1h",
  "4h": "4h",
  "1d": "1d",
};

export class PriceService {
  async getCandles(
    symbol: string,
    interval: string,
    limit: number
  ): Promise<Candle[]> {
    try {
      return await this.getBinanceCandles(symbol, interval, limit);
    } catch (binanceError) {
      console.error("❌ Binance failed:", binanceError);
      console.log("↪️ Falling back to CoinCap");
      return await this.getCoinCapCandles(symbol, interval, limit);
    }
  }

  // ============================================================
  // BINANCE (USD-M FUTURES — SERVER SAFE)
  // ============================================================
  private async getBinanceCandles(
    symbol: string,
    interval: string,
    limit: number
  ): Promise<Candle[]> {
    const mappedInterval = INTERVAL_MAP[interval];
    if (!mappedInterval) {
      throw new Error(`Unsupported interval: ${interval}`);
    }

    const url =
      `${BINANCE_FAPI_BASE}` +
      `?symbol=${symbol}` +
      `&interval=${mappedInterval}` +
      `&limit=${limit}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Binance ${res.status}: ${text}`);
      }

      const data = (await res.json()) as any[];

      return data.map((candle) => ({
        time: Math.floor(candle[0] / 1000),
        open: Number(candle[1]),
        high: Number(candle[2]),
        low: Number(candle[3]),
        close: Number(candle[4]),
      }));
    } finally {
      clearTimeout(timeout);
    }
  }

  // ============================================================
  // COINCAP FALLBACK (HISTORICAL PRICE → SYNTHETIC OHLC)
  // ============================================================
  private async getCoinCapCandles(
    symbol: string,
    interval: string,
    limit: number
  ): Promise<Candle[]> {
    const assetId = COINCAP_ASSET_MAP[symbol];
    if (!assetId) {
      throw new Error(`CoinCap asset not mapped for ${symbol}`);
    }

    // CoinCap only supports daily/hourly history
    const coincapInterval =
      interval === "1d" || interval === "4h" ? "d1" : "h1";

    const url =
      `https://api.coincap.io/v2/assets/${assetId}/history` +
      `?interval=${coincapInterval}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`CoinCap ${res.status}: ${text}`);
      }

      const json = await res.json();
      const points = json.data.slice(-limit);

      return points.map((point: any) => {
        const price = Number(point.priceUsd);

        // Controlled OHLC synthesis (±1.5%)
        const variation = price * 0.015;

        const open = price + (Math.random() - 0.5) * variation;
        const close = price;
        const high = Math.max(open, close) + Math.random() * variation;
        const low = Math.min(open, close) - Math.random() * variation;

        return {
          time: Math.floor(new Date(point.time).getTime() / 1000),
          open,
          high,
          low,
          close,
        };
      });
    } finally {
      clearTimeout(timeout);
    }
  }
}



export const priceService = new PriceService();
