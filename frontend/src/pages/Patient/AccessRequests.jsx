import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { getContract } from "../../services/web3";
import RequestCard from "../../components/RequestCard";

export default function AccessRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/access/incoming");
      setRequests(data.requests);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDecision(request, decision) {
    setBusyId(request._id);
    setError("");
    try {
      const contract = await getContract();
      let tx;
      if (decision === "grant") {
        tx = await contract.grantAccess(request.chainRequestId);
      } else if (decision === "reject") {
        tx = await contract.rejectAccess(request.chainRequestId);
      } else if (decision === "revoke") {
        tx = await contract.revokeAccess(request.doctorId.walletAddress);
      }
      const receipt = await tx.wait();

      await api.put(`/access/${request._id}/${decision === "grant" ? "grant" : decision}`, {
        chainTxHash: receipt.hash,
      });

      load();
    } catch (err) {
      setError(err.response?.data?.message || err.reason || err.message || "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="text-xl font-semibold text-ink mb-1">Access requests</h1>
      <p className="text-sm text-muted mb-6">
        Approve or reject doctors who request access to your records. You can revoke access at any
        time.
      </p>

      {loading && <p className="text-muted text-sm">Loading...</p>}
      {error && <p className="text-danger text-sm mb-4">{error}</p>}

      {!loading && requests.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-muted">No access requests yet.</p>
        </div>
      )}

      <div className="space-y-3">
        {requests.map((r) => (
          <RequestCard
            key={r._id}
            request={r}
            person={r.doctorId}
            personLabel="Doctor"
            busy={busyId === r._id}
            actions={
              r.requestStatus === "pending" ? (
                <>
                  <button
                    className="btn-primary"
                    disabled={busyId === r._id}
                    onClick={() => handleDecision(r, "grant")}
                  >
                    Approve
                  </button>
                  <button
                    className="btn-outline"
                    disabled={busyId === r._id}
                    onClick={() => handleDecision(r, "reject")}
                  >
                    Reject
                  </button>
                </>
              ) : r.requestStatus === "approved" ? (
                <button
                  className="btn-danger"
                  disabled={busyId === r._id}
                  onClick={() => handleDecision(r, "revoke")}
                >
                  Revoke
                </button>
              ) : null
            }
          />
        ))}
      </div>
    </div>
  );
}
