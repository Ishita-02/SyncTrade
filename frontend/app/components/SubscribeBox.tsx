"use client";

import { useWriteContract } from "wagmi";
import { CORE_ABI, CORE_CONTRACT } from "../../lib/contracts";
import { useState } from "react";

export default function SubscribeBox({ leaderId }: { leaderId: number }) {
  return (
    <div className="card">
      <div className="section-title">Subscribe</div>

      <input
        className="input"
        placeholder="Deposit amount (USD)"
      />

      <button
        className="btn btn-primary"
        style={{ marginTop: "12px", width: "100%" }}
      >
        Subscribe
      </button>
    </div>
  );
}

