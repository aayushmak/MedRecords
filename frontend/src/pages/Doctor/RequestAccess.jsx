import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { isAddress } from "ethers";
import api from "../../services/api";
import { getContract } from "../../services/web3";

export default function RequestAccess() {
  const navigate = useNavigate();
  const [walletAddress, setWalletAddress] = useState("");
  const [step, setStep] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!isAddress(walletAddress)) return setError("Enter a valid wallet address");

    setBusy(true);
    try {
      setStep("Confirm in MetaMask to send the on-chain request...");
      const contract = await getContract();
      const tx = await contract.requestAccess(walletAddress);

      setStep("Waiting for blockchain confirmation...");
      const receipt = await tx.wait();

      let chainRequestId;
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog(log);
          if (parsed?.name === "AccessRequested") {
            chainRequestId = parsed.args.requestId.toString();
            break;
          }
        } catch (_) {
          // ignore unrelated logs
        }
      }

      setStep("Notifying patient...");
      await api.post("/access/request", {
        patientWalletAddress: walletAddress,
        chainRequestId,
        chainTxHash: receipt.hash,
      });

      navigate("/doctor");
    } catch (err) {
      setError(err.response?.data?.message || err.reason || err.message || "Request failed");
    } finally {
      setBusy(false);
      setStep("");
    }
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-8">
      <h1 className="text-xl font-semibold text-ink mb-1">Request patient access</h1>
      <p className="text-sm text-muted mb-6">
        Enter the patient's wallet address. They'll be notified and can approve or reject the
        request.
      </p>

      <form onSubmit={handleSubmit} className="card space-y-5">
        <div>
          <label className="label">Patient wallet address</label>
          <input
            className="input font-mono"
            placeholder="0x..."
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
          />
        </div>

        {step && <p className="text-sm text-primary">{step}</p>}
        {error && <p className="text-sm text-danger">{error}</p>}

        <button className="btn-primary w-full" type="submit" disabled={busy}>
          {busy ? "Processing..." : "Send access request"}
        </button>
      </form>
    </div>
  );
}
