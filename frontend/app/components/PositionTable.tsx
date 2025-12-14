export default function PositionTable({
  positions,
}: {
  positions: any[];
}) {
  return (
    <table className="w-full border rounded-xl overflow-hidden">
      <thead className="bg-muted">
        <tr>
          <th className="p-2 text-left">Market</th>
          <th className="p-2">Side</th>
          <th className="p-2">Size</th>
          <th className="p-2">Entry</th>
          <th className="p-2">PnL</th>
        </tr>
      </thead>
      <tbody>
        {positions.map((p, i) => (
          <tr key={i} className="border-t">
            <td className="p-2">{p.indexToken}</td>
            <td className="p-2">{p.isLong ? "Long" : "Short"}</td>
            <td className="p-2">${Number(p.sizeUsd) / 1e18}</td>
            <td className="p-2">${Number(p.entryPrice) / 1e18}</td>
            <td
              className={`p-2 ${
                Number(p.pnlUsd) >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {p.pnlUsd ? Number(p.pnlUsd) / 1e18 : "-"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
