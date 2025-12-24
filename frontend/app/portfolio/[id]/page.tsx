"use client";

import { useAccount } from "wagmi";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../lib/api";
import { Wallet, TrendingUp, DollarSign, Activity, ExternalLink } from "lucide-react";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";

// --- TYPES ---
type Position = {
  id: number;
  leaderId: number;
  action: string;
  isLong: boolean;
  entryPrice: string;
  exitPrice?: string;
  sizeUsd: string;
  pnlUsd?: string;
  isOpen: boolean;
  indexToken: string; 
  txHash: string;
  timestamp: string;
};

// Update these with the addresses from your deployment log
const TOKEN_MAP: Record<string, string> = {
  [process.env.NEXT_PUBLIC_WETH?.toLowerCase() || ""]: "ETH",
  [process.env.NEXT_PUBLIC_WBTC?.toLowerCase() || ""]: "BTC",
  [process.env.NEXT_PUBLIC_USDC?.toLowerCase() || ""]: "USDC",
  "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512": "ETH", 
};

function formatToken(address: string) {
  const symbol = TOKEN_MAP[address.toLowerCase()];
  if (symbol) return symbol;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatUsd(value: string | undefined | null) {
  if (!value) return "$0.00";
  // Assuming 18 decimals for size/price values based on your contract
  const num = Number(value) / 1e18;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num);
}

