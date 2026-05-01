require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
const User = require("../models/User");
const Group = require("../models/Group");
const Post = require("../models/Post");
const Message = require("../models/Message");

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const usernames = ["alice", "bob", "charlie", "dana", "eli", "fiona", "gal", "hila", "ido", "julia", "admin"];
  const users = await User.find({ username: { $in: usernames } });
  const byUsername = Object.fromEntries(users.map(user => [user.username, user]));

  const groupNames = [
    "U.S. Stocks Radar",
    "Magnificent 7 Watch",
    "Apple (AAPL) Investors",
    "Tesla (TSLA) Traders",
    "NVIDIA (NVDA) Community",
    "Microsoft (MSFT) Investors",
    "Macro & News Desk"
  ];
  const groups = await Group.find({ name: { $in: groupNames } });
  const byGroupName = Object.fromEntries(groups.map(group => [group.name, group]));

  const ensureMessage = async ({ from, to, text, createdAt }) => {
    const exists = await Message.findOne({ from: from._id, to: to._id, text });
    if (exists) return false;
    await Message.create({ from: from._id, to: to._id, text, read: true, createdAt });
    return true;
  };

  const ensurePost = async ({ author, group, content, marketMentions, createdAt }) => {
    const exists = await Post.findOne({ author: author._id, group: group?._id || null, content });
    if (exists) return false;
    await Post.create({
      author: author._id,
      group: group?._id || null,
      content,
      mediaType: "none",
      mediaUrl: "",
      tags: [],
      marketMentions: marketMentions || [],
      createdAt
    });
    return true;
  };

  const addedMessages = [
    { from: byUsername.alice, to: byUsername.fiona, text: "The dollar is still driving the whole tape. If USD/ILS keeps climbing, that matters for local investors too.", createdAt: new Date(Date.now() - 15 * 60 * 60 * 1000) },
    { from: byUsername.fiona, to: byUsername.alice, text: "Exactly. FX is the silent variable behind equity returns. I keep a close eye on EUR/ILS, GBP/ILS and JPY/ILS every morning.", createdAt: new Date(Date.now() - 14 * 60 * 60 * 1000) },
    { from: byUsername.bob, to: byUsername.eli, text: "Are you still bullish on MSFT after the last run? It feels like one of the safest mega-cap names.", createdAt: new Date(Date.now() - 13 * 60 * 60 * 1000) },
    { from: byUsername.eli, to: byUsername.bob, text: "Yes. Azure and AI spend still justify a premium. I would rather own MSFT than chase a random momentum name.", createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000) },
    { from: byUsername.charlie, to: byUsername.hila, text: "BTC and gold both feel like protection trades when the macro picture gets noisy.", createdAt: new Date(Date.now() - 11 * 60 * 60 * 1000) },
    { from: byUsername.hila, to: byUsername.charlie, text: "Agreed. I like having both in the watchlist. Different narratives, same hedge instinct.", createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000) },
    { from: byUsername.julia, to: byUsername.dana, text: "AAPL and AMZN are both quality names, but I prefer to buy them after a clean consolidation rather than into strength.", createdAt: new Date(Date.now() - 9 * 60 * 60 * 1000) },
    { from: byUsername.dana, to: byUsername.julia, text: "That is exactly the swing trader's edge. Price gives you better risk if you wait for the pullback.", createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000) },
    { from: byUsername.admin, to: byUsername.alice, text: "Reminder: the new demo groups now include famous stock communities. The app should feel much closer to the product vision.", createdAt: new Date(Date.now() - 7 * 60 * 60 * 1000) },
  ];

  let insertedMessages = 0;
  for (const item of addedMessages) {
    insertedMessages += await ensureMessage(item) ? 1 : 0;
  }

  const addedPosts = [
    {
      author: byUsername.admin,
      group: byGroupName["Magnificent 7 Watch"],
      content: "Magnificent 7 watchlist update: AAPL, MSFT, NVDA, AMZN, META, GOOGL, and TSLA remain the market's main leadership basket. This group is for tracking the mega-cap trend together.",
      marketMentions: [],
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
    },
    {
      author: byUsername.eli,
      group: byGroupName["NVIDIA (NVDA) Community"],
      content: "NVDA continues to set the tone for the AI trade. If chip breadth expands from here, semis can keep leading the market higher.",
      marketMentions: [],
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000)
    },
    {
      author: byUsername.bob,
      group: byGroupName["Apple (AAPL) Investors"],
      content: "AAPL remains the cleanest large-cap consumer tech name in my book. I prefer it as a core holding over pure momentum names.",
      marketMentions: [],
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
    },
    {
      author: byUsername.dana,
      group: byGroupName["Tesla (TSLA) Traders"],
      content: "TSLA is the perfect example of why risk management matters. Great for trading, not always ideal for oversized positions.",
      marketMentions: [],
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000)
    },
    {
      author: byUsername.fiona,
      group: byGroupName["Microsoft (MSFT) Investors"],
      content: "MSFT is the kind of name you can hold through volatility because the cloud + AI + software stack gives it durable earnings power.",
      marketMentions: [],
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      author: byUsername.alice,
      group: byGroupName["Macro & News Desk"],
      content: "FX volatility matters more than most retail traders realize. A move in USD/ILS can change the local return on U.S. assets even if the stock itself is flat.",
      marketMentions: [],
      createdAt: new Date(Date.now() - 90 * 60 * 1000)
    },
  ];

  let insertedPosts = 0;
  for (const item of addedPosts) {
    insertedPosts += await ensurePost(item) ? 1 : 0;
  }

  console.log(`Inserted ${insertedPosts} demo posts and ${insertedMessages} demo messages`);
  await mongoose.disconnect();
}

run().catch(err => {
  console.error("augment demo data failed:", err);
  process.exit(1);
});