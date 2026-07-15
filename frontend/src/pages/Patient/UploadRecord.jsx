import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { getContract, hashFile } from "../../services/web3";

const TYPES = ["PDF Report", "Prescription", "Medical Image", "Lab Report", "Other"];

export default function UploadRecord() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [recordType, setRecordType] = useState("PDF Report");
  const [step, setStep] = useState(""); // progress label
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) return setError("Choose a file first");
    setError("");
    setBusy(true);

    try {
      setStep("Hashing file...");
      const fileHash = await hashFile(file);

      setStep("Confirm in MetaMask to write the hash on-chain...");
      const contract = await getContract();
      const tx = await contract.addRecord(fileHash, file.name);

      setStep("Waiting for blockchain confirmation...");
      const receipt = await tx.wait();

      let chainRecordId;
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog(log);
          if (parsed?.name === "RecordAdded") {
            chainRecordId = parsed.args.recordId.toString();
            break;
          }
        } catch (_) {
          // log from a different contract, ignore
        }
      }

      setStep("Uploading file to secure storage...");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("recordType", recordType);
      if (chainRecordId) formData.append("chainRecordId", chainRecordId);
      formData.append("chainTxHash", receipt.hash);

      await api.post("/records", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      navigate("/patient");
    } catch (err) {
      setError(err.response?.data?.message || err.reason || err.message || "Upload failed");
    } finally {
      setBusy(false);
      setStep("");
    }
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-8">
      <h1 className="text-xl font-semibold text-ink mb-1">Upload a medical record</h1>
      <p className="text-sm text-muted mb-6">
        The file is stored securely and its hash is written to the blockchain as proof of
        ownership and integrity.
      </p>

      <form onSubmit={handleSubmit} className="card space-y-5">
        <div>
          <label className="label">Record type</label>
          <select className="input" value={recordType} onChange={(e) => setRecordType(e.target.value)}>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">File</label>
          <input
            className="input"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.dcm,.doc,.docx"
            onChange={(e) => setFile(e.target.files[0])}
          />
          <p className="text-xs text-muted mt-1">PDF, image, or document. Max 15MB.</p>
        </div>

        {step && <p className="text-sm text-primary">{step}</p>}
        {error && <p className="text-sm text-danger">{error}</p>}

        <button className="btn-primary w-full" type="submit" disabled={busy}>
          {busy ? "Processing..." : "Upload & anchor on-chain"}
        </button>
      </form>
    </div>
  );
}
