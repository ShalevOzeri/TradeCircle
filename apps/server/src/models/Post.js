const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text:   { type: String, required: true, maxlength: 500 },
  createdAt: { type: Date, default: Date.now }
});

const postSchema = new mongoose.Schema({
  author:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  group:    { type: mongoose.Schema.Types.ObjectId, ref: "Group", default: null },
  content:  { type: String, required: true, maxlength: 2000 },
  mediaType:{ type: String, enum: ["none", "image", "video"], default: "none" },
  mediaUrl: { type: String, default: "" },
  tags:     [{ type: String, lowercase: true, trim: true }],
  marketMentions: [{
    symbol: { type: String },
    name:   { type: String },
    price:  { type: Number },
    change: { type: Number },
    type:   { type: String },
    sector: { type: String },
  }],
  likes:    [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  comments: [commentSchema]
}, { timestamps: true });

postSchema.index({ content: "text", tags: "text" });
postSchema.index({ createdAt: -1 });
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ group: 1, createdAt: -1 });

module.exports = mongoose.model("Post", postSchema);