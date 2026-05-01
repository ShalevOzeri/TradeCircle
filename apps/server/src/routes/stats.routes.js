const express = require("express");
const auth = require("../middleware/auth");
const c = require("../controllers/statsController");

const router = express.Router();
router.use(auth);

router.get("/posts-per-month", c.postsPerMonth);
router.get("/top-groups", c.topGroups);
router.get("/user-activity/:userId", c.userActivity);

module.exports = router;