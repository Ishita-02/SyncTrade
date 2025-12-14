"use client";

import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Wallet, TrendingUp, DollarSign, Activity } from "lucide-react";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";

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
  indexToken?: string;
  timestamp: string;
};

type PortfolioData = {
  positions: Position[];
  totalDeposits: string;
  activeFollows: number;
  totalPnL: string;
};

export default function PortfolioPage() {
  const { address } = useAccount();

  const { data, isLoading } = useQuery({
    queryKey: ["portfolio", address],
    queryFn: () => api<PortfolioData>(`/portfolio/${address}`),
    enabled: !!address,
  });

  const stats = [
    {
      label: "Total Deposits",
      value: data?.totalDeposits ? `$${(Number(data.totalDeposits) / 1e18).toFixed(2)}` : "$0.00",
      icon: DollarSign,
    },
    {
      label: "Active Follows",
      value: data?.activeFollows?.toString() || "0",
      icon: TrendingUp,
    },
    {
      label: "Total P&L",
      value: data?.totalPnL ? `$${(Number(data.totalPnL) / 1e18).toFixed(2)}` : "$0.00",
      icon: Activity,
    },
  ];

  // State: Disconnected (Show Connect Landing)
  if (!address) {
    return (
      <div style={{ backgroundColor: "#0f1419", minHeight: "100vh", color: "#e6edf3" }}>
        <header style={{ backgroundColor: "#161b22", borderBottom: "1px solid #30363d" }}>
          <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 24px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 0",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "48px" }}>
                <h1 style={{ fontSize: "20px", fontWeight: "700", color: "#e6edf3", margin: 0 }}>
                  SyncTrade
                </h1>
                <nav style={{ display: "flex", gap: "32px" }}>
                  <Link
                    href="/"
                    style={{
                      color: "#8b949e",
                      textDecoration: "none",
                      transition: "color 0.2s",
                    }}
                  >
                    Markets
                  </Link>
                  <Link
                    href="#"
                    style={{ color: "#58a6ff", textDecoration: "none", fontWeight: "500" }}
                  >
                    Portfolio
                  </Link>
                  <Link
                    href="#"
                    style={{
                      color: "#8b949e",
                      textDecoration: "none",
                      transition: "color 0.2s",
                    }}
                  >
                    Docs
                  </Link>
                </nav>
              </div>
              
              {/* Replaced manual button with RainbowKit ConnectButton */}
              <ConnectButton />
            </div>
          </div>
        </header>

        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "120px 24px" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "24px",
            }}
          >
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                backgroundColor: "#21262d",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Wallet style={{ width: "40px", height: "40px", color: "#58a6ff" }} />
            </div>
            <div style={{ textAlign: "center" }}>
              <h2
                style={{
                  color: "#e6edf3",
                  fontSize: "24px",
                  fontWeight: "700",
                  marginBottom: "12px",
                }}
              >
                Connect Your Wallet
              </h2>
              <p style={{ color: "#8b949e", fontSize: "15px", maxWidth: "400px" }}>
                Connect your wallet to view your portfolio, positions, and trading history
              </p>
            </div>
            
            {/* Centered Large Connect Button */}
            <div style={{ marginTop: "16px" }}>
               <ConnectButton label="Connect Wallet" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // State: Loading Data (Connected but fetching)
  if (isLoading) {
    return (
      <div
        style={{
          backgroundColor: "#0f1419",
          minHeight: "100vh",
          color: "#e6edf3",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Loading portfolio...
      </div>
    );
  }

  // State: Connected & Loaded
  return (
    <div style={{ backgroundColor: "#0f1419", minHeight: "100vh", color: "#e6edf3" }}>
      <header style={{ backgroundColor: "#161b22", borderBottom: "1px solid #30363d" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 24px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 0",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "48px" }}>
              <h1 style={{ fontSize: "20px", fontWeight: "700", color: "#e6edf3", margin: 0 }}>
                SyncTrade
              </h1>
              <nav style={{ display: "flex", gap: "32px" }}>
                <Link
                  href="/"
                  style={{
                    color: "#8b949e",
                    textDecoration: "none",
                    transition: "color 0.2s",
                  }}
                >
                  Markets
                </Link>
                <Link
                  href="#"
                  style={{ color: "#58a6ff", textDecoration: "none", fontWeight: "500" }}
                >
                  Portfolio
                </Link>
                <Link
                  href="#"
                  style={{
                    color: "#8b949e",
                    textDecoration: "none",
                    transition: "color 0.2s",
                  }}
                >
                  Docs
                </Link>
              </nav>
            </div>
            
            {/* Replaced manual address display with RainbowKit ConnectButton */}
            <ConnectButton showBalance={false} chainStatus="icon" accountStatus="address" />
          </div>
        </div>
      </header>

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "32px 24px" }}>
        {/* Stats Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          {stats.map((stat, i) => {
            const IconComponent = stat.icon;
            return (
              <div
                key={i}
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
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "12px",
                  }}
                >
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
                    <IconComponent style={{ width: "20px", height: "20px", color: "#58a6ff" }} />
                  </div>
                  <div>
                    <div style={{ color: "#8b949e", fontSize: "13px", marginBottom: "4px" }}>
                      {stat.label}
                    </div>
                    <div style={{ color: "#e6edf3", fontSize: "24px", fontWeight: "700" }}>
                      {stat.value}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Page Header */}
        <div style={{ marginBottom: "24px" }}>
          <h2 style={{ color: "#e6edf3", fontSize: "28px", fontWeight: "700", marginBottom: "8px" }}>
            Your Positions
          </h2>
          <p style={{ color: "#8b949e", fontSize: "15px", margin: 0 }}>
            Track your copy trading positions and performance
          </p>
        </div>

        {/* Positions Table */}
        <div
          style={{
            backgroundColor: "#161b22",
            border: "1px solid #30363d",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #30363d" }}>
                <th
                  style={{
                    textAlign: "left",
                    padding: "16px 24px",
                    color: "#8b949e",
                    fontWeight: "600",
                    fontSize: "13px",
                  }}
                >
                  Token
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "16px 24px",
                    color: "#8b949e",
                    fontWeight: "600",
                    fontSize: "13px",
                  }}
                >
                  Type
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "16px 24px",
                    color: "#8b949e",
                    fontWeight: "600",
                    fontSize: "13px",
                  }}
                >
                  Size
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "16px 24px",
                    color: "#8b949e",
                    fontWeight: "600",
                    fontSize: "13px",
                  }}
                >
                  Entry Price
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "16px 24px",
                    color: "#8b949e",
                    fontWeight: "600",
                    fontSize: "13px",
                  }}
                >
                  P&L
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "16px 24px",
                    color: "#8b949e",
                    fontWeight: "600",
                    fontSize: "13px",
                  }}
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {!data?.positions || data.positions.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "80px 24px", textAlign: "center" }}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "16px",
                      }}
                    >
                      <div
                        style={{
                          width: "64px",
                          height: "64px",
                          borderRadius: "50%",
                          backgroundColor: "#21262d",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Activity style={{ width: "32px", height: "32px", color: "#58a6ff" }} />
                      </div>
                      <div>
                        <div
                          style={{
                            color: "#e6edf3",
                            fontSize: "18px",
                            fontWeight: "600",
                            marginBottom: "8px",
                          }}
                        >
                          No positions yet
                        </div>
                        <div style={{ color: "#8b949e", fontSize: "14px" }}>
                          Start following traders to see your positions here
                        </div>
                      </div>
                      <Link
                        href="/"
                        style={{
                          marginTop: "16px",
                          backgroundColor: "#238636",
                          color: "#ffffff",
                          padding: "10px 24px",
                          borderRadius: "8px",
                          textDecoration: "none",
                          fontWeight: "600",
                          fontSize: "14px",
                          display: "inline-block",
                        }}
                      >
                        Browse Strategies
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                data.positions.map((position: any) => (
                  <tr key={position.id} style={{ borderBottom: "1px solid #30363d" }}>
                    <td style={{ padding: "16px 24px", color: "#e6edf3", fontWeight: "600" }}>
                      {position.indexToken || "Unknown"}
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <span
                        style={{
                          padding: "4px 12px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "600",
                          backgroundColor: position.isLong ? "#1a3a1a" : "#3a1a1a",
                          color: position.isLong ? "#4ade80" : "#f87171",
                        }}
                      >
                        {position.isLong ? "LONG" : "SHORT"}
                      </span>
                    </td>
                    <td style={{ padding: "16px 24px", color: "#e6edf3" }}>
                      ${(Number(position.sizeUsd) / 1e18).toFixed(2)}
                    </td>
                    <td style={{ padding: "16px 24px", color: "#e6edf3" }}>
                      ${(Number(position.entryPrice) / 1e18).toFixed(2)}
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <span
                        style={{
                          color: position.pnlUsd && Number(position.pnlUsd) >= 0 ? "#4ade80" : "#f87171",
                          fontWeight: "600",
                        }}
                      >
                        {position.pnlUsd
                          ? `${Number(position.pnlUsd) >= 0 ? "+" : ""}$${(Number(position.pnlUsd) / 1e18).toFixed(2)}`
                          : "-"}
                      </span>
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <span
                        style={{
                          padding: "4px 12px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "600",
                          backgroundColor: position.isOpen ? "#1a2f3a" : "#2a2a2a",
                          color: position.isOpen ? "#58a6ff" : "#8b949e",
                        }}
                      >
                        {position.isOpen ? "OPEN" : "CLOSED"}
                      </span>
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