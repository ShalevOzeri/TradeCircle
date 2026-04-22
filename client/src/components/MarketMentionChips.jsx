import { useState } from "react";
import MarketChartModal from "./MarketChartModal";

function formatPrice(value) {
  if (value == null) return "—";
  if (value < 1) return value.toFixed(4);
  if (value < 100) return value.toFixed(2);
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function MarketMentionChips({ mentions }) {
  const [chartItem, setChartItem] = useState(null);

  if (!mentions || mentions.length === 0) return null;

  return (
    <>
      <div className="post-market-mentions">
        {mentions.map(m => (
          <span
            key={m.symbol}
            className="post-market-chip"
            onClick={e => { e.stopPropagation(); setChartItem(m); }}
            title={`${m.name} · לחץ לגרף היסטורי`}
          >
            <span className="pmc-symbol">${m.symbol}</span>
            <span className="pmc-price">{formatPrice(m.price)}</span>
            <span className={`pmc-change ${(m.change ?? 0) >= 0 ? "positive" : "negative"}`}>
              {(m.change ?? 0) >= 0 ? "+" : ""}{typeof m.change === "number" ? m.change.toFixed(2) : m.change}%
            </span>
            <span className="pmc-chart-icon">📈</span>
          </span>
        ))}
      </div>
      {chartItem && <MarketChartModal item={chartItem} onClose={() => setChartItem(null)} />}
    </>
  );
}
