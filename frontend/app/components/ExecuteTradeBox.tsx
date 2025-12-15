"use client";

import { useState } from "react";
import { useWriteContract } from "wagmi";
import { CORE_ABI, CORE_CONTRACT } from "../../lib/contracts";

const INDEX_TOKEN_ETH =
  "0x0000000000000000000000000000000000000000"; // mock ETH

export default function ExecuteTradeBox({ leaderId }: { leaderId: number }) {
  const [sizeUsd, setSizeUsd] = useState("");
  const { writeContract, isPending } = useWriteContract();

  const sizeUsdWei =
    sizeUsd && Number(sizeUsd) > 0
      ? BigInt(Math.floor(Number(sizeUsd))) 
      : BigInt(Number(0));

  return (
    <div className="card">
      <div className="section-title">Leader Actions</div>

      <input
        className="input"
        type="number"
        placeholder="Size (USD)"
        value={sizeUsd}
        onChange={(e) => setSizeUsd(e.target.value)}
      />

      <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
        <button
          className="btn btn-green"
          disabled={!sizeUsdWei || isPending}
          onClick={() =>
            writeContract({
              address: CORE_CONTRACT,
              abi: CORE_ABI,
              functionName: "leaderOpenLong",
              args: [leaderId, sizeUsdWei, INDEX_TOKEN_ETH],
            })
          }
          style={{ flex: 1 }}
        >
          Open Long
        </button>

        <button
          className="btn btn-danger"
          disabled={!sizeUsdWei || isPending}
          onClick={() =>
            writeContract({
              address: CORE_CONTRACT,
              abi: CORE_ABI,
              functionName: "leaderOpenShort",
              args: [leaderId, sizeUsdWei, INDEX_TOKEN_ETH],
            })
          }
          style={{ flex: 1 }}
        >
          Open Short
        </button>
      </div>

      <button
        className="btn btn-primary"
        disabled={isPending}
        style={{ marginTop: "12px", width: "100%" }}
        onClick={() =>
          writeContract({
            address: CORE_CONTRACT,
            abi: CORE_ABI,
            functionName: "leaderClose",
            args: [leaderId],
          })
        }
      >
        Close Position
      </button>
    </div>
  );
}
