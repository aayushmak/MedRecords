const AccessRequest = require("../models/AccessRequest");
const User = require("../models/User");

// POST /api/access/request  (doctor only) { patientWalletAddress, chainRequestId, chainTxHash }
async function requestAccess(req, res) {
  try {
    const { patientWalletAddress, chainRequestId, chainTxHash } = req.body;
    if (!patientWalletAddress) {
      return res.status(400).json({ message: "patientWalletAddress is required" });
    }

    const patient = await User.findOne({
      walletAddress: patientWalletAddress.toLowerCase(),
      role: "patient",
    });
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const existingPending = await AccessRequest.findOne({
      patientId: patient._id,
      doctorId: req.user.id,
      requestStatus: "pending",
    });
    if (existingPending) {
      return res.status(409).json({ message: "A pending request already exists for this patient" });
    }

    const request = await AccessRequest.create({
      patientId: patient._id,
      doctorId: req.user.id,
      requestStatus: "pending",
      chainRequestId,
      chainTxHash,
    });

    res.status(201).json({ request });
  } catch (err) {
    res.status(500).json({ message: "Request failed", error: err.message });
  }
}

// GET /api/access/incoming  (patient only) - requests awaiting this patient's decision
async function getIncomingRequests(req, res) {
  const requests = await AccessRequest.find({ patientId: req.user.id })
    .populate("doctorId", "name email walletAddress")
    .sort({ createdAt: -1 });
  res.json({ requests });
}

// GET /api/access/mine  (doctor only) - requests this doctor has sent
async function getMyRequests(req, res) {
  const requests = await AccessRequest.find({ doctorId: req.user.id })
    .populate("patientId", "name email walletAddress")
    .sort({ createdAt: -1 });
  res.json({ requests });
}

async function updateStatus(req, res, newStatus) {
  const request = await AccessRequest.findById(req.params.id);
  if (!request) return res.status(404).json({ message: "Request not found" });
  if (String(request.patientId) !== String(req.user.id)) {
    return res.status(403).json({ message: "Only the patient can update this request" });
  }
  if (newStatus !== "revoked" && request.requestStatus !== "pending") {
    return res.status(400).json({ message: `Request already ${request.requestStatus}` });
  }
  if (newStatus === "revoked" && request.requestStatus !== "approved") {
    return res.status(400).json({ message: "Only approved requests can be revoked" });
  }

  request.requestStatus = newStatus;
  if (req.body.chainTxHash) request.chainTxHash = req.body.chainTxHash;
  await request.save();
  res.json({ request });
}

// PUT /api/access/:id/grant
const grantAccess = (req, res) => updateStatus(req, res, "approved");
// PUT /api/access/:id/reject
const rejectAccess = (req, res) => updateStatus(req, res, "rejected");
// PUT /api/access/:id/revoke
const revokeAccess = (req, res) => updateStatus(req, res, "revoked");

module.exports = {
  requestAccess,
  getIncomingRequests,
  getMyRequests,
  grantAccess,
  rejectAccess,
  revokeAccess,
};
