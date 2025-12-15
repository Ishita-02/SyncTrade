"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../lib/api";
import { useAccount } from "wagmi";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ArrowLeft, User, Activity, Layers } from "lucide-react";

import SubscribeBox from "../../components/SubscribeBox";
import ExecuteTradeBox from "../../components/ExecuteTradeBox";
import PositionTable from "../../components/PositionTable";
import CandlestickChart from "../../components/CandleStickChart";

export default function LeaderPage() {
  const { id } = useParams();
  const leaderId = Number(id);
  const { address } = useAccount();

  // TEMP: mock leader if API empty
  const leader = {
    leaderId,
    address: "0xA1B2c3D4e5F678901234567890ABCDEF1234567",
    meta: "ETH Momentum Strategy",
  };

  const isLeader =
    address?.toLowerCase() === leader.address.toLowerCase();

  return (
    <div style={{ backgroundColor: "#0f1419", minHeight: "100vh", color: "#e6edf3" }}>
      {/* Header */}
      <header style={{ backgroundColor: "#161b22", borderBottom: "1px solid #30363d" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 0" }}>
            <h1 style={{ fontSize: "20px", fontWeight: 700 }}>SyncTrade</h1>
            <ConnectButton showBalance={false} chainStatus="icon" accountStatus="address" />
          </div>
        </div>
      </header>

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "32px 24px" }}>
        {/* Back */}
        <Link
          href="/"
          style={{
            display: "inline-flex",
            gap: "8px",
            marginBottom: "16px",
            color: "#8b949e",
            textDecoration: "none",
          }}
        >
          <ArrowLeft size={16} />
          Back to Strategies
        </Link>

        {/* Title */}
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
              }}
            >
              Active
            </span>
          </h2>

          <div style={{ display: "flex", gap: "8px", color: "#8b949e" }}>
            <User size={14} />
            <span style={{ fontFamily: "monospace" }}>{leader.address}</span>
          </div>
        </div>

        {/* CHART */}
        <div
          style={{
            backgroundColor: "#161b22",
            border: "1px solid #30363d",
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "32px",
          }}
        >
          <CandlestickChart />
        </div>

        {/* Subscribe / Execute */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
            gap: "24px",
            marginBottom: "32px",
          }}
        >
          <div className="card">
            <h3 className="section-title">
              <Activity size={18} /> Subscribe
            </h3>
            <SubscribeBox leaderId={leaderId} />
          </div>

          {isLeader && (
            <div className="card">
              <h3 className="section-title">
                <Layers size={18} /> Execute Trade
              </h3>
              <ExecuteTradeBox leaderId={leaderId} />
            </div>
          )}
        </div>

        {/* Positions */}
        <div className="card">
          <h3 className="section-title">Open Positions</h3>
          <PositionTable
            positions={[
              {
                market: "ETH",
                side: "Long",
                sizeUsd: "300",
                entryPrice: "3500",
              },
              {
                market: "ETH",
                side: "Short",
                sizeUsd: "150",
                entryPrice: "3700",
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
