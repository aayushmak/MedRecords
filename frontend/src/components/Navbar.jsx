import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function shorten(addr) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="border-b border-border bg-white">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <img src="/Med.png" alt="" className="h-12"/>
        {user && (
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-sm text-muted capitalize">{user.role}</span>
            <span className="text-sm text-ink font-medium">{user.name}</span>
            <span className="badge bg-primary-soft text-primary font-mono">
              {shorten(user.walletAddress)}
            </span>
            <button onClick={handleLogout} className="btn-ghost">
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
