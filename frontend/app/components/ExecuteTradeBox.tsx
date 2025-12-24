"use client";

import { useState, useEffect } from "react";
import { Settings, RefreshCw, Info, Wallet, XCircle } from "lucide-react";
import { api } from "../../lib/api"; 
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useTokenBalance } from "../hooks/useTokenBalance";
import { useTokenPrice } from "../hooks/usePrices";
import { parseUnits } from "viem";
import { CORE_ABI } from "@/lib/contracts";

interface ExecuteTradeBoxProps {
  market: string;   // e.g., "ETH-USD"
  leaderId: number; // Required to identify which strategy is executing
}

export default function ExecuteTradeBox({ market, leaderId }: ExecuteTradeBoxProps) {
  // Extract asset name (e.g., "ETH" from "ETH-USD")
  const asset = market.split('-')[0];

  // State
  const [side, setSide] = useState<"Long" | "Short">("Long");
  const [collateral, setCollateral] = useState("");
  const [leverage, setLeverage] = useState(1.1);
  const [status, setStatus] = useState<string | null>(null);
  
  // UI State
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const price = useTokenPrice(asset);
  const currentPrice = price.price;
  const usdcToken = process.env.NEXT_PUBLIC_USDC as `0x${string}` | undefined;
  const walletBalance = useTokenBalance(usdcToken); // Replace with real wallet balance hook

  const CORE_CONTRACT = process.env.NEXT_PUBLIC_CORE_CONTRACT as `0x${string}`;
  const TOKEN_MAP: Record<string, string> = {
    "ETH": process.env.NEXT_PUBLIC_WETH || "",
    "BTC": process.env.NEXT_PUBLIC_WBTC || "",
    "USDC": process.env.NEXT_PUBLIC_USDC || "",
  };

  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ 
    hash 
  });

  // --- CALCULATIONS ---
  const collateralVal = parseFloat(collateral) || 0;
  // GMX/Standard Perp Logic: Position Size = Collateral * Leverage
  const positionSize = collateralVal * leverage; 
  
  const openFee = positionSize * 0.001; // 0.1% est.
  const executionFee = 1.20; 
  const totalFees = openFee + executionFee;
  
  const liqThreshold = 0.9; 
  const liquidationPrice = side === "Long"
    ? currentPrice * (1 - (1/leverage) * liqThreshold)
    : currentPrice * (1 + (1/leverage) * liqThreshold);

  useEffect(() => {
    if (isSuccess) {
      setStatus("✅ Position Confirmed on Blockchain!");
      setCollateral("");
    }
  }, [isSuccess]);

