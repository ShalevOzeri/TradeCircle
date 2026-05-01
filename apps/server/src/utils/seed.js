require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");
const User     = require("../models/User");
const Group    = require("../models/Group");
const Post     = require("../models/Post");
const Message  = require("../models/Message");

// ─── helpers ────────────────────────────────────────────────────────────────
function daysAgo(n, offsetMinutes = 0) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setMinutes(d.getMinutes() - offsetMinutes);
  return d;
}
function hoursAgo(n) {
  return new Date(Date.now() - n * 60 * 60 * 1000);
}

// Market snapshot data (realistic recent values)
const M = {
  BTC:  { symbol: "BTC",     name: "Bitcoin",          type: "crypto", sector: "Store of value", price: 68420,   change: 2.1  },
  ETH:  { symbol: "ETH",     name: "Ethereum",         type: "crypto", sector: "Layer 1",        price: 3475,    change: 1.8  },
  SOL:  { symbol: "SOL",     name: "Solana",           type: "crypto", sector: "Layer 1",        price: 178.3,   change: 4.2  },
  XRP:  { symbol: "XRP",     name: "XRP",              type: "crypto", sector: "Payments",       price: 0.62,    change: -1.2 },
  NVDA: { symbol: "NVDA",    name: "NVIDIA",           type: "stock",  sector: "Semiconductors", price: 1205.4,  change: 1.4  },
  AAPL: { symbol: "AAPL",    name: "Apple",            type: "stock",  sector: "Consumer Tech",  price: 193.8,   change: 0.9  },
  TSLA: { symbol: "TSLA",    name: "Tesla",            type: "stock",  sector: "EV",             price: 182.55,  change: -0.8 },
  MSFT: { symbol: "MSFT",    name: "Microsoft",        type: "stock",  sector: "Software",       price: 421.7,   change: 0.7  },
  AMD:  { symbol: "AMD",     name: "AMD",              type: "stock",  sector: "Semiconductors", price: 163.9,   change: 3.1  },
  META: { symbol: "META",    name: "Meta",             type: "stock",  sector: "Social Media",   price: 507.6,   change: 2.4  },
  AMZN: { symbol: "AMZN",    name: "Amazon",           type: "stock",  sector: "E-Commerce",     price: 186.2,   change: 1.2  },
  SPX:  { symbol: "SPX",     name: "S&P 500",          type: "index",  sector: "US Large Cap",   price: 5200,    change: 0.5  },
  NDX:  { symbol: "NDX",     name: "NASDAQ 100",       type: "index",  sector: "US Tech",        price: 18200,   change: 0.8  },
  DJI:  { symbol: "DJI",     name: "Dow Jones",        type: "index",  sector: "US Blue Chip",   price: 39000,   change: 0.3  },
  DAX:  { symbol: "DAX",     name: "DAX 40",           type: "index",  sector: "Germany",        price: 18200,   change: 0.6  },
  USDI: { symbol: "USD/ILS", name: "US Dollar",        type: "fx",     sector: "FX",             price: 3.72,    change: 0.14 },
  EURI: { symbol: "EUR/ILS", name: "Euro",             type: "fx",     sector: "FX",             price: 3.94,    change: 0.09 },
};

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const preservedGroupNames = ["salva world", "salva world private"];
  await Promise.all([
    User.deleteMany(),
    Group.deleteMany({ name: { $nin: preservedGroupNames } }),
    Post.deleteMany(),
    Message.deleteMany(),
  ]);
  console.log("Cleared existing data");

  const password = await bcrypt.hash("Password123", 10);

  // ── Users ──────────────────────────────────────────────────────────────────
  const usersData = [
    { username: "alice",   email: "alice@example.com",   fullName: "Alice Cohen",     bio: "Swing trader & React dev. Long BTC since 2020." },
    { username: "bob",     email: "bob@example.com",     fullName: "Bob Levi",        bio: "Value investor. Dividend stocks & macro analysis." },
    { username: "charlie", email: "charlie@example.com", fullName: "Charlie Mizrahi", bio: "Crypto analyst. DeFi, L2s, and on-chain data." },
    { username: "dana",    email: "dana@example.com",    fullName: "Dana Shapiro",    bio: "Technical trader. Chart patterns & risk management." },
    { username: "eli",     email: "eli@example.com",     fullName: "Eli Ben-David",   bio: "Tech investor. AI, semis, and growth names." },
    { username: "fiona",   email: "fiona@example.com",   fullName: "Fiona Green",     bio: "Macro economist. Rates, FX, and global markets." },
    { username: "gal",     email: "gal@example.com",     fullName: "Gal Peretz",      bio: "Options trader. Volatility & event-driven plays." },
    { username: "hila",    email: "hila@example.com",    fullName: "Hila Katz",       bio: "Portfolio manager. ETFs, commodities, and gold." },
    { username: "ido",     email: "ido@example.com",     fullName: "Ido Natan",       bio: "Quant. Algorithmic strategies & market microstructure." },
    { username: "julia",   email: "julia@example.com",   fullName: "Julia Stern",     bio: "Growth investor. Consumer tech & SaaS." },
    { username: "admin",   email: "admin@example.com",   fullName: "System Admin",    bio: "Platform administrator.", role: "admin" },
  ];

  const users = await User.insertMany(usersData.map(u => ({ ...u, password })));
  console.log(`Created ${users.length} users`);
  const [alice, bob, charlie, dana, eli, fiona, gal, hila, ido, julia, admin] = users;

  // ── Friends ────────────────────────────────────────────────────────────────
  const friendPairs = [
    [alice, bob],   [alice, eli],   [alice, dana],  [alice, julia],
    [bob, gal],     [bob, hila],    [bob, dana],
    [charlie, eli], [charlie, ido], [charlie, alice],
    [dana, julia],  [dana, ido],    [dana, gal],
    [eli, ido],     [eli, julia],   [eli, fiona],
    [fiona, hila],  [fiona, alice],
    [gal, ido],     [hila, julia],
  ];
  for (const [a, b] of friendPairs) {
    await User.findByIdAndUpdate(a._id, { $addToSet: { friends: b._id } });
    await User.findByIdAndUpdate(b._id, { $addToSet: { friends: a._id } });
  }
  console.log("Created friend connections");

  // ── Groups ─────────────────────────────────────────────────────────────────
  const groupSpecs = [
    {
      name: "Bitcoin Traders",
      description: "Discussion around BTC trends, catalysts, support/resistance levels, and market sentiment. From HODLers to active traders.",
      privacy: "public", category: "other",
      admins: [eli._id],
      members: [eli._id, alice._id, ido._id, julia._id, bob._id, charlie._id, dana._id],
    },
    {
      name: "Ethereum Watch",
      description: "Ethereum ecosystem updates, L2 news, DeFi, staking yields, and ETH trading ideas.",
      privacy: "public", category: "tech",
      admins: [ido._id],
      members: [ido._id, eli._id, alice._id, julia._id, charlie._id, hila._id],
    },
    {
      name: "U.S. Stocks Radar",
      description: "General stock ideas, earnings plays, momentum setups, and sector rotation.",
      privacy: "public", category: "tech",
      admins: [julia._id],
      members: [julia._id, alice._id, bob._id, dana._id, eli._id, gal._id, hila._id],
    },
    {
      name: "AI & Semiconductors",
      description: "NVDA, AMD, AI infrastructure plays, data center capex, and growth names in the chip space.",
      privacy: "public", category: "tech",
      admins: [eli._id],
      members: [eli._id, ido._id, alice._id, julia._id, bob._id, charlie._id],
    },
    {
      name: "Swing Traders Lounge",
      description: "Short-term setups, chart patterns, risk management, and execution discipline. Private community.",
      privacy: "private", category: "other",
      admins: [dana._id],
      members: [dana._id, bob._id, eli._id, gal._id, ido._id, admin._id],
    },
    {
      name: "Macro & News Desk",
      description: "Macro headlines, Fed commentary, CPI/jobs data, market-moving news, and sector rotation ideas.",
      privacy: "public", category: "education",
      admins: [fiona._id],
      members: [fiona._id, hila._id, alice._id, bob._id, gal._id, admin._id],
    },
    { name: "salva world",         description: "Legacy community preserved by request.", privacy: "public",  category: "other", admins: [admin._id], members: [admin._id] },
    { name: "salva world private", description: "Legacy private community.",              privacy: "private", category: "other", admins: [admin._id], members: [admin._id] },
  ];

  const groups = [];
  for (const spec of groupSpecs) {
    let group = await Group.findOne({ name: spec.name });
    if (group) {
      Object.assign(group, spec);
      await group.save();
    } else {
      group = await Group.create(spec);
    }
    groups.push(group);
  }
  console.log(`Created ${groups.length} groups`);

  const g = Object.fromEntries(groups.map(x => [x.name, x]));
  const btcG   = g["Bitcoin Traders"];
  const ethG   = g["Ethereum Watch"];
  const stkG   = g["U.S. Stocks Radar"];
  const aiG    = g["AI & Semiconductors"];
  const swingG = g["Swing Traders Lounge"];
  const macroG = g["Macro & News Desk"];

  // ── Posts ──────────────────────────────────────────────────────────────────
  const postDefs = [
    // ── Bitcoin Traders ──
    {
      author: eli, group: btcG, createdAt: daysAgo(21),
      content: "BTC reclaiming the 200-day MA is a big deal structurally. Still think $75K is the next major target if macro cooperates. Watching the weekly close carefully.",
      marketMentions: [M.BTC],
    },
    {
      author: alice, group: btcG, createdAt: daysAgo(18),
      content: "Halving cycle is still playing out as expected. Historically, the 6-12 months post-halving have been the strongest period. Patient hands win here.",
      marketMentions: [M.BTC],
    },
    {
      author: charlie, group: btcG, createdAt: daysAgo(14),
      content: "On-chain data: long-term holders continue to accumulate. Exchange reserves are at multi-year lows — supply shock narrative is intact.",
      marketMentions: [M.BTC],
    },
    {
      author: ido, group: btcG, createdAt: daysAgo(10),
      content: "Miner profitability is key post-halving. Hash rate is still climbing, which means miners are not selling under pressure. Bullish signal.",
      marketMentions: [M.BTC],
    },
    {
      author: dana, group: btcG, createdAt: daysAgo(6),
      content: "Clean bull flag forming on the daily. Entry on breakout above $70K with a stop below the flag base. Risk/reward is solid here.",
      marketMentions: [M.BTC],
    },
    {
      author: julia, group: btcG, createdAt: daysAgo(2),
      content: "ETF flows continue to be net positive. Institutional adoption is real and accelerating. This cycle feels different from a structural demand standpoint.",
      marketMentions: [M.BTC, M.SPX],
    },

    // ── Ethereum Watch ──
    {
      author: charlie, group: ethG, createdAt: daysAgo(20),
      content: "ETH staking yield at ~4% with real deflation from EIP-1559 burns. This is a fundamentally different asset than 3 years ago. Accumulating.",
      marketMentions: [M.ETH],
    },
    {
      author: ido, group: ethG, createdAt: daysAgo(16),
      content: "L2 ecosystem is exploding. Arbitrum and Base daily transactions are now rivaling mainnet. Scaling is working — fee revenues are up.",
      marketMentions: [M.ETH],
    },
    {
      author: alice, group: ethG, createdAt: daysAgo(11),
      content: "ETH/BTC ratio is a key watch. If it starts recovering, that usually signals the altseason rotation is beginning. Not there yet, but watching.",
      marketMentions: [M.ETH, M.BTC],
    },
    {
      author: hila, group: ethG, createdAt: daysAgo(7),
      content: "Institutional interest in ETH spot ETFs is growing. The SEC dynamic is shifting. This could be the next major catalyst for ETH outperformance.",
      marketMentions: [M.ETH],
    },
    {
      author: charlie, group: ethG, createdAt: daysAgo(3),
      content: "SOL is eating into ETH's narrative in terms of speed and fees, but ETH's developer ecosystem and liquidity depth is unmatched. Both can win.",
      marketMentions: [M.ETH, M.SOL],
    },

    // ── U.S. Stocks Radar ──
    {
      author: julia, group: stkG, createdAt: daysAgo(23),
      content: "AAPL services revenue is the real story. Hardware can plateau but services recurring revenue is a re-rating catalyst. Still a core holding.",
      marketMentions: [M.AAPL, M.SPX],
    },
    {
      author: bob, group: stkG, createdAt: daysAgo(19),
      content: "TSLA is binary into earnings. Either they show margin recovery and the stock pops, or another disappointing quarter. I'm sitting it out.",
      marketMentions: [M.TSLA],
    },
    {
      author: gal, group: stkG, createdAt: daysAgo(15),
      content: "Energy sector is quietly outperforming. XOM and CVX both holding well with oil elevated. Underweight energy may be a mistake here.",
      marketMentions: [M.SPX],
    },
    {
      author: alice, group: stkG, createdAt: daysAgo(11),
      content: "Breadth is improving — small caps finally participating. When the Russell 2000 leads, it historically confirms bull market health. Constructive.",
      marketMentions: [M.SPX, M.NDX],
    },
    {
      author: julia, group: stkG, createdAt: daysAgo(5),
      content: "META's ad revenue beat shows online advertising is back. Platform economics at scale are extraordinary. Still think it's undervalued on a P/E basis.",
      marketMentions: [M.META, M.AMZN],
    },
    {
      author: bob, group: stkG, createdAt: daysAgo(1),
      content: "Microsoft cloud numbers are consistently impressive. MSFT remains the most durable large-cap tech name in my view. Own it through volatility.",
      marketMentions: [M.MSFT, M.NDX],
    },

    // ── AI & Semiconductors ──
    {
      author: eli, group: aiG, createdAt: daysAgo(25),
      content: "NVDA data center revenue just keeps accelerating. H100 demand is still outpacing supply. This is not a meme — the capex cycle is real and sustained.",
      marketMentions: [M.NVDA],
    },
    {
      author: ido, group: aiG, createdAt: daysAgo(20),
      content: "AMD is the clear beneficiary if NVDA supply remains constrained. MI300X ramp is ahead of schedule. Valuation still looks reasonable vs. the opportunity.",
      marketMentions: [M.AMD, M.NVDA],
    },
    {
      author: alice, group: aiG, createdAt: daysAgo(14),
      content: "AI infrastructure spending is a multi-year cycle. Azure, AWS, and GCP are all guiding higher capex. The picks-and-shovels trade (semis, power, cooling) is where I'd focus.",
      marketMentions: [M.NVDA, M.MSFT, M.AMD],
    },
    {
      author: charlie, group: aiG, createdAt: daysAgo(8),
      content: "Interesting that the AI trade is starting to broaden beyond just NVDA. Software names with genuine AI monetization are starting to catch a bid.",
      marketMentions: [M.NVDA, M.META],
    },
    {
      author: eli, group: aiG, createdAt: daysAgo(3),
      content: "Blackwell ramp in H2 is the next big catalyst for NVDA. If data center margins hold, the stock has room to re-rate higher. Q3 guide will be telling.",
      marketMentions: [M.NVDA, M.NDX],
    },

    // ── Swing Traders Lounge ──
    {
      author: dana, group: swingG, createdAt: daysAgo(18),
      content: "Today's setup: AAPL daily chart showing a tight inside bar near ATH support. Entry above the high, stop below the inside bar low. R:R 3.5:1. Sizing 2% of book.",
      marketMentions: [M.AAPL],
    },
    {
      author: gal, group: swingG, createdAt: daysAgo(12),
      content: "Volatility crush post-earnings is the most reliable options play I run. Buy before earnings, exit before announcement, capture the IV premium. Not complex, just disciplined.",
      marketMentions: [M.SPX],
    },
    {
      author: ido, group: swingG, createdAt: daysAgo(8),
      content: "Algo notes: moving average crossovers alone are weak signals. Adding volume and RSI confirmation bumps win rate significantly. Context is everything.",
      marketMentions: [M.NDX],
    },
    {
      author: dana, group: swingG, createdAt: daysAgo(4),
      content: "This week's best swing: AMD held the 50-day on the pullback and bounced cleanly. Took it long at the support, target is the prior high. Still in, trailing stop now.",
      marketMentions: [M.AMD, M.NVDA],
    },
    {
      author: bob, group: swingG, createdAt: daysAgo(1),
      content: "Reminder: the best traders I know define risk first, profit second. If you can't articulate your stop and size before entry, you're not trading — you're gambling.",
      marketMentions: [M.SPX],
    },

    // ── Macro & News Desk ──
    {
      author: fiona, group: macroG, createdAt: daysAgo(26),
      content: "CPI came in at 3.4%, slightly above consensus. Core services inflation is sticky. Fed has no urgency to cut. Expect higher-for-longer well into Q3.",
      marketMentions: [M.SPX, M.DJI, M.USDI],
    },
    {
      author: hila, group: macroG, createdAt: daysAgo(20),
      content: "Gold at all-time highs while real yields are still positive — that's unusual. Central bank buying from EM countries is the driver. Adds to de-dollarization narrative.",
      marketMentions: [M.DAX, M.EURI],
    },
    {
      author: fiona, group: macroG, createdAt: daysAgo(14),
      content: "Japanese Yen at 155 vs USD is extraordinary. BOJ intervention risk is rising. Any sharp Yen reversal could trigger a global carry trade unwind — watch this closely.",
      marketMentions: [M.USDI, M.SPX],
    },
    {
      author: alice, group: macroG, createdAt: daysAgo(9),
      content: "Fed funds futures are now pricing just 1-2 cuts in 2024. The narrative shifted dramatically since January. Equity market is holding up despite it — resilience or complacency?",
      marketMentions: [M.SPX, M.NDX, M.USDI],
    },
    {
      author: gal, group: macroG, createdAt: daysAgo(4),
      content: "DAX hitting all-time highs while German industrial output contracts. Equity markets are pricing in rate cuts that may not come as fast as hoped. Divergence is notable.",
      marketMentions: [M.DAX, M.SPX],
    },
    {
      author: fiona, group: macroG, createdAt: daysAgo(1),
      content: "Jobs report Friday. ADP came in strong again. A surprise beat could push 10Y yields higher and pressure equities short-term. Worth having some hedges into the print.",
      marketMentions: [M.SPX, M.DJI],
    },

    // ── Personal feed posts ──
    { author: admin, createdAt: daysAgo(30), content: "Welcome to TradeCircle! Track markets, join trading communities, share ideas, and learn from each other. All accounts use password: Password123 for demo purposes.", marketMentions: [M.SPX, M.BTC] },
    { author: alice, createdAt: daysAgo(4),  content: "Morning routine: check pre-market futures, scan earnings reactions, update watchlist. Consistency compounds over time.", marketMentions: [M.SPX, M.NDX] },
    { author: bob,   createdAt: daysAgo(7),  content: "Dividend investing is boring until the market drops 20%. Then it's suddenly genius.", marketMentions: [M.SPX] },
    { author: charlie, createdAt: daysAgo(5), content: "The crypto market never sleeps. Set alerts, stick to your plan, avoid FOMO. The best trade is sometimes no trade.", marketMentions: [M.BTC, M.ETH, M.SOL] },
    { author: dana, createdAt: daysAgo(3),   content: "Three losses in a row this week. Review time: what pattern am I missing? Journaling every trade is non-negotiable for improvement.", marketMentions: [] },
    { author: eli,  createdAt: daysAgo(6),   content: "AI capex is a generational investment cycle. We are very early. The infrastructure buildout will take a decade — NVDA is still in chapter 1.", marketMentions: [M.NVDA, M.AMD] },
    { author: fiona, createdAt: daysAgo(2),  content: "Markets are pricing in a soft landing. The bond market disagrees. One of them is wrong. Position sizing should reflect that uncertainty.", marketMentions: [M.SPX, M.USDI] },
    { author: gal,  createdAt: daysAgo(8),   content: "VIX back below 15. Complacency creeping in. Perfect time to buy some cheap protection.", marketMentions: [M.SPX] },
    { author: hila, createdAt: daysAgo(12),  content: "Portfolio review: trimmed tech exposure by 10%, added gold and Treasuries as hedge. The risk-adjusted return matters more than headline return.", marketMentions: [M.SPX, M.NDX] },
    { author: ido,  createdAt: daysAgo(9),   content: "Backtested 3 years of BTC daily data. Mean reversion after >7% daily moves wins 68% of the time. Still requires tight stops on the losers.", marketMentions: [M.BTC] },
    { author: julia, createdAt: daysAgo(1),  content: "Earnings season lesson: the reaction matters more than the number. Beat-and-raise is the only catalyst worth chasing. In-line beats get sold.", marketMentions: [M.SPX, M.NDX, M.META] },
  ];

  const posts = await Post.insertMany(postDefs.map(p => ({
    author: p.author._id,
    group: p.group?._id || null,
    content: p.content,
    marketMentions: (p.marketMentions || []).map(m => ({ ...m })),
    mediaType: "none",
    mediaUrl: "",
    tags: [],
    createdAt: p.createdAt,
  })));
  console.log(`Created ${posts.length} posts`);

  // ── Likes ──────────────────────────────────────────────────────────────────
  const allUsers = [alice, bob, charlie, dana, eli, fiona, gal, hila, ido, julia];
  for (let i = 0; i < posts.length; i++) {
    const likerCount = 2 + Math.floor(Math.random() * 6);
    const shuffled = allUsers.slice().sort(() => 0.5 - Math.random());
    const likers = shuffled.slice(0, likerCount).map(u => u._id);
    await Post.findByIdAndUpdate(posts[i]._id, { likes: likers });
  }

  // ── Comments ───────────────────────────────────────────────────────────────
  const commentSets = [
    { postIdx: 0, comments: [
      { author: alice, text: "Totally agree. The 200-day has acted as a magnet all cycle. Key level to defend." },
      { author: charlie, text: "On-chain is also supporting this — exchange outflows spiked the last two weeks." },
      { author: ido, text: "If SPX holds, BTC should follow. Macro correlation is still high." },
    ]},
    { postIdx: 1, comments: [
      { author: eli, text: "Historical cycles are a guide not a guarantee, but the pattern is compelling." },
      { author: dana, text: "Patient hands indeed. The volatility shakeouts are where weak hands leave." },
    ]},
    { postIdx: 6, comments: [
      { author: ido, text: "Staking yield + deflation makes ETH almost bond-like in some models. Very different asset now." },
      { author: alice, text: "The EIP-1559 burn mechanic is underappreciated. High activity = more deflation." },
      { author: julia, text: "Agreed. The supply story is structurally bullish long-term." },
    ]},
    { postIdx: 11, comments: [
      { author: bob, text: "Services gross margin is insane. 72%+ and growing. The flywheel is unstoppable." },
      { author: gal, text: "Vision Pro could be a slow burn. Hardware isn't the story, the ecosystem is." },
      { author: alice, text: "AAPL at 27x is fair if services keep compounding. I own it through any dip." },
    ]},
    { postIdx: 17, comments: [
      { author: ido, text: "Blackwell orders are reportedly 3-4x H100. The demand curve is still vertical." },
      { author: alice, text: "Power infrastructure is becoming the bottleneck. VST and NRG are interesting sideplays." },
      { author: charlie, text: "The hyperscalers are basically ordering blindly. NVDA can name its price right now." },
      { author: julia, text: "Margins at 76% gross with this growth rate is unlike anything in semiconductor history." },
    ]},
    { postIdx: 22, comments: [
      { author: gal, text: "Textbook setup. What's your profit target?" },
      { author: dana, text: "Prior swing high around $220. That's the level." },
      { author: ido, text: "Stop placement looks tight. Good discipline." },
    ]},
    { postIdx: 27, comments: [
      { author: hila, text: "BOJ carry trade risk is hugely underpriced by most retail traders. This could surprise." },
      { author: gal, text: "135 Yen last time there was intervention. We are well past that. Watch for announcements." },
      { author: fiona, text: "Agreed. Any unwind could be fast and disorderly. Tight positions are warranted." },
    ]},
    { postIdx: 33, comments: [
      { author: bob, text: "Pre-market scan is the most important 30 minutes of my day. Discipline compounds." },
      { author: dana, text: "Same. What screener do you use?" },
      { author: alice, text: "I run a custom filter — sector ETF gap + individual name gap + volume. Works well." },
    ]},
  ];

  for (const { postIdx, comments } of commentSets) {
    if (posts[postIdx]) {
      await Post.findByIdAndUpdate(posts[postIdx]._id, {
        comments: comments.map(c => ({ author: c.author._id, text: c.text, createdAt: new Date() }))
      });
    }
  }
  console.log("Added likes and comments");

  // ── Messages ───────────────────────────────────────────────────────────────
  // Each conversation is realistic and topic-driven

  const conversations = [
    // alice ↔ eli  (tech stocks & AI)
    { from: eli,   to: alice, text: "Alice — NVDA is up 3% pre-market. You still in from your entry last month?", at: daysAgo(2, 180) },
    { from: alice, to: eli,   text: "Yes! Up about 18% on the position. Starting to think about a trailing stop.", at: daysAgo(2, 175) },
    { from: eli,   to: alice, text: "I would hold through the Blackwell launch in Q3. That is the real re-rating moment.", at: daysAgo(2, 170) },
    { from: alice, to: eli,   text: "Makes sense. What is your price target?", at: daysAgo(2, 165) },
    { from: eli,   to: alice, text: "Fundamentally I think $1500 is achievable by year end if data center demand holds. It is all about margins.", at: daysAgo(2, 160) },
    { from: alice, to: eli,   text: "Agreed. The gross margin story is insane. 76% at this scale is unprecedented.", at: daysAgo(2, 155) },
    { from: eli,   to: alice, text: "AMD is also interesting as a secondary play if NVDA supply stays constrained.", at: daysAgo(2, 150) },
    { from: alice, to: eli,   text: "Looking at AMD now. MI300X ramp seems ahead of schedule from what I am reading.", at: daysAgo(2, 145) },
    { from: eli,   to: alice, text: "Exactly. I sized in 2% of portfolio on AMD last week. Tight stop below $155.", at: daysAgo(2, 140) },
    { from: alice, to: eli,   text: "Smart. Did you see the AI group post I made about infrastructure capex? Worth a read.", at: daysAgo(2, 130) },
    { from: eli,   to: alice, text: "Just read it. Excellent breakdown. The picks-and-shovels angle is where I am focused too.", at: daysAgo(2, 125) },
    { from: alice, to: eli,   text: "Thanks. Saving dry powder for any macro-driven pullback in semis.", at: daysAgo(2, 120) },

    // alice ↔ bob  (market chat)
    { from: bob,   to: alice, text: "Morning! Did you catch the jobs report? Came in hot — 272K vs 180K expected.", at: daysAgo(5, 240) },
    { from: alice, to: bob,   text: "Just saw it. Futures are getting hit. 10-year yield spiking toward 4.5%.", at: daysAgo(5, 235) },
    { from: bob,   to: alice, text: "Rate-sensitive names will be under pressure today. Trimming some REITs here.", at: daysAgo(5, 230) },
    { from: alice, to: bob,   text: "Tech could actually hold — it has been pricing out cuts for months anyway.", at: daysAgo(5, 225) },
    { from: bob,   to: alice, text: "Good point. SPX below 5150 is where I would get cautious. Still above for now.", at: daysAgo(5, 220) },
    { from: alice, to: bob,   text: "NVDA holding above 1200 is the tell for me. If semis fade, everything follows.", at: daysAgo(5, 215) },
    { from: bob,   to: alice, text: "True. What is on your watchlist today?", at: daysAgo(5, 200) },
    { from: alice, to: bob,   text: "AAPL near 190, AMD at 50-day support, and BTC reaction to the dollar move.", at: daysAgo(5, 195) },
    { from: bob,   to: alice, text: "Solid list. I am watching MSFT and keeping an eye on energy for rotation.", at: daysAgo(5, 190) },
    { from: alice, to: bob,   text: "Good call on energy — XOM has been quietly outperforming for weeks.", at: daysAgo(5, 185) },

    // charlie ↔ ido  (crypto deep dive)
    { from: charlie, to: ido, text: "Ido — did you see the ETH gas fees today? Back near 50 gwei on mainnet.", at: daysAgo(3, 300) },
    { from: ido,   to: charlie, text: "Yeah. L2 activity is pulling most of the user traffic but mainnet is still the settlement layer. Healthy dynamic.", at: daysAgo(3, 295) },
    { from: charlie, to: ido, text: "Base (Coinbase L2) is growing insanely fast. Transaction count is almost matching Arbitrum.", at: daysAgo(3, 290) },
    { from: ido,   to: charlie, text: "The fee revenue flowing back to ETH through EIP-1559 from L2s is an underappreciated mechanism.", at: daysAgo(3, 285) },
    { from: charlie, to: ido, text: "Exactly. More L2 activity = more ETH burned. It is a self-reinforcing loop.", at: daysAgo(3, 280) },
    { from: ido,   to: charlie, text: "I ran a backtest: ETH outperforms BTC 60 days after L2 transaction count ATHs. Interesting signal.", at: daysAgo(3, 275) },
    { from: charlie, to: ido, text: "That is a nice alpha signal. What is the win rate?", at: daysAgo(3, 270) },
    { from: ido,   to: charlie, text: "About 67% over 18 data points. Small sample but directionally useful.", at: daysAgo(3, 265) },
    { from: charlie, to: ido, text: "Worth building on. SOL is also eating market share narratively. How do you think about ETH vs SOL long-term?", at: daysAgo(3, 260) },
    { from: ido,   to: charlie, text: "SOL wins on speed and cost short-term. ETH wins on security and composability long-term. Both have room.", at: daysAgo(3, 255) },
    { from: charlie, to: ido, text: "That is a fair take. I am long both but ETH is the bigger position by far.", at: daysAgo(3, 250) },
    { from: ido,   to: charlie, text: "Same. ETH staking yield + deflation makes it the more defensible hold.", at: daysAgo(3, 245) },

    // dana ↔ julia  (portfolio & setups)
    { from: dana,  to: julia, text: "Julia — how are you thinking about META going into Q2 earnings?", at: daysAgo(4, 400) },
    { from: julia, to: dana,  text: "Bullish. Ad revenue recovery is real, AI-driven targeting is improving click-through rates.", at: daysAgo(4, 395) },
    { from: dana,  to: julia, text: "Agreed. Zuckerberg's cost discipline turned the narrative completely. Margins are back.", at: daysAgo(4, 390) },
    { from: julia, to: dana,  text: "I added to my position at $470 last week. It felt like a gift after the mild selloff.", at: daysAgo(4, 385) },
    { from: dana,  to: julia, text: "Smart entry. My technical target is $540 on the breakout. Do you have a stop?", at: daysAgo(4, 380) },
    { from: julia, to: dana,  text: "Using $445 as stop — below the prior consolidation base. Risk is about 5%.", at: daysAgo(4, 375) },
    { from: dana,  to: julia, text: "Clean setup. R:R is solid if target holds. I am watching AMZN for a similar trade.", at: daysAgo(4, 370) },
    { from: julia, to: dana,  text: "AMZN AWS acceleration plus advertising line is a very compelling combination right now.", at: daysAgo(4, 365) },
    { from: dana,  to: julia, text: "Both names look like they want to go higher but the macro backdrop is the key risk.", at: daysAgo(4, 360) },
    { from: julia, to: dana,  text: "If rates stay elevated, growth multiples compress. I am keeping position sizes modest until the Fed picture clears.", at: daysAgo(4, 355) },
    { from: dana,  to: julia, text: "Sensible. Conviction + small size beats no conviction + big size every time.", at: daysAgo(4, 350) },

    // fiona ↔ hila  (macro & global markets)
    { from: fiona, to: hila,  text: "Hila — your gold thesis is playing out perfectly. $2350 this morning.", at: daysAgo(1, 200) },
    { from: hila,  to: fiona, text: "Fiona! I have been saying it for months. Real yields positive AND gold at ATH — central bank buying is the anomaly driving this.", at: daysAgo(1, 195) },
    { from: fiona, to: hila,  text: "EM central banks are diversifying away from USD reserves. China, India, Turkey all accumulating.", at: daysAgo(1, 190) },
    { from: hila,  to: fiona, text: "The de-dollarization narrative is real even if slow. Gold and BTC both benefit.", at: daysAgo(1, 185) },
    { from: fiona, to: hila,  text: "I posted about the Yen this morning. 155 is a critical psychological level for BOJ.", at: daysAgo(1, 180) },
    { from: hila,  to: fiona, text: "Any BOJ intervention would strengthen JPY fast. Global carry trades would unwind violently.", at: daysAgo(1, 175) },
    { from: fiona, to: hila,  text: "2022 showed how disorderly that can be. I reduced carry exposure last week as a precaution.", at: daysAgo(1, 170) },
    { from: hila,  to: fiona, text: "Wise. DAX at ATH with weak fundamentals in Germany is also a disconnect to watch.", at: daysAgo(1, 165) },
    { from: fiona, to: hila,  text: "European equities are being driven by rate cut hopes more than earnings. Fragile if those cuts are delayed.", at: daysAgo(1, 160) },
    { from: hila,  to: fiona, text: "Exactly my thinking. Risk-adjusted, I prefer US equities and gold over European exposure right now.", at: daysAgo(1, 155) },

    // bob ↔ gal  (options & volatility)
    { from: gal,   to: bob,   text: "Bob — VIX crushed to 13.5. I am loading up on cheap puts as portfolio insurance.", at: hoursAgo(36) },
    { from: bob,   to: gal,   text: "Smart move. Complacency at these levels is historically a setup for a spike.", at: hoursAgo(35) },
    { from: gal,   to: bob,   text: "Buying SPX 0-DTE puts for pennies when VIX is at 13 is asymmetric. Worst case I lose the premium.", at: hoursAgo(34) },
    { from: bob,   to: gal,   text: "How much of your book are you allocating to protection?", at: hoursAgo(33) },
    { from: gal,   to: bob,   text: "About 1.5%. Small enough to not hurt performance, large enough to matter if we get a 3-5% move.", at: hoursAgo(32) },
    { from: bob,   to: gal,   text: "That is a disciplined approach. Are you using SPY or SPX options?", at: hoursAgo(31) },
    { from: gal,   to: bob,   text: "SPX — better tax treatment for me and more liquidity in the strikes I want.", at: hoursAgo(30) },
    { from: bob,   to: gal,   text: "Noted. I have been more focused on stock selection lately, less on portfolio-level hedging.", at: hoursAgo(29) },
    { from: gal,   to: bob,   text: "You are long quality names — dividend payers with strong balance sheets. That is its own form of defense.", at: hoursAgo(28) },
    { from: bob,   to: gal,   text: "Exactly the idea. Sleep well at night investing.", at: hoursAgo(27) },

    // alice ↔ dana  (swing trade discussion)
    { from: dana,  to: alice, text: "Alice — what do you think of the AMD setup right now? Daily looks like a textbook bull flag.", at: hoursAgo(10) },
    { from: alice, to: dana,  text: "I see it. The flag pole was clean and the consolidation is tight. Volume dried up nicely.", at: hoursAgo(9, 50) },
    { from: dana,  to: alice, text: "Entry above $168 with stop at $161. That is the invalidation point.", at: hoursAgo(9, 40) },
    { from: alice, to: dana,  text: "Looks good. What is the measured move target from the flag?", at: hoursAgo(9, 30) },
    { from: dana,  to: alice, text: "Flag pole was about $22. Target is around $190. That is the prior resistance zone too.", at: hoursAgo(9, 20) },
    { from: alice, to: dana,  text: "R:R is excellent. I might take half size going into the earnings uncertainty though.", at: hoursAgo(9, 10) },
    { from: dana,  to: alice, text: "Fair. Earnings binary risk cuts your effective R:R. Half size is sensible.", at: hoursAgo(9) },
    { from: alice, to: dana,  text: "Will update you if I enter. Also watching NVDA for a similar consolidation break.", at: hoursAgo(8, 30) },
    { from: dana,  to: alice, text: "NVDA is the higher conviction setup but AMD is cleaner technically right now.", at: hoursAgo(8) },
    { from: alice, to: dana,  text: "Agreed. Thanks for the heads up on AMD — this is exactly the kind of setup I look for.", at: hoursAgo(7) },
  ];

  await Message.insertMany(conversations.map(m => ({
    from: m.from._id,
    to:   m.to._id,
    text: m.text,
    read: true,
    createdAt: m.at,
  })));
  console.log(`Created ${conversations.length} messages`);

  console.log("\n✅ Seed complete!");
  console.log("─────────────────────────────────────────────");
  console.log("Test accounts (password: Password123)");
  console.log("─────────────────────────────────────────────");
  usersData.forEach(u => console.log(`  ${u.username.padEnd(10)} ${u.email}`));
  console.log("─────────────────────────────────────────────");
  console.log(`  ${posts.length} posts  |  ${groups.length} groups  |  ${conversations.length} messages`);

  await mongoose.disconnect();
}

seed().catch(err => { console.error("Seed failed:", err); process.exit(1); });
