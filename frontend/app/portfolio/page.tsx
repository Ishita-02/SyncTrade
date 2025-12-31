"use client";

import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api"; // Check your relative path
import { Wallet, TrendingUp, DollarSign, Activity, ExternalLink, ArrowRight, AlertCircle } from "lucide-react";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useMode } from "@/app/context/ModeContext"; 
import { usePrices } from "../hooks/usePrices";

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

type LeaderDetail = {
  leaderId: number;
  address: string;
  meta: string;
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
  const num = Number(value) ;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num);
}

function formatPnL(value: number, type: 'usd' | 'percent') {
  if (value === 0) return "0.00";
  
  const absValue = Math.abs(value);
  
  if (absValue < 0.01) {
    return absValue.toLocaleString('en-US', { 
      minimumFractionDigits: 6, 
      maximumFractionDigits: 6 
    });
  }
  
  return absValue.toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
}

export default function PortfolioPage() {
  const { address, isConnected } = useAccount();
  const { prices } = usePrices();
  
  // 1. Consume Global Context
  const { viewMode, activeStrategyId } = useMode();

  // 2. Fetch Details of Selected Strategy/Leader
  const { data: selectedDetails } = useQuery({
    queryKey: ["leader-details", activeStrategyId],
    queryFn: () => api<LeaderDetail>(`/leaders/${activeStrategyId}`),
    enabled: activeStrategyId !== null,
  });

  // --- NEW: OWNERSHIP CHECK ---
  // We check if the connected wallet owns the strategy currently being viewed.
  const isStrategyOwner = 
    isConnected && 
    selectedDetails?.address && 
    address && 
    selectedDetails.address.toLowerCase() === address.toLowerCase();

  // 3. Fetch Leader Positions
  // We only fetch if it's leader mode. (We can technically fetch it, but we won't show it if !isOwner)
  const { data: leaderPositions, isLoading: leaderLoading } = useQuery({
    queryKey: ["leader-positions", activeStrategyId],
    queryFn: () => api<Position[]>(`/leaders/${activeStrategyId}/positions`),
    enabled: !!address && viewMode === "leader" && activeStrategyId !== null,
  });

  // 4. Fetch Follower Positions
  const { data: followerPositions, isLoading: followerLoading } = useQuery({
    queryKey: ["follower-positions", activeStrategyId, address],
    queryFn: () => api<Position[]>(`/leaders/${activeStrategyId}/followers/${address}/positions`),
    enabled: !!address && viewMode === "follower" && activeStrategyId !== null,
  });

  // 5. Determine which list to show
  // If we are in Leader Mode but NOT the owner, we force an empty list (or handle in UI)
  const positions = (viewMode === "leader" ? leaderPositions : followerPositions) || [];
  const isLoading = viewMode === "leader" ? leaderLoading : followerLoading;

  // ... (Stats Logic remains the same) ...
  const totalVolume = positions.reduce((acc, pos) => acc + Number(pos.sizeUsd), 0);
  const openPositionsCount = positions.filter((p) => p.isOpen).length;
  const closedPositions = positions.filter((p) => !p.isOpen);
  const winningTrades = closedPositions.filter((p) => p.pnlUsd && Number(p.pnlUsd) > 0).length;
  const winRate = closedPositions.length > 0 ? `${Math.round((winningTrades / closedPositions.length) * 100)}%` : "0%";

  const stats = [
    { label: "Total Volume", value: formatUsd(totalVolume.toString()), icon: DollarSign },
    { label: "Active Positions", value: openPositionsCount.toString(), icon: TrendingUp },
    { label: "Win Rate", value: winRate, icon: Activity },
  ];

  // ... (Not Connected & No Strategy States remain the same) ...
  if (!isConnected) return <div /* ... */ >Connect Wallet...</div>;
  if (activeStrategyId === null) return <div /* ... */ >Select Strategy...</div>;
  if (isLoading) return <div /* ... */ >Loading...</div>;

  return (
    <div style={{ backgroundColor: "#0f1419", minHeight: "100vh", color: "#e6edf3" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "32px 24px" }}>
        
        {/* Header Section (Same as before) */}
        <div style={{ marginBottom: "32px" }}>
          {/* ... */}
          <h1 style={{ fontSize: "32px", fontWeight: "700", margin: 0 }}>
             {selectedDetails?.meta || `Strategy #${activeStrategyId}`}
          </h1>
          {/* ... */}
        </div>

        {/* Stats Grid (Same as before) */}
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: "700", margin: 0 }}>
            {viewMode === "leader" ? "Strategy Positions" : "Your Mirrored Positions"}
          </h2>
        </div>
        
        <div style={{ backgroundColor: "#161b22", border: "1px solid #30363d", borderRadius: "12px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #30363d", color: "#8b949e", fontSize: "13px" }}>
                <th style={{ padding: "16px 24px" }}>Asset</th>
                <th style={{ padding: "16px 24px" }}>Side</th>
                <th style={{ padding: "16px 24px" }}>Size (USD)</th>
                <th style={{ padding: "16px 24px" }}>Entry Price</th>
                <th style={{ padding: "16px 24px" }}>Exit / Mark Price</th>
                <th style={{ padding: "16px 24px" }}>P&L</th>
                <th style={{ padding: "16px 24px" }}>Status</th>
                <th style={{ padding: "16px 24px" }}>Tx</th>
              </tr>
            </thead>
            <tbody>
              
              {/* --- ACCESS CONTROL LOGIC START --- */}
              {viewMode === "leader" && !isStrategyOwner ? (
                /* CASE A: User is in Leader Mode but NOT the owner */
                <tr>
                  <td colSpan={8} style={{ padding: "64px", textAlign: "center" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
                      <div style={{ padding: "16px", borderRadius: "50%", backgroundColor: "rgba(235, 87, 87, 0.1)" }}>
                         <AlertCircle size={32} color="#f85149" />
                      </div>
                      <h3 style={{ fontSize: "18px", fontWeight: "700", margin: 0, color: "#e6edf3" }}>Access Restricted</h3>
                      <p style={{ color: "#8b949e", maxWidth: "400px", margin: 0, lineHeight: "1.5" }}>
                        You are viewing <strong>Strategy #{activeStrategyId}</strong> in Leader Mode, but you do not own it. 
                        To view positions here, you must be the creator of this strategy.
                      </p>
                      <Link href="/create-strategy" style={{ marginTop: "16px", padding: "10px 20px", backgroundColor: "#238636", color: "white", borderRadius: "6px", textDecoration: "none", fontWeight: "600", fontSize: "14px" }}>
                        Create Your Own Strategy
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : positions.length === 0 ? (
                 /* CASE B: Owner (or Follower) has no positions */
                 <tr>
                   <td colSpan={8} style={{ padding: "48px", textAlign: "center", color: "#8b949e" }}>
                     {viewMode === "leader" 
                       ? "No positions recorded for this strategy." 
                       : "You haven't mirrored any positions from this leader yet."}
                   </td>
                 </tr>
              ) : (
                /* CASE C: Show Positions */
                positions.map((pos) => {
                  const symbol = TOKEN_MAP[pos.indexToken.toLowerCase()] || "ETH";
                  const entryPrice = Number(pos.entryPrice);
                  const sizeUsd = Number(pos.sizeUsd);
                  
                  let currentPrice = 0;
                  if (!pos.isOpen && pos.exitPrice) {
                    currentPrice = Number(pos.exitPrice);
                  } else {
                    currentPrice = prices?.[symbol as keyof typeof prices]?.price || 0;
                  }

                  let pnlUsd = 0;
                  let pnlPercent = 0;

                  if (entryPrice > 0 && currentPrice > 0) {
                    const priceDiff = pos.isLong ? currentPrice - entryPrice : entryPrice - currentPrice;
                    pnlUsd = (priceDiff / entryPrice) * sizeUsd;
                    pnlPercent = (priceDiff / entryPrice) * 100;
                  }
                  
                  const isPnlPositive = pnlUsd >= 0;

                  return (
                    <tr key={pos.id} style={{ borderBottom: "1px solid #30363d" }}>
                      {/* ... (Keep your existing Row content here exactly as is) ... */}
                      <td style={{ padding: "16px 24px", fontWeight: "600" }}>{formatToken(pos.indexToken)}</td>
                      <td style={{ padding: "16px 24px" }}>
                         <span style={{ padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "700", backgroundColor: pos.isLong ? "rgba(35, 134, 54, 0.2)" : "rgba(218, 54, 51, 0.2)", color: pos.isLong ? "#3fb950" : "#f85149" }}>
                           {pos.isLong ? "LONG" : "SHORT"}
                         </span>
                      </td>
                      <td style={{ padding: "16px 24px" }}>{formatUsd(pos.sizeUsd)}</td>
                      <td style={{ padding: "16px 24px", color: "#8b949e" }}>{Number(pos.entryPrice) > 0 ? formatUsd(pos.entryPrice) : "-"}</td>
                      <td style={{ padding: "16px 24px", color: "#8b949e" }}>{Number(currentPrice) > 0 ? formatUsd(currentPrice.toString()) : "-"}</td>
                      <td style={{ padding: "16px 24px" }}>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ color: isPnlPositive ? "#26a641" : "#f85149", fontWeight: 600 }}>{isPnlPositive ? "+" : "-"}${formatPnL(pnlUsd, 'usd')}</span>
                          <span style={{ fontSize: "11px", color: isPnlPositive ? "#26a641" : "#f85149" }}>{isPnlPositive ? "+" : "-"}{formatPnL(pnlPercent, 'percent')}%</span>
                        </div>
                      </td>
                      <td style={{ padding: "16px 24px" }}><span style={{ color: pos.isOpen ? "#58a6ff" : "#8b949e" }}>{pos.isOpen ? "OPEN" : "CLOSED"}</span></td>
                      <td style={{ padding: "16px 24px" }}>
                        <a href={`https://sepolia.arbiscan.io/tx/${pos.txHash}`} target="_blank" rel="noreferrer" style={{ color: "#8b949e", display: "flex", alignItems: "center", gap: "4px", textDecoration: "none" }}>Scan <ExternalLink size={12} /></a>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}