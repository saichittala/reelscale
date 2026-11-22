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
    <div
      className="login-wrap"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        background: "radial-gradient(ellipse at 50% 18%, rgba(229, 9, 20, 0.08) 0%, #09090b 68%)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "360px",
          background: "rgba(18, 18, 22, 0.8)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "20px",
          padding: "36px 28px 28px",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          boxShadow: "0 24px 60px -12px rgba(0, 0, 0, 0.65)",
          textAlign: "center",
          boxSizing: "border-box",
        }}
      >
        {/* Minimal ReelScale Brandmark */}
        <div style={{ marginBottom: "26px" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
            <img
              src="/assets/logo.svg"
              alt="ReelScale"
              style={{ height: "24px", width: "auto" }}
            />
          </Link>
        </div>

        {/* Clean Typography Header */}
        <div style={{ marginBottom: "24px" }}>
          <h1
            style={{
              fontSize: "19px",
              fontWeight: 600,
              color: "#ffffff",
              letterSpacing: "-0.02em",
              margin: "0 0 5px",
            }}
          >
            Delivery Portal
          </h1>
          <p
            style={{
              fontSize: "13px",
              color: "var(--muted, #8e8e93)",
              margin: 0,
              letterSpacing: "-0.01em",
            }}
          >
            Enter your passcode to access your tracker
          </p>
        </div>

        {/* Minimal Form */}
        <form onSubmit={handleLookup} style={{ textAlign: "left" }}>
          <div style={{ marginBottom: "14px" }}>
            <div style={{ position: "relative", width: "100%" }}>
              <input
                id="client-passcode"
                type={showPassword ? "text" : "password"}
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  if (errorMsg) setErrorMsg("");
                }}
                placeholder="e.g. clientname@123"
                autoFocus
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                style={{
                  width: "100%",
                  height: "44px",
                  background: "rgba(255, 255, 255, 0.04)",
                  border: errorMsg
                    ? "1px solid var(--danger, #ef4444)"
                    : "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  padding: "0 42px 0 14px",
                  color: "#ffffff",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                }}
                onFocus={(e) => {
                  if (!errorMsg) {
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.25)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(255, 255, 255, 0.04)";
                  }
                }}
                onBlur={(e) => {
                  if (!errorMsg) {
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                    e.currentTarget.style.boxShadow = "none";
                  }
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide passcode" : "Show passcode"}
                tabIndex={-1}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  padding: "6px",
                  color: showPassword ? "#ffffff" : "var(--muted, #8e8e93)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "6px",
                  transition: "color 0.15s ease",
                }}
              >
                {showPassword ? <IconEye size={17} /> : <IconEyeOff size={17} />}
              </button>
            </div>

            {errorMsg && (
              <div
                style={{
                  marginTop: "6px",
                  fontSize: "12px",
                  color: "var(--danger, #ef4444)",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                {errorMsg}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSearching || !passcode.trim()}
            style={{
              width: "100%",
              height: "44px",
              background: !passcode.trim()
                ? "rgba(229, 9, 20, 0.35)"
                : "var(--red, #e50914)",
              color: "#ffffff",
              border: "none",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: 500,
              letterSpacing: "-0.01em",
              cursor: !passcode.trim() || isSearching ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              transition: "all 0.2s ease",
              boxShadow: passcode.trim()
                ? "0 4px 16px rgba(229, 9, 20, 0.25)"
                : "none",
            }}
          >
            {isSearching ? (
              <span
                style={{
                  width: "16px",
                  height: "16px",
                  border: "2px solid rgba(255, 255, 255, 0.3)",
                  borderTopColor: "#ffffff",
                  borderRadius: "50%",
                  animation: "spin 0.6s linear infinite",
                  display: "inline-block",
                }}
              />
            ) : (
              <>
                <span>Access Tracker</span>
                <span style={{ fontSize: "15px", lineHeight: 1 }}>→</span>
              </>
            )}
          </button>
        </form>

        {/* Minimal Footer */}
        <div
          style={{
            marginTop: "22px",
            textAlign: "center",
            fontSize: "12px",
            color: "rgba(255, 255, 255, 0.4)",
          }}
        >
          <Link
            href="/"
            style={{
              color: "rgba(255, 255, 255, 0.6)",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              transition: "color 0.15s ease",
            }}
          >
            ← Back to ReelScale
          </Link>
        </div>
      </div>
    </div>
  );
}
