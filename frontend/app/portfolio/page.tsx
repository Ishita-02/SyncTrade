"use client";

import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";

export default function PortfolioPage() {
  const { address } = useAccount();

  const { data } = useQuery({
    queryKey: ["portfolio", address],
    queryFn: () => api<any[]>(`/portfolio/${address}`),
    enabled: !!address,
  });

  if (!address) return <div className="p-6">Connect wallet</div>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Your Portfolio</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
