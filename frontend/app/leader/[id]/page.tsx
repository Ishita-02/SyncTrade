"use client";

import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ArrowLeft, User, TrendingUp, DollarSign, Activity, MousePointerClick } from "lucide-react";
import { useQuery } from "@tanstack/react-query"; // IMPORT THIS
import { api } from "@/lib/api"; // Ensure this path is correct

import SubscribeBox from "../../components/SubscribeBox";
import CandlestickChart from "../../components/CandleStickChart";

// --- TYPES ---
type LeaderDetail = {
  leaderId: number;
  address: string;
  meta: string;
  totalAUM: number;
  totalPnL: number;
  totalFollowers: number;
};

type Position = {
  id: number;
  market: string;
  side: "Long" | "Short";
  collateral: string | number; // Handle both from API
  leverage: string | number;
  entryPrice: string | number;
  currentPrice: string | number;
  pnl: string | number;
  pnlPercent: string | number;
  isOpen: boolean;
};

export default function LeaderPage() {
  const { id } = useParams();
  const leaderId = Number(id);
  const { address } = useAccount();

  const [marketFilter, setMarketFilter] = useState("All");
  const [selectedMarket, setSelectedMarket] = useState("ETH-USD");

  // --- 1. FETCH LEADER DETAILS ---
  const { data: leader, isLoading: isLeaderLoading } = useQuery({
    queryKey: ["leader", leaderId],
    queryFn: () => api<LeaderDetail>(`/leaders/${leaderId}`),
  });

  // --- 2. FETCH LEADER POSITIONS ---
  const { data: rawPositions, isLoading: isPositionsLoading } = useQuery({
    queryKey: ["leader-positions", leaderId],
    queryFn: () => api<Position[]>(`/leaders/${leaderId}/positions`),
  });

   const { data: rawStats, isLoading: isStatsLoading } = useQuery({
    queryKey: ["leader-positions", leaderId],
    queryFn: () => api<Position[]>(`/leaders/${leaderId}/stats`),
  });

  console.log("data", rawStats)

  // --- DATA PROCESSING ---
  // If backend returns raw numbers, we format them here for the UI
  const allPositions = (rawPositions || []).map((p) => ({
    ...p,
    collateral: Number(p.collateral).toLocaleString(),
    leverage: typeof p.leverage === 'number' ? `${p.leverage}x` : p.leverage,
    entryPrice: Number(p.entryPrice).toLocaleString(),
    currentPrice: Number(p.currentPrice).toLocaleString(),
    // Add signs to PnL if missing
    pnl: String(p.pnl).startsWith("-") || String(p.pnl).startsWith("+") 
         ? p.pnl 
         : Number(p.pnl) >= 0 ? `+${p.pnl}` : `${p.pnl}`,
    pnlPercent: String(p.pnlPercent).includes("%") 
         ? p.pnlPercent 
         : `${Number(p.pnlPercent).toFixed(2)}%`
  }));

  const filteredPositions =
    marketFilter === "All"
      ? allPositions
      : allPositions.filter((p) => p.market.startsWith(marketFilter));

  const openPositions = filteredPositions.filter((p) => p.isOpen);

  // --- LOADING STATE ---
  if (isLeaderLoading || isPositionsLoading) {
    return (
      <div style={{ backgroundColor: "#0f1419", minHeight: "100vh", color: "#e6edf3", display: "flex", justifyContent: "center", alignItems: "center" }}>
        Loading strategy data...
      </div>
    );
  }

  // --- ERROR STATE (e.g. Leader not found) ---
  if (!leader) {
    return (
      <div style={{ backgroundColor: "#0f1419", minHeight: "100vh", color: "#e6edf3", display: "flex", justifyContent: "center", alignItems: "center" }}>
        Leader not found.
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#0f1419", minHeight: "100vh", color: "#e6edf3" }}>
      {/* Header */}
      <header style={{ backgroundColor: "#161b22", borderBottom: "1px solid #30363d" }}>
        <div style={{ maxWidth: "1600px", margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0" }}>
            <h1 style={{ fontSize: "20px", fontWeight: 700 }}>SyncTrade</h1>
            <ConnectButton showBalance={false} chainStatus="icon" accountStatus="address" />
          </div>
        </div>
      </header>

      <div style={{ maxWidth: "1600px", margin: "0 auto", padding: "32px 24px" }}>
        {/* Back */}
        <Link
          href="/"
          style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "16px", color: "#8b949e", textDecoration: "none", fontSize: "14px" }}
        >
          <ArrowLeft size={16} />
          Back to Strategies
        </Link>

        {/* Strategy Header */}
        <div style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "28px", fontWeight: 700 }}>
            {leader.meta || `Strategy #${leader.leaderId}`}
            <span style={{ marginLeft: "12px", padding: "4px 12px", borderRadius: "20px", backgroundColor: "#1f6feb", fontSize: "12px", fontWeight: 600 }}>
              Active
            </span>
          </h2>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#8b949e", marginTop: "6px" }}>
            <User size={14} />
            <span style={{ fontFamily: "monospace" }}>{leader.address}</span>
          </div>
        </div>

        {/* Portfolio Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" }}>
          
          {/* AUM */}
          <div style={{ backgroundColor: "#161b22", border: "1px solid #30363d", borderRadius: "12px", padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "8px", backgroundColor: "#21262d", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <DollarSign style={{ width: "20px", height: "20px", color: "#58a6ff" }} />
              </div>
              <div>
                <div style={{ color: "#8b949e", fontSize: "12px", marginBottom: "2px" }}>Total AUM</div>
                <div style={{ color: "#e6edf3", fontSize: "20px", fontWeight: "700" }}>${Number(leader.totalAUM).toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* PnL */}
          <div style={{ backgroundColor: "#161b22", border: "1px solid #30363d", borderRadius: "12px", padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "8px", backgroundColor: "#1a3a1a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <TrendingUp style={{ width: "20px", height: "20px", color: "#26a641" }} />
              </div>
              <div>
                <div style={{ color: "#8b949e", fontSize: "12px", marginBottom: "2px" }}>Total P&L</div>
                <div style={{ color: "#26a641", fontSize: "20px", fontWeight: "700" }}>
                   {Number(leader.totalPnL) > 0 ? "+" : ""}${Number(leader.totalPnL).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Open Positions Count */}
          <div style={{ backgroundColor: "#161b22", border: "1px solid #30363d", borderRadius: "12px", padding: "20px" }}>
             <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "8px", backgroundColor: "#21262d", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Activity style={{ width: "20px", height: "20px", color: "#58a6ff" }} />
              </div>
              <div>
                <div style={{ color: "#8b949e", fontSize: "12px", marginBottom: "2px" }}>Open Positions</div>
                <div style={{ color: "#e6edf3", fontSize: "20px", fontWeight: "700" }}>{openPositions.length}</div>
              </div>
            </div>
          </div>

          {/* Followers */}
          <div style={{ backgroundColor: "#161b22", border: "1px solid #30363d", borderRadius: "12px", padding: "20px" }}>
             <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "8px", backgroundColor: "#21262d", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <User style={{ width: "20px", height: "20px", color: "#58a6ff" }} />
              </div>
              <div>
                <div style={{ color: "#8b949e", fontSize: "12px", marginBottom: "2px" }}>Followers</div>
                <div style={{ color: "#e6edf3", fontSize: "20px", fontWeight: "700" }}>{leader.totalFollowers}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: "24px", marginBottom: "32px" }}>
          
          {/* Left: Chart */}
          <div style={{ backgroundColor: "#161b22", border: "1px solid #30363d", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column" }}>
            <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
               <span style={{ fontSize: "14px", color: "#8b949e" }}>
                 Viewing Chart: <strong style={{ color: "#e6edf3" }}>{selectedMarket}</strong>
               </span>
            </div>
            <CandlestickChart symbol={selectedMarket} />
          </div>

          {/* Right: Subscribe Box */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ backgroundColor: "#161b22", border: "1px solid #30363d", borderRadius: "12px", padding: "24px" }}>
              <h3 style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
                <Activity size={18} />
                Subscribe to Strategy
              </h3>
              <SubscribeBox leaderId={leaderId} />
            </div>
          </div>
        </div>

        {/* Portfolio Positions Table */}
        <div style={{ backgroundColor: "#161b22", border: "1px solid #30363d", borderRadius: "12px", padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 600, margin: 0 }}>Portfolio Positions</h3>
            
            {/* Filter Buttons */}
            <div style={{ display: "flex", gap: "6px" }}>
              {["All", "ETH", "BTC", "SOL"].map((market) => (
                <button
                  key={market}
                  onClick={() => setMarketFilter(market)}
                  style={{
                    padding: "6px 14px", borderRadius: "6px", border: "1px solid #30363d",
                    backgroundColor: marketFilter === market ? "#1f6feb" : "transparent",
                    color: marketFilter === market ? "#ffffff" : "#8b949e",
                    fontSize: "12px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s",
                  }}
                >
                  {market === "All" ? "All Markets" : market}
                </button>
              ))}
            </div>
          </div>

          <p style={{ fontSize: "12px", color: "#8b949e", marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
            <MousePointerClick size={14} /> Click a position row to view its chart above.
          </p>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #30363d" }}>
                  {["Market", "Side", "Collateral", "Leverage", "Entry Price", "Current Price", "P&L", "Status"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "12px 16px", color: "#8b949e", fontWeight: "600", fontSize: "12px" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPositions.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: "32px", textAlign: "center", color: "#8b949e" }}>
                      No positions found for this strategy.
                    </td>
                  </tr>
                ) : (
                  filteredPositions.map((position) => {
                    const isPnlPositive = String(position.pnl).startsWith("+");
                    const isSelected = selectedMarket === position.market;

                    return (
                      <tr 
                        key={position.id} 
                        onClick={() => setSelectedMarket(position.market)}
                        style={{ 
                          borderBottom: "1px solid #30363d", 
                          cursor: "pointer", 
                          backgroundColor: isSelected ? "#1f242e" : "transparent",
                          transition: "background 0.2s"
                        }}
                      >
                        <td style={{ padding: "16px", color: "#e6edf3", fontWeight: "600" }}>{position.market}</td>
                        <td style={{ padding: "16px" }}>
                          <span style={{ padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "600", backgroundColor: position.side === "Long" ? "rgba(38, 166, 65, 0.1)" : "rgba(248, 81, 73, 0.1)", color: position.side === "Long" ? "#26a641" : "#f85149" }}>
                            {position.side}
                          </span>
                        </td>
                        <td style={{ padding: "16px", color: "#e6edf3" }}>${position.collateral}</td>
                        <td style={{ padding: "16px", color: "#e6edf3" }}>{position.leverage}</td>
                        <td style={{ padding: "16px", color: "#e6edf3", fontFamily: "monospace" }}>${position.entryPrice}</td>
                        <td style={{ padding: "16px", color: "#e6edf3", fontFamily: "monospace" }}>${position.currentPrice}</td>
                        <td style={{ padding: "16px" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <span style={{ color: isPnlPositive ? "#26a641" : "#f85149", fontWeight: "600", fontSize: "14px" }}>{position.pnl}</span>
                            <span style={{ color: isPnlPositive ? "#26a641" : "#f85149", fontSize: "11px" }}>{position.pnlPercent}</span>
                          </div>
                        </td>
                        <td style={{ padding: "16px" }}>
                          <span style={{ padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "600", backgroundColor: position.isOpen ? "rgba(31, 111, 235, 0.1)" : "rgba(139, 148, 158, 0.1)", color: position.isOpen ? "#58a6ff" : "#8b949e" }}>
                            {position.isOpen ? "OPEN" : "CLOSED"}
                          </span>
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
    </div>
  );
}