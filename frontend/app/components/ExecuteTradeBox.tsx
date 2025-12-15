"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export default function ExecuteTradeBox({ leaderId }: { leaderId: number }) {
  const [market, setMarket] = useState("ETH");
  const [side, setSide] = useState<"Long" | "Short">("Long");
  const [size, setSize] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useState(() => {
    setMounted(true);
  });

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log("Execute clicked, size:", size); // Debug log
    
    if (!size || Number(size) <= 0) {
      alert("Please enter a valid position size");
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
    setSize("");
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
              backgroundColor: side === "Long" ? "#1a3a1a" : "#3a1a1a",
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
              stroke={side === "Long" ? "#26a641" : "#f85149"}
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
            Trade Executed!
          </h3>

          <p style={{ color: "#8b949e", fontSize: "14px", marginBottom: "24px" }}>
            Opened {side} position on {market}-USD with ${size}. All your
            followers will automatically copy this trade.
          </p>

          <button
            onClick={closeModal}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "#1f6feb",
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
      <form onSubmit={handleExecute}>
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
            Market
          </label>
          <select
            value={market}
            onChange={(e) => setMarket(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "6px",
              border: "1px solid #30363d",
              backgroundColor: "#0f1419",
              color: "#e6edf3",
              fontSize: "14px",
            }}
          >
            <option value="ETH">ETH-USD</option>
            <option value="BTC">BTC-USD</option>
            <option value="SOL">SOL-USD</option>
          </select>
        </div>

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
            Side
          </label>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={() => setSide("Long")}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #30363d",
                backgroundColor: side === "Long" ? "#1a3a1a" : "#0f1419",
                color: side === "Long" ? "#26a641" : "#8b949e",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Long
            </button>
            <button
              type="button"
              onClick={() => setSide("Short")}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #30363d",
                backgroundColor: side === "Short" ? "#3a1a1a" : "#0f1419",
                color: side === "Short" ? "#f85149" : "#8b949e",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Short
            </button>
          </div>
        </div>

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
            Size (USD)
          </label>
          <input
            type="number"
            step="0.01"
            placeholder="100.00"
            value={size}
            onChange={(e) => setSize(e.target.value)}
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
            backgroundColor: isProcessing ? "#30363d" : "#1f6feb",
            color: "#ffffff",
            fontSize: "14px",
            fontWeight: "600",
            cursor: isProcessing ? "not-allowed" : "pointer",
          }}
        >
          {isProcessing ? "Executing..." : "Execute Trade"}
        </button>
      </form>

      {/* Render modal using Portal */}
      {mounted && typeof window !== "undefined" && modalContent && createPortal(modalContent, document.body)}
    </>
  );
}