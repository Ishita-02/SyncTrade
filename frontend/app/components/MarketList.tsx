"use client";

const MARKETS = [
  { symbol: "ETH-USD", token: "ETH" },
  { symbol: "BTC-USD", token: "BTC" },
  { symbol: "SOL-USD", token: "SOL" },
];

export default function MarketList({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (m: string) => void;
}) {
  return (
    <div className="border rounded-xl p-4 space-y-2">
      {MARKETS.map((m) => (
        <div
          key={m.symbol}
          onClick={() => onSelect(m.token)}
          className={`p-2 rounded cursor-pointer ${
            selected === m.token
              ? "bg-muted font-semibold"
              : "hover:bg-muted/50"
          }`}
        >
          {m.symbol}
        </div>
      ))}
    </div>
  );
}
