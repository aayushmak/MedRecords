const express = require("express");
const router = express.Router();
const { protect, requireRole } = require("../middleware/auth");
const {
  requestAccess,
  getIncomingRequests,
  getMyRequests,
  grantAccess,
  rejectAccess,
  revokeAccess,
} = require("../controllers/accessController");

router.post("/request", protect, requireRole("doctor"), requestAccess);
router.get("/incoming", protect, requireRole("patient"), getIncomingRequests);
router.get("/mine", protect, requireRole("doctor"), getMyRequests);
router.put("/:id/grant", protect, requireRole("patient"), grantAccess);
router.put("/:id/reject", protect, requireRole("patient"), rejectAccess);
router.put("/:id/revoke", protect, requireRole("patient"), revokeAccess);

module.exports = router;
