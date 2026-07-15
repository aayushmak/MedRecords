const express = require("express");
const router = express.Router();
const { protect, requireRole } = require("../middleware/auth");
const { getOverview, getUsers } = require("../controllers/adminController");

router.get("/overview", protect, requireRole("admin"), getOverview);
router.get("/users", protect, requireRole("admin"), getUsers);

module.exports = router;
