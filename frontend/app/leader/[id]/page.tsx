"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../lib/api";
import { useAccount } from "wagmi";

import SubscribeBox from "../../components/SubscribeBox";
import ExecuteTradeBox from "../../components/ExecuteTradeBox";
import PositionTable from "../../components/PositionTable";

export default function LeaderPage() {
  const { id } = useParams();
  const leaderId = Number(id);
  const { address } = useAccount();

  const { data: leader } = useQuery({
    queryKey: ["leader", leaderId],
    queryFn: () => api<any>(`/leaders/${leaderId}`),
  });

  const { data: positions } = useQuery({
    queryKey: ["positions", leaderId],
    queryFn: () => api<any[]>(`/leaders/${leaderId}/positions`),
  });

  if (!leader) return <div className="p-6">Loading...</div>;

  const isLeader =
    address?.toLowerCase() === leader.address.toLowerCase();

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">{leader.meta}</h1>
      <div className="text-sm break-all">{leader.address}</div>

      {positions && <PositionTable positions={positions} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SubscribeBox leaderId={leaderId} />
        {isLeader && <ExecuteTradeBox leaderId={leaderId} />}
      </div>
    </div>
  );
}
