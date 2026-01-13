"use client";

import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api"; 
import { Wallet, TrendingUp, DollarSign, Activity, ExternalLink, ArrowRight, AlertCircle } from "lucide-react";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useMode } from "@/app/context/ModeContext"; 
import { usePrices } from "../hooks/usePrices";

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

const TOKEN_MAP: Record<string, string> = {
  [process.env.NEXT_PUBLIC_WETH?.toLowerCase() || ""]: "ETH",
  [process.env.NEXT_PUBLIC_WBTC?.toLowerCase() || ""]: "BTC",
  [process.env.NEXT_PUBLIC_USDC?.toLowerCase() || ""]: "USDC",
  [process.env.NEXT_PUBLIC_LINK?.toLowerCase() || ""]: "LINK",
  [process.env.NEXT_PUBLIC_ARB?.toLowerCase() || ""]: "ARB",
  [process.env.NEXT_PUBLIC_UNI?.toLowerCase() || ""]: "UNI",
  "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512": "ETH", 
};

const TOKEN_DECIMALS: Record<string, number> = {
  ETH: 18,
  BTC: 18,
  LINK: 18,
  UNI: 18,
  ARB: 18,
  USDC: 6,
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
  
  const { viewMode, activeStrategyId } = useMode();

  const { data: selectedDetails } = useQuery({
    queryKey: ["leader-details", activeStrategyId],
    queryFn: () => api<LeaderDetail>(`/leaders/${activeStrategyId}`),
    enabled: activeStrategyId !== null,
  });

  const isStrategyOwner = 
    isConnected && 
    selectedDetails?.address && 
    address && 
    selectedDetails.address.toLowerCase() === address.toLowerCase();

  const { data: leaderPositions, isLoading: leaderLoading } = useQuery({
    queryKey: ["leader-positions", activeStrategyId],
    queryFn: () => api<Position[]>(`/leaders/${activeStrategyId}/positions`),
    enabled: !!address && viewMode === "leader" && activeStrategyId !== null,
  });

  const { data: followerPositions, isLoading: followerLoading } = useQuery({
    queryKey: ["follower-positions", activeStrategyId, address],
    queryFn: () => api<Position[]>(`/leaders/${activeStrategyId}/followers/${address}/positions`),
    enabled: !!address && viewMode === "follower" && activeStrategyId !== null,
  });

  const positions = (viewMode === "leader" ? leaderPositions : followerPositions) || [];
  const isLoading = viewMode === "leader" ? leaderLoading : followerLoading;

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

  return (
    <div style={{ backgroundColor: "#0f1419", minHeight: "100vh", color: "#e6edf3" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "32px 24px" }}>
        
        <div style={{ marginBottom: "32px" }}>
          {/* ... */}
          <h1 style={{ fontSize: "32px", fontWeight: "700", margin: 0 }}>
             {selectedDetails?.meta || `Strategy #${activeStrategyId}`}
          </h1>
        </div>

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
              {!isConnected ? (
                <tr>
                  <td colSpan={8} style={{ padding: "48px", textAlign: "center", color: "#8b949e" }}>
                    Connect your wallet to view portfolio data.
                  </td>
                </tr>
              ) : activeStrategyId === null ? (
                <tr>
                  <td colSpan={8} style={{ padding: "48px", textAlign: "center", color: "#8b949e" }}>
                    Select a strategy from the navbar to view positions.
                  </td>
                </tr>
              ) : isLoading ? (
                <tr>
                  <td colSpan={8} style={{ padding: "48px", textAlign: "center", color: "#8b949e" }}>
                    Loading positions…
                  </td>
                </tr>
              ) : viewMode === "leader" && !isStrategyOwner ? (
                <tr>
                  <td colSpan={8} style={{ padding: "64px", textAlign: "center" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
                      <div style={{ padding: "16px", borderRadius: "50%", backgroundColor: "rgba(235, 87, 87, 0.1)" }}>
                        <AlertCircle size={32} color="#f85149" />
                      </div>
                      <h3 style={{ fontSize: "18px", fontWeight: "700", margin: 0 }}>Access Restricted</h3>
                      <p style={{ color: "#8b949e", maxWidth: "400px", margin: 0 }}>
                        You do not own this strategy.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : positions.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "48px", textAlign: "center", color: "#8b949e" }}>
                    {viewMode === "leader"
                      ? "No positions recorded for this strategy."
                      : "You haven't mirrored any positions yet."}
                  </td>
                </tr>
              ) : (
                positions.map((pos) => {
                const symbol = TOKEN_MAP[pos.indexToken.toLowerCase()] || "ETH";

                const entryPrice = Number(pos.entryPrice) / 1e18;

                const sizeUsd = parseFloat(pos.sizeUsd);

                let currentPrice = 0;
                if (!pos.isOpen && pos.exitPrice) {
                  currentPrice = Number(pos.exitPrice) / 1e18;
                } else {
                  currentPrice = prices?.[symbol as keyof typeof prices]?.price || 0;
                }

                let pnlUsd = 0;
                let pnlPercent = 0;

                if (entryPrice > 0 && currentPrice > 0) {
                  const priceDiff = pos.isLong
                    ? currentPrice - entryPrice
                    : entryPrice - currentPrice;

                  pnlUsd = (priceDiff / entryPrice) * sizeUsd;
                  pnlPercent = (priceDiff / entryPrice) * 100;
                }

                const isPnlPositive = pnlUsd >= 0;

                return (
                  <tr key={pos.id} style={{ borderBottom: "1px solid #30363d" }}>
                    <td style={{ padding: "16px 24px", fontWeight: "600" }}>
                      {formatToken(pos.indexToken)}
                    </td>

                    <td style={{ padding: "16px 24px" }}>
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: "700",
                          backgroundColor: pos.isLong
                            ? "rgba(35, 134, 54, 0.2)"
                            : "rgba(218, 54, 51, 0.2)",
                          color: pos.isLong ? "#3fb950" : "#f85149",
                        }}
                      >
                        {pos.isLong ? "LONG" : "SHORT"}
                      </span>
                    </td>

                    <td style={{ padding: "16px 24px" }}>
                      {formatUsd(pos.sizeUsd)}
                    </td>

                    <td style={{ padding: "16px 24px", color: "#8b949e" }}>
                      {entryPrice > 0 ? entryPrice.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "-"}
                    </td>

                    <td style={{ padding: "16px 24px", color: "#8b949e" }}>
                      {currentPrice > 0 ? currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "-"}
                    </td>

                    <td style={{ padding: "16px 24px" }}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span
                          style={{
                            color: isPnlPositive ? "#26a641" : "#f85149",
                            fontWeight: 600,
                          }}
                        >
                          {isPnlPositive ? "+" : "-"}${formatPnL(pnlUsd, "usd")}
                        </span>
                        <span
                          style={{
                            fontSize: "11px",
                            color: isPnlPositive ? "#26a641" : "#f85149",
                          }}
                        >
                          {isPnlPositive ? "+" : "-"}
                          {formatPnL(pnlPercent, "percent")}%
                        </span>
                      </div>
                    </td>

                    <td style={{ padding: "16px 24px" }}>
                      <span style={{ color: pos.isOpen ? "#58a6ff" : "#8b949e" }}>
                        {pos.isOpen ? "OPEN" : "CLOSED"}
                      </span>
                    </td>

                    <td style={{ padding: "16px 24px" }}>
                      <a
                        href={`https://sepolia.arbiscan.io/tx/${pos.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          color: "#8b949e",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          textDecoration: "none",
                        }}
                      >
                        Scan <ExternalLink size={12} />
                      </a>
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