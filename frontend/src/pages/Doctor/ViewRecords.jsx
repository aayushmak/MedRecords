import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../services/api";
import RecordCard from "../../components/RecordCard";

export default function ViewRecords() {
  const { patientId } = useParams();
  const [records, setRecords] = useState([]);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data } = await api.get(`/records/patient/${patientId}`);
        setRecords(data.records);
        setPatient(data.patient);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load records");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [patientId]);

  async function handleDownload(record) {
    const res = await api.get(`/records/${record._id}/download`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = record.fileName;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <Link to="/doctor" className="text-sm text-primary">
        &larr; Back to dashboard
      </Link>

      <div className="mt-3 mb-6">
        <h1 className="text-xl font-semibold text-ink">
          {patient ? `${patient.name}'s records` : "Patient records"}
        </h1>
        {patient && <p className="text-sm text-muted">{patient.email}</p>}
      </div>

      {loading && <p className="text-muted text-sm">Loading...</p>}
      {error && <p className="text-danger text-sm">{error}</p>}

      {!loading && records.length === 0 && !error && (
        <div className="card text-center py-12">
          <p className="text-muted">This patient hasn't uploaded any records yet.</p>
        </div>
      )}

      <div className="space-y-3">
        {records.map((r) => (
          <RecordCard key={r._id} record={r} onDownload={handleDownload} />
        ))}
      </div>
    </div>
  );
}
