const Group = require("../models/Group");
const Post = require("../models/Post");
const { getIO } = require("../sockets/io");

function emitGroupMemberUpdate(group, changedUserId = null) {
  const io = getIO();
  if (!io || !group) return;

  io.to(`group:${group._id}`).emit("group:members:updated", {
    groupId: String(group._id),
    changedUserId: changedUserId ? String(changedUserId) : null,
    membersCount: group.members?.length || 0,
    pendingCount: group.pendingRequests?.length || 0
  });
}

exports.create = async (req, res, next) => {
  try {
    const { name, description, privacy, category, coverImage } = req.body;
    const group = await Group.create({
      name, description, privacy, category, coverImage,
      admins: [req.user.id],
      members: [req.user.id]
    });
    res.status(201).json({ group });
  } catch (err) { next(err); }
};

exports.list = async (req, res, next) => {
  try {
    const { q, category, privacy } = req.query;
    const filter = {};
    if (q) filter.name = new RegExp(q, "i");
    if (category) filter.category = category;
    if (privacy) filter.privacy = privacy;
    const groups = await Group.find(filter)
      .populate("admins", "username fullName")
      .sort({ createdAt: -1 });
    res.json({ groups });
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate("admins", "username fullName avatarUrl")
      .populate("members", "username fullName avatarUrl")
      .populate("pendingRequests", "username fullName avatarUrl");
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (group.privacy === "private" && !group.canUserSee(req.user.id)) {
      return res.json({
        group: {
          _id: group._id, name: group.name, privacy: "private",
          description: group.description, category: group.category
        }
      });
    }
    res.json({ group });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const allowed = ["name", "description", "privacy", "category", "coverImage"];
    const updates = {};
    for (const key of allowed) if (req.body[key] !== undefined) updates[key] = req.body[key];
    Object.assign(req.group, updates);
    await req.group.save();
    res.json({ group: req.group });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await Group.findByIdAndDelete(req.params.groupId);
    await Post.deleteMany({ group: req.params.groupId });
    res.json({ message: "Group deleted" });
  } catch (err) { next(err); }
};

exports.requestJoin = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: "Group not found" });
    if (group.members.some(id => id.equals(req.user.id))) {
      return res.status(400).json({ message: "Already a member" });
    }
    if (group.privacy === "public") {
      group.members.push(req.user.id);
      await group.save();
      emitGroupMemberUpdate(group, req.user.id);
      return res.json({ message: "Joined group", group });
    }
    if (group.pendingRequests.some(id => id.equals(req.user.id))) {
      return res.status(400).json({ message: "Request already pending" });
    }
    group.pendingRequests.push(req.user.id);
    await group.save();

    emitGroupMemberUpdate(group, req.user.id);

    const io = getIO();
    if (io) {
      io.to(`group:${group._id}`).emit("group:join-request:new", {
        groupId: String(group._id),
        requesterId: String(req.user.id)
      });

      for (const adminId of group.admins || []) {
        io.to(`user:${adminId}`).emit("group:join-request:new", {
          groupId: String(group._id),
          requesterId: String(req.user.id)
        });
      }
    }

    res.json({ message: "Join request sent, waiting for admin approval" });
  } catch (err) { next(err); }
};

exports.approveJoin = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const group = req.group;
    if (!group.pendingRequests.some(id => id.equals(userId))) {
      return res.status(404).json({ message: "No such pending request" });
    }
    group.pendingRequests = group.pendingRequests.filter(id => !id.equals(userId));
    group.members.push(userId);
    await group.save();

    emitGroupMemberUpdate(group, userId);

    const io = getIO();
    if (io) {
      io.to(`user:${userId}`).emit("group:join-request:approved", {
        groupId: String(group._id)
      });
    }

    res.json({ message: "User approved", group });
  } catch (err) { next(err); }
};

exports.removeMember = async (req, res, next) => {
  try {
    const group = req.group;
    group.members = group.members.filter(id => !id.equals(req.params.userId));
    await group.save();

    emitGroupMemberUpdate(group, req.params.userId);

    const io = getIO();
    if (io) {
      io.to(`user:${req.params.userId}`).emit("group:membership:removed", {
        groupId: String(group._id)
      });
    }

    res.json({ message: "Member removed", group });
  } catch (err) { next(err); }
};