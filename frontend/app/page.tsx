"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "../lib/api"; 
import { TrendingUp, Users, DollarSign, Plus } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";

type Leader = {
  leaderId: number;
  address: string;
  meta: string;
  totalFollowers: number;
  totalDeposits?: string;
  feeBps: number;
};

export default function StrategyPage() {
  const router = useRouter();
  const { isConnected } = useAccount();

  const handleCreateStrategy = () => {
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }
    router.push("/create-strategy");
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ["leaders"],
    queryFn: () => api<Leader[]>("/leaders"),
  });

  const leaders = data || [];

  const stats = [
    {
      label: "Total AUM",
      value: leaders
        .reduce((sum, l) => sum + (Number(l.totalDeposits) || 0), 0)
        .toFixed(2),
      icon: DollarSign,
    },
    {
      label: "Active Leaders",
      value: leaders.length.toString(),
      icon: TrendingUp,
    },
    {
      label: "Total Followers",
      value: leaders
        .reduce((sum, l) => sum + l.totalFollowers, 0)
        .toString(),
      icon: Users,
    },
  ];

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <div style={{ backgroundColor: "#0f1419", minHeight: "100vh", color: "#e6edf3", display: "flex", alignItems: "center", justifyContent: "center" }}>
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ backgroundColor: "#0f1419", minHeight: "100vh", color: "#f85149", display: "flex", alignItems: "center", justifyContent: "center" }}>
        Failed to load strategies
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#0f1419", minHeight: "100vh", color: "#e6edf3" }}>
      {/* HEADER */}
      <header style={{ backgroundColor: "#161b22", borderBottom: "1px solid #30363d" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "48px" }}>
              <h1 style={{ fontSize: "20px", fontWeight: "700", color: "#e6edf3", margin: 0 }}>
                SyncTrade
              </h1>
              <nav style={{ display: "flex", gap: "32px" }}>
                {/* Updated Link to point to the new Trade page */}
                <Link href="/trade" style={{ color: "#8b949e", textDecoration: "none", transition: "color 0.2s" }}>
                  Markets
                </Link>
                <Link href="/" style={{ color: "#58a6ff", textDecoration: "none", fontWeight: "500" }}>
                  Strategies
                </Link>
                <Link href="/portfolio" style={{ color: "#8b949e", textDecoration: "none", transition: "color 0.2s" }}>
                  Portfolio
                </Link>
              </nav>
            </div>
            <ConnectButton showBalance={false} chainStatus="icon" accountStatus="address" />
          </div>
        </div>
      </header>

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "32px 24px" }}>
        {/* STATS GRID */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "32px" }}>
          {stats.map((stat, i) => {
            const IconComponent = stat.icon;
            return (
              <div key={i} style={{ backgroundColor: "#161b22", border: "1px solid #30363d", borderRadius: "12px", padding: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "8px", backgroundColor: "#21262d", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <IconComponent style={{ width: "20px", height: "20px", color: "#58a6ff" }} />
                  </div>
                  <div>
                    <div style={{ color: "#8b949e", fontSize: "13px", marginBottom: "4px" }}>{stat.label}</div>
                    <div style={{ color: "#e6edf3", fontSize: "24px", fontWeight: "700" }}>
                      {stat.label.includes("AUM") ? `$${stat.value}` : stat.value}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ color: "#e6edf3", fontSize: "28px", fontWeight: "700", marginBottom: "8px" }}>Trading Strategies</h2>
            <p style={{ color: "#8b949e", fontSize: "15px", margin: 0 }}>Copy strategies from top traders on GMX perpetuals</p>
          </div>
          <button onClick={handleCreateStrategy} style={{ backgroundColor: "#238636", color: "#ffffff", padding: "10px 20px", borderRadius: "8px", border: "none", fontWeight: "600", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Plus style={{ width: "18px", height: "18px" }} />
            Create Strategy
          </button>
        </div>

        {/* LEADER TABLE */}
        <div style={{ backgroundColor: "#161b22", border: "1px solid #30363d", borderRadius: "12px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #30363d" }}>
                <th style={{ textAlign: "left", padding: "16px 24px", color: "#8b949e", fontWeight: "600", fontSize: "13px" }}>Strategy</th>
                <th style={{ textAlign: "left", padding: "16px 24px", color: "#8b949e", fontWeight: "600", fontSize: "13px" }}>Leader</th>
                <th style={{ textAlign: "left", padding: "16px 24px", color: "#8b949e", fontWeight: "600", fontSize: "13px" }}>Followers</th>
                <th style={{ textAlign: "left", padding: "16px 24px", color: "#8b949e", fontWeight: "600", fontSize: "13px" }}>Total Deposits</th>
                <th style={{ textAlign: "left", padding: "16px 24px", color: "#8b949e", fontWeight: "600", fontSize: "13px" }}>Fee</th>
                <th style={{ textAlign: "right", padding: "16px 24px", color: "#8b949e", fontWeight: "600", fontSize: "13px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {leaders.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "80px 24px", textAlign: "center" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
                      <div style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "#21262d", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <TrendingUp style={{ width: "32px", height: "32px", color: "#58a6ff" }} />
                      </div>
                      <div style={{ color: "#e6edf3", fontSize: "18px", fontWeight: "600", marginBottom: "8px" }}>No strategies yet</div>
                    </div>
                  </td>
                </tr>
              ) : (
                leaders.map((leader) => (
                  <tr key={leader.leaderId} style={{ borderBottom: "1px solid #30363d" }}>
                    <td style={{ padding: "16px 24px", color: "#e6edf3" }}>{leader.meta || "Unnamed Strategy"}</td>
                    <td style={{ padding: "16px 24px", color: "#e6edf3", fontFamily: "monospace" }}>{formatAddress(leader.address)}</td>
                    <td style={{ padding: "16px 24px", color: "#e6edf3" }}>{leader.totalFollowers}</td>
                    <td style={{ padding: "16px 24px", color: "#e6edf3" }}>${leader.totalDeposits ? (Number(leader.totalDeposits) / 1e18).toFixed(2) : "0.00"}</td>
                    <td style={{ padding: "16px 24px", color: "#e6edf3" }}>{leader.feeBps ? (leader.feeBps / 100).toFixed(2) : "0"}%</td>
                    <td style={{ padding: "16px 24px", textAlign: "right" }}>
                      <Link href={`/leader/${leader.leaderId}`} style={{ display: "inline-block", backgroundColor: "#1f6feb", color: "#ffffff", padding: "6px 16px", borderRadius: "6px", textDecoration: "none", fontWeight: "600", fontSize: "13px" }}>
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}