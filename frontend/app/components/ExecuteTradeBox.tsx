"use client";

import { useState } from "react";
import { useWriteContract } from "wagmi";
import { CORE_ABI, CORE_CONTRACT } from "../../lib/contracts";

export default function ExecuteTradeBox({ leaderId }: { leaderId: number }) {
  const [size, setSize] = useState("");
  const { writeContract } = useWriteContract();

  return (
    <div className="border rounded-xl p-4 space-y-3">
      <h3 className="font-semibold">Leader Actions</h3>

      <input
        type="number"
        placeholder="Size USD"
        className="w-full border rounded p-2"
        value={size}
        onChange={(e) => setSize(e.target.value)}
      />

      <button
        className="w-full bg-green-600 text-white py-2 rounded"
        onClick={() =>
          writeContract({
            address: CORE_CONTRACT,
            abi: CORE_ABI,
            functionName: "leaderOpenLong",
            args: [
              leaderId,
              BigInt(Number(size) * 1e18),
              "0x0000000000000000000000000000000000000000",
            ],
          })
        }
      >
        Open Long
      </button>

      <button
        className="w-full bg-red-600 text-white py-2 rounded"
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