export default function PortfolioPage() {
  const { id } = useParams();
  const leaderId = Number(id);
  const { address } = useAccount();

  // Fetch Data
  const { data, isLoading } = useQuery({
    queryKey: ["portfolio", address],
    queryFn: () => api<Position[]>(`/leaders/${leaderId}/followers/${address}/positions`), 
    enabled: !!address,
  });

  const positions = data || [];
  console.log(data)

  // Calculate Stats dynamically from positions if backend doesn't aggregate
  const totalVolume = positions.reduce((acc, pos) => acc + Number(pos.sizeUsd), 0);
  const openPositionsCount = positions.filter((p) => p.isOpen).length;

  const stats = [
    {
      label: "Total Volume Traded",
      value: formatUsd(totalVolume.toString()),
      icon: DollarSign,
    },
    {
      label: "Active Positions",
      value: openPositionsCount.toString(),
      icon: TrendingUp,
    },
    {
      label: "Win Rate",
      value: "100%", // Placeholder or calculate based on closed trades
      icon: Activity,
    },
  ];

  // --- STATE 1: NOT CONNECTED ---
  if (!address) {
    return (
      <div style={{ backgroundColor: "#0f1419", minHeight: "100vh", color: "#e6edf3" }}>
        {/* Header */}
        <header style={{ backgroundColor: "#161b22", borderBottom: "1px solid #30363d" }}>
          <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
             <h1 style={{ fontSize: "20px", fontWeight: "700" }}>SyncTrade</h1>
             <ConnectButton />
          </div>
        </header>

        {/* Connect Prompt */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: "24px" }}>
          <div style={{ width: "80px", height: "80px", borderRadius: "50%", backgroundColor: "#21262d", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Wallet style={{ width: "40px", height: "40px", color: "#58a6ff" }} />
          </div>
          <h2 style={{ fontSize: "24px", fontWeight: "700" }}>Connect Your Wallet</h2>
          <ConnectButton label="Connect Wallet to View Portfolio" />
        </div>
      </div>
    );
  }

  // --- STATE 2: LOADING ---
  if (isLoading) {
    return (
      <div style={{ backgroundColor: "#0f1419", minHeight: "100vh", color: "#e6edf3", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#8b949e" }}>Loading portfolio data...</div>
      </div>
    );
  }

  // --- STATE 3: DASHBOARD ---
  return (
    <div style={{ backgroundColor: "#0f1419", minHeight: "100vh", color: "#e6edf3" }}>
      {/* Header */}
      <header style={{ backgroundColor: "#161b22", borderBottom: "1px solid #30363d" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "48px", alignItems: "center" }}>
            <h1 style={{ fontSize: "20px", fontWeight: "700", color: "#e6edf3", margin: 0 }}>SyncTrade</h1>
            <nav style={{ display: "flex", gap: "32px" }}>
              <Link href="/trade" style={{ color: "#8b949e", textDecoration: "none" }}>Trade</Link>
              <Link href="/" style={{ color: "#8b949e", textDecoration: "none" }}>Strategies</Link>
              <Link href="/portfolio" style={{ color: "#58a6ff", fontWeight: "600", textDecoration: "none" }}>Portfolio</Link>
            </nav>
          </div>
          <ConnectButton showBalance={false} chainStatus="icon" accountStatus="address" />
        </div>
      </header>

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "32px 24px" }}>
        
        {/* Stats Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px", marginBottom: "32px" }}>
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} style={{ backgroundColor: "#161b22", border: "1px solid #30363d", borderRadius: "12px", padding: "24px", display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "8px", backgroundColor: "#21262d", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon style={{ color: "#58a6ff" }} size={24} />
                </div>
                <div>
                  <div style={{ color: "#8b949e", fontSize: "13px" }}>{stat.label}</div>
                  <div style={{ fontSize: "24px", fontWeight: "700" }}>{stat.value}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Positions Section */}
        <h2 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "16px" }}>Your Positions</h2>
        
        <div style={{ backgroundColor: "#161b22", border: "1px solid #30363d", borderRadius: "12px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #30363d", color: "#8b949e", fontSize: "13px" }}>
                <th style={{ padding: "16px 24px" }}>Asset</th>
                <th style={{ padding: "16px 24px" }}>Side</th>
                <th style={{ padding: "16px 24px" }}>Size (USD)</th>
                <th style={{ padding: "16px 24px" }}>Entry Price</th>
                <th style={{ padding: "16px 24px" }}>Status</th>
                <th style={{ padding: "16px 24px" }}>Tx</th>
              </tr>
            </thead>
            <tbody>
              {positions.length === 0 ? (
                 <tr>
                   <td colSpan={6} style={{ padding: "48px", textAlign: "center", color: "#8b949e" }}>
                     No positions found. Start trading to see activity here.
                   </td>
                 </tr>
              ) : (
                positions.map((pos) => (
                  <tr key={pos.id} style={{ borderBottom: "1px solid #30363d" }}>
                    {/* 1. Asset Symbol */}
                    <td style={{ padding: "16px 24px", fontWeight: "600" }}>
                      {formatToken(pos.indexToken)}
                    </td>

                    {/* 2. Side (Long/Short) */}
                    <td style={{ padding: "16px 24px" }}>
                      <span style={{ 
                        padding: "4px 8px", 
                        borderRadius: "4px", 
                        fontSize: "12px", 
                        fontWeight: "700",
                        backgroundColor: pos.isLong ? "rgba(35, 134, 54, 0.2)" : "rgba(218, 54, 51, 0.2)",
                        color: pos.isLong ? "#3fb950" : "#f85149"
                      }}>
                        {pos.isLong ? "LONG" : "SHORT"}
                      </span>
                    </td>

                    {/* 3. Size */}
                    <td style={{ padding: "16px 24px" }}>
                      {formatUsd(pos.sizeUsd)}
                    </td>

                    {/* 4. Entry Price */}
                    <td style={{ padding: "16px 24px", color: "#8b949e" }}>
                      {Number(pos.entryPrice) > 0 ? formatUsd(pos.entryPrice) : "-"}
                    </td>

                    {/* 5. Status */}
                    <td style={{ padding: "16px 24px" }}>
                       <span style={{ color: pos.isOpen ? "#58a6ff" : "#8b949e" }}>
                         {pos.isOpen ? "OPEN" : "CLOSED"}
                       </span>
                    </td>

                    {/* 6. Transaction Link */}
                    <td style={{ padding: "16px 24px" }}>
                      <a 
                        href={`https://sepolia.arbiscan.io/tx/${pos.txHash}`} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ color: "#8b949e", display: "flex", alignItems: "center", gap: "4px", textDecoration: "none" }}
                      >
                        Scan <ExternalLink size={12} />
                      </a>
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