import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMarketQuotes } from "../services/api";
import MarketChartModal from "../components/MarketChartModal";
import { formatPrice } from "@tradecircle/utils";

const MARKET_ITEMS = [
  { symbol: "BTC", name: "Bitcoin", type: "crypto", sector: "Store of value", price: 68420, change: 2.1, volume: "34.2B" },
  { symbol: "ETH", name: "Ethereum", type: "crypto", sector: "Layer 1", price: 3475, change: 1.8, volume: "18.9B" },
  { symbol: "SOL", name: "Solana", type: "crypto", sector: "Layer 1", price: 178.3, change: 4.2, volume: "4.1B" },
  { symbol: "USD/ILS", name: "US Dollar", type: "fx", sector: "Major FX", price: 3.62, change: 0.14, volume: "FX" },
  { symbol: "EUR/ILS", name: "Euro", type: "fx", sector: "Major FX", price: 3.94, change: 0.09, volume: "FX" },
  { symbol: "GBP/ILS", name: "British Pound", type: "fx", sector: "Major FX", price: 4.68, change: 0.12, volume: "FX" },
  { symbol: "JPY/ILS", name: "Japanese Yen", type: "fx", sector: "Major FX", price: 0.024, change: -0.07, volume: "FX" },
  { symbol: "CNY/ILS", name: "Chinese Yuan", type: "fx", sector: "Major FX", price: 0.50, change: 0.03, volume: "FX" },
  { symbol: "THB/ILS", name: "Thai Baht", type: "fx", sector: "Emerging FX", price: 0.101, change: -0.05, volume: "FX" },
  { symbol: "AUD/ILS", name: "Australian Dollar", type: "fx", sector: "Commodity FX", price: 2.35, change: 0.11, volume: "FX" },
  { symbol: "CAD/ILS", name: "Canadian Dollar", type: "fx", sector: "Commodity FX", price: 2.69, change: 0.08, volume: "FX" },
  { symbol: "CHF/ILS", name: "Swiss Franc", type: "fx", sector: "Safe Haven FX", price: 4.12, change: 0.05, volume: "FX" },
  { symbol: "AED/ILS", name: "UAE Dirham", type: "fx", sector: "Regional FX", price: 0.99, change: 0.02, volume: "FX" },
  { symbol: "NVDA", name: "NVIDIA", type: "stock", sector: "Semiconductors", price: 1205.4, change: 1.4, volume: "42.7B" },
  { symbol: "AAPL", name: "Apple", type: "stock", sector: "Consumer Tech", price: 193.8, change: 0.9, volume: "10.3B" },
  { symbol: "TSLA", name: "Tesla", type: "stock", sector: "EV", price: 182.55, change: -0.8, volume: "21.8B" },
  { symbol: "MSFT", name: "Microsoft", type: "stock", sector: "Software", price: 421.7, change: 0.7, volume: "8.9B" },
  { symbol: "AMZN", name: "Amazon", type: "stock", sector: "E-Commerce", price: 186.2, change: 1.2, volume: "7.2B" },
  { symbol: "GOOGL", name: "Alphabet", type: "stock", sector: "Internet", price: 174.3, change: 0.6, volume: "5.8B" },
  { symbol: "META", name: "Meta", type: "stock", sector: "Social Media", price: 507.6, change: 2.4, volume: "6.3B" },
  { symbol: "AMD", name: "AMD", type: "stock", sector: "Semiconductors", price: 163.9, change: 3.1, volume: "9.4B" },
  { symbol: "XRP", name: "XRP", type: "crypto", sector: "Payments", price: 0.62, change: -1.2, volume: "2.5B" },
  { symbol: "ADA", name: "Cardano", type: "crypto", sector: "Smart contracts", price: 0.47, change: 0.8, volume: "1.1B" },
  { symbol: "MSTR", name: "MicroStrategy", type: "stock", sector: "Bitcoin Proxy", price: 1640.2, change: 5.6, volume: "3.6B" },
  { symbol: "SPX",  name: "S&P 500",    type: "index", sector: "US Large Cap",  price: 5200,  change: 0.5,  volume: "Index" },
  { symbol: "NDX",  name: "NASDAQ 100", type: "index", sector: "US Tech",       price: 18200, change: 0.8,  volume: "Index" },
  { symbol: "DJI",  name: "Dow Jones",  type: "index", sector: "US Blue Chip",  price: 39000, change: 0.3,  volume: "Index" },
  { symbol: "DAX",  name: "DAX 40",     type: "index", sector: "Germany",       price: 18200, change: 0.6,  volume: "Index" },
  { symbol: "CAC",  name: "CAC 40",     type: "index", sector: "France",        price: 7800,  change: 0.4,  volume: "Index" },
  { symbol: "HSI",  name: "Hang Seng",  type: "index", sector: "Hong Kong",     price: 17000, change: 0.7,  volume: "Index" },
  { symbol: "IBEX", name: "IBEX 35",    type: "index", sector: "Spain",         price: 11200, change: 0.3,  volume: "Index" },
  { symbol: "SMI",  name: "SMI",        type: "index", sector: "Switzerland",   price: 11800, change: 0.2,  volume: "Index" },
];

