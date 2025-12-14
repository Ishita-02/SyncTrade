"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "../lib/api";

type Leader = {
  leaderId: number;
  address: string;
  meta: string;
  totalFollowers: number;
  totalDeposits?: string;
};

export default function Page() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["leaders"],
    queryFn: () => api<Leader[]>("/leaders"),
  });

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-16 text-text-muted">
        Loading strategies…
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-16 text-red-500">
        Failed to load strategies
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-10">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-semibold">Markets</h1>
        <p className="text-text-muted max-w-xl">
          Copy strategies trading GMX-style perpetual markets
        </p>
      </div>

      {/* Market selector */}
      <div className="flex gap-4">
        {["ETH-USD", "BTC-USD", "SOL-USD"].map((m) => (
          <button
            key={m}
            className="px-5 py-2 rounded-lg border border-border
                       bg-bg-muted hover:bg-bg-card
                       transition text-sm font-medium"
          >
            {m}
          </button>
        ))}
      </div>

      {/* Leader strategies table */}
      <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-bg-muted text-text-muted text-sm">
            <tr>
              <th className="px-6 py-4 text-left">Strategy</th>
              <th className="px-6 py-4 text-left">Leader</th>
              <th className="px-6 py-4 text-center">Followers</th>
              <th className="px-6 py-4 text-center">AUM</th>
              <th className="px-6 py-4 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {data?.map((leader) => (
              <tr
                key={leader.leaderId}
                className="border-t border-border hover:bg-bg-muted/50 transition"
              >
                <td className="px-6 py-4 font-medium">
                  {leader.meta || "Unnamed Strategy"}
                </td>

                <td className="px-6 py-4 text-xs text-text-muted break-all">
                  {leader.address}
                </td>

                <td className="px-6 py-4 text-center">
                  {leader.totalFollowers}
                </td>

                <td className="px-6 py-4 text-center">
                  {leader.totalDeposits
                    ? `$${Number(leader.totalDeposits) / 1e18}`
                    : "-"}
                </td>

                <td className="px-6 py-4 text-center">
                  <Link
                    href={`/leader/${leader.leaderId}`}
                    className="inline-block px-4 py-1.5 rounded-md
                               bg-accent text-white text-sm
                               hover:opacity-90 transition"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}

            {data?.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <div className="h-48 flex items-center justify-center text-text-muted">
                    No strategies yet
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
