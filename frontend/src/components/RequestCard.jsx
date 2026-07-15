import React from "react";
import StatusBadge from "./StatusBadge";

export default function RequestCard({ request, personLabel, person, actions, busy }) {
  return (
    <div className="card flex items-center justify-between">
      <div>
        <p className="font-medium text-ink">{person?.name || "Unknown"}</p>
        <p className="text-xs text-muted">{person?.email}</p>
        <p className="text-xs text-muted font-mono">{person?.walletAddress}</p>
        <p className="text-xs text-muted mt-1">
          {personLabel} · requested {new Date(request.createdAt).toLocaleString()}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <StatusBadge status={request.requestStatus} />
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
    </div>
  );
}
