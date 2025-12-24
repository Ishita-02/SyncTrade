import { MARKET_MAP } from "../../lib/api";

export default function PositionTable({
  positions,
  prices, 
}: {
  positions: any[];
  prices: Record<string, number>;
}) {
  const format = (n: number) =>
    n.toLocaleString(undefined, { maximumFractionDigits: 2 });

  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ borderBottom: "1px solid #30363d", color: "#8b949e" }}>
          <th style={{ padding: "12px" }}>Market</th>
          <th style={{ padding: "12px" }}>Side</th>
          <th style={{ padding: "12px" }}>Size (USD)</th>
          <th style={{ padding: "12px" }}>Entry</th>
          <th style={{ padding: "12px" }}>PnL</th>
        </tr>
      </thead>
      <tbody>
        {positions.map((p) => {
          const tokenKey = p.indexToken.toLowerCase();
          const marketInfo = MARKET_MAP[tokenKey];

          const marketLabel =
            marketInfo?.market ??
            `${p.indexToken.slice(0, 6)}…${p.indexToken.slice(-4)}`;

          const entryPrice = Number(p.entryPrice) / 1e18;
          const sizeUsd = Number(p.sizeUsd) / 1e18;

          const currentPrice = prices[tokenKey];
          let pnl = 0;

          if (currentPrice && entryPrice > 0) {
            pnl = p.isLong
              ? ((currentPrice - entryPrice) * sizeUsd) / entryPrice
              : ((entryPrice - currentPrice) * sizeUsd) / entryPrice;
          }

          return (
            <tr key={p.id} style={{ borderBottom: "1px solid #30363d" }}>
              {/* Market */}
              <td style={{ padding: "12px", fontWeight: 600 }}>
                {marketLabel}
              </td>

              {/* Side */}
              <td style={{ padding: "12px" }}>
                <span
                  style={{
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: 700,
                    backgroundColor: p.isLong
                      ? "rgba(35,134,54,0.2)"
                      : "rgba(218,54,51,0.2)",
                    color: p.isLong ? "#3fb950" : "#f85149",
                  }}
                >
                  {p.isLong ? "LONG" : "SHORT"}
                </span>
              </td>

              {/* Size */}
              <td style={{ padding: "12px" }}>
                ${format(sizeUsd)}
              </td>

              {/* Entry */}
              <td style={{ padding: "12px", color: "#8b949e" }}>
                ${format(entryPrice)}
              </td>

              {/* PnL */}
              <td
                style={{
                  padding: "12px",
                  fontWeight: 600,
                  color:
                    pnl > 0
                      ? "#3fb950"
                      : pnl < 0
                      ? "#f85149"
                      : "#8b949e",
                }}
              >
                {currentPrice ? `$${format(pnl)}` : "-"}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
