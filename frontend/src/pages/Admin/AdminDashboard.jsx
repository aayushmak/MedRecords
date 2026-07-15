import React, { useEffect, useState } from "react";
import api from "../../services/api";

function StatCard({ label, value }) {
  return (
    <div className="card text-center">
      <p className="text-3xl font-semibold text-primary">{value ?? "-"}</p>
      <p className="text-sm text-muted mt-1">{label}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [{ data: ov }, { data: us }] = await Promise.all([
          api.get("/admin/overview"),
          api.get("/admin/users"),
        ]);
        setOverview(ov);
        setUsers(us.users);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load admin data");
      }
    }
    load();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-xl font-semibold text-ink mb-1">System overview</h1>
      <p className="text-sm text-muted mb-6">Read-only view of registered users and activity.</p>

      {error && <p className="text-danger text-sm mb-4">{error}</p>}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatCard label="Patients" value={overview?.patients} />
        <StatCard label="Doctors" value={overview?.doctors} />
        <StatCard label="Records" value={overview?.records} />
        <StatCard label="Access requests" value={overview?.requests} />
      </div>

      <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
        Registered users
      </h2>
      <div className="card divide-y divide-border p-0 overflow-hidden">
        {users.map((u) => (
          <div key={u._id} className="flex items-center justify-between px-5 py-3">
            <div>
              <p className="font-medium text-ink">{u.name}</p>
              <p className="text-xs text-muted">{u.email}</p>
            </div>
            <div className="text-right">
              <p className="text-xs capitalize text-primary font-medium">{u.role}</p>
              <p className="text-xs text-muted font-mono">{u.walletAddress}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
