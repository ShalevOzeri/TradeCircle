const express = require("express");
const auth = require("../middleware/auth");
const c = require("../controllers/messageController");

const router = express.Router();
router.use(auth);

router.get("/", c.getInbox);
router.get("/:otherUserId", c.getConversation);

module.exports = router;