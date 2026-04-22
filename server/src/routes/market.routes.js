const express = require("express");
const auth = require("../middleware/auth");
const c = require("../controllers/marketController");

const router = express.Router();
router.use(auth);

router.get("/quotes", c.getQuotes);
router.get("/history", c.getHistory);

module.exports = router;
