"use client";

import { useWriteContract } from "wagmi";
import { CORE_ABI, CORE_CONTRACT } from "../../lib/contracts";
import { useState } from "react";

export default function SubscribeBox({ leaderId }: { leaderId: number }) {
  const [amount, setAmount] = useState("");
  const { writeContract, isPending } = useWriteContract();

  return (
    <div className="border rounded-xl p-4 space-y-3">
      <h3 className="font-semibold">Subscribe</h3>

      <input
        type="number"
        placeholder="Deposit amount (USD)"
        className="w-full border rounded p-2"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <button
        disabled={isPending}
        className="w-full bg-blue-600 text-white py-2 rounded"
        onClick={() =>
          writeContract({
            address: CORE_CONTRACT,
            abi: CORE_ABI,
            functionName: "subscribe",
            args: [leaderId, BigInt(Number(amount) * 1e18)],
          })
        }
      >
        {isPending ? "Subscribing..." : "Subscribe"}
      </button>
    </div>
  );
}
