const User = require("../models/User");
const MedicalRecord = require("../models/MedicalRecord");
const AccessRequest = require("../models/AccessRequest");

// GET /api/admin/overview
async function getOverview(req, res) {
  const [patients, doctors, records, requests] = await Promise.all([
    User.countDocuments({ role: "patient" }),
    User.countDocuments({ role: "doctor" }),
    MedicalRecord.countDocuments(),
    AccessRequest.countDocuments(),
  ]);
  res.json({ patients, doctors, records, requests });
}

// GET /api/admin/users
async function getUsers(req, res) {
  const users = await User.find().sort({ createdAt: -1 });
  res.json({ users });
}

module.exports = { getOverview, getUsers };
