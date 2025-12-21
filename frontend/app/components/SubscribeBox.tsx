"use client";

import { useState } from "react";
import { X, Info, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import toast from "react-hot-toast";
import { CORE_ABI, CORE_CONTRACT, ERC20_ABI } from "@/lib/contracts";
import { useQuery } from "@tanstack/react-query"; // IMPORT THIS

export default function SubscribeBox({ leaderId }: { leaderId: number }) {
  const { address } = useAccount();
  const [amount, setAmount] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculate fees based on amount
  const depositAmount = Number(amount) || 0;
  const platformFee = 0.1; // 0.1% platform fee
  const platformFeeAmount = depositAmount * (platformFee / 100);
  const netDeposit = depositAmount - platformFeeAmount;

  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
    
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ 
    hash 
  });

    const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || Number(amount) <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    try {
      setIsProcessing(true);

      toast.loading("Submitting subscription...", { id: "subscribe" });
      await writeContract({
        address: "0x5fbdb2315678afecb367f032d93f642f64180aa3",
        abi: ERC20_ABI,
        functionName: "approve",
        args: [CORE_CONTRACT, amount],
      });

      const txHash = writeContract({
        address: CORE_CONTRACT,
        abi: CORE_ABI,
        functionName: "subscribe",
        args: [leaderId, BigInt(Number(amount))],
      });

      toast.success("Subscription submitted", { id: "subscribe" });

      console.log("Tx:", txHash);

      // OPTIONAL: trigger refetch after delay
      setTimeout(() => {
        // queryClient.invalidateQueries(["leader", leaderId]);
      }, 3000);

      setAmount("");
    } catch (err: any) {
      console.error(err);
      toast.error("Subscription failed", { id: "subscribe" });
    } finally {
      setIsProcessing(false);
    }
  };

//   const handleUnsubscribe = async () => {
//   try {
//     toast.loading("Unsubscribing...", { id: "unsub" });

//     writeContract({
//       address: CORE_CONTRACT,
//       abi: CORE_ABI,
//       functionName: "unsubscribe",
//       args: [leaderId],
//     });

//     toast.success("Unsubscribed", { id: "unsub" });

