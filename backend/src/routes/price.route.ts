import { FastifyInstance } from "fastify";
import { priceService } from "../services/price.service.js";
// backend/src/routes/price.route.ts
import axios from "axios";

// Cache prices to avoid hitting rate limits
let priceCache: any = null;
let lastFetch = 0;
const CACHE_DURATION = 10000; 

async function fetchPrices() {
  const now = Date.now();
  
  // Return cached data if still valid
  if (priceCache && now - lastFetch < CACHE_DURATION) {
    return priceCache;
  }

  try {
    // Fetch from CoinGecko (free tier)
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price',
      {
        params: {
          ids: 'ethereum,bitcoin,uniswap,arbitrum,chainlink',
          vs_currencies: 'usd',
          include_24hr_change: 'true',
        },
      }
    );

    const data = response.data;

    priceCache = {
      ETH: {
        symbol: 'ETH',
        price: data.ethereum?.usd || 0,
        change24h: data.ethereum?.usd_24h_change || 0,
      },
      BTC: {
        symbol: 'BTC',
        price: data.bitcoin?.usd || 0,
        change24h: data.bitcoin?.usd_24h_change || 0,
      },
      UNI: {
        symbol: 'UNI',
        price: data.uniswap?.usd || 0,
        change24h: data.uniswap?.usd_24h_change || 0,
      },
      ARB: {
        symbol: 'ARB',
        price: data.arbitrum?.usd || 0,
        change24h: data.arbitrum?.usd_24h_change || 0,
      },
      LINK: {
        symbol: 'LINK',
        price: data.chainlink?.usd || 0,
        change24h: data.chainlink?.usd_24h_change || 0,
      },
    };

    lastFetch = now;
    return priceCache;
  } catch (error) {
    console.error('Error fetching prices:', error);
    
    if (priceCache) return priceCache;
    
    return {
      ETH: { symbol: 'ETH', price: 3272.50, change24h: 0 },
      BTC: { symbol: 'BTC', price: 64200.00, change24h: 0 },
      UNI: { symbol: 'UNI', price: 6.25, change24h: 0 },
      ARB: { symbol: 'ARB', price: 1.15, change24h: 0 },
      LINK: { symbol: 'LINK', price: 14.50, change24h: 0 },
    };
  }
}


export default async function priceRoutes(app: FastifyInstance) {
  app.get("/prices", async (req, reply) => {
    const prices = await fetchPrices();
    return prices;
  });

  app.get("/prices/:symbol", async (req, reply) => {
    const { symbol } = req.params as { symbol: string };
    const prices = await fetchPrices();
    
    const price = prices[symbol.toUpperCase()];
    if (!price) {
      return reply.status(404).send({ error: 'Symbol not found' });
    }
    
    return price;
  });

  // app.get("/prices/candles", async (req, reply) => {
  //   const { symbol = "ETHUSDT", interval = "1d", limit = "200" } =
  //     req.query as any;

  //   const candles = await priceService.getCandles(
  //     symbol,
  //     interval,
  //     Number(limit)
  //   );

  //   reply.send(candles);
  // });

}

