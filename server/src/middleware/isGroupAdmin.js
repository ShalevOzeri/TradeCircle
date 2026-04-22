const Group = require("../models/Group");

module.exports = async function isGroupAdmin(req, res, next) {
  try {
    const groupId = req.params.groupId || req.body.groupId;
    if (!groupId) return res.status(400).json({ message: "Group ID required" });
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });
    if (!group.isAdmin(req.user.id)) {
      return res.status(403).json({ message: "Only group admins can perform this action" });
    }
    req.group = group;
    next();
  } catch (err) { next(err); }
};