
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
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });
    if (!res.ok) {
      throw new Error("Failed to fetch candles from Binance");
    }

    const data = (await res.json()) as any[];

    return data.map((candle) => ({
      time: Math.floor(candle[0] / 1000), // unix seconds
      open: Number(candle[1]),
      high: Number(candle[2]),
      low: Number(candle[3]),
      close: Number(candle[4]),
    }));
  }
}

export const priceService = new PriceService();
