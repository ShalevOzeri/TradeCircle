const FX_CODES = ["USD", "EUR", "GBP", "JPY", "CNY", "THB", "AUD", "CAD", "CHF"];

// Only indices confirmed to work on Stooq individual queries
const INDEX_SPECS = [
  { symbol: "SPX",  stooqSymbol: "^spx",  name: "S&P 500",          sector: "US Large Cap" },
  { symbol: "NDX",  stooqSymbol: "^ndx",  name: "NASDAQ 100",       sector: "US Tech" },
  { symbol: "DJI",  stooqSymbol: "^dji",  name: "Dow Jones",         sector: "US Blue Chip" },
  { symbol: "DAX",  stooqSymbol: "^dax",  name: "DAX 40",            sector: "Germany" },
  { symbol: "CAC",  stooqSymbol: "^cac",  name: "CAC 40",            sector: "France" },
  { symbol: "HSI",  stooqSymbol: "^hsi",  name: "Hang Seng",         sector: "Hong Kong" },
  { symbol: "IBEX", stooqSymbol: "^ibex", name: "IBEX 35",           sector: "Spain" },
  { symbol: "SMI",  stooqSymbol: "^smi",  name: "SMI",               sector: "Switzerland" },
];

const STOCK_SPECS = [
  { symbol: "AAPL",  name: "Apple",        sector: "Consumer Tech" },
  { symbol: "TSLA",  name: "Tesla",        sector: "EV" },
  { symbol: "NVDA",  name: "NVIDIA",       sector: "Semiconductors" },
  { symbol: "MSFT",  name: "Microsoft",    sector: "Software" },
  { symbol: "AMZN",  name: "Amazon",       sector: "E-Commerce" },
  { symbol: "GOOGL", name: "Alphabet",     sector: "Internet" },
  { symbol: "META",  name: "Meta",         sector: "Social Media" },
  { symbol: "AMD",   name: "AMD",          sector: "Semiconductors" },
  { symbol: "MSTR",  name: "MicroStrategy",sector: "Bitcoin Proxy" },
];

const CRYPTO_SPECS = [
  { id: "bitcoin",  symbol: "BTC", name: "Bitcoin",  sector: "Store of value" },
  { id: "ethereum", symbol: "ETH", name: "Ethereum", sector: "Layer 1" },
  { id: "solana",   symbol: "SOL", name: "Solana",   sector: "Layer 1" },
  { id: "ripple",   symbol: "XRP", name: "XRP",      sector: "Payments" },
  { id: "cardano",  symbol: "ADA", name: "Cardano",  sector: "Smart contracts" },
];

function formatFxName(code) {
  const names = {
    USD: "US Dollar", EUR: "Euro", GBP: "British Pound", JPY: "Japanese Yen",
    CNY: "Chinese Yuan", THB: "Thai Baht", AUD: "Australian Dollar",
    CAD: "Canadian Dollar", CHF: "Swiss Franc",
  };
  return names[code] || code;
}

function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": "TradeCircle/1.0" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { "User-Agent": "TradeCircle/1.0" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

// Fetch a single Stooq symbol. Returns { open, close } or null on failure/N/D.
async function fetchStooqOne(stooqSymbol) {
  try {
    const url = `https://stooq.com/q/l/?s=${encodeURIComponent(stooqSymbol)}&f=sd2t2ohlcv&h&e=csv`;
    const csv = await fetchText(url);
    const lines = csv.trim().split(/\r?\n/);
    if (lines.length < 2) return null;
    const parts = lines[1].split(",");
    const open  = toNumber(parts[3], 0);
    const close = toNumber(parts[6], 0);
    const volume = (parts[7] || "").trim();
    if (!close) return null;
    return { open, close, volume };
  } catch {
    return null;
  }
}

async function getFxQuotes() {
  const toList = ["ILS", ...FX_CODES].join(",");
  const latestUrl = `https://api.frankfurter.app/latest?from=EUR&to=${toList}`;

  const prevDate = new Date();
  prevDate.setDate(prevDate.getDate() - 1);
  const yyyy = prevDate.getFullYear();
  const mm = String(prevDate.getMonth() + 1).padStart(2, "0");
  const dd = String(prevDate.getDate()).padStart(2, "0");
  const prevUrl = `https://api.frankfurter.app/${yyyy}-${mm}-${dd}?from=EUR&to=${toList}`;

  const [latest, previous] = await Promise.all([fetchJson(latestUrl), fetchJson(prevUrl)]);

  const latestRates = latest.rates || {};
  const prevRates   = previous.rates || {};
  const ilsNow  = toNumber(latestRates.ILS, 0);
  const ilsPrev = toNumber(prevRates.ILS, 0);
  if (!ilsNow || !ilsPrev) return [];

  return FX_CODES.map((code) => {
    const cNow  = code === "EUR" ? 1 : toNumber(latestRates[code], 0);
    const cPrev = code === "EUR" ? 1 : toNumber(prevRates[code], 0);
    if (!cNow || !cPrev) return null;
    const pairNow  = ilsNow / cNow;
    const pairPrev = ilsPrev / cPrev;
    const change = pairPrev ? ((pairNow - pairPrev) / pairPrev) * 100 : 0;
    return {
      symbol: `${code}/ILS`, name: formatFxName(code), type: "fx", sector: "FX",
      price: Number(pairNow.toFixed(4)), change: Number(change.toFixed(2)), volume: "FX"
    };
  }).filter(Boolean);
}

