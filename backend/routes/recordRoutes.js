const express = require("express");
const router = express.Router();
const { protect, requireRole } = require("../middleware/auth");
const upload = require("../middleware/upload");
const {
  uploadRecord,
  getMyRecords,
  getPatientRecordsForDoctor,
  downloadRecord,
  removeRecord,
} = require("../controllers/recordController");

router.post("/", protect, requireRole("patient"), upload.single("file"), uploadRecord);
router.get("/mine", protect, requireRole("patient"), getMyRecords);
router.get("/patient/:patientId", protect, requireRole("doctor"), getPatientRecordsForDoctor);
router.get("/:id/download", protect, downloadRecord);
router.delete("/:id", protect, requireRole("patient"), removeRecord);

module.exports = router;
