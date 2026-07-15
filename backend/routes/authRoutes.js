const express = require("express");
const router = express.Router();
const { requestNonce, register, login, me } = require("../controllers/authController");
const { protect } = require("../middleware/auth");

router.post("/nonce", requestNonce);
router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, me);

module.exports = router;