const handleOpenPosition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collateral) return;
    setStatus("Please confirm in wallet...");

    // 1. Get Token Address
    const indexToken = TOKEN_MAP[asset];
    if (!indexToken) {
      setStatus(`Error: No address found for ${asset}`);
      return;
    }

    const isLong = side === "Long";

    const decimals = asset === "USDC" ? 6 : 18;

    const entryPrice = parseUnits(
      currentPrice.toString(),
      decimals
    );

    const sizeUsd = parseUnits(
      (collateralVal * leverage).toString(),
      decimals
    );

    // const sizeAmount = parseUnits(collateral, decimals);

    writeContract({
      address: CORE_CONTRACT,
      abi: CORE_ABI as any,
      functionName: "leaderOpenPosition",
      args: [
        BigInt(leaderId),
        isLong,
        entryPrice,
        sizeUsd,
        indexToken as `0x${string}`,
    ],
    });
  };

  const handleClosePosition = async () => {
    if (!confirm("Are you sure you want to close the current position?")) return;

    setStatus("Please confirm close transaction in wallet...");
    setIsProcessing(true); 

    try {
      writeContract({
        address: CORE_CONTRACT,
        abi: CORE_ABI as any,
        functionName: "leaderClose",
        args: [
          BigInt(leaderId) 
        ],
      });
      
    } catch (error: any) {
      console.error("Close Position Error:", error);
      setStatus(`Failed to close: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{
      backgroundColor: "#111418",
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
          <span style={{ fontSize: "15px", fontWeight: "600" }}>Trade {market}</span>
          <span style={{ fontSize: "12px", color: "#8b949e", backgroundColor: "#1c2128", padding: "2px 6px", borderRadius: "4px" }}>
             ID: {leaderId}
          </span>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <Settings size={18} color="#8b949e" style={{ cursor: "pointer" }} />
        </div>
      </div>

      <form onSubmit={handleOpenPosition}>
        
        {/* --- MARKET DISPLAY --- */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontSize: "12px", color: "#8b949e", marginBottom: "6px", display: "block" }}>Market</label>
          <div style={{ 
            backgroundColor: "#1c2128", border: "1px solid #30363d", borderRadius: "8px", padding: "12px",
            display: "flex", justifyContent: "space-between", alignItems: "center"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "600" }}>
              <img src={`https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/32/color/${asset.toLowerCase()}.png`} 
                   alt={asset} width={24} height={24} 
                   onError={(e) => (e.currentTarget.style.display = 'none')}
              />
              <span>{market}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
               <span style={{ fontSize: "14px", color: "#238636" }}>${currentPrice.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* --- SIDE SELECTOR --- */}
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

        {/* --- COLLATERAL INPUT --- */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "12px", color: "#8b949e" }}>
            <span>Pay</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <Wallet size={12} /> {walletBalance.balance}
            </span>
          </div>
          <div style={{ position: "relative" }}>
            <input 
              type="number" placeholder="0.00" value={collateral}
              onChange={(e) => setCollateral(e.target.value)}
              style={{
                width: "100%", backgroundColor: "#0d1117", border: "1px solid #30363d", borderRadius: "8px",
                padding: "12px 60px 12px 12px", color: "white", fontSize: "16px", outline: "none"
              }}
            />
            <div style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", gap: "8px" }}>
              <button type="button" onClick={() => setCollateral(walletBalance.balance)} style={{ fontSize: "11px", color: "#58a6ff", background: "none", border: "none", cursor: "pointer" }}>MAX</button>
              <span style={{ fontSize: "14px", color: "#8b949e", fontWeight: "600" }}>USDC</span>
            </div>
          </div>
        </div>

        {/* --- LEVERAGE SLIDER --- */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", fontSize: "12px" }}>
            <span style={{ color: "#8b949e" }}>Leverage</span>
            <span style={{ fontWeight: "600" }}>{leverage.toFixed(1)}x</span>
          </div>
          <input 
            type="range" min="1.1" max="50" step="0.1" value={leverage} 
            onChange={(e) => setLeverage(parseFloat(e.target.value))}
            style={{ width: "100%", cursor: "pointer", accentColor: "#238636" }} 
          />
        </div>

        {/* --- INFO SUMMARY --- */}
        <div style={{ backgroundColor: "#161b22", border: "1px solid #30363d", borderRadius: "8px", padding: "12px", marginBottom: "20px", fontSize: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ color: "#8b949e" }}>Liq. Price</span>
            <span style={{ color: "#da3633", fontWeight: "600" }}>{collateralVal > 0 ? `$${liquidationPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "-"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ color: "#8b949e" }}>Est. Fees</span>
            <span style={{ color: "#e6edf3" }}>{collateralVal > 0 ? `$${totalFees.toFixed(2)}` : "-"}</span>
          </div>
          <div style={{ borderTop: "1px solid #30363d", margin: "8px 0" }}></div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#8b949e" }}>Total Size (USD)</span>
            <span style={{ color: "#e6edf3", fontWeight: "600" }}>{collateralVal > 0 ? `$${positionSize.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "-"}</span>
          </div>
        </div>

        {/* --- STATUS MESSAGE --- */}
        {statusMessage && (
          <div style={{ 
            marginBottom: "16px", padding: "10px", borderRadius: "6px", fontSize: "13px",
            backgroundColor: statusMessage.type === 'success' ? "rgba(35, 134, 54, 0.2)" : "rgba(218, 54, 51, 0.2)",
            color: statusMessage.type === 'success' ? "#3fb950" : "#f85149", border: `1px solid ${statusMessage.type === 'success' ? "#238636" : "#da3633"}`
          }}>
            {statusMessage.text}
          </div>
        )}

        {/* --- OPEN ACTION BUTTON --- */}
        <button 
          disabled={isProcessing || collateralVal <= 0}
          style={{
            width: "100%", padding: "14px", borderRadius: "8px", border: "none", fontSize: "16px", fontWeight: "600",
            backgroundColor: side === "Long" ? "#238636" : "#da3633",
            color: "white", cursor: collateralVal > 0 ? "pointer" : "not-allowed", opacity: collateralVal > 0 ? 1 : 0.6,
            display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginBottom: "12px"
          }}
        >
          {isProcessing ? <><RefreshCw className="animate-spin" size={18} /> Processing...</> : `Open ${side} ${asset}`}
        </button>

        {/* --- CLOSE POSITION BUTTON --- */}
        <button 
          type="button"
          onClick={handleClosePosition}
          disabled={isProcessing}
          style={{
            width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #30363d", fontSize: "14px", fontWeight: "600",
            backgroundColor: "transparent", color: "#8b949e", cursor: "pointer", transition: "all 0.2s",
            display: "flex", justifyContent: "center", alignItems: "center", gap: "8px"
          }}
          onMouseOver={(e) => { e.currentTarget.style.borderColor = "#da3633"; e.currentTarget.style.color = "#da3633"; }}
          onMouseOut={(e) => { e.currentTarget.style.borderColor = "#30363d"; e.currentTarget.style.color = "#8b949e"; }}
        >
          <XCircle size={16} /> Close Open Position
        </button>

      </form>
    </div>
  );
}