async function getStockQuotes() {
  const results = await Promise.all(
    STOCK_SPECS.map(async (spec) => {
      const data = await fetchStooqOne(`${spec.symbol.toLowerCase()}.us`);
      if (!data) return null;
      const change = data.open ? ((data.close - data.open) / data.open) * 100 : 0;
      return {
        symbol: spec.symbol, name: spec.name, type: "stock", sector: spec.sector,
        price: data.close, change: Number(change.toFixed(2)),
        volume: data.volume || "N/A"
      };
    })
  );
  return { quotes: results.filter(Boolean), source: "Stooq" };
}

async function getIndexQuotes() {
  const results = await Promise.all(
    INDEX_SPECS.map(async (spec) => {
      const data = await fetchStooqOne(spec.stooqSymbol);
      if (!data) return null;
      const change = data.open ? ((data.close - data.open) / data.open) * 100 : 0;
      return {
        symbol: spec.symbol, name: spec.name, type: "index", sector: spec.sector,
        price: data.close, change: Number(change.toFixed(2)), volume: "Index"
      };
    })
  );
  return { quotes: results.filter(Boolean), source: "Stooq" };
}

async function getCryptoQuotes() {
  const ids = CRYPTO_SPECS.map((item) => item.id).join(",");
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids)}&vs_currencies=usd&include_24hr_change=true`;
  const data = await fetchJson(url);

  return CRYPTO_SPECS.map((spec) => {
    const row = data?.[spec.id];
    if (!row || row.usd == null) return null;
    return {
      symbol: spec.symbol, name: spec.name, type: "crypto", sector: spec.sector,
      price: toNumber(row.usd, 0), change: toNumber(row.usd_24h_change, 0),
      volume: "CoinGecko"
    };
  }).filter(Boolean);
}

const YAHOO_INDEX_MAP = {
  SPX: "^GSPC", NDX: "^IXIC", DJI: "^DJI",
  DAX: "^GDAXI", CAC: "^FCHI", HSI: "^HSI",
  IBEX: "^IBEX", SMI: "^SSMI",
};

const PERIOD_YAHOO = {
  "1W": { range: "5d",  interval: "1d"  },
  "1M": { range: "1mo", interval: "1d"  },
  "3M": { range: "3mo", interval: "1d"  },
  "6M": { range: "6mo", interval: "1wk" },
  "1Y": { range: "1y",  interval: "1wk" },
};

const PERIOD_COINGECKO_DAYS = { "1W": 7, "1M": 30, "3M": 90, "6M": 180, "1Y": 365 };

async function fetchYahooHistory(yahooSymbol, period) {
  const { range, interval } = PERIOD_YAHOO[period] || PERIOD_YAHOO["1M"];
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?range=${range}&interval=${interval}`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" } });
  if (!res.ok) throw new Error(`Yahoo HTTP ${res.status}`);
  const json = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result) throw new Error("No chart data");
  const timestamps = result.timestamp || [];
  const closes = result.indicators?.quote?.[0]?.close || [];
  const name = result.meta?.longName || result.meta?.shortName || yahooSymbol;
  const data = timestamps
    .map((ts, i) => ({ date: new Date(ts * 1000).toISOString().slice(0, 10), close: closes[i] }))
    .filter(p => p.close != null && Number.isFinite(p.close));
  return { name, data };
}

async function fetchCoinGeckoHistory(coinId, period) {
  const days = PERIOD_COINGECKO_DAYS[period] || 30;
  const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}&interval=daily`;
  const json = await fetchJson(url);
  const data = (json?.prices || []).map(([ts, price]) => ({
    date: new Date(ts).toISOString().slice(0, 10),
    close: price
  }));
  return { data };
}

exports.getHistory = async (req, res, next) => {
  try {
    const { symbol, type, period = "1M" } = req.query;
    if (!symbol || !type) return res.status(400).json({ message: "symbol and type are required" });

    if (type === "crypto") {
      const spec = CRYPTO_SPECS.find(s => s.symbol === symbol);
      if (!spec) return res.status(404).json({ message: "Symbol not found" });
      const { data } = await fetchCoinGeckoHistory(spec.id, period);
      return res.json({ symbol, name: spec.name, type, period, data });
    }

    let yahooSymbol;
    if (type === "stock") yahooSymbol = symbol;
    else if (type === "index") yahooSymbol = YAHOO_INDEX_MAP[symbol];
    else if (type === "fx") yahooSymbol = symbol.replace("/", "") + "=X";

    if (!yahooSymbol) return res.status(404).json({ message: "Symbol not supported for history" });

    const { name, data } = await fetchYahooHistory(yahooSymbol, period);
    res.json({ symbol, name, type, period, data });
  } catch (err) {
    next(err);
  }
};

exports.getQuotes = async (req, res, next) => {
  try {
    const [fx, stockBundle, crypto, indexBundle] = await Promise.all([
      getFxQuotes().catch(() => []),
      getStockQuotes().catch(() => ({ quotes: [], source: "Unavailable" })),
      getCryptoQuotes().catch(() => []),
      getIndexQuotes().catch(() => ({ quotes: [], source: "Unavailable" })),
    ]);

    res.json({
      quotes: [
        ...fx,
        ...(stockBundle.quotes || []),
        ...(crypto),
        ...(indexBundle.quotes || []),
      ],
      sources: {
        fx: "Frankfurter (ECB)",
        stocks: stockBundle.source,
        crypto: "CoinGecko",
        indices: indexBundle.source,
      },
      asOf: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
};
