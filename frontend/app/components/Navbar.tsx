"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { Users, LayoutDashboard, ChevronDown } from "lucide-react";
import { useMode } from "../context/ModeContext";
import { api } from "@/lib/api"; 
import { useConfig } from "wagmi";


// --- Types based on your backend ---
type Strategy = { leaderId: number; address: string; meta: string; };
type Leader = { leaderId: number; address: string; meta: string; };

export default function Navbar() {
  const pathname = usePathname();
  const { address } = useAccount();
  const config = useConfig();
  // console.log("wagmi config", config);
  const { viewMode, setViewMode, activeStrategyId, setActiveStrategyId } = useMode();

  // --- LOGIC: HIDE NAVBAR ON LANDING PAGE ---
  // If we are on Home ("/"), we return null so this Navbar doesn't show.
  // The Landing Page has its own separate header.
  if (pathname === "/") {
    return null;
  }

  // --- DATA FETCHING ---
  const { data: strategies, isLoading: isLoadingStrategies } = useQuery({
    queryKey: ["user-strategies", address],
    queryFn: () => api<Strategy[]>(`/strategies/me/${address}`),
    enabled: !!address && viewMode === "leader",
  });

  const { data: followedLeaders, isLoading: isLoadingFollowed } = useQuery({
    queryKey: ["followed-leaders", address],
    queryFn: () => api<Leader[]>(`/getLeaders/follower/${address}`),
    enabled: !!address && viewMode === "follower",
  });

  const currentList = useMemo(() => {
    if (viewMode === "leader") return strategies || [];
    return followedLeaders || [];
  }, [viewMode, strategies, followedLeaders]);

  const isLoading = viewMode === "leader" ? isLoadingStrategies : isLoadingFollowed;

  useEffect(() => {
    if (activeStrategyId === null && currentList.length > 0) {
      setActiveStrategyId(currentList[0].leaderId);
    }
  }, [currentList, activeStrategyId, setActiveStrategyId]);

  // Helper for Link styling
  const getLinkStyle = (path: string) => {
    const isActive = path === "/" ? pathname === "/" : pathname.startsWith(path);
    return {
      color: isActive ? "#58a6ff" : "#8b949e",
      textDecoration: "none",
      fontWeight: isActive ? "500" : "400",
      transition: "color 0.2s",
    };
  };

  return (
    <header style={{ backgroundColor: "#161b22", borderBottom: "1px solid #30363d" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0" }}>
          
          {/* LEFT: Logo & Nav */}
          <div style={{ display: "flex", alignItems: "center", gap: "48px" }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <h1 style={{ fontSize: "20px", fontWeight: "700", color: "#e6edf3", margin: 0 }}>
                SyncTrade
              </h1>
            </Link>
            
            <nav style={{ display: "flex", gap: "32px" }}>
              <Link href="/trade" style={getLinkStyle("/trade")}>Markets</Link>
              {/* Corrected Link: Goes to /strategies, NOT / */}
              <Link href="/strategies" style={getLinkStyle("/strategies")}>Strategies</Link>
              <Link href="/portfolio" style={getLinkStyle("/portfolio")}>Portfolio</Link>
            </nav>
          </div>

          {/* RIGHT: Wallet & Mode Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            
            {/* Mode Switcher */}
            <div style={{ backgroundColor: "#21262d", borderRadius: "6px", padding: "4px", display: "flex", border: "1px solid #30363d" }}>
              <button
                onClick={() => setViewMode("follower")}
                style={{ backgroundColor: viewMode === "follower" ? "#1f6feb" : "transparent", color: viewMode === "follower" ? "white" : "#8b949e", border: "none", borderRadius: "4px", padding: "6px 12px", fontSize: "13px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
              >
                <Users size={14} /> Follower
              </button>
              <button
                onClick={() => setViewMode("leader")}
                style={{ backgroundColor: viewMode === "leader" ? "#238636" : "transparent", color: viewMode === "leader" ? "white" : "#8b949e", border: "none", borderRadius: "4px", padding: "6px 12px", fontSize: "13px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
              >
                <LayoutDashboard size={14} /> Leader
              </button>
            </div>

            {/* Strategy Dropdown */}
            <div style={{ position: "relative", minWidth: "180px" }}>
              <select
                value={activeStrategyId ?? ""} 
                onChange={(e) => setActiveStrategyId(Number(e.target.value))}
                disabled={isLoading || currentList.length === 0}
                style={{ appearance: "none", width: "100%", backgroundColor: "#161b22", border: "1px solid #30363d", borderRadius: "6px", padding: "8px 32px 8px 12px", color: "#e6edf3", fontSize: "13px", cursor: "pointer", outline: "none", opacity: isLoading ? 0.7 : 1 }}
              >
                {isLoading ? <option>Loading...</option> : currentList.length === 0 ? <option value="">No Strategies</option> : (
                  <>
                    <option value="" disabled>Select {viewMode === "leader" ? "Strategy" : "Leader"}</option>
                    {currentList.map((item) => <option key={item.leaderId} value={item.leaderId}>{item.meta || `Strategy #${item.leaderId}`}</option>)}
                  </>
                )}
              </select>
              <div style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#8b949e" }}><ChevronDown size={14} /></div>
            </div>

            {/* CONNECT BUTTON (Only shows here!) */}
            <ConnectButton showBalance={false} chainStatus="icon" accountStatus="address" />
          </div>

        </div>
      </div>
    </header>
  );
}