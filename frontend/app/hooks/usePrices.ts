// frontend/src/hooks/usePrices.ts
import { useQuery } from '@tanstack/react-query';

interface TokenPrice {
  symbol: string;
  price: number;
  change24h: number;
}

interface PricesResponse {
  ETH: TokenPrice;
  BTC: TokenPrice;
  SOL: TokenPrice;
  ARB: TokenPrice;
  LINK: TokenPrice;
}

export function usePrices() {
  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL!;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['prices'],
    queryFn: async () => {
      const res = await fetch(`${BACKEND}/api/prices`);
      if (!res.ok) throw new Error('Failed to fetch prices');
      return res.json() as Promise<PricesResponse>;
    },
    refetchInterval: 30000, 
    staleTime: 10000, 
  });

  return {
    prices: data,
    isLoading,
    error,
    refetch,
  };
}

// Hook to get a specific token price
export function useTokenPrice(symbol: string) {
  const { prices, isLoading } = usePrices();
  
  return {
    price: prices?.[symbol as keyof PricesResponse]?.price || 0,
    change24h: prices?.[symbol as keyof PricesResponse]?.change24h || 0,
    isLoading,
  };
}