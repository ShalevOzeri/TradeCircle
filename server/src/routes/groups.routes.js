const express = require("express");
const auth = require("../middleware/auth");
const isGroupAdmin = require("../middleware/isGroupAdmin");
const c = require("../controllers/groupController");
const postC = require("../controllers/postController");

const router = express.Router();
router.use(auth);

router.get("/search", postC.advancedGroupSearch);

router.post("/", c.create);
router.get("/", c.list);
router.get("/:id", c.getOne);
router.put("/:groupId", isGroupAdmin, c.update);
router.delete("/:groupId", isGroupAdmin, c.remove);

router.post("/:id/join", c.requestJoin);
router.post("/:groupId/approve/:userId", isGroupAdmin, c.approveJoin);
router.delete("/:groupId/members/:userId", isGroupAdmin, c.removeMember);

module.exports = router;