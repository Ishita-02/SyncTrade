"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export default function SubscribeBox({ leaderId }: { leaderId: number }) {
  const [amount, setAmount] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useState(() => {
    setMounted(true);
  });

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log("Subscribe clicked, amount:", amount); // Debug log
    
    if (!amount || Number(amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    setIsProcessing(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log("Showing modal"); // Debug log
      setShowModal(true);
      setIsProcessing(false);
    }, 1000);
  };

  const closeModal = () => {
    console.log("Closing modal"); // Debug log
    setShowModal(false);
    setAmount("");
  };

  const modalContent = showModal ? (
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
        zIndex: 999999,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          closeModal();
        }
      }}
    >
      <div
        style={{
          backgroundColor: "#161b22",
          border: "1px solid #30363d",
          borderRadius: "12px",
          padding: "32px",
          maxWidth: "480px",
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
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
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
              fontSize: "20px",
              fontWeight: "700",
              color: "#e6edf3",
              marginBottom: "12px",
            }}
          >
            Successfully Subscribed!
          </h3>

          <p style={{ color: "#8b949e", fontSize: "14px", marginBottom: "24px" }}>
            You've deposited ${amount} and are now following Leader #{leaderId}.
            Your positions will automatically sync with their trades.
          </p>

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
  ) : null;

  return (
    <>
      <form onSubmit={handleSubscribe}>
        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: "600",
              color: "#8b949e",
              marginBottom: "8px",
            }}
          >
            Deposit Amount (USD)
          </label>
          <input
            type="number"
            step="0.01"
            placeholder="100.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "6px",
              border: "1px solid #30363d",
              backgroundColor: "#0f1419",
              color: "#e6edf3",
              fontSize: "14px",
            }}
          />
        </div>

        <button
          type="submit"
          disabled={isProcessing}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: isProcessing ? "#30363d" : "#238636",
            color: "#ffffff",
            fontSize: "14px",
            fontWeight: "600",
            cursor: isProcessing ? "not-allowed" : "pointer",
          }}
        >
          {isProcessing ? "Processing..." : "Subscribe & Deposit"}
        </button>

        <p
          style={{
            marginTop: "12px",
            fontSize: "12px",
            color: "#8b949e",
            lineHeight: "1.5",
          }}
        >
          Your deposit will automatically copy this leader's trades. You can
          unsubscribe anytime.
        </p>
      </form>

      {/* Render modal using Portal */}
      {mounted && typeof window !== "undefined" && modalContent && createPortal(modalContent, document.body)}
    </>
  );
}