//     // refresh UI
//     // useQueryClient.invalidateQueries({ queryKey: ["subscription"] });
//     // queryClient.invalidateQueries({ queryKey: ["leader", leaderId] });
//   } catch (e) {
//     console.error(e);
//     toast.error("Unsubscribe failed", { id: "unsub" });
//   }
// };

  const closeModal = () => {
    setShowModal(false);
    setAmount("");
  };

  const { data: subscription } = useQuery({
    queryKey: ["subscription", leaderId, address],
    enabled: !!address,
    queryFn: () =>
      api<{
        subscribed: boolean;
        deposit: string;
      }>(`/leaders/${leaderId}/subscription/${address}`),
  });

  return (
    <>
      <form onSubmit={handleSubscribe}>
        {/* Deposit Amount */}
        <div style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <label
              style={{
                fontSize: "13px",
                fontWeight: "600",
                color: "#8b949e",
              }}
            >
              Deposit Amount
            </label>
            <span style={{ fontSize: "12px", color: "#8b949e" }}>
              Balance: $0.00
            </span>
          </div>
          <div style={{ position: "relative" }}>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 50px 12px 12px",
                borderRadius: "6px",
                border: "1px solid #30363d",
                backgroundColor: "#0f1419",
                color: "#e6edf3",
                fontSize: "16px",
                fontWeight: "600",
              }}
            />
            <span
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#8b949e",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              USDC
            </span>
          </div>
        </div>

        {/* Fee Breakdown */}
        {depositAmount > 0 && (
          <div
            style={{
              marginBottom: "16px",
              padding: "12px",
              backgroundColor: "#161b22",
              border: "1px solid #30363d",
              borderRadius: "8px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "12px",
                color: "#8b949e",
                marginBottom: "8px",
              }}
            >
              <span>Deposit Amount:</span>
              <span style={{ color: "#e6edf3", fontWeight: "600" }}>
                ${depositAmount.toFixed(2)}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "12px",
                color: "#8b949e",
                marginBottom: "8px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span>Platform Fee (0.1%):</span>
                <Info size={12} style={{ color: "#8b949e" }} />
              </div>
              <span style={{ color: "#e6edf3", fontWeight: "600" }}>
                ${platformFeeAmount.toFixed(2)}
              </span>
            </div>
            <div
              style={{
                paddingTop: "8px",
                borderTop: "1px solid #30363d",
                display: "flex",
                justifyContent: "space-between",
                fontSize: "13px",
                fontWeight: "600",
              }}
            >
              <span style={{ color: "#e6edf3" }}>Net Deposit:</span>
              <span style={{ color: "#26a641" }}>${netDeposit.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Strategy Info */}
        <div
          style={{
            marginBottom: "16px",
            padding: "12px",
            backgroundColor: "#0d1117",
            border: "1px solid #30363d",
            borderRadius: "8px",
          }}
        >
          <div style={{ fontSize: "12px", color: "#8b949e", marginBottom: "8px" }}>
            <strong style={{ color: "#e6edf3" }}>Strategy Details:</strong>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "11px",
              color: "#8b949e",
              marginBottom: "4px",
            }}
          >
            <span>Leader Fee:</span>
            <span style={{ color: "#e6edf3" }}>2% on profits</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "11px",
              color: "#8b949e",
              marginBottom: "4px",
            }}
          >
            <span>Minimum Deposit:</span>
            <span style={{ color: "#e6edf3" }}>$100</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "11px",
              color: "#8b949e",
            }}
          >
            <span>Auto-Copy:</span>
            <span style={{ color: "#26a641" }}>Enabled</span>
          </div>
        </div>

        {/* Warning */}
        <div
          style={{
            marginBottom: "16px",
            padding: "10px 12px",
            backgroundColor: "rgba(249, 168, 37, 0.1)",
            border: "1px solid rgba(249, 168, 37, 0.3)",
            borderRadius: "6px",
            display: "flex",
            gap: "8px",
          }}
        >
          <AlertCircle size={16} style={{ color: "#f9a825", flexShrink: 0, marginTop: "2px" }} />
          <div style={{ fontSize: "11px", color: "#f9a825", lineHeight: "1.5" }}>
            Your funds will automatically copy this leader's trades. You can unsubscribe at any time.
          </div>
        </div>

        {/* Subscribe Button */}
        <button
          type="submit"
          disabled={isProcessing || depositAmount < 100}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "8px",
            border: "none",
            backgroundColor:
              isProcessing || depositAmount < 100 ? "#30363d" : "#238636",
            color: "#ffffff",
            fontSize: "15px",
            fontWeight: "600",
            cursor: isProcessing || depositAmount < 100 ? "not-allowed" : "pointer",
            opacity: depositAmount < 100 && depositAmount > 0 ? 0.5 : 1,
          }}
        >
          {isProcessing ? "Processing..." : "Subscribe & Deposit"}
        </button>

        {depositAmount > 0 && depositAmount < 100 && (
          <div style={{ marginTop: "8px", fontSize: "11px", color: "#f85149", textAlign: "center" }}>
            Minimum deposit amount is $100
          </div>
        )}
      </form>

      {/* Success Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            style={{
              backgroundColor: "#161b22",
              border: "1px solid #30363d",
              borderRadius: "12px",
              padding: "32px",
              maxWidth: "500px",
              width: "90%",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "none",
                border: "none",
                color: "#8b949e",
                cursor: "pointer",
                padding: "4px",
              }}
            >
              <X size={20} />
            </button>

            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  backgroundColor: "#1a3a1a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 24px",
                }}
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#26a641"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>

              <h3
                style={{
                  fontSize: "22px",
                  fontWeight: "700",
                  color: "#e6edf3",
                  marginBottom: "12px",
                }}
              >
                Subscription Successful!
              </h3>

              <p style={{ color: "#8b949e", fontSize: "14px", marginBottom: "24px", lineHeight: "1.6" }}>
                You've successfully subscribed to Leader #{leaderId} with ${netDeposit.toFixed(2)}.
              </p>

              {/* Transaction Details */}
              <div
                style={{
                  backgroundColor: "#0d1117",
                  border: "1px solid #30363d",
                  borderRadius: "8px",
                  padding: "16px",
                  marginBottom: "24px",
                  textAlign: "left",
                }}
              >
                <div style={{ fontSize: "12px", fontWeight: "600", color: "#e6edf3", marginBottom: "12px" }}>
                  Transaction Details
                </div>
                <div style={{ fontSize: "12px", color: "#8b949e", marginBottom: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span>Deposited:</span>
                    <span style={{ color: "#e6edf3", fontWeight: "600" }}>${depositAmount.toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span>Platform Fee:</span>
                    <span style={{ color: "#e6edf3", fontWeight: "600" }}>-${platformFeeAmount.toFixed(2)}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      paddingTop: "8px",
                      borderTop: "1px solid #30363d",
                    }}
                  >
                    <span style={{ fontWeight: "600" }}>Net Amount:</span>
                    <span style={{ color: "#26a641", fontWeight: "600" }}>${netDeposit.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={closeModal}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#238636",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}