function getPinnedKey(userId) {
  return `tradecircle:pinned:${userId}`;
}

export default function MarketExplorer() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [market, setMarket] = useState(MARKET_ITEMS);
  const [type, setType] = useState("all");
  const [chartItem, setChartItem] = useState(null);
  const [pinned, setPinned] = useState([]);
  const [fxDirection, setFxDirection] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState("");
  const [asOf, setAsOf] = useState("");
  const [sources, setSources] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem(getPinnedKey(user._id));
    if (stored) setPinned(JSON.parse(stored));
  }, [user._id]);

  useEffect(() => {
    let isAlive = true;

    const load = () => {
      getMarketQuotes()
        .done((res) => {
          if (!isAlive) return;
          const apiQuotes = Array.isArray(res?.quotes) ? res.quotes : [];
          const mergeByType = (type) => {
            const fromApi = apiQuotes.filter(q => q.type === type);
            return fromApi.length > 0 ? fromApi : MARKET_ITEMS.filter(m => m.type === type);
          };
          const quotes = apiQuotes.length > 0
            ? [...mergeByType("fx"), ...mergeByType("stock"), ...mergeByType("crypto"), ...mergeByType("index")]
            : MARKET_ITEMS;
          setMarket(quotes);
          setSources(res?.sources || null);
          setAsOf(res?.asOf || "");
          setLoadErr("");
        })
        .fail((xhr) => {
          if (!isAlive) return;
          setLoadErr(xhr?.responseJSON?.message || "Live market sources are temporarily unavailable.");
        })
        .always(() => {
          if (isAlive) setLoading(false);
        });
    };

    load();
    const timer = setInterval(load, 30000);
    return () => {
      isAlive = false;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(getPinnedKey(user._id), JSON.stringify(pinned));
  }, [pinned, user._id]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return market.filter(item => {
      const reversedPair = item.type === "fx" ? item.symbol.split("/").reverse().join("/") : "";
      const matchesQuery = !q || [item.symbol, reversedPair, item.name, item.sector, item.type].some(v => String(v).toLowerCase().includes(q));
      const matchesType = type === "all" || item.type === type;
      return matchesQuery && matchesType;
    });
  }, [market, query, type]);

  const pinnedItems = useMemo(
    () => pinned.map(symbol => filtered.find(item => item.symbol === symbol) || market.find(item => item.symbol === symbol)).filter(Boolean),
    [pinned, filtered, market]
  );

  const togglePin = (symbol) => {
    setPinned(prev => prev.includes(symbol) ? prev.filter(s => s !== symbol) : [symbol, ...prev].slice(0, 12));
  };

  const toggleFxDirection = (symbol) => {
    setFxDirection((prev) => ({ ...prev, [symbol]: !prev[symbol] }));
  };

  const getDisplayItem = (item) => {
    if (item.type !== "fx") return item;
    const inverted = !!fxDirection[item.symbol];
    if (!inverted) return item;

    const [base, quote] = item.symbol.split("/");
    const safePrice = Number(item.price) || 0;
    const invertedPrice = safePrice > 0 ? 1 / safePrice : 0;
    return {
      ...item,
      symbol: `${quote}/${base}`,
      price: invertedPrice,
      change: Number((-(Number(item.change) || 0)).toFixed(2)),
      sector: `${item.sector} (inverted)`
    };
  };

  return (
    <div className="page-container market-page">
      {chartItem && <MarketChartModal item={chartItem} onClose={() => setChartItem(null)} />}
      <div className="market-header card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div>
            <div className="market-live-pill">Live market explorer</div>
            <h2 style={{ marginTop: 10, marginBottom: 6 }}>TradeCircle Market Explorer</h2>
            <p style={{ color: "var(--muted)", maxWidth: 700 }}>
              Track stocks and crypto in real time, search what matters to you, and pin the instruments you want to follow.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-ghost" onClick={() => nav(-1)}>Back</button>
            <Link to="/search"><button>Advanced search</button></Link>
          </div>
        </div>

        <div className="market-search-row">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search symbol, name, sector, or currency pair..."
          />
          <select value={type} onChange={e => setType(e.target.value)}>
            <option value="all">All assets</option>
            <option value="index">Indices</option>
            <option value="stock">Stocks</option>
            <option value="crypto">Crypto</option>
            <option value="fx">FX / currencies</option>
          </select>
        </div>
        {loadErr && <div className="error-msg" style={{ marginTop: 12 }}>{loadErr}</div>}
        <div style={{ marginTop: 10, color: "var(--muted)", fontSize: "0.82rem" }}>
          {loading ? "Loading reliable market data..." : "Updated from external sources"}
          {asOf ? ` · ${new Date(asOf).toLocaleString()}` : ""}
          {sources ? ` · FX: ${sources.fx}, Stocks: ${sources.stocks}, Crypto: ${sources.crypto}${sources.indices ? `, Indices: ${sources.indices}` : ""}` : ""}
        </div>
      </div>

      {pinnedItems.length > 0 && (
        <section className="card market-section">
          <div className="section-heading">
            <h3>Pinned for you</h3>
            <span>{pinnedItems.length} item(s)</span>
          </div>
          <div className="market-grid pinned-grid">
            {pinnedItems.map(item => {
              const display = getDisplayItem(item);
              return (
              <article key={item.symbol} className="market-tile pinned" style={{ cursor: "pointer" }} onClick={() => setChartItem(item)}>
                <div className="market-tile-top">
                  <div>
                    <div className="market-symbol">{display.symbol}</div>
                    <div className="market-name">{item.name}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {item.type === "fx" && (
                      <button
                        className="btn-ghost fx-direction-btn"
                        onClick={e => { e.stopPropagation(); toggleFxDirection(item.symbol); }}
                        title="Switch direction"
                        aria-label="Switch currency direction"
                      >
                        ↔
                      </button>
                    )}
                    <button className="btn-ghost pinned-btn active" onClick={e => { e.stopPropagation(); togglePin(item.symbol); }}>Unpin</button>
                  </div>
                </div>
                <div className="market-price">{formatPrice(display.price)}</div>
                <div className={`market-change ${display.change >= 0 ? "positive" : "negative"}`}>
                  {display.change >= 0 ? "+" : ""}{display.change}%
                </div>
                <div className="market-meta">{display.sector}{item.type !== "index" ? ` · Vol ${item.volume}` : ""}</div>
              </article>
            );})}
          </div>
        </section>
      )}

      <section className="card market-section">
        <div className="section-heading">
          <h3>Markets</h3>
          <span>{filtered.length} results</span>
        </div>
        <div className="market-grid">
          {filtered.map(item => {
            const isPinned = pinned.includes(item.symbol);
            const display = getDisplayItem(item);
            return (
              <article key={item.symbol} className={`market-tile ${isPinned ? "pinned" : ""}`} style={{ cursor: "pointer" }} onClick={() => setChartItem(item)}>
                <div className="market-tile-top">
                  <div>
                    <div className="market-symbol">{display.symbol}</div>
                    <div className="market-name">{item.name}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {item.type === "fx" && (
                      <button
                        className="btn-ghost fx-direction-btn"
                        onClick={e => { e.stopPropagation(); toggleFxDirection(item.symbol); }}
                        title="Switch direction"
                        aria-label="Switch currency direction"
                      >
                        ↔
                      </button>
                    )}
                    <button className={`btn-ghost pinned-btn ${isPinned ? "active" : ""}`} onClick={e => { e.stopPropagation(); togglePin(item.symbol); }}>
                      {isPinned ? "Pinned" : "Pin"}
                    </button>
                  </div>
                </div>
                <div className="market-price">{formatPrice(display.price)}</div>
                <div className={`market-change ${display.change >= 0 ? "positive" : "negative"}`}>
                  {display.change >= 0 ? "+" : ""}{display.change}%
                </div>
                <div className="market-meta">{item.type.toUpperCase()} · {display.sector}{item.type !== "index" ? ` · Vol ${item.volume}` : ""}</div>
              </article>
            );
          })}
          {filtered.length === 0 && <div className="empty-state" style={{ gridColumn: "1 / -1" }}><p>No markets found.</p></div>}
        </div>
      </section>
    </div>
  );
}