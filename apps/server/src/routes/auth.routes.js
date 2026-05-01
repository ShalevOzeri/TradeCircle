const express = require("express");
const { body } = require("express-validator");
const c = require("../controllers/authController");
const auth = require("../middleware/auth");

const router = express.Router();

router.post("/register",
  [
    body("username").trim().isLength({ min: 3, max: 30 })
      .matches(/^[a-zA-Z0-9_]+$/).withMessage("Username: 3-30 chars, letters/numbers/underscore only"),
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("fullName").trim().notEmpty()
  ],
  c.register
);

router.post("/login",
  [ body("username").trim().notEmpty(), body("password").notEmpty() ],
  c.login
);

router.get("/me", auth, c.me);

module.exports = router;