const BASE = process.env.NEXT_PUBLIC_BACKEND_URL!;

type ApiOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: any;
  headers?: HeadersInit;
};

export async function api<T>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    body: options.body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "API error");
  }

  return res.json();
}

export const MARKET_MAP: Record<
  string,
  {
    symbol: string;
    market: string;
  }
> = {
  [process.env.NEXT_PUBLIC_WETH!.toLowerCase()]: {
    symbol: "ETH",
    market: "ETH-USD",
  },
  [process.env.NEXT_PUBLIC_WBTC!.toLowerCase()]: {
    symbol: "BTC",
    market: "BTC-USD",
  },
  [process.env.NEXT_PUBLIC_USDC!.toLowerCase()]: {
    symbol: "USDC",
    market: "USDC-USD",
  },

  // hardhat fallback
  "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512": {
    symbol: "ETH",
    market: "ETH-USD",
  },
};
