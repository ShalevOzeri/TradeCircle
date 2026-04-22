const User = require("../models/User");
const Post = require("../models/Post");

exports.list = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (q) {
      filter.$or = [
        { username: new RegExp(q, "i") },
        { fullName: new RegExp(q, "i") }
      ];
    }
    const users = await User.find(filter)
      .select("username fullName avatarUrl bio")
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select("username fullName avatarUrl bio friends createdAt")
      .populate("friends", "username fullName avatarUrl");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    if (req.params.id !== req.user.id) {
      return res.status(403).json({ message: "You can only edit your own profile" });
    }
    const allowed = ["fullName", "bio", "avatarUrl"];
    const updates = {};
    for (const key of allowed) if (req.body[key] !== undefined) updates[key] = req.body[key];
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    res.json({ user });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    if (req.params.id !== req.user.id) {
      return res.status(403).json({ message: "You can only delete your own account" });
    }
    await User.findByIdAndDelete(req.params.id);
    await Post.deleteMany({ author: req.params.id });
    res.json({ message: "Account deleted" });
  } catch (err) { next(err); }
};

exports.sendFriendRequest = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ message: "Can't friend yourself" });
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: "User not found" });
    if (target.friends.includes(req.user.id)) return res.status(400).json({ message: "Already friends" });
    if (target.friendRequests.includes(req.user.id)) return res.status(400).json({ message: "Request already sent" });
    target.friendRequests.push(req.user.id);
    await target.save();
    res.json({ message: "Friend request sent" });
  } catch (err) { next(err); }
};

exports.acceptFriendRequest = async (req, res, next) => {
  try {
    const me = await User.findById(req.user.id);
    const requesterId = req.params.requesterId;
    if (!me.friendRequests.some(id => id.equals(requesterId))) {
      return res.status(404).json({ message: "No such friend request" });
    }
    me.friendRequests = me.friendRequests.filter(id => !id.equals(requesterId));
    me.friends.push(requesterId);
    await me.save();
    await User.findByIdAndUpdate(requesterId, { $addToSet: { friends: me._id } });
    res.json({ message: "Friend request accepted" });
  } catch (err) { next(err); }
};