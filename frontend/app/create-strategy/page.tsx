"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";
import { useAccount } from "wagmi";
import { ArrowLeft } from "lucide-react";

export default function CreateStrategyPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();

  const [meta, setMeta] = useState("");
  const [feeBps, setFeeBps] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!isConnected || !address) {
      setError("Please connect your wallet");
      return;
    }

    if (!meta.trim()) {
      setError("Strategy description is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api("/strategies", {
        method: "POST",
        body: JSON.stringify({
          address: `0x${address}`,
          meta,
          feeBps,
        }),
      });

      router.push("/");
    } catch (e) {
      console.error(e);
      setError("Failed to create strategy");
    } finally {
      setLoading(false);
    }
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
          {error && (
            <div
              style={{
                marginBottom: "16px",
                color: "#f85149",
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={submit}
            disabled={loading}
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
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Creating..." : "Create Strategy"}
          </button>
        </div>
      </div>
    </div>
  );
}
