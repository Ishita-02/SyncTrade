"use client";

import { useParams } from "next/navigation";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, User, TrendingUp, DollarSign, Activity, MousePointerClick, Settings, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query"; 
import { api } from "@/lib/api"; 
import toast from "react-hot-toast";
import SubscribeBox from "../../components/SubscribeBox";
import CandlestickChart from "../../components/CandleStickChart";
import { CORE_ABI, CORE_CONTRACT } from "@/lib/contracts";
import { MARKET_MAP } from "@/lib/api";
import { usePrices } from "@/app/hooks/usePrices";
import { useMode } from "@/app/context/ModeContext"; // 1. Import Context

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
  indexToken: string;
  side: "OPEN_LONG" | "Short";
  collateral: string | number; 
  leverage: string | number;
  entryPrice: string | number;
  currentPrice: string | number;
  pnlUsd: string | number;
  pnlPercent: string | number;
  isOpen: boolean;
  isLong: boolean;
  sizeUsd: string
};

export default function LeaderPage() {
  const { id } = useParams();
  const leaderId = Number(id);
  const { address } = useAccount();
  const { prices } = usePrices();
  
  // 2. Consume Mode Context
  const { viewMode } = useMode();

  const [marketFilter, setMarketFilter] = useState("All");
  const [selectedMarket, setSelectedMarket] = useState("ETH-USD");

  // --- 1. FETCH LEADER DETAILS ---
  const { data: leader, isLoading: isLeaderLoading } = useQuery({
    queryKey: ["leader", leaderId],
    queryFn: () => api<LeaderDetail>(`/leaders/${leaderId}`),
  });

  const isOwner = address && leader && address.toLowerCase() === leader.address.toLowerCase();

  // --- 2. FETCH LEADER POSITIONS ---
  const { data: rawPositions, isLoading: isPositionsLoading } = useQuery({
    queryKey: ["leader-positions", leaderId],
    queryFn: () => api<Position[]>(`/leaders/${leaderId}/positions`),
  });

  const { data: subscription } = useQuery({
    queryKey: ["subscription", leaderId, address],
    enabled: !!address,
    queryFn: () =>
      api<{
        subscribed: boolean;
        deposit: string;
      }>(`/leaders/${leaderId}/subscription/${address}`),
  });

  const { writeContract, data: hash } = useWriteContract();
      
  useWaitForTransactionReceipt({ hash });

  const handleUnsubscribe = async () => {
    try {
      toast.loading("Unsubscribing...", { id: "unsub" });
      writeContract({
        address: CORE_CONTRACT,
        abi: CORE_ABI,
        functionName: "unsubscribe",
        args: [leaderId],
      });
      toast.success("Unsubscribed", { id: "unsub" });
    } catch (e) {
      console.error(e);
      toast.error("Unsubscribe failed", { id: "unsub" });
    }
  };

  const allPositions = (rawPositions || []).map((p) => {
    const tokenKey = p.indexToken.toLowerCase();
    const marketInfo = MARKET_MAP[tokenKey];

    const entryPrice = Number(p.entryPrice) / 1e18;
    const sizeUsd = Number(p.sizeUsd) / 1e18;

    const symbol = MARKET_MAP[p.indexToken.toLowerCase()];
    const currentPrice = (prices && symbol?.symbol && (prices as Record<string, any>)[symbol.symbol]?.price) ?? 0;

    let pnlUsd = 0;
    let pnlPercent = 0;

    if (currentPrice && entryPrice > 0) {
      pnlUsd = p.isLong
        ? ((currentPrice - entryPrice) * sizeUsd) / entryPrice
        : ((entryPrice - currentPrice) * sizeUsd) / entryPrice;

      pnlPercent = (pnlUsd / sizeUsd) * 100;
    }

    return {
      id: p.id,
      market: marketInfo?.market ?? "UNKNOWN",
      isLong: p.isLong,
      collateral: sizeUsd,
      leverage: 1, // Simplified for now
      entryPrice,
      currentPrice,
      pnlUsd,
      pnlPercent,
      isOpen: p.isOpen,
    };
  });

   var totalPnlUsd = allPositions
    .filter((p) => p.isOpen)
    .reduce((acc, p) => acc + p.pnlUsd, 0);

    var totalAmount = allPositions
    .filter((p) => p.isOpen)
    .reduce((acc, p) => acc + p.collateral, 0);


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

  // --- ERROR STATE ---
  if (!leader) {
    return (
      <div style={{ backgroundColor: "#0f1419", minHeight: "100vh", color: "#e6edf3", display: "flex", justifyContent: "center", alignItems: "center" }}>
        Leader not found.
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#0f1419", minHeight: "100vh", color: "#e6edf3" }}>
      
      {/* 3. REMOVED LOCAL HEADER */}

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
            {isOwner && (
              <span style={{ marginLeft: "12px", padding: "4px 12px", borderRadius: "20px", backgroundColor: "#238636", fontSize: "12px", fontWeight: 600 }}>
                Owner
              </span>
            )}
            {!isOwner && (
              <span style={{ marginLeft: "12px", padding: "4px 12px", borderRadius: "20px", backgroundColor: "#1f6feb", fontSize: "12px", fontWeight: 600 }}>
                Active
              </span>
            )}
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
                <div style={{ color: "#e6edf3", fontSize: "20px", fontWeight: "700" }}>${Number(totalAmount.toLocaleString())}</div>
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
                   {totalPnlUsd > 0 ? "+" : ""}${(totalPnlUsd).toLocaleString()}
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

          {/* Right: ACTION PANEL (Depends on MODE) */}
          <div style={{ backgroundColor: "#161b22", border: "1px solid #30363d", borderRadius: "12px", padding: "24px", display: "flex", flexDirection: "column" }}>
            
            {/* 4. MODE BASED RENDERING */}
            {viewMode === "leader" ? (
              // LEADER MODE VIEW
              isOwner ? (
                <>
                  <h3 style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "18px", fontWeight: 600, marginBottom: "16px", color: "#238636" }}>
                    <Settings size={18} /> Manage Strategy
                  </h3>
                  <div style={{ fontSize: "14px", color: "#8b949e", lineHeight: "1.5", marginBottom: "24px" }}>
                    You are the owner of this strategy. You can execute trades and manage positions from the trading terminal.
                  </div>
                  <Link href="/trade" style={{ textAlign: "center", backgroundColor: "#238636", color: "white", padding: "12px", borderRadius: "8px", textDecoration: "none", fontWeight: "600" }}>
                    Open Trading Terminal
                  </Link>
                </>
              ) : (
                <>
                  <h3 style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "18px", fontWeight: 600, marginBottom: "16px", color: "#f85149" }}>
                    <AlertCircle size={18} /> View Only
                  </h3>
                  <div style={{ fontSize: "14px", color: "#8b949e", lineHeight: "1.5", marginBottom: "12px" }}>
                    You are currently in <strong>Leader Mode</strong>.
                  </div>
                  <div style={{ fontSize: "14px", color: "#e6edf3", lineHeight: "1.5" }}>
                     To subscribe to this strategy, please switch to <strong>Follower Mode</strong> in the navigation bar.
                  </div>
                </>
              )
            ) : (
              // FOLLOWER MODE VIEW (Original Logic)
              <>
                <h3 style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
                  <Activity size={18} />
                  {subscription?.subscribed ? "Your Subscription" : "Subscribe to Strategy"}
                </h3>

                {subscription?.subscribed ? (
                  <>
                    <div style={{ marginBottom: "12px", color: "#8b949e", fontSize: "14px" }}>
                      Deposited: $
                      {(Number(subscription.deposit) / 1e6).toFixed(2)} USDC
                    </div>

                    <button
                      onClick={handleUnsubscribe}
                      style={{
                        width: "100%",
                        backgroundColor: "#f85149",
                        color: "#ffffff",
                        padding: "12px",
                        borderRadius: "8px",
                        border: "none",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      Unsubscribe
                    </button>
                  </>
                ) : (
                  <SubscribeBox leaderId={leaderId} />
                )}
              </>
            )}
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
                    const isPnlPositive = position.pnlUsd >= 0;
                    const isSelected = selectedMarket === position.market;

                    return (
                      <tr
                        key={position.id}
                        onClick={() => setSelectedMarket(position.market)}
                        style={{
                          borderBottom: "1px solid #30363d",
                          cursor: "pointer",
                          backgroundColor: isSelected ? "#1f242e" : "transparent",
                        }}
                      >
                        <td style={{ padding: "16px", fontWeight: 600 }}>{position.market}</td>
                        <td style={{ padding: "16px" }}>
                          <span style={{ padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, backgroundColor: position.isLong ? "rgba(38,166,65,0.1)" : "rgba(248,81,73,0.1)", color: position.isLong ? "#26a641" : "#f85149" }}>
                            {position.isLong ? "LONG" : "SHORT"}
                          </span>
                        </td>
                        <td style={{ padding: "16px" }}>${position.collateral.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                        <td style={{ padding: "16px" }}>{position.leverage}x</td>
                        <td style={{ padding: "16px", fontFamily: "monospace" }}>${position.entryPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                        <td style={{ padding: "16px", fontFamily: "monospace" }}>${position.currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                        <td style={{ padding: "16px" }}>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ color: isPnlPositive ? "#26a641" : "#f85149", fontWeight: 600 }}>
                              {isPnlPositive ? "+" : "-"}${Math.abs(position.pnlUsd).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </span>
                            <span style={{ fontSize: "11px", color: isPnlPositive ? "#26a641" : "#f85149" }}>
                              {isPnlPositive ? "+" : "-"}{Math.abs(position.pnlPercent).toFixed(2)}%
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: "16px" }}>
                          <span style={{ padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, backgroundColor: position.isOpen ? "rgba(31,111,235,0.1)" : "rgba(139,148,158,0.1)", color: position.isOpen ? "#58a6ff" : "#8b949e" }}>
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