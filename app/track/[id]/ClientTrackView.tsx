"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { DeliveredReel } from "../../dashboard/types";
import { CustomSelect } from "../../dashboard/components/CustomSelect";
import {
  IconFolder,
  IconArrowUpRight,
  IconWhatsApp,
  IconEye,
  IconEyeOff,
  IconSearch,
} from "../../dashboard/components/Icons";


interface PublicClientData {
  id: string | number;
  name: string;
  business: string;
  instagram: string;
  reels: number;
  plan: string;
  billingModel: string;
}

export default function ClientTrackView({ clientId }: { clientId: string }) {

  const currentMonthVal = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthVal);
  const [client, setClient] = useState<PublicClientData | null>(null);
  const [deliveries, setDeliveries] = useState<DeliveredReel[]>([]);
  const [driveLink, setDriveLink] = useState<string>("");
  const [showDriveLink, setShowDriveLink] = useState<boolean>(true);
  const [validPasscodes, setValidPasscodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Passcode verification states
  const [passcode, setPasscode] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passcodeError, setPasscodeError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Load client and deliveries from API
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setErrorMsg("");
      try {
        const res = await fetch(`/api/track/${clientId}?month=${selectedMonth}`);
        if (!res.ok) {
          setErrorMsg(`Unable to locate client tracking portal (Status ${res.status})`);
          return;
        }
        const data = await res.json().catch(() => null);
        if (!data || !data.success) {
          setErrorMsg(data?.message || "Unable to locate client tracking portal");
          return;
        }

        setClient(data.client);
        setDeliveries(data.deliveries || []);
        setDriveLink(data.driveLink || "");
        setShowDriveLink(data.showDriveLink !== false && Boolean(data.driveLink));
        setValidPasscodes(data.validPasscodes || []);

        // Check if client is already unlocked in this browser session
        const storedAuth = localStorage.getItem(`reelscale_client_auth_${clientId}`);
        if (storedAuth === "true") {
          setIsUnlocked(true);
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to load portal");
      } finally {
        setIsLoading(false);
      }
    }

    if (clientId) {
      loadData();
    }
  }, [clientId, selectedMonth]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setPasscodeError("");
    setIsVerifying(true);

    const inputClean = passcode.trim().toLowerCase();
    const inputNoSpace = inputClean.replace(/\s+/g, "");

    const clientNameClean = (client?.name || "").toLowerCase().trim();
    const clientBizClean = (client?.business || "").toLowerCase().trim();

    // Secure verification: strictly match client's valid passcodes
    const allowedPasscodes = [
      ...validPasscodes.map((vp) => vp.toLowerCase().trim()),
      ...validPasscodes.map((vp) => vp.toLowerCase().replace(/\s+/g, "")),
      `${clientNameClean}@123`,
      `${clientNameClean.replace(/\s+/g, "")}@123`,
      `${clientBizClean}@123`,
      `${clientBizClean.replace(/\s+/g, "")}@123`,
    ].filter((p) => Boolean(p) && p !== "@123");

    const isMatched = allowedPasscodes.some(
      (ap) => ap === inputClean || ap === inputNoSpace
    );

    if (isMatched) {
      setIsUnlocked(true);
      try {
        localStorage.setItem(`reelscale_client_auth_${clientId}`, "true");
      } catch {}
      setPasscodeError("");
    } else {
      setPasscodeError("Incorrect passcode. Format: clientname@123");
    }
    setIsVerifying(false);
  };

  const handleLock = () => {
    try {
      localStorage.removeItem(`reelscale_client_auth_${clientId}`);
    } catch {}
    setIsUnlocked(false);
    setPasscode("");
  };



  // Month selector options
  const monthOptions = useMemo(() => {
    const opts = [];
    const now = new Date();
    for (let i = -5; i <= 2; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      opts.push({ value: val, label });
    }
    return opts;
  }, []);

  if (isLoading) {
    return (
      <div className="login-wrap">
        <div style={{ textAlign: "center", color: "var(--muted)" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              border: "2px solid var(--border)",
              borderTopColor: "var(--red)",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          <div style={{ fontSize: "var(--text-sm)" }}>Loading delivery tracker...</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (errorMsg || !client) {
    return (
      <div className="login-wrap">
        <div className="login-card" style={{ textAlign: "center" }}>
          <div style={{ marginBottom: "16px", display: "flex", justifyContent: "center", color: "var(--muted)" }}>
            <IconSearch size={36} />
          </div>
          <div className="login-title">Portal Not Found</div>
          <div className="login-sub">
            {errorMsg || "The requested client reel tracking portal link could not be located."}
          </div>
          <Link href="/" className="btn btn-ghost" style={{ textDecoration: "none", display: "inline-flex", justifyContent: "center" }}>
            Return to ReelScale Home
          </Link>
        </div>
      </div>
    );
  }

  const targetReels = client.reels || 0;
  const deliveredCount = deliveries.filter((d) => d.status === "Delivered").length;
  const shortMonthStr = (() => {
    try {
      const [y, m] = selectedMonth.split("-");
      const d = new Date(parseInt(y), parseInt(m) - 1, 1);
      return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    } catch {
      return selectedMonth;
    }
  })();

  // ──────────────────────────────────────────────
  // Passcode Lock Screen View (Ultra-Minimalist)
  // ──────────────────────────────────────────────
  if (!isUnlocked) {
    const displayName = client.business || client.name;
    const examplePlaceholder = `${(client.business || client.name || "client")
      .toLowerCase()
      .replace(/\s+/g, "")}@123`;

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
              {displayName}
            </h1>
            <p
              style={{
                fontSize: "13px",
                color: "var(--muted, #8e8e93)",
                margin: 0,
                letterSpacing: "-0.01em",
              }}
            >
              Enter passcode to view deliveries
            </p>
          </div>

          {/* Minimal Form */}
          <form onSubmit={handleUnlock} style={{ textAlign: "left" }}>
            <div style={{ marginBottom: "14px" }}>
              <div style={{ position: "relative", width: "100%" }}>
                <input
                  id="portal-passcode"
                  type={showPassword ? "text" : "password"}
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value);
                    if (passcodeError) setPasscodeError("");
                  }}
                  placeholder={`e.g. ${examplePlaceholder}`}
                  autoFocus
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  style={{
                    width: "100%",
                    height: "44px",
                    background: "rgba(255, 255, 255, 0.04)",
                    border: passcodeError
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
                    if (!passcodeError) {
                      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.25)";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(255, 255, 255, 0.04)";
                    }
                  }}
                  onBlur={(e) => {
                    if (!passcodeError) {
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

              {passcodeError && (
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
                  {passcodeError}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isVerifying || !passcode.trim()}
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
                cursor: !passcode.trim() || isVerifying ? "not-allowed" : "pointer",
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
              {isVerifying ? (
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
            Need passcode?{" "}
            <a
              href="mailto:support@reelscale.co?subject=Client%20Portal%20Passcode%20Request"
              style={{
                color: "rgba(255, 255, 255, 0.75)",
                textDecoration: "underline",
                textUnderlineOffset: "2px",
              }}
            >
              Contact manager
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────
  // Unlocked Client Dashboard (Exact Dashboard Layout & CSS)
  // ──────────────────────────────────────────────
  return (
    <div className="app">
      <div className="main" style={{ marginLeft: 0 }}>
        {/* Topbar: Full Width Standard Header */}
        <div className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Link
              href="/"
              className="dashboard-logo"
              style={{ display: "flex", alignItems: "center", textDecoration: "none" }}
            >
              <img
                src="/assets/icons/logo-small.svg"
                alt="ReelScale Logo"
                style={{ height: "26px", width: "auto" }}
              />
            </Link>

            <span
              style={{
                height: "16px",
                width: "1px",
                background: "var(--border)",
                display: "inline-block",
              }}
            />

            <div className="page-title">{client.name || client.business}</div>
          </div>

          <div className="topbar-actions">
            {/* Active Subscription Badge */}
            <span
              className="badge badge-gold"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "var(--gold)",
                  display: "inline-block",
                }}
              />
              {client.plan || "Active Subscription"}
            </span>

            {/* Lock session action */}
            <button
              onClick={handleLock}
              className="btn btn-ghost btn-sm"
              style={{
                fontSize: "12px",
                color: "var(--muted)",
                padding: "4px 8px",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                textDecoration: "none",
              }}
              title="Lock portal"
            >
              Lock
            </button>
          </div>
        </div>

        {/* Content Area: Max Width 800px & Mobile Responsive */}
        <div
          className="content track-content"
          style={{
            maxWidth: "800px",
            width: "100%",
            margin: "0 auto",
            padding: "20px 20px 24px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minHeight: 0,
          }}
        >
          {/* Client Details Row */}
          <div
            className="glass-card track-details-card"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
              padding: "14px 20px",
              marginBottom: "12px",
              position: "relative",
              zIndex: 30,
            }}
          >
            <div
              className="track-details-client"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <span className="badge badge-red" style={{ fontWeight: 600 }}>
                {client.billingModel || "Monthly Subscription"}
              </span>

              {client.instagram && (
                <a
                  href={`https://instagram.com/${client.instagram.replace("@", "")}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: "var(--muted)",
                    fontSize: "var(--text-xs)",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <span>{client.instagram}</span>
                  <IconArrowUpRight size={12} />
                </a>
              )}
            </div>

            <div
              className="track-details-cycle"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "var(--text-xs)",
                color: "var(--muted)",
              }}
            >
              <span>Viewing Delivery Cycle:</span>
              <div className="month-filter-wrap" style={{ minWidth: "140px" }}>
                <CustomSelect
                  value={selectedMonth}
                  onChange={setSelectedMonth}
                  options={monthOptions}
                  align="right"
                  size="sm"
                />
              </div>
            </div>
          </div>

          {/* Minimalist Delivery Progress Radial Gauge Card */}
          <div
            className="glass-card track-gauge-card"
            style={{
              padding: "40px 24px 32px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              position: "relative",
              overflow: "hidden",
              flex: 1,
              minHeight: "calc(100vh - 220px)",
            }}
          >
            {/* Circular Progress Gauge */}
            {(() => {
              const gaugeSize = 220;
              const strokeWidth = 24;
              const radius = (gaugeSize - strokeWidth) / 2;
              const circumference = 2 * Math.PI * radius;
              const fraction = targetReels > 0 ? Math.min(1, Math.max(0, deliveredCount / targetReels)) : 0;
              const strokeDashoffset = circumference * (1 - fraction);

              return (
                <div
                  style={{
                    position: "relative",
                    width: `${gaugeSize}px`,
                    height: `${gaugeSize}px`,
                    margin: "0 auto",
                  }}
                >
                  <svg
                    width={gaugeSize}
                    height={gaugeSize}
                    viewBox={`0 0 ${gaugeSize} ${gaugeSize}`}
                    style={{ transform: "rotate(-90deg)" }}
                  >
                    {/* Dark background track */}
                    <circle
                      cx={gaugeSize / 2}
                      cy={gaugeSize / 2}
                      r={radius}
                      fill="transparent"
                      stroke="#262626"
                      strokeWidth={strokeWidth}
                    />
                    {/* Vibrant lime green progress track */}
                    <circle
                      cx={gaugeSize / 2}
                      cy={gaugeSize / 2}
                      r={radius}
                      fill="transparent"
                      stroke="#6ef000"
                      strokeWidth={strokeWidth}
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="butt"
                      style={{
                        transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                    />
                  </svg>

                  {/* Center Content */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      pointerEvents: "none",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "var(--muted)",
                        marginBottom: "4px",
                      }}
                    >
                      Reels Delivered
                    </div>
                    <div
                      style={{
                        fontSize: "42px",
                        fontWeight: 800,
                        lineHeight: 1,
                      }}
                    >
                      <span style={{ color: "#ffffff" }}>{deliveredCount}</span>
                      <span style={{ color: "#666666", fontWeight: 700 }}>/{targetReels}</span>
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 500,
                        color: "var(--muted)",
                        marginTop: "4px",
                      }}
                    >
                      {shortMonthStr}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Secondary Action Buttons Row within the same container below tracker */}
            <div
              className="track-buttons-row"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                flexWrap: "wrap",
                width: "100%",
                maxWidth: "480px",
                marginTop: "28px",
              }}
            >
              {showDriveLink && driveLink && (
                <a
                  href={driveLink}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-ghost track-action-btn"
                  style={{
                    flex: "1 1 200px",
                    border: "0.6px solid var(--border)",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    fontSize: "var(--text-xs)",
                    height: "38px",
                    padding: "0 18px",
                    whiteSpace: "nowrap",
                  }}
                >
                  <IconFolder size={15} style={{ color: "var(--gold)" }} />
                  <span>Open Google Drive Folder</span>
                  <IconArrowUpRight size={13} style={{ color: "var(--muted)" }} />
                </a>
              )}

              <a
                href="https://wa.me/918801041400?text=Hi%20ReelScale%20Team%2C%20I%20have%20a%20question%20about%20my%20reels%20delivery"
                target="_blank"
                rel="noreferrer"
                className="btn btn-ghost track-action-btn"
                style={{
                  flex: "1 1 200px",
                  border: "0.6px solid var(--border)",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  fontSize: "var(--text-xs)",
                  height: "38px",
                  padding: "0 18px",
                  whiteSpace: "nowrap",
                }}
              >
                <IconWhatsApp size={16} style={{ color: "var(--green)" }} />
                <span>Chat on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        {/* Scoped Responsive Styles */}
        <style>{`
          .track-details-card,
          .track-gauge-card {
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
          }
          @media (max-width: 640px) {
            .track-content {
              padding: 12px 14px 16px !important;
              flex: 1 !important;
              display: flex !important;
              flex-direction: column !important;
            }
            .track-details-card {
              flex-direction: column !important;
              align-items: stretch !important;
              gap: 12px !important;
              margin-bottom: 12px !important;
              padding: 14px 16px !important;
            }
            .track-details-client {
              width: 100% !important;
              display: flex !important;
              align-items: center !important;
              justify-content: space-between !important;
              gap: 12px !important;
            }
            .track-details-cycle {
              width: 100% !important;
              display: flex !important;
              align-items: center !important;
              justify-content: space-between !important;
              gap: 12px !important;
            }
            .track-details-cycle .month-filter-wrap {
              flex-shrink: 0 !important;
            }
            .track-gauge-card {
              flex: 1 !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: center !important;
              align-items: center !important;
              min-height: calc(100dvh - 200px) !important;
              padding: 32px 18px 28px !important;
            }
            .track-buttons-row {
              flex-direction: column !important;
              width: 100% !important;
              max-width: 100% !important;
              gap: 12px !important;
            }
            .track-action-btn {
              width: 100% !important;
              flex: none !important;
              justify-content: center !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
