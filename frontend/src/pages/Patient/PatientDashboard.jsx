import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import RecordCard from "../../components/RecordCard";

export default function PatientDashboard() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/records/mine");
      setRecords(data.records);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load records");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDownload(record) {
    const res = await api.get(`/records/${record._id}/download`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = record.fileName;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  async function handleDelete(record) {
    if (!window.confirm(`Delete "${record.fileName}"? This cannot be undone.`)) return;
    await api.delete(`/records/${record._id}`);
    load();
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-ink">Your medical records</h1>
          <p className="text-sm text-muted">Stored securely, hash-verified on-chain.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/patient/requests" className="btn-outline">
            Access requests
          </Link>
          <Link to="/patient/upload" className="btn-primary">
            Upload record
          </Link>
        </div>
      </div>

      {loading && <p className="text-muted text-sm">Loading...</p>}
      {error && <p className="text-danger text-sm">{error}</p>}

      {!loading && records.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-muted">No records uploaded yet.</p>
          <Link to="/patient/upload" className="btn-primary mt-4 inline-flex">
            Upload your first record
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {records.map((r) => (
          <RecordCard key={r._id} record={r} onDownload={handleDownload} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  );
}
