const express = require("express");
const auth = require("../middleware/auth");
const isPostOwner = require("../middleware/isPostOwner");
const c = require("../controllers/postController");

const router = express.Router();
router.use(auth);

router.get("/search", c.advancedSearch);
router.get("/feed", c.feed);
router.get("/user/:userId", c.byUser);
router.get("/group/:groupId", c.byGroup);

router.post("/upload", c.uploadMedia);
router.post("/", c.create);
router.put("/:id", isPostOwner, c.update);
router.delete("/:id", c.remove);

router.post("/:id/like", c.toggleLike);
router.post("/:id/comments", c.addComment);

module.exports = router;