const mongoose = require("mongoose");
const Post = require("../models/Post");

exports.postsPerMonth = async (req, res, next) => {
  try {
    const months = Math.min(Number(req.query.months) || 12, 24);
    const { groupId } = req.query;
    const start = new Date();
    start.setMonth(start.getMonth() - (months - 1));
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    const match = { createdAt: { $gte: start } };
    if (groupId) match.group = new mongoose.Types.ObjectId(groupId);

    const data = await Post.aggregate([
      { $match: match },
      { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const result = [];
    for (let i = 0; i < months; i++) {
      const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const found = data.find(x => x._id.year === y && x._id.month === m);
      result.push({
        label: `${y}-${String(m).padStart(2, "0")}`,
        year: y, month: m,
        count: found ? found.count : 0
      });
    }
    res.json({ data: result });
  } catch (err) { next(err); }
};

exports.topGroups = async (req, res, next) => {
  try {
    const days = Math.min(Number(req.query.days) || 30, 365);
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const since = new Date();
    since.setDate(since.getDate() - days);

    const data = await Post.aggregate([
      { $match: { group: { $ne: null }, createdAt: { $gte: since } } },
      { $group: { _id: "$group", postCount: { $sum: 1 } } },
      { $sort: { postCount: -1 } },
      { $limit: limit },
      { $lookup: { from: "groups", localField: "_id", foreignField: "_id", as: "group" } },
      { $unwind: "$group" },
      {
        $project: {
          _id: 0,
          groupId: "$_id",
          name: "$group.name",
          category: "$group.category",
          memberCount: { $size: "$group.members" },
          postCount: 1
        }
      }
    ]);
    res.json({ data, period: { days } });
  } catch (err) { next(err); }
};

exports.userActivity = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.params.userId);
    const [posts, likesAgg, commentsAgg] = await Promise.all([
      Post.countDocuments({ author: userId }),
      Post.aggregate([
        { $match: { author: userId } },
        { $project: { n: { $size: "$likes" } } },
        { $group: { _id: null, total: { $sum: "$n" } } }
      ]),
      Post.aggregate([
        { $match: { author: userId } },
        { $project: { n: { $size: "$comments" } } },
        { $group: { _id: null, total: { $sum: "$n" } } }
      ])
    ]);
    res.json({
      posts,
      likesReceived: likesAgg[0]?.total || 0,
      commentsReceived: commentsAgg[0]?.total || 0
    });
  } catch (err) { next(err); }
};