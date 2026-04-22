const Post = require("../models/Post");

module.exports = async function isPostOwner(req, res, next) {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (!post.author.equals(req.user.id)) {
      return res.status(403).json({ message: "You can only edit your own posts" });
    }
    req.post = post;
    next();
  } catch (err) { next(err); }
};