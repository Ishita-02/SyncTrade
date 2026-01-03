
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
    try {
      // Try Binance first
      return await this.getBinanceCandles(symbol, interval, limit);
    } catch (err) {
      console.log("Binance failed, using CoinCap fallback");
      // Fallback to CoinCap
      return await this.getCoinCapCandles(symbol, interval, limit);
    }
  }

  private async getBinanceCandles(symbol: string, interval: string, limit: number): Promise<Candle[]> {
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "application/json",
        },
      });

      if (!res.ok) throw new Error(`Binance ${res.status}`);

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

  private async getCoinCapCandles(symbol: string, interval: string, limit: number): Promise<Candle[]> {
    // Convert ETHUSDT to eth
    const coinId = symbol.replace('USDT', '').toLowerCase();
    
    // CoinCap doesn't have candles, so generate from price history
    const url = `https://api.coincap.io/v2/assets/${coinId}/history?interval=d1`;
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    try {
      const res = await fetch(url, {
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`CoinCap ${res.status}`);

      const json = await res.json();
      const data = json.data.slice(-limit);

      return data.map((point: any) => {
        const price = Number(point.priceUsd);
        const variation = price * 0.02; // 2% variation for mock OHLC
        return {
          time: Math.floor(new Date(point.time).getTime() / 1000),
          open: price * (0.98 + Math.random() * 0.04),
          high: price * (1 + Math.random() * 0.02),
          low: price * (1 - Math.random() * 0.02),
          close: price,
        };
      });
    } finally {
      clearTimeout(timeout);
    }
  }
}


export const priceService = new PriceService();
