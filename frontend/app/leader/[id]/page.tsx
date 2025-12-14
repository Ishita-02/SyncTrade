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

export default function LeaderPage() {
  const { id } = useParams();
  const leaderId = Number(id);
  const { address } = useAccount();

  const { data: leader, isLoading } = useQuery({
    queryKey: ["leader", leaderId],
    queryFn: () => api<any>(`/leaders/${leaderId}`),
  });

  const { data: positions } = useQuery({
    queryKey: ["positions", leaderId],
    queryFn: () => api<any[]>(`/leaders/${leaderId}/positions`),
  });

  if (isLoading || !leader) {
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
        Loading strategy...
      </div>
    );
  }

  const isLeader = address?.toLowerCase() === leader.address.toLowerCase();

  return (
    <div style={{ backgroundColor: "#0f1419", minHeight: "100vh", color: "#e6edf3" }}>
      {/* Header */}
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
                  style={{
                    color: "#8b949e",
                    textDecoration: "none",
                    transition: "color 0.2s",
                  }}
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
            <ConnectButton showBalance={false} chainStatus="icon" accountStatus="address" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "32px 24px" }}>
        {/* Back Button */}
        <div style={{ marginBottom: "24px" }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              color: "#8b949e",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            <ArrowLeft style={{ width: "16px", height: "16px" }} />
            Back to Strategies
          </Link>
        </div>

        {/* Strategy Header */}
        <div
          style={{
            marginBottom: "32px",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <h2 style={{ fontSize: "28px", fontWeight: "700", color: "#e6edf3", margin: 0 }}>
                {leader.meta || "Unnamed Strategy"}
              </h2>
              <span
                style={{
                  padding: "4px 12px",
                  backgroundColor: "#1f6feb",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "white",
                }}
              >
                Active
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#8b949e" }}>
              <User style={{ width: "16px", height: "16px" }} />
              <span style={{ fontFamily: "monospace", fontSize: "14px" }}>{leader.address}</span>
            </div>
          </div>
        </div>

        {/* Action Grid (Subscribe / Execute) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
            gap: "24px",
            marginBottom: "32px",
          }}
        >
          {/* Subscribe Box Wrapper */}
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
                fontWeight: "600",
                color: "#e6edf3",
                marginBottom: "20px",
              }}
            >
              <Activity style={{ width: "20px", height: "20px", color: "#58a6ff" }} />
              Subscribe
            </h3>
            <SubscribeBox leaderId={leaderId} />
          </div>

          {/* Execute Trade Box Wrapper (Only for Leader) */}
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
                  fontWeight: "600",
                  color: "#e6edf3",
                  marginBottom: "20px",
                }}
              >
                <Layers style={{ width: "20px", height: "20px", color: "#d2a8ff" }} />
                Execute Trade
              </h3>
              <ExecuteTradeBox leaderId={leaderId} />
            </div>
          )}
        </div>

        {/* Positions Table Wrapper */}
        <div
          style={{
            backgroundColor: "#161b22",
            border: "1px solid #30363d",
            borderRadius: "12px",
            overflow: "hidden",
            padding: "24px",
          }}
        >
          <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#e6edf3", marginBottom: "20px" }}>
            Open Positions
          </h3>
          {positions && <PositionTable positions={positions} />}
        </div>
      </div>
    </div>
  );
}