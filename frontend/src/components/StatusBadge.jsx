import React from "react";

const STYLES = {
  pending: "badge-pending",
  approved: "badge-approved",
  rejected: "badge-rejected",
  revoked: "badge-revoked",
};

export default function StatusBadge({ status }) {
  return <span className={STYLES[status] || "badge bg-slate-100 text-muted"}>{status}</span>;
}
