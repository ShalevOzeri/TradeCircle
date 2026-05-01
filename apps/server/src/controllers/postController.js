const Post = require("../models/Post");
const Group = require("../models/Group");
const User = require("../models/User");
const { getIO } = require("../sockets/io");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadsDir = path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const safeExt = path.extname(file.originalname || "").toLowerCase();
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype?.startsWith("image/") || file.mimetype?.startsWith("video/")) {
      cb(null, true);
      return;
    }
    cb(new Error("Only image/video files are allowed"));
  }
});

exports.uploadMedia = (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "File too large (max 500MB)" });
      }
      return res.status(400).json({ message: err.message || "Upload failed" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const mediaType = req.file.mimetype.startsWith("image/") ? "image" : "video";
    const proto = req.get("x-forwarded-proto") || req.protocol;
    const base = process.env.SERVER_URL || `${proto}://${req.get("host")}`;
    const mediaUrl = `${base}/uploads/${req.file.filename}`;
    return res.status(201).json({ mediaUrl, mediaType });
  });
};

exports.create = async (req, res, next) => {
  try {
    const { content, groupId, mediaType, mediaUrl, tags, marketMentions } = req.body;
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: "Content is required" });
    }
    if (groupId) {
      const group = await Group.findById(groupId);
      if (!group) return res.status(404).json({ message: "Group not found" });
      if (!group.members.some(id => id.equals(req.user.id))) {
        return res.status(403).json({ message: "Only group members can post here" });
      }
    }
    const post = await Post.create({
      author: req.user.id,
      group: groupId || null,
      content,
      mediaType: mediaType || "none",
      mediaUrl: mediaUrl || "",
      tags: Array.isArray(tags) ? tags : [],
      marketMentions: Array.isArray(marketMentions) ? marketMentions.slice(0, 5) : []
    });
    const populated = await post.populate("author", "username fullName avatarUrl");

    if (groupId) {
      const io = getIO();
      if (io) io.to(`group:${groupId}`).emit("group:post:new", populated);
    }

    res.status(201).json({ post: populated });
  } catch (err) { next(err); }
};

exports.feed = async (req, res, next) => {
  try {
    const me = await User.findById(req.user.id);
    const myGroups = await Group.find({ members: req.user.id }).select("_id");
    const groupIds = myGroups.map(g => g._id);
    const posts = await Post.find({
      $or: [
        { author: req.user.id },
        { author: { $in: me.friends }, group: null },
        { group: { $in: groupIds } }
      ]
    })
      .populate("author", "username fullName avatarUrl")
      .populate("group", "name privacy")
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ posts });
  } catch (err) { next(err); }
};

exports.byUser = async (req, res, next) => {
  try {
    const visibleGroups = await Group.find({
      $or: [{ privacy: "public" }, { members: req.user.id }]
    }).select("_id");
    const visibleGroupIds = visibleGroups.map(g => g._id);

    const posts = await Post.find({
      author: req.params.userId,
      $or: [{ group: null }, { group: { $in: visibleGroupIds } }]
    })
      .populate("author", "username fullName avatarUrl")
      .populate("group", "name privacy")
      .sort({ createdAt: -1 });
    res.json({ posts });
  } catch (err) { next(err); }
};

exports.byGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });
    if (!group.canUserSee(req.user.id)) {
      return res.status(403).json({ message: "Not a member of this private group" });
    }
    const posts = await Post.find({ group: group._id })
      .populate("author", "username fullName avatarUrl")
      .sort({ createdAt: -1 });
    res.json({ posts });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const allowed = ["content", "mediaType", "mediaUrl", "tags"];
    for (const key of allowed) if (req.body[key] !== undefined) req.post[key] = req.body[key];
    await req.post.save();
    res.json({ post: req.post });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    const isOwner = post.author.equals(req.user.id);
    let isGAdmin = false;
    if (post.group) {
      const group = await Group.findById(post.group);
      isGAdmin = group && group.isAdmin(req.user.id);
    }
    if (!isOwner && !isGAdmin) return res.status(403).json({ message: "Not allowed" });
    const groupId = post.group ? String(post.group) : null;
    await post.deleteOne();

    if (groupId) {
      const io = getIO();
      if (io) io.to(`group:${groupId}`).emit("group:post:deleted", { groupId, postId: String(post._id) });
    }

    res.json({ message: "Post deleted" });
  } catch (err) { next(err); }
};

exports.toggleLike = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    const idx = post.likes.findIndex(id => id.equals(req.user.id));
    if (idx === -1) post.likes.push(req.user.id);
    else post.likes.splice(idx, 1);
    await post.save();
    res.json({ likes: post.likes.length, liked: idx === -1 });
  } catch (err) { next(err); }
};

exports.addComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: "Comment text required" });
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    post.comments.push({ author: req.user.id, text });
    await post.save();
    const populated = await Post.findById(post._id)
      .populate("comments.author", "username fullName avatarUrl");

    if (post.group) {
      const io = getIO();
      if (io) {
        io.to(`group:${post.group}`).emit("group:post:comments", {
          groupId: String(post.group),
          postId: String(post._id),
          comments: populated.comments
        });
      }
    }

    res.json({ comments: populated.comments });
  } catch (err) { next(err); }
};

// ADVANCED SEARCH #1 - posts (7 params)
exports.advancedSearch = async (req, res, next) => {
  try {
    const { q, author, groupId, mediaType, tag, from, to, sortBy } = req.query;
    const filter = {};
    if (q) filter.content = new RegExp(q, "i");
    if (author) filter.author = author;
    if (groupId) {
      const group = await Group.findById(groupId);
      if (!group) return res.status(404).json({ message: "Group not found" });
      if (!group.canUserSee(req.user.id)) return res.status(403).json({ message: "Not a member" });
      filter.group = groupId;
    }
    if (mediaType) filter.mediaType = mediaType;
    if (tag) filter.tags = tag.toLowerCase();
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to)   filter.createdAt.$lte = new Date(to);
    }
    if (!groupId) {
      const myGroups = await Group.find({ members: req.user.id }).select("_id");
      const myGroupIds = myGroups.map(g => g._id);
      filter.$or = [{ group: null }, { group: { $in: myGroupIds } }];
    }
    let sort = { createdAt: -1 };
    if (sortBy === "oldest") sort = { createdAt: 1 };
    if (sortBy === "popular") sort = { "likes.length": -1 };
    const posts = await Post.find(filter)
      .populate("author", "username fullName avatarUrl")
      .populate("group", "name privacy")
      .sort(sort)
      .limit(100);
    res.json({ posts, count: posts.length });
  } catch (err) { next(err); }
};

// ADVANCED SEARCH #2 - groups (5 params)
exports.advancedGroupSearch = async (req, res, next) => {
  try {
    const { q, category, privacy, minMembers, createdAfter } = req.query;
    const filter = {};
    if (q) filter.name = new RegExp(q, "i");
    if (category) filter.category = category;
    if (privacy) filter.privacy = privacy;
    if (createdAfter) filter.createdAt = { $gte: new Date(createdAfter) };

    const pipeline = [{ $match: filter }];
    if (minMembers) {
      pipeline.push({
        $match: { $expr: { $gte: [{ $size: "$members" }, Number(minMembers)] } }
      });
    }
    pipeline.push({ $sort: { createdAt: -1 } }, { $limit: 100 });
    const groups = await Group.aggregate(pipeline);
    res.json({ groups, count: groups.length });
  } catch (err) { next(err); }
};