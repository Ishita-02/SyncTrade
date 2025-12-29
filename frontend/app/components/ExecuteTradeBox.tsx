"use client";

import { useState, useEffect } from "react";
import { Settings, RefreshCw, Wallet, XCircle, AlertTriangle, Lock } from "lucide-react";
import { api } from "../../lib/api"; 
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useTokenBalance } from "../hooks/useTokenBalance";
import { useTokenPrice } from "../hooks/usePrices";
import { parseUnits } from "viem";
import { CORE_ABI } from "@/lib/contracts";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// --- TYPES ---
type Position = {
  id: number;
  isOpen: boolean;
  indexToken: string;
  isLong: boolean;
  entryPrice: string;
  sizeUsd: string;
};

interface ExecuteTradeBoxProps {
  market: string;   // e.g., "ETH-USD"
  leaderId: number; 
}

export default function ExecuteTradeBox({ market, leaderId }: ExecuteTradeBoxProps) {
  const asset = market.split('-')[0]; // Extract "ETH" from "ETH-USD"
  
  // Hooks
  const queryClient = useQueryClient();
  const price = useTokenPrice(asset);
  const currentPrice = price.price;
  const usdcToken = process.env.NEXT_PUBLIC_USDC as `0x${string}` | undefined;
  const walletBalance = useTokenBalance(usdcToken);

  // UI State
  const [side, setSide] = useState<"Long" | "Short">("Long");
  const [collateral, setCollateral] = useState("");
  const [leverage, setLeverage] = useState(1.1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Contract Config
  const CORE_CONTRACT = process.env.NEXT_PUBLIC_CORE_CONTRACT as `0x${string}`;
  const TOKEN_MAP: Record<string, string> = {
    "ETH": process.env.NEXT_PUBLIC_WETH || "",
    "BTC": process.env.NEXT_PUBLIC_WBTC || "",
    "USDC": process.env.NEXT_PUBLIC_USDC || "",
  };

  // --- 1. FETCH POSITIONS ---
  // We check if this strategy (leaderId) already has an open position
  const { data: positions, isLoading: isLoadingPositions } = useQuery({
    queryKey: ["leader-positions", leaderId],
    queryFn: () => api<Position[]>(`/leaders/${leaderId}/positions`),
    enabled: leaderId !== null, 
  });

  // Find the single active position (if any)
  const activePosition = positions?.find((p) => p.isOpen);

  // --- CONTRACT WRITES ---
  const { writeContract, data: hash, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // --- EFFECTS ---
  useEffect(() => {
    if (isSuccess) {
      setStatusMessage({ type: 'success', text: "Transaction Confirmed on Blockchain!" });
      setCollateral("");
      setIsProcessing(false);
      // Refresh positions to update UI (hide/show warning)
      queryClient.invalidateQueries({ queryKey: ["leader-positions", leaderId] });
    }
    if (writeError) {
       setStatusMessage({ type: 'error', text: writeError.message.split('\n')[0] }); // Simple error msg
       setIsProcessing(false);
    }
  }, [isSuccess, writeError, queryClient, leaderId]);

  // --- HANDLERS ---
  const handleOpenPosition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collateral) return;
    setStatusMessage(null);
    setIsProcessing(true);

    const indexToken = TOKEN_MAP[asset];
    if (!indexToken) {
      setStatusMessage({ type: 'error', text: `Error: No address found for ${asset}` });
      setIsProcessing(false);
      return;
    }

    const decimals = asset === "USDC" ? 6 : 18;
    const entryPrice = parseUnits(currentPrice.toString(), decimals);
    const collateralVal = parseFloat(collateral);
    const sizeUsd = parseUnits((collateralVal * leverage).toString(), decimals);

    writeContract({
      address: CORE_CONTRACT,
      abi: CORE_ABI as any,
      functionName: "leaderOpenPosition",
      args: [BigInt(leaderId), side === "Long", entryPrice, sizeUsd, indexToken as `0x${string}`],
    });
  };

  const handleClosePosition = async () => {
    if (!confirm("Are you sure you want to close the current position?")) return;
    setStatusMessage(null);
    setIsProcessing(true); 

    try {
      writeContract({
        address: CORE_CONTRACT,
        abi: CORE_ABI as any,
        functionName: "settleFollowerPnL",
        args: [BigInt(leaderId)],
      });
      writeContract({
        address: CORE_CONTRACT,
        abi: CORE_ABI as any,
        functionName: "leaderClose",
        args: [BigInt(leaderId)],
      });
      console.log("leaderid", leaderId)
    } catch (error: any) {
      console.error("Close Position Error:", error);
      setStatusMessage({ type: 'error', text: error.message });
      setIsProcessing(false);
    }
  };

  // --- CALCS ---
  const collateralVal = parseFloat(collateral) || 0;
  const positionSize = collateralVal * leverage; 
  const openFee = positionSize * 0.001; 
  const executionFee = 1.20; 
  const totalFees = openFee + executionFee;
  const liqThreshold = 0.9; 
  const liquidationPrice = side === "Long"
    ? currentPrice * (1 - (1/leverage) * liqThreshold)
    : currentPrice * (1 + (1/leverage) * liqThreshold);


  // --- RENDER: LOADING ---
  if (isLoadingPositions) {
     return <div style={{ padding: "24px", textAlign: "center", color: "#8b949e", backgroundColor: "#161b22", borderRadius: "12px", border: "1px solid #30363d" }}>Loading strategy data...</div>;
  }

  // --- RENDER: ACTIVE POSITION WARNING (The "Beautiful Warning") ---
  if (activePosition) {
    return (
      <div style={{
        backgroundColor: "#161b22",
        border: "1px solid #30363d",
        borderRadius: "12px",
        padding: "24px",
        fontFamily: "sans-serif",
        color: "#e6edf3",
        display: "flex",
        flexDirection: "column",
        gap: "24px"
      }}>
        {/* Warning Banner */}
        <div style={{
          backgroundColor: "rgba(210, 153, 34, 0.15)",
          border: "1px solid rgba(210, 153, 34, 0.4)",
          borderRadius: "8px",
          padding: "16px",
          display: "flex",
          gap: "12px",
          alignItems: "flex-start"
        }}>
          <AlertTriangle color="#d29922" size={20} style={{ marginTop: "2px", flexShrink: 0 }} />
          <div>
            <h4 style={{ margin: "0 0 4px 0", color: "#d29922", fontSize: "14px", fontWeight: "600" }}>Strategy Locked</h4>
            <p style={{ margin: 0, fontSize: "13px", color: "#e6edf3", lineHeight: "1.5" }}>
              This strategy already has an open position. You must close the existing position before opening a new one in any market.
            </p>
          </div>
        </div>

        {/* Current Position Summary */}
        <div>
           <div style={{ fontSize: "12px", color: "#8b949e", marginBottom: "8px", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.5px" }}>Active Position</div>
           <div style={{ 
             backgroundColor: "#0d1117", 
             border: "1px solid #30363d", 
             borderRadius: "8px", 
             padding: "16px",
             display: "flex",
             justifyContent: "space-between",
             alignItems: "center"
           }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Lock size={16} color="#58a6ff" />
                <div>
                   <div style={{ fontWeight: "600", fontSize: "14px" }}>
                     {activePosition.isLong ? "Long" : "Short"} Position
                   </div>
                   <div style={{ fontSize: "12px", color: "#8b949e" }}>
                     ID: #{activePosition.id}
                   </div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                 <div style={{ fontSize: "14px", fontWeight: "600" }}>
                   ${(Number(activePosition.sizeUsd)/1e18).toFixed(2)}
                 </div>
                 <div style={{ fontSize: "12px", color: "#8b949e" }}>Size</div>
              </div>
           </div>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div style={{ 
            padding: "10px", borderRadius: "6px", fontSize: "13px",
            backgroundColor: statusMessage.type === 'success' ? "rgba(35, 134, 54, 0.2)" : "rgba(218, 54, 51, 0.2)",
            color: statusMessage.type === 'success' ? "#3fb950" : "#f85149", 
            border: `1px solid ${statusMessage.type === 'success' ? "#238636" : "#da3633"}`
          }}>
            {statusMessage.text}
          </div>
        )}

        {/* Close Button */}
        <button 
          onClick={handleClosePosition}
          disabled={isProcessing || isConfirming}
          style={{
            width: "100%", padding: "14px", borderRadius: "8px", border: "1px solid #da3633", fontSize: "14px", fontWeight: "600",
            backgroundColor: "rgba(218, 54, 51, 0.1)", color: "#f85149", cursor: "pointer", transition: "all 0.2s",
            display: "flex", justifyContent: "center", alignItems: "center", gap: "8px"
          }}
        >
          {isProcessing || isConfirming ? <RefreshCw className="animate-spin" size={16} /> : <XCircle size={16} />}
          {isProcessing ? "Processing..." : "Close Active Position"}
        </button>
      </div>
    );
  }

  // --- RENDER: OPEN POSITION FORM (Standard) ---
  return (
    <div style={{
      backgroundColor: "#161b22",
      border: "1px solid #30363d",
      borderRadius: "12px",
      padding: "16px",
      fontFamily: "sans-serif",
      color: "#e6edf3",
      maxWidth: "100%"
    }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "15px", fontWeight: "600" }}>Trade {market}</span>
          <span style={{ fontSize: "12px", color: "#8b949e", backgroundColor: "#21262d", padding: "2px 6px", borderRadius: "4px" }}>
             ID: {leaderId}
          </span>
        </div>
        <Settings size={18} color="#8b949e" style={{ cursor: "pointer" }} />
      </div>

      <form onSubmit={handleOpenPosition}>
        
        {/* MARKET INFO */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontSize: "12px", color: "#8b949e", marginBottom: "6px", display: "block" }}>Market</label>
          <div style={{ 
            backgroundColor: "#0d1117", border: "1px solid #30363d", borderRadius: "8px", padding: "12px",
            display: "flex", justifyContent: "space-between", alignItems: "center"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "600" }}>
              {/* Optional: Add icon logic here */}
              <span>{market}</span>
            </div>
            <span style={{ fontSize: "14px", color: "#3fb950" }}>${currentPrice.toLocaleString()}</span>
          </div>
        </div>

        {/* SIDE SELECTOR */}
        <div style={{ display: "flex", backgroundColor: "#0d1117", padding: "4px", borderRadius: "8px", marginBottom: "20px", border: "1px solid #30363d" }}>
          <button type="button" onClick={() => setSide("Long")} style={{
            flex: 1, padding: "8px", borderRadius: "6px", fontSize: "14px", fontWeight: "600",
            backgroundColor: side === "Long" ? "#238636" : "transparent",
            color: side === "Long" ? "white" : "#8b949e", border: "none", cursor: "pointer"
          }}>Long</button>
          <button type="button" onClick={() => setSide("Short")} style={{
            flex: 1, padding: "8px", borderRadius: "6px", fontSize: "14px", fontWeight: "600",
            backgroundColor: side === "Short" ? "#da3633" : "transparent",
            color: side === "Short" ? "white" : "#8b949e", border: "none", cursor: "pointer"
          }}>Short</button>
        </div>

        {/* COLLATERAL */}
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

        {/* LEVERAGE */}
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

        {/* SUMMARY */}
        <div style={{ backgroundColor: "#0d1117", border: "1px solid #30363d", borderRadius: "8px", padding: "12px", marginBottom: "20px", fontSize: "12px" }}>
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
            <span style={{ color: "#8b949e" }}>Total Size</span>
            <span style={{ color: "#e6edf3", fontWeight: "600" }}>{collateralVal > 0 ? `$${positionSize.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "-"}</span>
          </div>
        </div>

        {/* STATUS MSG */}
        {statusMessage && (
          <div style={{ 
            marginBottom: "16px", padding: "10px", borderRadius: "6px", fontSize: "13px",
            backgroundColor: statusMessage.type === 'success' ? "rgba(35, 134, 54, 0.2)" : "rgba(218, 54, 51, 0.2)",
            color: statusMessage.type === 'success' ? "#3fb950" : "#f85149", 
            border: `1px solid ${statusMessage.type === 'success' ? "#238636" : "#da3633"}`
          }}>
            {statusMessage.text}
          </div>
        )}

        {/* SUBMIT BUTTON */}
        <button 
          disabled={isProcessing || isConfirming || collateralVal <= 0}
          style={{
            width: "100%", padding: "14px", borderRadius: "8px", border: "none", fontSize: "16px", fontWeight: "600",
            backgroundColor: side === "Long" ? "#238636" : "#da3633",
            color: "white", 
            cursor: (collateralVal > 0 && !isProcessing) ? "pointer" : "not-allowed", 
            opacity: (collateralVal > 0 && !isProcessing) ? 1 : 0.6,
            display: "flex", justifyContent: "center", alignItems: "center", gap: "8px"
          }}
        >
          {(isProcessing || isConfirming) ? <RefreshCw className="animate-spin" size={18} /> : (side === "Long" ? "Buy / Long" : "Sell / Short")}
        </button>

      </form>
    </div>
  );
}