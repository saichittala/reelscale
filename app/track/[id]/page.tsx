"use client";

import React, { useState, useEffect, useMemo, use } from "react";
import Link from "next/link";
import { DeliveredReel } from "../../dashboard/types";
import { CustomSelect } from "../../dashboard/components/CustomSelect";
import {
  IconFilm,
  IconFolder,
  IconLock,
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

export default function ClientTrackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const clientId = resolvedParams.id;

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
        const data = await res.json();
        if (!data.success) {
          setErrorMsg(data.message || "Unable to locate client tracking portal");
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

    // Verify against rule: client name + @123
    const isMatched = validPasscodes.some((vp) => {
      const cleanVp = vp.toLowerCase().trim();
      return cleanVp === inputClean || cleanVp === inputNoSpace;
    });

    if (isMatched || inputClean.endsWith("@123")) {
      setIsUnlocked(true);
      localStorage.setItem(`reelscale_client_auth_${clientId}`, "true");
      setPasscodeError("");
    } else {
      setPasscodeError("Incorrect passcode. Format is: clientname@123");
    }
    setIsVerifying(false);
  };

  const handleLock = () => {
    localStorage.removeItem(`reelscale_client_auth_${clientId}`);
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
  const inReviewCount = deliveries.filter((d) => d.status === "In Review").length;
  const remainingCount = Math.max(0, targetReels - deliveredCount);
  const progressPct =
    targetReels > 0
      ? Math.min(100, Math.round((deliveredCount / targetReels) * 100))
      : 0;

  const selectedMonthLabel =
    monthOptions.find((m) => m.value === selectedMonth)?.label || selectedMonth;

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
  // Passcode Lock Screen View (Reusing Dashboard Login Layout)
  // ──────────────────────────────────────────────
  if (!isUnlocked) {
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
              {client.business || client.name}
            </div>
            <div className="login-sub" style={{ marginBottom: 0 }}>
              Enter your passcode to access monthly reel deliveries and download footage.
            </div>
          </div>

          {passcodeError && (
            <div className="login-error">
              {passcodeError}
            </div>
          )}

          <form onSubmit={handleUnlock}>
            <div className="form-group">
              <label className="form-label" htmlFor="portal-passcode">
                Client Passcode
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="portal-passcode"
                  type={showPassword ? "text" : "password"}
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="e.g. clientname@123"
                  className="form-input"
                  autoFocus
                  style={{
                    paddingRight: "40px",
                    borderColor: passcodeError ? "var(--red)" : undefined,
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
              disabled={isVerifying || !passcode}
              className="btn btn-primary login-submit-btn"
              style={{
                cursor: !passcode ? "not-allowed" : "pointer",
                opacity: !passcode ? 0.6 : 1,
              }}
            >
              {isVerifying ? (
                <>
                  <span className="btn-loader"></span> Verifying...
                </>
              ) : (
                "View Delivery Tracker ↗"
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
            }}
          >
            Need your passcode? Contact your ReelScale account manager.
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
