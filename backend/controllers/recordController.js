const fs = require("fs");
const crypto = require("crypto");
const path = require("path");
const MedicalRecord = require("../models/MedicalRecord");
const AccessRequest = require("../models/AccessRequest");
const User = require("../models/User");

function sha256File(filePath) {
  const buffer = fs.readFileSync(filePath);
  return "0x" + crypto.createHash("sha256").update(buffer).digest("hex");
}

const RECORD_TYPES = ["PDF Report", "Prescription", "Medical Image", "Lab Report", "Other"];

// POST /api/records  (patient only, multipart/form-data: file, recordType, chainRecordId, chainTxHash)
async function uploadRecord(req, res) {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const fileHash = sha256File(req.file.path);
    const recordType = RECORD_TYPES.includes(req.body.recordType) ? req.body.recordType : "Other";

    const record = await MedicalRecord.create({
      patientId: req.user.id,
      fileName: req.file.originalname,
      fileURL: `/uploads/${req.file.filename}`,
      fileHash,
      recordType,
      chainRecordId: req.body.chainRecordId ? Number(req.body.chainRecordId) : undefined,
      chainTxHash: req.body.chainTxHash || undefined,
    });

    res.status(201).json({ record, fileHash });
  } catch (err) {
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
}

// GET /api/records/mine  (patient only)
async function getMyRecords(req, res) {
  const records = await MedicalRecord.find({ patientId: req.user.id }).sort({ uploadDate: -1 });
  res.json({ records });
}

// GET /api/records/patient/:patientId  (doctor only, requires approved AccessRequest)
async function getPatientRecordsForDoctor(req, res) {
  const { patientId } = req.params;

  const approved = await AccessRequest.findOne({
    patientId,
    doctorId: req.user.id,
    requestStatus: "approved",
  });

  if (!approved) {
    return res.status(403).json({ message: "Access not granted for this patient" });
  }

  const records = await MedicalRecord.find({ patientId }).sort({ uploadDate: -1 });
  const patient = await User.findById(patientId).select("name email walletAddress");
  res.json({ records, patient });
}

// GET /api/records/:id/download
async function downloadRecord(req, res) {
  const record = await MedicalRecord.findById(req.params.id);
  if (!record) return res.status(404).json({ message: "Record not found" });

  const isOwner = String(record.patientId) === String(req.user.id);

  if (!isOwner) {
    const approved = await AccessRequest.findOne({
      patientId: record.patientId,
      doctorId: req.user.id,
      requestStatus: "approved",
    });
    if (!approved) return res.status(403).json({ message: "Access not granted for this record" });
  }

  const absolutePath = path.join(__dirname, "..", record.fileURL);
  if (!fs.existsSync(absolutePath)) return res.status(404).json({ message: "File missing on server" });

  res.download(absolutePath, record.fileName);
}

// DELETE /api/records/:id  (owner only)
async function removeRecord(req, res) {
  const record = await MedicalRecord.findById(req.params.id);
  if (!record) return res.status(404).json({ message: "Record not found" });
  if (String(record.patientId) !== String(req.user.id)) {
    return res.status(403).json({ message: "Only the owning patient can delete this record" });
  }

  const absolutePath = path.join(__dirname, "..", record.fileURL);
  if (fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath);

  await record.deleteOne();
  res.json({ message: "Record deleted" });
}

module.exports = {
  uploadRecord,
  getMyRecords,
  getPatientRecordsForDoctor,
  downloadRecord,
  removeRecord,
};
