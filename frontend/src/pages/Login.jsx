import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { connectWallet, signMessage, isMetaMaskInstalled } from "../services/web3";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [walletAddress, setWalletAddress] = useState("");
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [form, setForm] = useState({ name: "", email: "", role: "patient" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleConnect() {
    setError("");
    try {
      const addr = await connectWallet();
      setWalletAddress(addr);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAuth(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const addr = walletAddress || (await connectWallet());
      if (!walletAddress) setWalletAddress(addr);

      const { data: nonceData } = await api.post("/auth/nonce", { walletAddress: addr });
      const signature = await signMessage(nonceData.message);

      let res;
      if (mode === "login") {
        res = await api.post("/auth/login", { walletAddress: addr, signature });
      } else {
        res = await api.post("/auth/register", {
          walletAddress: addr,
          signature,
          name: form.name,
          email: form.email,
          role: form.role,
        });
      }

      login(res.data.token, res.data.user);
      const role = res.data.user.role;
      navigate(role === "doctor" ? "/doctor" : role === "admin" ? "/admin" : "/patient");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-md ">
        <div className="flex w-full justify-center p-4">
          <img src="/Med.png" alt="" className="h-20 " />
        </div>

        <div className="card">
          <div className="flex rounded-md border border-border overflow-hidden mb-5">
            <button
              className={`flex-1 py-2 text-sm font-medium ${
                mode === "login" ? "bg-primary text-white" : "bg-white text-muted"
              }`}
              onClick={() => setMode("login")}
            >
              Log in
            </button>
            <button
              className={`flex-1 py-2 text-sm font-medium ${
                mode === "register" ? "bg-primary text-white" : "bg-white text-muted"
              }`}
              onClick={() => setMode("register")}
            >
              Register
            </button>
          </div>

          {!isMetaMaskInstalled() && (
            <p className="text-sm text-danger mb-4">
              MetaMask not detected. Install it from metamask.io to continue.
            </p>
          )}

          <button className="btn-outline w-full mb-4" onClick={handleConnect} type="button">
            {walletAddress
              ? `Connected: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
              : "Connect MetaMask Wallet"}
          </button>

          <form onSubmit={handleAuth} className="space-y-4">
            {mode === "register" && (
              <>
                <div>
                  <label className="label">Full name</label>
                  <input
                    className="input"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Jane Doe"
                  />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input
                    className="input"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="jane@example.com"
                  />
                </div>
                <div>
                  <label className="label">I am a</label>
                  <select
                    className="input"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                  >
                    <option value="patient">Patient</option>
                    <option value="doctor">Doctor</option>
                  </select>
                </div>
              </>
            )}

            {error && <p className="text-sm text-danger">{error}</p>}

            <button className="btn-primary w-full" type="submit" disabled={busy}>
              {busy ? "Waiting for signature..." : mode === "login" ? "Sign in with wallet" : "Create account"}
            </button>
          </form>
        </div>

        <p className="text-xs text-center text-muted mt-6">
          No passwords. Your MetaMask signature proves who you are.
        </p>
      </div>
    </div>
  );
}
