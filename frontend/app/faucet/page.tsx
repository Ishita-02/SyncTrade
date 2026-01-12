"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ChevronDown } from "lucide-react"; // Import for the dropdown arrow
import {  FAUCET_ABI, FAUCET_TOKENS } from "@/lib/contracts";
import Navbar from "../components/Navbar";

export default function FaucetPage() {
  const { address, isConnected } = useAccount();
  const [selectedToken, setSelectedToken] = useState(FAUCET_TOKENS[0]);

  const { data: hash, writeContract, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleClaim = async () => {
    if (!isConnected || !selectedToken.address) return;
    console.log("selected token", selectedToken)
    
    writeContract({
      address: process.env.NEXT_PUBLIC_FAUCET_CONTRACT as `0x${string}`,
      abi: FAUCET_ABI,
      functionName: "claim",
      args: [selectedToken.address],
      gas: BigInt(60000000), 
    });
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0d1117", color: "#e6edf3" }}>
      
      <main style={{ maxWidth: "600px", margin: "80px auto", padding: "0 24px" }}>
        <div style={{ 
          backgroundColor: "#161b22", 
          border: "1px solid #30363d", 
          borderRadius: "12px", 
          padding: "32px" 
        }}>
          
          <h1 style={{ fontSize: "24px", fontWeight: "600", marginBottom: "8px" }}>🚰 Testnet Faucet</h1>
          <p style={{ color: "#8b949e", marginBottom: "32px", fontSize: "14px" }}>
            Get mock tokens to test SyncTrade strategies.
          </p>

          {!isConnected ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "32px 0" }}>
              <p>Connect your wallet to claim tokens</p>
              <ConnectButton />
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#8b949e", marginBottom: "8px" }}>
                  RECIPIENT (YOU)
                </label>
                <input 
                  type="text" 
                  value={address} 
                  disabled 
                  style={{ 
                    width: "100%", 
                    backgroundColor: "#0d1117", 
                    border: "1px solid #30363d", 
                    borderRadius: "6px", 
                    padding: "12px", 
                    color: "#8b949e",
                    fontFamily: "monospace"
                  }} 
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#8b949e", marginBottom: "8px" }}>
                  SELECT TOKEN
                </label>
                <div style={{ position: "relative" }}>
                  <select
                    value={selectedToken.symbol}
                    onChange={(e) => {
                      const token = FAUCET_TOKENS.find(t => t.symbol === e.target.value);
                      if (token) setSelectedToken(token);
                    }}
                    style={{
                      width: "100%",
                      appearance: "none", 
                      backgroundColor: "#0d1117",
                      border: "1px solid #30363d",
                      borderRadius: "6px",
                      padding: "12px",
                      paddingRight: "40px",
                      color: "#e6edf3",
                      fontSize: "14px",
                      cursor: "pointer",
                      outline: "none"
                    }}
                  >
                    {FAUCET_TOKENS.map((token) => (
                      <option key={token.symbol} value={token.symbol}>
                        {token.symbol}
                      </option>
                    ))}
                  </select>
                  <div style={{ 
                    position: "absolute", 
                    right: "12px", 
                    top: "50%", 
                    transform: "translateY(-50%)", 
                    pointerEvents: "none", 
                    color: "#8b949e" 
                  }}>
                    <ChevronDown size={16} />
                  </div>
                </div>
              </div>

              <button
                onClick={handleClaim}
                disabled={isPending || isConfirming}
                style={{
                  width: "100%",
                  padding: "14px",
                  backgroundColor: "#238636",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: (isPending || isConfirming) ? "not-allowed" : "pointer",
                  opacity: (isPending || isConfirming) ? 0.7 : 1,
                  marginTop: "8px"
                }}
              >
                {isPending ? "Check Wallet..." : isConfirming ? "Claiming..." : `Claim ${selectedToken.symbol}`}
              </button>

              {isSuccess && (
                <div style={{ padding: "12px", backgroundColor: "rgba(35, 134, 54, 0.2)", border: "1px solid #238636", borderRadius: "6px", color: "#3fb950", fontSize: "14px", textAlign: "center" }}>
                  ✅ Successfully claimed {selectedToken.symbol}!
                </div>
              )}
              {error && (
                <div style={{ padding: "12px", backgroundColor: "rgba(218, 54, 51, 0.2)", border: "1px solid #f85149", borderRadius: "6px", color: "#f85149", fontSize: "14px", wordBreak: "break-all" }}>
                  Error: {error.message.split('\n')[0]}
                </div>
              )}

            </div>
          )}
        </div>
      </main>
    </div>
  );
}