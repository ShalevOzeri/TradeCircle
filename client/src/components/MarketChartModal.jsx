import { useEffect, useState } from "react";
import { getMarketHistory } from "../services/api";
import MarketChart from "./MarketChart";

const PERIODS = ["1W", "1M", "3M", "6M", "1Y"];

function fmtPrice(v) {
  if (v == null) return "—";
  if (v < 1) return v.toFixed(4);
  if (v < 100) return v.toFixed(2);
  return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function MarketChartModal({ item, onClose }) {
  const [period, setPeriod] = useState("1M");
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  useEffect(() => {
    if (!item) return;
    setLoading(true);
    setError("");
    setData(null);
    getMarketHistory(item.symbol, item.type, period)
      .done(res => setData(res.data))
      .fail(xhr => setError(xhr.responseJSON?.message || "Failed to load history"))
      .always(() => setLoading(false));
  }, [item, period]);

  // Close on Escape
  useEffect(() => {
    const handler = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!item) return null;

  const change = item.change ?? 0;
  const isUp   = change >= 0;
  const source = item.type === "crypto" ? "CoinGecko" : "Yahoo Finance";

  return (
    <div className="chart-modal-overlay" onClick={e => { e.stopPropagation(); onClose(); }}>
      <div className="chart-modal" onClick={e => e.stopPropagation()}>

        <div className="chart-modal-header">
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
              <span className="chart-modal-symbol">{item.symbol}</span>
              <span className="chart-modal-name">{item.name}</span>
              {item.sector && <span className="chart-modal-sector">{item.sector}</span>}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 4 }}>
              <span className="chart-modal-price">{fmtPrice(item.price)}</span>
              <span className={`chart-modal-change ${isUp ? "positive" : "negative"}`}>
                {isUp ? "+" : ""}{change.toFixed(2)}%
              </span>
            </div>
          </div>
          <button className="btn-ghost chart-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="chart-modal-periods">
          {PERIODS.map(p => (
            <button key={p} className={`period-btn${period === p ? " active" : ""}`} onClick={() => setPeriod(p)}>{p}</button>
          ))}
        </div>

        <div className="chart-modal-body" style={{ position: "relative", minHeight: 260 }}>
          {loading && <div className="chart-modal-loading">Loading chart…</div>}
          {!loading && error && <div className="chart-modal-error">{error}</div>}
          {!loading && !error && <MarketChart data={data} />}
        </div>

        <div className="chart-modal-footer">
          <span>Source: {source}</span>
          <span style={{ color: "var(--muted)", fontSize: "0.78rem" }}>Prices in {item.type === "fx" ? "ILS" : "USD"}</span>
        </div>

      </div>
    </div>
  );
}
