"use client";

import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
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

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const leader = {
    leaderId,
    address: "0xA1B2c3D4e5F678901234567890ABCDEF1234567",
    meta: "ETH Momentum Strategy",
  };

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

        {/* Main Content Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 400px", // Main Grid Ratio
            gap: "24px",
            alignItems: "start", // Prevents stretching
            marginBottom: "32px",
          }}
        >
          {/* LEFT COLUMN: Chart + Positions Table */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Chart Section - Fixed height to make it shorter */}
            <div
              style={{
                backgroundColor: "#161b22",
                border: "1px solid #30363d",
                borderRadius: "12px",
                padding: "20px",
                height: "500px", // RESTRICTED HEIGHT
                display: "flex",
                flexDirection: "column",
              }}
            >
              <CandlestickChart />
            </div>

            {/* Positions Table - Now below chart to fill the gap */}
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
                  fontSize: "18px",
                  fontWeight: 600,
                  marginBottom: "16px",
                }}
              >
                Open Positions
              </h3>

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

          {/* RIGHT COLUMN: Subscribe & Execute Boxes */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

            {/* Execute Trade Box */}
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
                <Layers size={18} />
                Execute Trade
              </h3>
              <ExecuteTradeBox leaderId={leaderId} />
            </div>
            
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
                Subscribe
              </h3>
              <SubscribeBox leaderId={leaderId} />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}