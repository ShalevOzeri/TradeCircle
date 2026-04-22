const mongoose = require("mongoose");
const Message = require("../models/Message");

exports.getConversation = async (req, res, next) => {
  try {
    const me = req.user.id;
    const other = req.params.otherUserId;
    const messages = await Message.find({
      $or: [{ from: me, to: other }, { from: other, to: me }]
    })
      .populate("from", "username fullName avatarUrl")
      .sort({ createdAt: 1 })
      .limit(200);
    res.json({ messages });
  } catch (err) { next(err); }
};

exports.getInbox = async (req, res, next) => {
  try {
    const meId = new mongoose.Types.ObjectId(req.user.id);
    const inbox = await Message.aggregate([
      { $match: { $or: [{ from: meId }, { to: meId }] } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: { $cond: [{ $eq: ["$from", meId] }, "$to", "$from"] },
          lastMessage: { $first: "$$ROOT" },
          unread: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$to", meId] }, { $eq: ["$read", false] }] },
                1, 0
              ]
            }
          }
        }
      },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
      { $unwind: "$user" },
      {
        $project: {
          _id: 0,
          user: { _id: 1, username: 1, fullName: 1, avatarUrl: 1 },
          lastMessage: { text: 1, createdAt: 1, from: 1 },
          unread: 1
        }
      }
    ]);
    res.json({ inbox });
  } catch (err) { next(err); }
};