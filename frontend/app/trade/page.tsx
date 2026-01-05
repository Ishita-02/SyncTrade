"use client";

import { useState } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { useMode } from "../context/ModeContext"; 
import dynamic from "next/dynamic";

import { ShieldCheck, LineChart } from "lucide-react"; 
const CandlestickChart = dynamic(
  () => import("../components/CandleStickChart"),
  { ssr: false }
);

const ExecuteTradeBox = dynamic(
  () => import("../components/ExecuteTradeBox"),
  { ssr: false }
);

export default function TradePage() {
  const [activeMarket, setActiveMarket] = useState("ETH-USD");
  const markets = ["ETH-USD", "BTC-USD", "UNI-USD", "ARB-USD", "LINK-USD"];

  const { isConnected } = useAccount();
  
  const { viewMode, activeStrategyId } = useMode();

  return (
    <div style={{ backgroundColor: "#0f1419", minHeight: "100vh", color: "#e6edf3" }}>

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "32px 24px" }}>
        
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

        <div style={{ display: "flex", gap: "24px", flexDirection: "row", alignItems: "stretch", minHeight: "600px" }}>
          
          <div style={{ 
            flex: "1", 
            backgroundColor: "#161b22", 
            border: "1px solid #30363d", 
            borderRadius: "12px", 
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            minHeight: "500px"
          }}>
            <div style={{ flex: 1, position: "relative" }}>
               <CandlestickChart symbol={activeMarket} />
            </div>
          </div>

          <div style={{ 
            width: "380px", 
            backgroundColor: "#161b22", 
            border: "1px solid #30363d", 
            borderRadius: "12px", 
            padding: "24px",
            display: "flex",
            flexDirection: "column"
          }}>
             
             {!isConnected ? (
               <div style={{ textAlign: "center", marginTop: "40px", color: "#f85149" }}>
                 <p style={{ fontWeight: "600", marginBottom: "8px" }}>Wallet Not Connected</p>
                 <p style={{ fontSize: "14px", color: "#8b949e" }}>Please connect your wallet to access trading features.</p>
               </div>
             ) : (
               <>
                  {viewMode === "follower" ? (
                    <div>
                      <h3 style={{ color: "#e6edf3", fontSize: "18px", fontWeight: "600", marginBottom: "24px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <ShieldCheck size={20} color="#58a6ff"/> Follower View
                      </h3>
                      
                      {!activeStrategyId ? (
                        <div style={{ textAlign: "center", color: "#8b949e", marginTop: "20px" }}>
                          Please select a Leader to view from the Navbar.
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                          <div style={{ padding: "16px", backgroundColor: "#21262d", borderRadius: "8px", border: "1px solid #30363d" }}>
                            <div style={{ fontSize: "13px", color: "#8b949e", marginBottom: "4px" }}>Following Leader</div>
                            <div style={{ fontSize: "20px", fontWeight: "700", color: "#58a6ff" }}>#{activeStrategyId}</div>
                          </div>
                          
                          <div style={{ padding: "16px", backgroundColor: "rgba(31, 111, 235, 0.1)", borderRadius: "8px", border: "1px solid rgba(31, 111, 235, 0.4)" }}>
                             <p style={{ fontSize: "14px", color: "#e6edf3", lineHeight: "1.5", margin: 0 }}>
                               You are currently in <strong>Follower Mode</strong>. 
                               Trades executed by Leader #{activeStrategyId} in <strong>{activeMarket}</strong> will be automatically copied to your portfolio based on your subscription settings.
                             </p>
                          </div>

                          <Link 
                            href={`/leader/${activeStrategyId}`}
                            style={{ 
                              display: "block", 
                              textAlign: "center", 
                              marginTop: "16px",
                              color: "#58a6ff", 
                              textDecoration: "none", 
                              fontSize: "14px", 
                              fontWeight: "600" 
                            }}
                          >
                            View Leader Performance &rarr;
                          </Link>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                       <h3 style={{ color: "#e6edf3", fontSize: "18px", fontWeight: "600", marginBottom: "24px", display: "flex", alignItems: "center", gap: "8px" }}>
                         <LineChart size={20} color="#238636" /> Open Position
                       </h3>

                       {activeStrategyId === null ? (
                         <div style={{ textAlign: "center", marginTop: "20px" }}>
                           <p style={{ color: "#8b949e", marginBottom: "12px" }}>No Strategy Selected.</p>
                           <p style={{ fontSize: "13px", color: "#8b949e", marginBottom: "24px" }}>
                             Select one from the navbar or create a new one to start trading.
                           </p>
                           <Link href="/create-strategy" style={{ color: "#58a6ff", textDecoration: "none", fontWeight: "600" }}>
                             Create a Strategy &rarr;
                           </Link>
                         </div>
                       ) : (
                         <ExecuteTradeBox market={activeMarket} leaderId={activeStrategyId} />
                       )}
                    </div>
                  )}
               </>
             )}

          </div>

        </div>
      </div>
    </div>
  );
}