const express = require("express");
const auth = require("../middleware/auth");
const c = require("../controllers/userController");

const router = express.Router();
router.use(auth);

router.get("/", c.list);
router.get("/:id", c.getOne);
router.put("/:id", c.update);
router.delete("/:id", c.remove);
router.post("/:id/friend-request", c.sendFriendRequest);
router.post("/friend-request/:requesterId/accept", c.acceptFriendRequest);

module.exports = router;