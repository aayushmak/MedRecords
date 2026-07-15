const mongoose = require("mongoose");

const medicalRecordSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fileName: { type: String, required: true },
    fileURL: { type: String, required: true }, // local path now, IPFS CID later
    fileHash: { type: String, required: true }, // SHA-256 hex, mirrors on-chain hash
    recordType: {
      type: String,
      enum: ["PDF Report", "Prescription", "Medical Image", "Lab Report", "Other"],
      default: "Other",
    },
    chainRecordId: { type: Number }, // id returned by the smart contract, once written
    chainTxHash: { type: String }, // blockchain transaction hash
    uploadDate: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

module.exports = mongoose.model("MedicalRecord", medicalRecordSchema);
