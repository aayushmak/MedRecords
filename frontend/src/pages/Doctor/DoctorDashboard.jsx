import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import RequestCard from "../../components/RequestCard";

export default function DoctorDashboard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/access/mine");
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

  const approved = requests.filter((r) => r.requestStatus === "approved");

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-ink">Your access requests</h1>
          <p className="text-sm text-muted">Track patients you've requested records from.</p>
        </div>
        <Link to="/doctor/request" className="btn-primary">
          Request patient access
        </Link>
      </div>

      {loading && <p className="text-muted text-sm">Loading...</p>}
      {error && <p className="text-danger text-sm mb-4">{error}</p>}

      {approved.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
            Approved patients
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {approved.map((r) => (
              <Link
                key={r._id}
                to={`/doctor/records/${r.patientId._id}`}
                className="card hover:border-primary transition-colors"
              >
                <p className="font-medium text-ink">{r.patientId.name}</p>
                <p className="text-xs text-muted">{r.patientId.email}</p>
                <p className="text-xs text-primary mt-2">View records &rarr;</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
        All requests
      </h2>
      {!loading && requests.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-muted">You haven't requested access to any patient yet.</p>
        </div>
      )}
      <div className="space-y-3">
        {requests.map((r) => (
          <RequestCard key={r._id} request={r} person={r.patientId} personLabel="Patient" />
        ))}
      </div>
    </div>
  );
}
