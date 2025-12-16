"use client";

import { useState } from "react";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";

// Import your existing components
// Adjust the import paths ('@/components/...') if your folder structure is different
import CandlestickChart from "../components/CandleStickChart";
import ExecuteTradeBox from "../components/ExecuteTradeBox";

export default function TradePage() {
  // Current active market state
  const [activeMarket, setActiveMarket] = useState("ETH-USD");

  // List of available markets
  const markets = ["ETH-USD", "BTC-USD", "SOL-USD", "ARB-USD", "LINK-USD"];

  return (
    <div style={{ backgroundColor: "#0f1419", minHeight: "100vh", color: "#e6edf3" }}>
      {/* HEADER */}
      <header style={{ backgroundColor: "#161b22", borderBottom: "1px solid #30363d" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "48px" }}>
              <h1 style={{ fontSize: "20px", fontWeight: "700", color: "#e6edf3", margin: 0 }}>
                SyncTrade
              </h1>
              <nav style={{ display: "flex", gap: "32px" }}>
                <Link href="/trade" style={{ color: "#58a6ff", textDecoration: "none", fontWeight: "500" }}>
                  Markets
                </Link>
                <Link href="/" style={{ color: "#8b949e", textDecoration: "none", transition: "color 0.2s" }}>
                  Strategies
                </Link>
                <Link href="/portfolio" style={{ color: "#8b949e", textDecoration: "none", transition: "color 0.2s" }}>
                  Portfolio
                </Link>
              </nav>
            </div>
            <ConnectButton showBalance={false} chainStatus="icon" accountStatus="address" />
          </div>
        </div>
      </header>

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "32px 24px" }}>
        
        {/* MARKET SELECTOR SECTION */}
        <div style={{ marginBottom: "24px" }}>
          <h2 style={{ color: "#e6edf3", fontSize: "28px", fontWeight: "700", marginBottom: "16px" }}>
             Trade Markets
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            {markets.map((market) => (
              <button
                key={market}
                onClick={() => setActiveMarket(market)}
                style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                  border: activeMarket === market ? "none" : "1px solid #30363d",
                  backgroundColor: activeMarket === market ? "#1f6feb" : "#161b22",
                  color: activeMarket === market ? "#ffffff" : "#8b949e",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "14px",
                  transition: "all 0.2s",
                }}
              >
                {market}
              </button>
            ))}
          </div>
        </div>

        {/* TRADING INTERFACE: LEFT (Chart) & RIGHT (Order Form) */}
        <div style={{ display: "flex", gap: "24px", flexDirection: "row", alignItems: "stretch", minHeight: "600px" }}>
          
          {/* LEFT SIDE: CANDLESTICK CHART */}
          <div style={{ 
            flex: "1", 
            backgroundColor: "#161b22", 
            border: "1px solid #30363d", 
            borderRadius: "12px", 
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            minHeight: "500px" // Ensure height for chart
          }}>
            {/* <h3 style={{ color: "#8b949e", fontSize: "16px", marginBottom: "16px" }}>
              {activeMarket} Chart
            </h3> */}
            
            <div style={{ flex: 1, position: "relative" }}>
               {/* Passing activeMarket prop so chart updates when you switch tabs */}
               <CandlestickChart symbol={activeMarket} />
            </div>
          </div>

          {/* RIGHT SIDE: EXECUTE TRADE BOX */}
          <div style={{ 
            width: "380px", // Fixed width for the trading box
            backgroundColor: "#161b22", 
            border: "1px solid #30363d", 
            borderRadius: "12px", 
            padding: "24px",
            display: "flex",
            flexDirection: "column"
          }}>
             <h3 style={{ color: "#e6edf3", fontSize: "18px", fontWeight: "600", marginBottom: "24px" }}>
               Open Position
             </h3>
             
             {/* Passing activeMarket prop so trade box knows which asset to trade */}
             <ExecuteTradeBox market={activeMarket} />
          </div>

        </div>
      </div>
    </div>
  );
}