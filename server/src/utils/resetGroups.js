require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
const User = require("../models/User");
const Group = require("../models/Group");
const Post = require("../models/Post");

async function resetGroups() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const preservedNames = ["salva world", "salva world private"];
  const preservedGroups = await Group.find({ name: { $in: preservedNames } });
  const preservedByName = Object.fromEntries(preservedGroups.map(group => [group.name, group]));

  const existingGroups = await Group.find({ name: { $nin: preservedNames } }).select("_id");
  const existingGroupIds = existingGroups.map(group => group._id);
  if (existingGroupIds.length > 0) {
    await Post.deleteMany({ group: { $in: existingGroupIds } });
    await Group.deleteMany({ _id: { $in: existingGroupIds } });
  }

  const users = await User.find({ username: { $in: ["alice", "bob", "charlie", "dana", "eli", "fiona", "gal", "hila", "ido", "julia", "admin"] } });
  const byUsername = Object.fromEntries(users.map(user => [user.username, user]));

  const requiredUsernames = ["alice", "bob", "charlie", "dana", "eli", "fiona", "gal", "hila", "ido", "julia", "admin"];
  const missingUsers = requiredUsernames.filter(username => !byUsername[username]);
  if (missingUsers.length > 0) {
    throw new Error(`Missing required users for group reset: ${missingUsers.join(", ")}`);
  }

  const groupSpecs = [
    {
      name: "Bitcoin Traders",
      description: "Discussion around BTC trends, catalysts, support levels, and market sentiment.",
      privacy: "public",
      category: "other",
      admins: [byUsername.eli._id],
      members: [byUsername.eli._id, byUsername.alice._id, byUsername.ido._id, byUsername.julia._id, byUsername.bob._id]
    },
    {
      name: "Ethereum Watch",
      description: "Ethereum ecosystem updates, L2 news, and ETH trading ideas.",
      privacy: "public",
      category: "tech",
      admins: [byUsername.ido._id],
      members: [byUsername.ido._id, byUsername.eli._id, byUsername.alice._id, byUsername.julia._id]
    },
    {
      name: "U.S. Stocks Radar",
      description: "General stock ideas, earnings, momentum, and swing trading setups.",
      privacy: "public",
      category: "tech",
      admins: [byUsername.julia._id],
      members: [byUsername.julia._id, byUsername.alice._id, byUsername.bob._id, byUsername.dana._id, byUsername.eli._id]
    },
    {
      name: "AI & Semiconductors",
      description: "NVDA, AMD, AI infrastructure, chips, and growth names.",
      privacy: "public",
      category: "tech",
      admins: [byUsername.eli._id],
      members: [byUsername.eli._id, byUsername.ido._id, byUsername.alice._id, byUsername.julia._id]
    },
    {
      name: "Swing Traders Lounge",
      description: "Short-term setups, chart patterns, risk management, and execution.",
      privacy: "private",
      category: "other",
      admins: [byUsername.dana._id],
      members: [byUsername.dana._id, byUsername.bob._id, byUsername.eli._id, byUsername.admin._id]
    },
    {
      name: "Macro & News Desk",
      description: "Macro headlines, Fed commentary, market-moving news, and sector rotation.",
      privacy: "public",
      category: "education",
      admins: [byUsername.fiona._id],
      members: [byUsername.fiona._id, byUsername.hila._id, byUsername.alice._id, byUsername.admin._id]
    },
    {
      name: "Magnificent 7 Watch",
      description: "AAPL, MSFT, NVDA, AMZN, META, GOOGL, and TSLA under one roof.",
      privacy: "public",
      category: "tech",
      admins: [byUsername.admin._id],
      members: [byUsername.admin._id, byUsername.alice._id, byUsername.eli._id, byUsername.julia._id, byUsername.bob._id]
    },
    {
      name: "Apple (AAPL) Investors",
      description: "Long-term and swing ideas around Apple earnings, products, and valuation.",
      privacy: "public",
      category: "tech",
      admins: [byUsername.julia._id],
      members: [byUsername.julia._id, byUsername.alice._id, byUsername.bob._id, byUsername.ido._id]
    },
    {
      name: "Tesla (TSLA) Traders",
      description: "TSLA setups, volatility plays, deliveries, and earnings discussion.",
      privacy: "public",
      category: "other",
      admins: [byUsername.bob._id],
      members: [byUsername.bob._id, byUsername.dana._id, byUsername.eli._id, byUsername.admin._id]
    },
    {
      name: "NVIDIA (NVDA) Community",
      description: "NVIDIA, AI chips, datacenter demand, and related trade ideas.",
      privacy: "public",
      category: "tech",
      admins: [byUsername.eli._id],
      members: [byUsername.eli._id, byUsername.ido._id, byUsername.alice._id, byUsername.julia._id]
    },
    {
      name: "Microsoft (MSFT) Investors",
      description: "Cloud, AI, enterprise software, and MSFT valuation thesis discussion.",
      privacy: "public",
      category: "tech",
      admins: [byUsername.ido._id],
      members: [byUsername.ido._id, byUsername.fiona._id, byUsername.alice._id, byUsername.admin._id]
    },
    {
      name: "Amazon (AMZN) Watch",
      description: "E-commerce, AWS, margins, and AMZN growth conversation.",
      privacy: "public",
      category: "tech",
      admins: [byUsername.alice._id],
      members: [byUsername.alice._id, byUsername.julia._id, byUsername.bob._id, byUsername.hila._id]
    },
    {
      name: "Alphabet (GOOGL) Investors",
      description: "Search, cloud, ads, Gemini, and GOOGL fundamentals.",
      privacy: "public",
      category: "tech",
      admins: [byUsername.fiona._id],
      members: [byUsername.fiona._id, byUsername.eli._id, byUsername.julia._id, byUsername.admin._id]
    },
    {
      name: "Meta (META) Traders",
      description: "META price action, ad trends, AI spend, and quarterly results.",
      privacy: "public",
      category: "tech",
      admins: [byUsername.dana._id],
      members: [byUsername.dana._id, byUsername.bob._id, byUsername.charlie._id, byUsername.admin._id]
    },
    {
      name: "S&P 500 Blue Chips",
      description: "Discussion focused on top quality S&P 500 companies and allocation.",
      privacy: "public",
      category: "education",
      admins: [byUsername.admin._id],
      members: [byUsername.admin._id, byUsername.alice._id, byUsername.fiona._id, byUsername.gal._id]
    },
    {
      name: "Banking Giants (JPM, BAC)",
      description: "Major U.S. banks, rates sensitivity, and financial sector sentiment.",
      privacy: "public",
      category: "other",
      admins: [byUsername.gal._id],
      members: [byUsername.gal._id, byUsername.bob._id, byUsername.fiona._id, byUsername.admin._id]
    },
    {
      name: "Energy Majors (XOM, CVX)",
      description: "Oil and gas majors, commodity trends, and dividend-focused ideas.",
      privacy: "public",
      category: "other",
      admins: [byUsername.hila._id],
      members: [byUsername.hila._id, byUsername.gal._id, byUsername.fiona._id, byUsername.admin._id]
    },
    {
      name: "Healthcare Leaders (LLY, JNJ)",
      description: "Pharma and healthcare leaders, pipeline updates, and defensive setups.",
      privacy: "public",
      category: "education",
      admins: [byUsername.fiona._id],
      members: [byUsername.fiona._id, byUsername.hila._id, byUsername.julia._id, byUsername.admin._id]
    }
  ];

  const newGroups = [];
  for (const spec of groupSpecs) {
    const created = await Group.create(spec);
    newGroups.push(created);
  }

  const ensuredPreserved = [...preservedGroups];
  if (!preservedByName["salva world"]) {
    ensuredPreserved.push(await Group.create({
      name: "salva world",
      description: "Legacy community preserved by request.",
      privacy: "public",
      category: "other",
      admins: [byUsername.admin._id],
      members: [byUsername.admin._id]
    }));
  }
  if (!preservedByName["salva world private"]) {
    ensuredPreserved.push(await Group.create({
      name: "salva world private",
      description: "Legacy private community preserved by request.",
      privacy: "private",
      category: "other",
      admins: [byUsername.admin._id],
      members: [byUsername.admin._id]
    }));
  }

  const preservedMap = Object.fromEntries(ensuredPreserved.map(group => [group.name, group]));
  newGroups.push(...ensuredPreserved);

  const groupByName = Object.fromEntries(newGroups.map(group => [group.name, group]));

  const daysAgo = (n) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d;
  };

  const postData = [
    { author: byUsername.alice._id, content: "Bitcoin is holding up well above key support. I still think the next move depends on macro data this week.", group: groupByName["Bitcoin Traders"]._id, createdAt: daysAgo(20) },
    { author: byUsername.alice._id, content: "Good morning traders! Watching the pre-market movers before the open.", createdAt: daysAgo(5) },
    { author: byUsername.alice._id, content: "NVDA and the whole chip sector are still the main story. What are you watching today?", group: groupByName["AI & Semiconductors"]._id, createdAt: daysAgo(3) },

    { author: byUsername.bob._id, content: "What a clean breakout on AAPL last night. The market is still rewarding quality names.", group: groupByName["U.S. Stocks Radar"]._id, createdAt: daysAgo(18) },
    { author: byUsername.bob._id, content: "Starting my watchlist review before the open. Looking for momentum and volume.", createdAt: daysAgo(7) },
    { author: byUsername.bob._id, content: "Anyone tracking TSLA earnings setup this week? Let's compare notes.", group: groupByName["U.S. Stocks Radar"]._id, createdAt: daysAgo(2) },

    { author: byUsername.charlie._id, content: "ETH still feels like the strongest large-cap crypto ecosystem play to me.", group: groupByName["Ethereum Watch"]._id, createdAt: daysAgo(15) },
    { author: byUsername.charlie._id, content: "Watching altcoin rotation carefully. Risk appetite is back in parts of the market.", createdAt: daysAgo(8) },
    { author: byUsername.charlie._id, content: "Stablecoins and gas fees are still the hidden story for crypto traders.", group: groupByName["Ethereum Watch"]._id, createdAt: daysAgo(1) },

    { author: byUsername.dana._id, content: "Swing trade idea: a tight risk setup with clear invalidation is better than chasing.", group: groupByName["Swing Traders Lounge"]._id, createdAt: daysAgo(12) },
    { author: byUsername.dana._id, content: "Playing the trend on semis until it breaks structure. Discipline first.", group: groupByName["Swing Traders Lounge"]._id, createdAt: daysAgo(4) },
    { author: byUsername.dana._id, content: "Risk management is the real edge. Great setups only matter if position sizing is sane.", createdAt: daysAgo(9) },

    { author: byUsername.eli._id, content: "AI infrastructure names keep surprising to the upside. Semis are still leading the tape.", group: groupByName["AI & Semiconductors"]._id, createdAt: daysAgo(22) },
    { author: byUsername.eli._id, content: "Launched a new watchlist for high-conviction growth names today.", createdAt: daysAgo(6) },
    { author: byUsername.eli._id, content: "NVDA has been the market's heartbeat for a while. I am watching volume closely.", group: groupByName["AI & Semiconductors"]._id, createdAt: daysAgo(1) },

    { author: byUsername.fiona._id, content: "Macro news is driving the intraday move again. Stay patient and wait for confirmation.", group: groupByName["Macro & News Desk"]._id, createdAt: daysAgo(25) },
    { author: byUsername.fiona._id, content: "Reading CPI and Fed commentary like a trader reads a chart.", createdAt: daysAgo(10) },
    { author: byUsername.fiona._id, content: "This week's economic calendar matters more than most people think.", group: groupByName["Macro & News Desk"]._id, createdAt: daysAgo(3) },

    { author: byUsername.gal._id, content: "Watching energy and banks for rotation while the index chops sideways.", group: groupByName["U.S. Stocks Radar"]._id, createdAt: daysAgo(14) },
    { author: byUsername.gal._id, content: "Rest day for the portfolio too. Sometimes cash is a position.", createdAt: daysAgo(11) },

    { author: byUsername.hila._id, content: "Gold is acting like a quiet hedge again. Precious metals deserve a spot on the watchlist.", createdAt: daysAgo(13) },
    { author: byUsername.hila._id, content: "Commodities and defensive plays are worth watching when tech gets crowded.", group: groupByName["Macro & News Desk"]._id, createdAt: daysAgo(5) },

    { author: byUsername.ido._id, content: "Market structure is more important than the headline. The chart usually tells the truth first.", group: groupByName["Swing Traders Lounge"]._id, createdAt: daysAgo(16) },
    { author: byUsername.ido._id, content: "Breakouts fail more often when volume doesn't confirm. Patience saves money.", createdAt: daysAgo(8) },

    { author: byUsername.julia._id, content: "A clean watchlist beats a huge noisy one. Simplicity helps execution.", group: groupByName["U.S. Stocks Radar"]._id, createdAt: daysAgo(17) },
    { author: byUsername.julia._id, content: "Diversification is still underrated, especially for newer investors.", createdAt: daysAgo(4) },

    { author: byUsername.admin._id, content: "Welcome to TradeCircle! Follow markets, join asset communities, and share trade ideas responsibly.", createdAt: daysAgo(30) },
  ];

  const posts = await Post.insertMany(postData);
  console.log(`Created ${posts.length} posts`);

  if (preservedMap["salva world"] || preservedMap["salva world private"]) {
    console.log("Preserved legacy salva groups");
  }

  console.log("Seed reset complete for TradeCircle groups.");
  await mongoose.disconnect();
}

resetGroups().catch(err => { console.error("Reset groups failed:", err); process.exit(1); });