const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
  description: { type: String, maxlength: 500, default: "" },
  coverImage:  { type: String, default: "" },
  privacy:     { type: String, enum: ["public", "private"], default: "public" },
  admins:      [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
  members:     [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  pendingRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  category:    { type: String, enum: ["general","tech","sports","music","gaming","education","other"], default: "general" }
}, { timestamps: true });

groupSchema.index({ name: "text", description: "text" });

groupSchema.methods.canUserSee = function(userId) {
  if (this.privacy === "public") return true;
  return this.members.some(m => m.equals(userId));
};

groupSchema.methods.isAdmin = function(userId) {
  return this.admins.some(a => a.equals(userId));
};

module.exports = mongoose.model("Group", groupSchema);