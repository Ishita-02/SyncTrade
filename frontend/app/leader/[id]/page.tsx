"use client";

import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ArrowLeft, User, TrendingUp, DollarSign, Activity } from "lucide-react";

import SubscribeBox from "../../components/SubscribeBox";
import ExecuteTradeBox from "../../components/ExecuteTradeBox";
import CandlestickChart from "../../components/CandleStickChart";

export default function LeaderPage() {
  const { id } = useParams();
  const leaderId = Number(id);
  const { address } = useAccount();

  const [mounted, setMounted] = useState(false);
  const [marketFilter, setMarketFilter] = useState("All");

  useEffect(() => {
    setMounted(true);
  }, []);

  const leader = {
    leaderId,
    address:  `0x${address?.slice(2)}`,
    meta: "Multi-Market Strategy",
    totalAUM: 12500,
    totalPnL: 1850,
    totalFollowers: 45,
  };

  // Mock positions across multiple markets
  const allPositions = [
    {
      id: 1,
      market: "ETH-USD",
      side: "Long",
      collateral: "1000",
      leverage: "5x",
      entryPrice: "3200",
      currentPrice: "3400",
      pnl: "+312.50",
      pnlPercent: "+31.25%",
      isOpen: true,
    },
    {
      id: 2,
      market: "BTC-USD",
      side: "Short",
      collateral: "2000",
      leverage: "3x",
      entryPrice: "68000",
      currentPrice: "67200",
      pnl: "+176.47",
      pnlPercent: "+8.82%",
      isOpen: true,
    },
    {
      id: 3,
      market: "SOL-USD",
      side: "Long",
      collateral: "500",
      leverage: "10x",
      entryPrice: "95",
      currentPrice: "102",
      pnl: "+368.42",
      pnlPercent: "+73.68%",
      isOpen: true,
    },
    {
      id: 4,
      market: "ETH-USD",
      side: "Long",
      collateral: "1500",
      leverage: "2x",
      entryPrice: "3100",
      currentPrice: "3400",
      pnl: "+290.32",
      pnlPercent: "+19.35%",
      isOpen: true,
    },
    {
      id: 5,
      market: "BTC-USD",
      side: "Long",
      collateral: "800",
      leverage: "4x",
      entryPrice: "65000",
      currentPrice: "67200",
      pnl: "+215.38",
      pnlPercent: "+26.92%",
      isOpen: false,
    },
  ];

  const filteredPositions =
    marketFilter === "All"
      ? allPositions
      : allPositions.filter((p) => p.market.startsWith(marketFilter));

  const openPositions = filteredPositions.filter((p) => p.isOpen);

  const isLeader =
    !mounted || address?.toLowerCase() === leader.address.toLowerCase();

  return (
    <div
      style={{
        backgroundColor: "#0f1419",
        minHeight: "100vh",
        color: "#e6edf3",
      }}
    >
      {/* Header */}
      <header
        style={{
          backgroundColor: "#161b22",
          borderBottom: "1px solid #30363d",
        }}
      >
        <div
          style={{
            maxWidth: "1600px",
            margin: "0 auto",
            padding: "0 24px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 0",
            }}
          >
            <h1 style={{ fontSize: "20px", fontWeight: 700 }}>SyncTrade</h1>
            <ConnectButton
              showBalance={false}
              chainStatus="icon"
              accountStatus="address"
            />
          </div>
        </div>
      </header>

      <div
        style={{
          maxWidth: "1600px",
          margin: "0 auto",
          padding: "32px 24px",
        }}
      >
        {/* Back */}
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "16px",
            color: "#8b949e",
            textDecoration: "none",
            fontSize: "14px",
          }}
        >
          <ArrowLeft size={16} />
          Back to Strategies
        </Link>

        {/* Strategy Header */}
        <div style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "28px", fontWeight: 700 }}>
            {leader.meta}
            <span
              style={{
                marginLeft: "12px",
                padding: "4px 12px",
                borderRadius: "20px",
                backgroundColor: "#1f6feb",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              Active
            </span>
          </h2>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "#8b949e",
              marginTop: "6px",
            }}
          >
            <User size={14} />
            <span style={{ fontFamily: "monospace" }}>{leader.address}</span>
          </div>
        </div>

        {/* Portfolio Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              backgroundColor: "#161b22",
              border: "1px solid #30363d",
              borderRadius: "12px",
              padding: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "8px",
                  backgroundColor: "#21262d",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <DollarSign style={{ width: "20px", height: "20px", color: "#58a6ff" }} />
              </div>
              <div>
                <div style={{ color: "#8b949e", fontSize: "12px", marginBottom: "2px" }}>Total AUM</div>
                <div style={{ color: "#e6edf3", fontSize: "20px", fontWeight: "700" }}>
                  ${leader.totalAUM.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: "#161b22",
              border: "1px solid #30363d",
              borderRadius: "12px",
              padding: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "8px",
                  backgroundColor: "#1a3a1a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <TrendingUp style={{ width: "20px", height: "20px", color: "#26a641" }} />
              </div>
              <div>
                <div style={{ color: "#8b949e", fontSize: "12px", marginBottom: "2px" }}>Total P&L</div>
                <div style={{ color: "#26a641", fontSize: "20px", fontWeight: "700" }}>
                  +${leader.totalPnL.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: "#161b22",
              border: "1px solid #30363d",
              borderRadius: "12px",
              padding: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "8px",
                  backgroundColor: "#21262d",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Activity style={{ width: "20px", height: "20px", color: "#58a6ff" }} />
              </div>
              <div>
                <div style={{ color: "#8b949e", fontSize: "12px", marginBottom: "2px" }}>Open Positions</div>
                <div style={{ color: "#e6edf3", fontSize: "20px", fontWeight: "700" }}>
                  {openPositions.length}
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: "#161b22",
              border: "1px solid #30363d",
              borderRadius: "12px",
              padding: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "8px",
                  backgroundColor: "#21262d",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <User style={{ width: "20px", height: "20px", color: "#58a6ff" }} />
              </div>
              <div>
                <div style={{ color: "#8b949e", fontSize: "12px", marginBottom: "2px" }}>Followers</div>
                <div style={{ color: "#e6edf3", fontSize: "20px", fontWeight: "700" }}>
                  {leader.totalFollowers}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid - Chart Left, Actions Right */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 400px",
            gap: "24px",
            marginBottom: "32px",
          }}
        >
          {/* Left: Chart */}
          <div
            style={{
              backgroundColor: "#161b22",
              border: "1px solid #30363d",
              borderRadius: "12px",
              padding: "20px",
            }}
          >
            <CandlestickChart />
          </div>

          {/* Right: Subscribe & Execute Boxes */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Subscribe Box */}
            <div
              style={{
                backgroundColor: "#161b22",
                border: "1px solid #30363d",
                borderRadius: "12px",
                padding: "24px",
              }}
            >
              <h3
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "18px",
                  fontWeight: 600,
                  marginBottom: "16px",
                }}
              >
                <Activity size={18} />
                Subscribe to Strategy
              </h3>
              <SubscribeBox leaderId={leaderId} />
            </div>

            {/* Execute Trade Box - Always show for development */}
            {isLeader && (
              <div
                style={{
                  backgroundColor: "#161b22",
                  border: "1px solid #30363d",
                  borderRadius: "12px",
                  padding: "24px",
                }}
              >
                <h3
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "18px",
                    fontWeight: 600,
                    marginBottom: "16px",
                  }}
                >
                  <TrendingUp size={18} />
                  Execute Trade
                </h3>
                <ExecuteTradeBox leaderId={leaderId} />
              </div>
            )}
          </div>
        </div>

        {/* Portfolio Positions - Full Width Below */}
        <div
          style={{
            backgroundColor: "#161b22",
            border: "1px solid #30363d",
            borderRadius: "12px",
            padding: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <h3 style={{ fontSize: "18px", fontWeight: 600, margin: 0 }}>
              Portfolio Positions
            </h3>

            {/* Market Filter */}
            <div style={{ display: "flex", gap: "6px" }}>
              {["All", "ETH", "BTC", "SOL"].map((market) => (
                <button
                  key={market}
                  onClick={() => setMarketFilter(market)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "6px",
                    border: "1px solid #30363d",
                    backgroundColor: marketFilter === market ? "#1f6feb" : "transparent",
                    color: marketFilter === market ? "#ffffff" : "#8b949e",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {market === "All" ? "All Markets" : market}
                </button>
              ))}
            </div>
          </div>

          {/* Positions Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #30363d" }}>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "12px 16px",
                      color: "#8b949e",
                      fontWeight: "600",
                      fontSize: "12px",
                    }}
                  >
                    Market
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "12px 16px",
                      color: "#8b949e",
                      fontWeight: "600",
                      fontSize: "12px",
                    }}
                  >
                    Side
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "12px 16px",
                      color: "#8b949e",
                      fontWeight: "600",
                      fontSize: "12px",
                    }}
                  >
                    Collateral
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "12px 16px",
                      color: "#8b949e",
                      fontWeight: "600",
                      fontSize: "12px",
                    }}
                  >
                    Leverage
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "12px 16px",
                      color: "#8b949e",
                      fontWeight: "600",
                      fontSize: "12px",
                    }}
                  >
                    Entry Price
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "12px 16px",
                      color: "#8b949e",
                      fontWeight: "600",
                      fontSize: "12px",
                    }}
                  >
                    Current Price
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "12px 16px",
                      color: "#8b949e",
                      fontWeight: "600",
                      fontSize: "12px",
                    }}
                  >
                    P&L
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "12px 16px",
                      color: "#8b949e",
                      fontWeight: "600",
                      fontSize: "12px",
                    }}
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPositions.map((position) => {
                  const isPnlPositive = position.pnl.startsWith("+");
                  return (
                    <tr key={position.id} style={{ borderBottom: "1px solid #30363d" }}>
                      <td style={{ padding: "16px", color: "#e6edf3", fontWeight: "600" }}>
                        {position.market}
                      </td>
                      <td style={{ padding: "16px" }}>
                        <span
                          style={{
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "600",
                            backgroundColor:
                              position.side === "Long" ? "rgba(38, 166, 65, 0.1)" : "rgba(248, 81, 73, 0.1)",
                            color: position.side === "Long" ? "#26a641" : "#f85149",
                          }}
                        >
                          {position.side}
                        </span>
                      </td>
                      <td style={{ padding: "16px", color: "#e6edf3" }}>
                        ${position.collateral}
                      </td>
                      <td style={{ padding: "16px", color: "#e6edf3" }}>
                        {position.leverage}
                      </td>
                      <td style={{ padding: "16px", color: "#e6edf3", fontFamily: "monospace" }}>
                        ${position.entryPrice}
                      </td>
                      <td style={{ padding: "16px", color: "#e6edf3", fontFamily: "monospace" }}>
                        ${position.currentPrice}
                      </td>
                      <td style={{ padding: "16px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span
                            style={{
                              color: isPnlPositive ? "#26a641" : "#f85149",
                              fontWeight: "600",
                              fontSize: "14px",
                            }}
                          >
                            {position.pnl}
                          </span>
                          <span
                            style={{
                              color: isPnlPositive ? "#26a641" : "#f85149",
                              fontSize: "11px",
                            }}
                          >
                            {position.pnlPercent}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "16px" }}>
                        <span
                          style={{
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: "600",
                            backgroundColor: position.isOpen ? "rgba(31, 111, 235, 0.1)" : "rgba(139, 148, 158, 0.1)",
                            color: position.isOpen ? "#58a6ff" : "#8b949e",
                          }}
                        >
                          {position.isOpen ? "OPEN" : "CLOSED"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}