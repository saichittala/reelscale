"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconEye, IconEyeOff } from "../dashboard/components/Icons";

export default function TrackEntryPage() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) return;

    setIsSearching(true);
    setErrorMsg("");

    try {
      // Fetch clients to resolve client ID by passcode (e.g. clientname@123)
      const res = await fetch("https://script.google.com/macros/s/AKfycbwjmC5mDKejUEDSuXsf_7IlhEznHR7vA9pvu1O16DOS8J2Nn6bXNEv_w3xaOuRFAXZS/exec");
      const data = await res.json();
      const list = data.clients || data || [];

      const cleanInput = passcode.trim().toLowerCase().replace(/\s+/g, "");

      const matched = list.find((c: any) => {
        const nameCode = `${String(c.clientName || c.name || "").trim().toLowerCase().replace(/\s+/g, "")}@123`;
        const bizCode = `${String(c.business || "").trim().toLowerCase().replace(/\s+/g, "")}@123`;
        return nameCode === cleanInput || bizCode === cleanInput;
      });

      if (matched) {
        localStorage.setItem(`reelscale_client_auth_${matched.id}`, "true");
        router.push(`/track/${matched.id}`);
      } else {
        setErrorMsg("No active client found with this passcode. Format: clientname@123");
      }
    } catch {
      setErrorMsg("Failed to connect. Please try again or use your direct tracking link.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-logo">
          <Link href="/" className="dashboard-logo" style={{ display: "inline-block", textDecoration: "none" }}>
            <img
              src="/assets/logo.svg"
              alt="ReelScale Logo"
              className="login-icon-frame"
              style={{ height: "28px" }}
            />
          </Link>
        </div>

        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <span
            className="badge badge-gold"
            style={{
              display: "inline-block",
              marginBottom: "12px",
              fontSize: "11px",
            }}
          >
            Client Delivery Portal
          </span>
          <div className="login-title" style={{ margin: "0 0 6px" }}>
            Reels Delivery Portal
          </div>
          <div className="login-sub" style={{ marginBottom: 0 }}>
            Enter your client passcode to access your live monthly delivery tracker and footage.
          </div>
        </div>

        {errorMsg && (
          <div className="login-error">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLookup}>
          <div className="form-group">
            <label htmlFor="client-passcode" className="form-label">
              Secret Passcode
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="client-passcode"
                type={showPassword ? "text" : "password"}
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="e.g. manish@123"
                className="form-input"
                autoFocus
                style={{
                  paddingRight: "40px",
                  borderColor: errorMsg ? "var(--red)" : undefined,
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "var(--muted)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                }}
                title={showPassword ? "hide" : "show"}
              >
                {showPassword ? <IconEye size={18} /> : <IconEyeOff size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSearching || !passcode}
            className="btn btn-primary login-submit-btn"
            style={{
              cursor: !passcode ? "not-allowed" : "pointer",
              opacity: !passcode ? 0.6 : 1,
            }}
          >
            {isSearching ? (
              <>
                <span className="btn-loader"></span> Finding Portal...
              </>
            ) : (
              "Open Delivery Tracker ↗"
            )}
          </button>
        </form>

        <div
          style={{
            marginTop: "24px",
            paddingTop: "16px",
            borderTop: "0.6px solid var(--border)",
            textAlign: "center",
            fontSize: "var(--text-xs)",
            color: "var(--muted)",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Link href="/" className="btn btn-ghost btn-sm" style={{ textDecoration: "none", display: "inline-flex" }}>
            ← Back to ReelScale
          </Link>
        </div>
      </div>
    </div>
  );
}
