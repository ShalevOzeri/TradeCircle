const jwt = require("jsonwebtoken");
const Message = require("../models/Message");
const User = require("../models/User");
const Group = require("../models/Group");

const onlineUsers = new Map();

function addOnline(userId, socketId) {
  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
  onlineUsers.get(userId).add(socketId);
}
function removeOnline(userId, socketId) {
  const set = onlineUsers.get(userId);
  if (!set) return;
  set.delete(socketId);
  if (set.size === 0) onlineUsers.delete(userId);
}

module.exports = function registerChatHandlers(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Auth token missing"));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.username = decoded.username;
      next();
    } catch (err) { next(new Error("Invalid token")); }
  });

  io.on("connection", (socket) => {
    const { userId, username } = socket;
    console.log(`[socket] ${username} connected (${socket.id})`);

    addOnline(userId, socket.id);
    socket.join(`user:${userId}`);
    io.emit("user:online", { userId });

    socket.on("message:send", async (data, ack) => {
      try {
        const { to, text } = data;
        if (!to || !text || !text.trim()) return ack?.({ ok: false, error: "Recipient and text required" });
        if (text.length > 1000) return ack?.({ ok: false, error: "Message too long" });
        const recipient = await User.findById(to).select("_id");
        if (!recipient) return ack?.({ ok: false, error: "Recipient not found" });

        const msg = await Message.create({ from: userId, to, text: text.trim() });
        const populated = await msg.populate("from", "username fullName avatarUrl");

        io.to(`user:${to}`).emit("message:new", populated);
        io.to(`user:${userId}`).emit("message:new", populated);

        ack?.({ ok: true, message: populated });
      } catch (err) {
        console.error("[socket] message:send", err);
        ack?.({ ok: false, error: "Server error" });
      }
    });

    socket.on("message:read", async ({ fromUserId }) => {
      try {
        await Message.updateMany(
          { from: fromUserId, to: userId, read: false },
          { $set: { read: true } }
        );
        io.to(`user:${fromUserId}`).emit("message:read", { by: userId });
      } catch (err) { console.error("[socket] message:read", err); }
    });

    socket.on("typing:start", ({ to }) => io.to(`user:${to}`).emit("typing:start", { from: userId }));
    socket.on("typing:stop",  ({ to }) => io.to(`user:${to}`).emit("typing:stop",  { from: userId }));

    socket.on("group:watch", async ({ groupId }, ack) => {
      try {
        if (!groupId) return ack?.({ ok: false, error: "Group ID is required" });
        const group = await Group.findById(groupId).select("_id privacy members admins");
        if (!group) return ack?.({ ok: false, error: "Group not found" });

        const canSee = group.privacy === "public" || group.canUserSee(userId) || group.isAdmin(userId);
        if (!canSee) return ack?.({ ok: false, error: "Not allowed to watch this group" });

        socket.join(`group:${groupId}`);
        ack?.({ ok: true });
      } catch (err) {
        console.error("[socket] group:watch", err);
        ack?.({ ok: false, error: "Server error" });
      }
    });

    socket.on("group:unwatch", ({ groupId }) => {
      if (!groupId) return;
      socket.leave(`group:${groupId}`);
    });

    socket.on("disconnect", () => {
      removeOnline(userId, socket.id);
      if (!onlineUsers.has(userId)) io.emit("user:offline", { userId });
      console.log(`[socket] ${username} disconnected`);
    });
  });
};