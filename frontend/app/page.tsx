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
    return <div className="p-6">Loading strategies…</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">Failed to load strategies</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Markets</h1>
        <p className="text-muted-foreground">
          Copy strategies trading GMX-style perpetual markets
        </p>
      </div>

      {/* Market selector (static for now) */}
      <div className="flex gap-3">
        {["ETH-USD", "BTC-USD", "SOL-USD"].map((m) => (
          <div
            key={m}
            className="px-4 py-2 border rounded-lg text-sm cursor-pointer hover:bg-muted"
          >
            {m}
          </div>
        ))}
      </div>

      {/* Leader strategies table */}
      <div className="border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="p-3 text-left">Strategy</th>
              <th className="p-3 text-left">Leader</th>
              <th className="p-3 text-center">Followers</th>
              <th className="p-3 text-center">AUM</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {data?.map((leader) => (
              <tr
                key={leader.leaderId}
                className="border-t hover:bg-muted/50"
              >
                <td className="p-3 font-medium">
                  {leader.meta || "Unnamed Strategy"}
                </td>

                <td className="p-3 text-xs break-all">
                  {leader.address}
                </td>

                <td className="p-3 text-center">
                  {leader.totalFollowers}
                </td>

                <td className="p-3 text-center">
                  {leader.totalDeposits
                    ? `$${Number(leader.totalDeposits) / 1e18}`
                    : "-"}
                </td>

                <td className="p-3 text-center">
                  <Link
                    href={`/leader/${leader.leaderId}`}
                    className="px-3 py-1 rounded bg-blue-600 text-white text-sm"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}

            {data?.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                  No strategies yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
