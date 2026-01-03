"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { decodeEventLog } from "viem"; // Import this to parse logs
import { ArrowLeft } from "lucide-react";
import coreABI from "../../abi/Core.json"; 

const CONTRACT_ADDRESS = "0x73b0f0bfd958b6f6119de09a48543b2fb7264369";

export default function CreateStrategyPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();

  const [meta, setMeta] = useState("");
  const [feeBps, setFeeBps] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { writeContract, data: hash, isPending: isWalletPending, error: contractError } = useWriteContract();

  // Get the full receipt, which contains the Logs/Events
  const { data: receipt, isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isConfirmed && receipt && !isSyncing) {
      syncWithBackend(receipt);
    }
  }, [isConfirmed, receipt]);

  const syncWithBackend = async (txReceipt: any) => {
    setIsSyncing(true);
    try {
      // 1. Find the "LeaderRegistered" event log
      let leaderId = null;

      for (const log of txReceipt.logs) {
        try {
          const event = decodeEventLog({
            abi: coreABI,
            data: log.data,
            topics: log.topics,
          });

          console.log("event", event)
          
          if (event.eventName === "LeaderRegistered") {
            // @ts-ignore
            leaderId = Number(event.args.leaderId);
            break;
          }
        } catch (e) {
          continue; 
        }
      }

      if (leaderId === null) {
        throw new Error("Could not find Leader ID in transaction logs");
      }

      console.log("Found Leader ID from Blockchain:", leaderId);

      // 2. Send the REAL ID to the backend
      await api("/strategies", {
        method: "POST",
        body: JSON.stringify({
          leaderId: leaderId, // Pass the ID here!
          address: address as `0x${string}`,
          meta,
          feeBps,
        }),
      });

      router.push("/");
    } catch (e: any) {
      console.error(e);
      setError(`Sync Failed: ${e.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const submit = async () => {
    if (!isConnected || !address) return setError("Please connect your wallet");
    if (!meta.trim()) return setError("Strategy description is required");

    setError(null);

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: coreABI as any,
      functionName: "registerLeader",
      args: [meta, BigInt(feeBps)], 
    });
  };

  // ... rest of your UI (return statement) remains exactly the same
  // (Just copy the return logic from your previous file)
  const isLoading = isWalletPending || isConfirming || isSyncing;
  const getButtonText = () => {
      if (isWalletPending) return "Check Wallet...";
      if (isConfirming) return "Confirming Transaction...";
      if (isSyncing) return "Syncing Database...";
      return "Create Strategy";
  };

  return (
    <div
      style={{
        backgroundColor: "#0f1419",
        minHeight: "100vh",
        color: "#e6edf3",
      }}
    >
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "48px 24px" }}>
        {/* Back */}
        <button
          onClick={() => router.back()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "#8b949e",
            background: "none",
            border: "none",
            cursor: "pointer",
            marginBottom: "24px",
          }}
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {/* Card */}
        <div
          style={{
            backgroundColor: "#161b22",
            border: "1px solid #30363d",
            borderRadius: "12px",
            padding: "32px",
          }}
        >
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "700",
              marginBottom: "8px",
            }}
          >
            Create Strategy
          </h1>

          <p
            style={{
              color: "#8b949e",
              fontSize: "14px",
              marginBottom: "32px",
            }}
          >
            Create a copy-trading strategy that others can follow.
          </p>

          {/* Leader Address */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                color: "#8b949e",
                marginBottom: "6px",
              }}
            >
              Leader Address
            </label>
            <input
              value={address ?? ""}
              disabled
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                backgroundColor: "#21262d",
                border: "1px solid #30363d",
                color: "#8b949e",
                fontFamily: "monospace",
              }}
            />
          </div>

          {/* Meta */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                color: "#8b949e",
                marginBottom: "6px",
              }}
            >
              Strategy Description
            </label>
            <input
              placeholder="ETH trend following, low frequency"
              value={meta}
              onChange={(e) => setMeta(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                backgroundColor: "#0d1117",
                border: "1px solid #30363d",
                color: "#e6edf3",
              }}
            />
          </div>

          {/* Fee */}
          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                color: "#8b949e",
                marginBottom: "6px",
              }}
            >
              Performance Fee (bps)
            </label>
            <input
              type="number"
              min={0}
              max={2000}
              value={feeBps}
              onChange={(e) => setFeeBps(Number(e.target.value))}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                backgroundColor: "#0d1117",
                border: "1px solid #30363d",
                color: "#e6edf3",
              }}
            />
            <div style={{ color: "#8b949e", fontSize: "12px", marginTop: "4px" }}>
              Example: 200 = 2% performance fee
            </div>
          </div>

          {/* Error */}
          {(error || contractError) && (
            <div
              style={{
                marginBottom: "16px",
                color: "#f85149",
                fontSize: "14px",
              }}
            >
              {error || (contractError?.message.includes("User rejected") ? "User rejected transaction" : "Transaction Failed")}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={submit}
            disabled={isLoading}
            style={{
              width: "100%",
              backgroundColor: "#238636",
              color: "#ffffff",
              padding: "14px",
              borderRadius: "8px",
              border: "none",
              fontWeight: "600",
              cursor: "pointer",
              fontSize: "15px",
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            {getButtonText()}
          </button>
        </div>
      </div>
    </div>
  );
}