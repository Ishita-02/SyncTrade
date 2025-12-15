"use client";

import { useState, useEffect } from "react";
import { X, Settings, RefreshCw, ChevronDown, Info, Wallet } from "lucide-react";

export default function ExecuteTradeBox({ leaderId = 1 }: { leaderId?: number }) {
  // State
  const [market, setMarket] = useState("ETH");
  const [side, setSide] = useState<"Long" | "Short">("Long");
  const [collateral, setCollateral] = useState("");
  const [leverage, setLeverage] = useState(1.1); // Default strictly numeric for math
  const [showModal, setShowModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Mock Data (In real app, fetch from Oracle)
  const prices: Record<string, number> = {
    ETH: 3272.50,
    BTC: 64200.00,
    SOL: 145.20
  };
  const currentPrice = prices[market] || 0;
  const walletBalance = 1240.50;

  // --- CALCULATIONS (GMX Logic) ---
  const collateralVal = parseFloat(collateral) || 0;
  const positionSize = collateralVal * leverage;
  
  // Fees
  const openFee = positionSize * 0.001; // 0.1%
  const executionFee = 1.20; // Flat keeper fee
  const totalFees = openFee + executionFee;
  
  // Liquidation Price
  // Long Liq = Entry * (1 - (1/Leverage) + (MaintenanceMargin))
  // Simplified for UI: 
  const liqThreshold = 0.9; // Liquidation at 90% loss
  const liquidationPrice = side === "Long"
    ? currentPrice * (1 - (1/leverage) * liqThreshold)
    : currentPrice * (1 + (1/leverage) * liqThreshold);

  // Handlers
  const handleMax = () => setCollateral(walletBalance.toString());
  
  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (collateralVal <= 0) return;
    
    setIsProcessing(true);
    // Simulate Contract Call
    setTimeout(() => {
      setIsProcessing(false);
      setShowModal(true);
    }, 1500);
  };

  return (
    <div style={{
      backgroundColor: "#111418", // Darker background from screenshot
      border: "1px solid #2a2e35",
      borderRadius: "12px",
      padding: "16px",
      fontFamily: "sans-serif",
      color: "#e6edf3",
      maxWidth: "100%"
    }}>
      
      {/* --- HEADER --- */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "15px", fontWeight: "600" }}>Copying Leader #{leaderId}</span>
        </div>
        <Settings size={18} color="#8b949e" style={{ cursor: "pointer" }} />
      </div>

      <form onSubmit={handleExecute}>
        
        {/* --- MARKET SELECTOR --- */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontSize: "12px", color: "#8b949e", marginBottom: "6px", display: "block" }}>Market</label>
          <div style={{ 
            position: "relative", 
            backgroundColor: "#1c2128", 
            border: "1px solid #30363d", 
            borderRadius: "8px",
            padding: "12px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "600" }}>
              <img src={`https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/32/color/${market.toLowerCase()}.png`} 
                   alt={market} width={24} height={24} 
                   onError={(e) => (e.currentTarget.style.display = 'none')}
              />
              <span>{market} / USD</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
               <span style={{ fontSize: "14px", color: "#238636" }}>${currentPrice.toLocaleString()}</span>
            </div>
            
            {/* Invisible Select overlay for functionality */}
            <select 
              value={market} 
              onChange={(e) => setMarket(e.target.value)}
              style={{ position: "absolute", top:0, left:0, width:"100%", height:"100%", opacity:0, cursor:"pointer" }}
            >
              <option value="ETH">ETH</option>
              <option value="BTC">BTC</option>
              <option value="SOL">SOL</option>
            </select>
          </div>
        </div>

        {/* --- LONG / SHORT TABS --- */}
        <div style={{ display: "flex", backgroundColor: "#1c2128", padding: "4px", borderRadius: "8px", marginBottom: "20px" }}>
          <button type="button" onClick={() => setSide("Long")} style={{
            flex: 1, padding: "8px", borderRadius: "6px", fontSize: "14px", fontWeight: "600",
            backgroundColor: side === "Long" ? "#238636" : "transparent",
            color: side === "Long" ? "white" : "#8b949e", border: "none", cursor: "pointer", transition: "all 0.2s"
          }}>Long</button>
          <button type="button" onClick={() => setSide("Short")} style={{
            flex: 1, padding: "8px", borderRadius: "6px", fontSize: "14px", fontWeight: "600",
            backgroundColor: side === "Short" ? "#da3633" : "transparent",
            color: side === "Short" ? "white" : "#8b949e", border: "none", cursor: "pointer", transition: "all 0.2s"
          }}>Short</button>
        </div>

        {/* --- INPUTS --- */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "12px", color: "#8b949e" }}>
            <span>Pay</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <Wallet size={12} />
              {walletBalance.toLocaleString()}
            </span>
          </div>
          <div style={{ position: "relative" }}>
            <input 
              type="number" 
              placeholder="0.00"
              value={collateral}
              onChange={(e) => setCollateral(e.target.value)}
              style={{
                width: "100%", backgroundColor: "#0d1117", border: "1px solid #30363d", borderRadius: "8px",
                padding: "12px 60px 12px 12px", color: "white", fontSize: "16px", outline: "none"
              }}
            />
            <div style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", gap: "8px" }}>
              <button type="button" onClick={handleMax} style={{ fontSize: "11px", color: "#58a6ff", background: "none", border: "none", cursor: "pointer" }}>MAX</button>
              <span style={{ fontSize: "14px", color: "#8b949e", fontWeight: "600" }}>USDC</span>
            </div>
          </div>
        </div>

        {/* --- LEVERAGE --- */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", fontSize: "12px" }}>
            <span style={{ color: "#8b949e" }}>Leverage</span>
            <span style={{ fontWeight: "600" }}>{leverage.toFixed(1)}x</span>
          </div>
          <input 
            type="range" min="1.1" max="50" step="0.1" 
            value={leverage} 
            onChange={(e) => setLeverage(parseFloat(e.target.value))}
            style={{ width: "100%", cursor: "pointer", accentColor: "#238636" }} 
          />
        </div>

        {/* --- TRADE SUMMARY (THE GMX "FIX") --- */}
        <div style={{ 
          backgroundColor: "#161b22", 
          border: "1px solid #30363d", 
          borderRadius: "8px", 
          padding: "12px", 
          marginBottom: "20px",
          fontSize: "12px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ color: "#8b949e" }}>Entry Price</span>
            <span style={{ color: "#e6edf3" }}>${currentPrice.toLocaleString()}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ color: "#8b949e" }}>Liq. Price</span>
            <span style={{ color: "#da3633", fontWeight: "600" }}>
              {collateralVal > 0 ? `$${liquidationPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "-"}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ color: "#8b949e", display: "flex", alignItems: "center", gap: "4px" }}>
              Fees <Info size={10} />
            </span>
            <span style={{ color: "#e6edf3" }}>
              {collateralVal > 0 ? `$${totalFees.toFixed(2)}` : "-"}
            </span>
          </div>
          <div style={{ borderTop: "1px solid #30363d", margin: "8px 0" }}></div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#8b949e" }}>Total Size</span>
            <span style={{ color: "#e6edf3", fontWeight: "600" }}>
              {collateralVal > 0 ? `$${positionSize.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "-"}
            </span>
          </div>
        </div>

        {/* --- MAIN BUTTON --- */}
        <button 
          disabled={isProcessing || collateralVal <= 0}
          style={{
            width: "100%", padding: "14px", borderRadius: "8px", border: "none", fontSize: "16px", fontWeight: "600",
            backgroundColor: side === "Long" ? "#238636" : "#da3633",
            color: "white", cursor: collateralVal > 0 ? "pointer" : "not-allowed", opacity: collateralVal > 0 ? 1 : 0.6,
            display: "flex", justifyContent: "center", alignItems: "center", gap: "8px"
          }}
        >
          {isProcessing ? (
            <> <RefreshCw className="animate-spin" size={18} /> Processing... </>
          ) : (
            `${side} ${market}`
          )}
        </button>

        {/* Disclaimer */}
        <p style={{ marginTop: "12px", fontSize: "11px", color: "#484f58", textAlign: "center" }}>
           Entry price will be set upon confirmation.
        </p>
      </form>

      {/* --- SUCCESS MODAL --- */}
      {showModal && (
        <div style={{
          position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.8)", 
          display: "flex", justifyContent: "center", alignItems: "center", zIndex: 50
        }} onClick={() => setShowModal(false)}>
          <div style={{ backgroundColor: "#161b22", border: "1px solid #30363d", padding: "30px", borderRadius: "12px", width: "400px", textAlign: "center" }} onClick={e => e.stopPropagation()}>
            <div style={{ color: side === "Long" ? "#238636" : "#da3633", fontSize: "18px", fontWeight: "bold", marginBottom: "10px" }}>Position Opened!</div>
            <p style={{ color: "#8b949e", marginBottom: "20px" }}>Your {side} position on {market} is live.</p>
            <button onClick={() => setShowModal(false)} style={{ padding: "10px 20px", backgroundColor: "#30363d", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}