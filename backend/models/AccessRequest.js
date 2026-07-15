const mongoose = require("mongoose");

const accessRequestSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    requestStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", "revoked"],
      default: "pending",
    },
    chainRequestId: { type: Number }, // id returned by the smart contract
    chainTxHash: { type: String },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

module.exports = mongoose.model("AccessRequest", accessRequestSchema);
