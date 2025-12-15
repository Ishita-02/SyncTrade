export default function PositionTable({
  positions,
}: {
  positions: any[];
}) {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Market</th>
          <th>Side</th>
          <th>Size</th>
          <th>Entry</th>
          <th>PnL</th>
        </tr>
      </thead>
      <tbody>
        {positions.map((p) => (
          <tr key={p.id}>
            <td>{p.indexToken}</td>
            <td className={p.isLong ? "badge-long" : "badge-short"}>
              {p.isLong ? "Long" : "Short"}
            </td>
            <td>${Number(p.sizeUsd) }</td>
            <td>${Number(p.entryPrice) }</td>
            <td>-</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
