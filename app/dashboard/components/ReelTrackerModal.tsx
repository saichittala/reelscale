"use client";

import React, { useState, useEffect } from "react";
import { Client, DeliveredReel } from "../types";
import {
  fetchDeliveries,
  apiSaveMonthDriveLink,
  apiAddDelivery,
  apiUpdateDelivery,
  apiDeleteDelivery,
} from "../services/api";
import { CustomSelect } from "./CustomSelect";

import {
  IconFilm,
  IconFolder,
  IconLink,
  IconKey,
  IconCopy,
  IconCheck,
  IconArrowUpRight,
  IconCalendar,
  IconPlus,
  IconEdit,
  IconTrash,
  IconEye,
  IconEyeOff,
  IconClose,
  IconWhatsApp,
  IconChevronDown,
} from "./Icons";

interface ReelTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  showToast: (msg: string, type?: "success" | "error") => void;
  onDeliveriesUpdated?: () => void;
}

function getMonthOptions() {
  const opts = [];
  const now = new Date();
  for (let i = -5; i <= 2; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    opts.push({ value: val, label });
  }
  return opts;
}

const STATUS_OPTIONS = [
  { value: "Delivered", label: "Delivered" },
  { value: "In Review", label: "In Review" },
  { value: "Scheduled", label: "Scheduled" },
];

export function ReelTrackerModal({
  isOpen,
  onClose,
  client,
  showToast,
  onDeliveriesUpdated,
}: ReelTrackerModalProps) {
  const currentMonthStr = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [deliveries, setDeliveries] = useState<DeliveredReel[]>([]);
  const [monthlyDriveLink, setMonthlyDriveLink] = useState<string>("");
  const [showDriveToClient, setShowDriveToClient] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingDrive, setIsSavingDrive] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Form states for adding / editing a delivery
  const [isEditingId, setIsEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [deliveredDate, setDeliveredDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [status, setStatus] = useState<"Delivered" | "In Review" | "Scheduled">(
    "Delivered"
  );
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [copiedPasscode, setCopiedPasscode] = useState(false);

  // Passcode rule: client name + @123
  const clientName = client?.name || client?.business || "client";
  const passcode = `${clientName.toLowerCase().replace(/\s+/g, "")}@123`;

  // Public client tracking URL
  const portalUrl = typeof window !== "undefined"
    ? `${window.location.origin}/track/${client?.id}`
    : `/track/${client?.id}`;

  const loadClientDeliveries = async () => {
    if (!client) return;
    setIsLoading(true);
    try {
      const res = await fetchDeliveries(client.id, selectedMonth);
      setDeliveries(res.deliveries || []);
      setMonthlyDriveLink(res.driveLink || "");
      setShowDriveToClient(res.showDriveLink !== false);
    } catch {
      showToast("Failed to load deliveries", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && client) {
      loadClientDeliveries();
      resetForm();
    }
  }, [isOpen, client, selectedMonth]);

  if (!isOpen || !client) return null;

  const targetReels = client.reels || 0;
  const deliveredCount = deliveries.filter((d) => d.status === "Delivered").length;
  const inReviewCount = deliveries.filter((d) => d.status === "In Review").length;
  const remainingCount = Math.max(0, targetReels - deliveredCount);
  const progressPct =
    targetReels > 0
      ? Math.min(100, Math.round((deliveredCount / targetReels) * 100))
      : 0;

  const resetForm = () => {
    setIsEditingId(null);
    setTitle("");
    setDeliveredDate(new Date().toISOString().slice(0, 10));
    setStatus("Delivered");
    setNotes("");
  };

  const handleStartEdit = (del: DeliveredReel) => {
    setIsEditingId(del.id);
    setTitle(del.title);
    setDeliveredDate(del.deliveredDate);
    setStatus(del.status);
    setNotes(del.notes || "");
  };

  const handleSaveDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast("Please enter a reel title", "error");
      return;
    }
    setIsSaving(true);
    try {
      if (isEditingId) {
        await apiUpdateDelivery({
          id: isEditingId,
          clientId: client.id,
          month: deliveredDate ? deliveredDate.slice(0, 7) : selectedMonth,
          title: title.trim(),
          deliveredDate,
          status,
          notes: notes.trim(),
        });
        showToast("Reel updated successfully!", "success");
      } else {
        await apiAddDelivery({
          clientId: client.id,
          month: deliveredDate ? deliveredDate.slice(0, 7) : selectedMonth,
          title: title.trim(),
          deliveredDate,
          status,
          notes: notes.trim(),
        });
        showToast("Delivered reel logged!", "success");
      }
      resetForm();
      await loadClientDeliveries();
      if (onDeliveriesUpdated) onDeliveriesUpdated();
    } catch (err: any) {
      showToast(err.message || "Failed to save delivery", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDelivery = async (id: string, reelTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${reelTitle}"?`)) return;
    try {
      await apiDeleteDelivery(id);
      showToast("Delivery deleted", "success");
      await loadClientDeliveries();
      if (onDeliveriesUpdated) onDeliveriesUpdated();
    } catch {
      showToast("Failed to delete delivery", "error");
    }
  };

  const handleSaveDriveLink = async () => {
    if (!client) return;
    setIsSavingDrive(true);
    try {
      await apiSaveMonthDriveLink(client.id, selectedMonth, monthlyDriveLink, showDriveToClient);
      showToast(
        showDriveToClient
          ? "Drive link saved & visible to client!"
          : "Drive link saved (hidden on client portal)",
        "success"
      );
    } catch (err: any) {
      showToast(err.message || "Failed to save Drive link", "error");
    } finally {
      setIsSavingDrive(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(portalUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    showToast("Client tracking link copied!", "success");
  };

  const handleCopyPasscode = () => {
    navigator.clipboard.writeText(passcode);
    setCopiedPasscode(true);
    setTimeout(() => setCopiedPasscode(false), 2000);
    showToast("Passcode copied!", "success");
  };

  const handleCopyWhatsAppMsg = () => {
    const driveInfo = showDriveToClient && monthlyDriveLink
      ? `\n📁 Month Drive Folder: ${monthlyDriveLink}`
      : "";
    const msg = `Hi ${client.name || client.business}! 🎬\n\nHere is your live link to track your reels delivered this month by ReelScale:\n🔗 ${portalUrl}\n🔑 Passcode: ${passcode}${driveInfo}\n\nYou can check your monthly delivered reels count, review progress, and access footage anytime!`;
    navigator.clipboard.writeText(msg);
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 2000);
    showToast("WhatsApp message & passcode copied!", "success");
  };

  // Month options for CustomSelect
  const monthOptions = getMonthOptions();

  const selectedMonthLabel =
    monthOptions.find((m) => m.value === selectedMonth)?.label || selectedMonth;

  const shortMonthStr = (() => {
    try {
      const [y, m] = selectedMonth.split("-");
      const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
      return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    } catch {
      return selectedMonth;
    }
  })();

  const statusOptions = STATUS_OPTIONS;

  return (
    <div
      className="modal-overlay active"
      id="tracker-modal-overlay"
      onClick={(e) => {
        if ((e.target as HTMLElement).id === "tracker-modal-overlay") {
          onClose();
        }
      }}
    >
      <div
        className="modal"
        style={{
          maxWidth: "760px",
          width: "100%",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          padding: "20px 24px 16px",
          gap: "14px",
          borderRadius: "var(--border-radius-2)",
          background: "var(--bg)",
          border: "0.6px solid var(--border)",
          boxShadow: "0 24px 64px rgba(0, 0, 0, 0.8)",
        }}
      >
        {/* 1. Minimalist Header */}
        <div
          className="modal-header"
          style={{
            margin: 0,
            paddingBottom: "14px",
            borderBottom: "0.6px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "var(--border-radius-2)",
                background: "var(--red-10)",
                border: "0.6px solid var(--red-op)",
                color: "var(--red)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <IconFilm size={18} />
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <h2
                  style={{
                    fontSize: "var(--text-md)",
                    fontWeight: 600,
                    color: "var(--white)",
                    margin: 0,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {client.business || client.name}
                </h2>
                <span className="badge badge-gold" style={{ fontSize: "11px" }}>
                  {client.billingModel || "Subscription"}
                </span>
                {client.plan && (
                  <span className="badge badge-red" style={{ fontSize: "11px" }}>
                    {client.plan}
                  </span>
                )}
              </div>

              {(client.name || client.phone) && (
                <div style={{ fontSize: "var(--text-xs)", color: "var(--muted)", marginTop: "2px" }}>
                  {client.name} {client.phone ? `· ${client.phone}` : ""}
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            className="modal-close"
            id="modal-close"
            aria-label="Close"
            onClick={onClose}
            title="Close modal"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "32px",
              height: "32px",
              borderRadius: "var(--border-radius-2)",
              border: "0.6px solid var(--border)",
              background: "transparent",
              color: "var(--muted)",
              cursor: "pointer",
            }}
          >
            <IconClose size={16} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div
          style={{
            overflowY: "auto",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            paddingRight: "2px",
          }}
        >
          {/* 2. Action & Share Strip (All Secondary Buttons) */}
          <div
            style={{
              padding: "10px 14px",
              background: "var(--white-02)",
              borderRadius: "var(--border-radius-2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={handleCopyLink}
                className="btn-secondary btn-sm"
                title="Click to copy live client portal URL"
              >
                {copiedLink ? <IconCheck size={12} style={{ color: "var(--green)" }} /> : <IconLink size={12} />}
                <span>{copiedLink ? "Link Copied!" : "Copy Link"}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyPasscode}
                className="btn-secondary btn-sm"
                title={`Passcode: ${passcode} (Click to copy)`}
              >
                {copiedPasscode ? <IconCheck size={12} style={{ color: "var(--green)" }} /> : <IconKey size={12} />}
                <span>{copiedPasscode ? "Passcode Copied!" : `Passcode: ${passcode}`}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyWhatsAppMsg}
                className="btn-secondary btn-sm"
                title="Copy client portal WhatsApp message with link and passcode"
              >
                {copiedMsg ? <IconCheck size={12} style={{ color: "var(--green)" }} /> : <IconWhatsApp size={12} style={{ color: "var(--green)" }} />}
                <span>{copiedMsg ? "Copied" : "Copy for WhatsApp"}</span>
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {monthlyDriveLink && (
                <a
                  href={monthlyDriveLink}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary btn-sm"
                  title="Open monthly Google Drive deliverables folder"
                >
                  <IconFolder size={12} style={{ color: "var(--gold)" }} />
                  <span>Drive</span>
                  <IconArrowUpRight size={11} />
                </a>
              )}

              <a
                href={portalUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary btn-sm"
                title="Preview client tracking portal"
              >
                <span>Preview</span>
                <IconArrowUpRight size={11} />
              </a>

              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="btn-secondary btn-sm"
                style={{
                  background: showAdvanced ? "var(--white-10)" : "transparent",
                  color: showAdvanced ? "var(--white)" : "var(--muted)",
                }}
                title={showAdvanced ? "Hide advanced metrics and Drive configuration" : "Show advanced metrics and Drive configuration"}
              >
                <span>Advance Info</span>
                <IconChevronDown
                  size={12}
                  style={{
                    transform: showAdvanced ? "rotate(180deg)" : "none",
                    transition: "transform 0.2s ease",
                  }}
                />
              </button>
            </div>
          </div>

          {/* 3. Minimal Delivery Progress Header (Always Visible) */}
          <div
            style={{
              background: "var(--card)",
              borderRadius: "var(--border-radius-2)",
              padding: "12px 16px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--white)" }}>
                  <span style={{ color: deliveredCount >= targetReels && targetReels > 0 ? "var(--green)" : "var(--white)" }}>
                    {deliveredCount}
                  </span>
                  <span style={{ color: "var(--muted)", fontWeight: 500 }}>/{targetReels}</span>{" "}
                  <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--white)" }}>Reels Delivered</span>
                </div>

                <span
                  className="badge"
                  style={{
                    fontSize: "11px",
                    background: progressPct >= 100 ? "var(--green-12)" : "var(--gold-10)",
                    color: progressPct >= 100 ? "var(--green)" : "var(--gold)",
                    border: `0.6px solid ${progressPct >= 100 ? "var(--green)" : "var(--gold)"}`,
                  }}
                >
                  {progressPct}%
                </span>

                <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                  · {remainingCount} remaining
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--muted)" }}>Cycle:</span>
                <div style={{ minWidth: "150px" }}>
                  <CustomSelect
                    value={selectedMonth}
                    onChange={setSelectedMonth}
                    options={monthOptions}
                    size="sm"
                    align="right"
                  />
                </div>
              </div>
            </div>

            {/* Slim, clean progress bar */}
            <div
              style={{
                width: "100%",
                height: "6px",
                background: "var(--white-05)",
                borderRadius: "var(--border-radius-99)",
                overflow: "hidden",
                marginTop: "10px",
              }}
            >
              <div
                style={{
                  width: `${progressPct}%`,
                  height: "100%",
                  background: progressPct >= 100 ? "var(--green)" : "var(--red)",
                  borderRadius: "var(--border-radius-99)",
                  transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              />
            </div>
          </div>

          {/* 4. Advance Info (Expandable Details: Circular Donut Gauge + 4 Stat Tiles + Drive Folder Manager) */}
          {showAdvanced && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                padding: "14px 16px",
                background: "var(--white-02)",
                borderRadius: "var(--border-radius-2)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingBottom: "8px",
                  borderBottom: "0.6px solid var(--border)",
                }}
              >
                <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--white)" }}>
                  Advanced Breakdown & Configuration
                </span>
                <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                  Cycle: {selectedMonthLabel}
                </span>
              </div>

              {/* Gauge + Metrics Row */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "150px 1fr",
                  gap: "16px",
                  alignItems: "center",
                }}
              >
                {/* Circular Gauge */}
                {(() => {
                  const gSize = 130;
                  const sWidth = 14;
                  const rad = (gSize - sWidth) / 2;
                  const circ = 2 * Math.PI * rad;
                  const frac = targetReels > 0 ? Math.min(1, Math.max(0, deliveredCount / targetReels)) : 0;
                  const sOffset = circ * (1 - frac);

                  return (
                    <div
                      style={{
                        position: "relative",
                        width: `${gSize}px`,
                        height: `${gSize}px`,
                        margin: "0 auto",
                      }}
                    >
                      <svg
                        width={gSize}
                        height={gSize}
                        viewBox={`0 0 ${gSize} ${gSize}`}
                        style={{ transform: "rotate(-90deg)" }}
                      >
                        <circle
                          cx={gSize / 2}
                          cy={gSize / 2}
                          r={rad}
                          fill="transparent"
                          stroke="#222222"
                          strokeWidth={sWidth}
                        />
                        <circle
                          cx={gSize / 2}
                          cy={gSize / 2}
                          r={rad}
                          fill="transparent"
                          stroke="#64e70c"
                          strokeWidth={sWidth}
                          strokeDasharray={circ}
                          strokeDashoffset={sOffset}
                          strokeLinecap="butt"
                          style={{
                            transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
                          }}
                        />
                      </svg>

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
                            fontSize: "10px",
                            color: "var(--muted)",
                            fontWeight: 500,
                            marginBottom: "2px",
                          }}
                        >
                          Delivered
                        </div>
                        <div
                          style={{
                            fontSize: "24px",
                            fontWeight: 800,
                            lineHeight: 1,
                          }}
                        >
                          <span style={{ color: "#ffffff" }}>{deliveredCount}</span>
                          <span style={{ color: "#666666", fontWeight: 700 }}>/{targetReels}</span>
                        </div>
                        <div
                          style={{
                            fontSize: "10px",
                            color: "var(--muted)",
                            fontWeight: 500,
                            marginTop: "2px",
                          }}
                        >
                          {shortMonthStr}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 2x2 Stat Tiles */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "8px",
                  }}
                >
                  <div
                    style={{
                      background: "var(--bg)",
                      borderRadius: "var(--border-radius-2)",
                      padding: "8px 12px",
                    }}
                  >
                    <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "2px" }}>
                      Contracted
                    </div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--white)" }}>
                      {targetReels} <span style={{ fontSize: "11px", fontWeight: 400, color: "var(--muted)" }}>reels</span>
                    </div>
                  </div>

                  <div
                    style={{
                      background: "var(--bg)",
                      borderRadius: "var(--border-radius-2)",
                      padding: "8px 12px",
                    }}
                  >
                    <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "2px" }}>
                      Delivered
                    </div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "#64e70c" }}>
                      {deliveredCount} <span style={{ fontSize: "11px", fontWeight: 400, color: "rgba(100, 231, 12, 0.7)" }}>reels</span>
                    </div>
                  </div>

                  <div
                    style={{
                      background: "var(--bg)",
                      borderRadius: "var(--border-radius-2)",
                      padding: "8px 12px",
                    }}
                  >
                    <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "2px" }}>
                      Remaining
                    </div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--gold)" }}>
                      {remainingCount} <span style={{ fontSize: "11px", fontWeight: 400, color: "rgba(234, 179, 8, 0.7)" }}>reels</span>
                    </div>
                  </div>

                  <div
                    style={{
                      background: "var(--bg)",
                      borderRadius: "var(--border-radius-2)",
                      padding: "8px 12px",
                    }}
                  >
                    <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "2px" }}>
                      Completion
                    </div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--white)" }}>
                      {progressPct}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Google Drive Folder Management */}
              <div
                style={{
                  background: "var(--bg)",
                  borderRadius: "var(--border-radius-2)",
                  padding: "12px 14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <IconFolder size={15} style={{ color: "var(--gold)" }} />
                    <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--white)" }}>
                      Google Drive Folder ({shortMonthStr})
                    </span>
                  </div>

                  <label
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      cursor: "pointer",
                      fontSize: "var(--text-xs)",
                      userSelect: "none",
                      background: showDriveToClient ? "var(--green-12)" : "transparent",
                      border: `0.6px solid ${showDriveToClient ? "var(--green)" : "var(--border)"}`,
                      color: showDriveToClient ? "var(--green)" : "var(--muted)",
                      padding: "3px 8px",
                      borderRadius: "var(--border-radius-2)",
                      transition: "var(--transition-fast)",
                    }}
                    title="Toggle client portal visibility"
                  >
                    <input
                      type="checkbox"
                      checked={showDriveToClient}
                      onChange={(e) => setShowDriveToClient(e.target.checked)}
                      style={{ display: "none" }}
                    />
                    {showDriveToClient ? <IconEye size={12} /> : <IconEyeOff size={12} />}
                    <span>{showDriveToClient ? "Visible to Client" : "Hidden from Client"}</span>
                  </label>
                </div>

                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input
                    type="text"
                    className="form-input"
                    value={monthlyDriveLink}
                    onChange={(e) => setMonthlyDriveLink(e.target.value)}
                    placeholder="https://drive.google.com/drive/folders/..."
                    style={{
                      flex: 1,
                      padding: "7px 12px",
                      fontSize: "var(--text-xs)",
                      height: "32px",
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSaveDriveLink}
                    disabled={isSavingDrive}
                    className="btn-secondary btn-sm"
                    style={{ height: "32px" }}
                  >
                    {isSavingDrive ? "Saving..." : "Save Drive Link"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 5. Minimalist Log / Edit Form */}
          <div
            style={{
              background: "var(--card)",
              borderRadius: "var(--border-radius-2)",
              padding: "14px 16px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "10px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {isEditingId ? <IconEdit size={14} style={{ color: "var(--red)" }} /> : <IconPlus size={14} style={{ color: "var(--red)" }} />}
                <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--white)" }}>
                  {isEditingId ? "Edit Delivered Reel" : "Log a Delivered Reel"}
                </span>
              </div>

              {isEditingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-secondary btn-sm"
                  style={{ height: "24px", padding: "0 8px", fontSize: "11px" }}
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <form onSubmit={handleSaveDelivery}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2.5fr 1.2fr 1.3fr",
                  gap: "10px",
                }}
              >
                <div>
                  <label className="form-label" style={{ fontSize: "11px", marginBottom: "4px" }}>
                    Reel Title / Topic *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Reel 04: Box Cricket Trick Shots"
                    style={{ padding: "7px 10px", fontSize: "var(--text-xs)", height: "34px" }}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: "11px", marginBottom: "4px" }}>
                    Delivery Date *
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={deliveredDate}
                    onChange={(e) => setDeliveredDate(e.target.value)}
                    style={{ padding: "7px 10px", fontSize: "var(--text-xs)", height: "34px" }}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: "11px", marginBottom: "4px" }}>
                    Status
                  </label>
                  <CustomSelect
                    value={status}
                    onChange={(val) => setStatus(val as any)}
                    options={statusOptions}
                    size="sm"
                  />
                </div>
              </div>

              <div style={{ marginTop: "10px", display: "flex", gap: "8px", alignItems: "center" }}>
                <input
                  type="text"
                  className="form-input"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes / caption hook / editor note..."
                  style={{ flex: 1, padding: "7px 12px", fontSize: "var(--text-xs)", height: "34px" }}
                />

                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-secondary btn-sm"
                  style={{
                    height: "34px",
                    padding: "0 16px",
                    fontSize: "var(--text-xs)",
                    whiteSpace: "nowrap",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  {isSaving ? (
                    "Saving..."
                  ) : isEditingId ? (
                    <>
                      <IconCheck size={13} />
                      <span>Update Reel</span>
                    </>
                  ) : (
                    <>
                      <IconPlus size={13} />
                      <span>Add Reel</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* 6. Tracked Reels Table */}
          <div
            style={{
              background: "var(--card)",
              borderRadius: "var(--border-radius-2)",
              padding: "14px 16px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "10px",
              }}
            >
              <div style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--white)" }}>
                Tracked Reels ({selectedMonthLabel})
              </div>

              <span className="badge badge-gold" style={{ fontSize: "11px" }}>
                {deliveries.length} logged
              </span>
            </div>

            {isLoading ? (
              <div style={{ padding: "24px", textAlign: "center", color: "var(--muted)", fontSize: "var(--text-xs)" }}>
                Loading delivery records...
              </div>
            ) : deliveries.length === 0 ? (
              <div style={{ padding: "24px 16px", textAlign: "center" }}>
                <div style={{ marginBottom: "8px", color: "var(--muted)", display: "flex", justifyContent: "center" }}>
                  <IconFilm size={24} />
                </div>
                <div style={{ color: "var(--white)", fontSize: "var(--text-xs)", fontWeight: 600 }}>
                  No reels logged for {selectedMonthLabel}
                </div>
                <div style={{ color: "var(--muted)", fontSize: "11px", marginTop: "2px" }}>
                  Use the form above to log the first reel for this month.
                </div>
              </div>
            ) : (
              <div className="table-wrap table-scroll-wrap" style={{ marginTop: 0, border: "none" }}>
                <table style={{ width: "100%", fontSize: "var(--text-xs)" }}>
                  <thead>
                    <tr>
                      <th style={{ width: "42px" }}>#</th>
                      <th>Title & Notes</th>
                      <th style={{ width: "120px" }}>Delivery Date</th>
                      <th style={{ width: "100px" }}>Status</th>
                      <th className="th-actions" style={{ width: "70px", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveries.map((del, idx) => (
                      <tr key={del.id}>
                        <td style={{ color: "var(--muted)", fontFamily: "monospace" }}>
                          #{String(idx + 1).padStart(2, "0")}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: "var(--white)" }}>{del.title}</div>
                          {del.notes && (
                            <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>
                              {del.notes}
                            </div>
                          )}
                        </td>
                        <td style={{ color: "var(--muted)" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <IconCalendar size={12} style={{ color: "var(--muted)" }} />
                            {del.deliveredDate}
                          </span>
                        </td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              fontSize: "11px",
                              background:
                                del.status === "Delivered"
                                  ? "var(--green-12)"
                                  : del.status === "In Review"
                                  ? "var(--gold-10)"
                                  : "var(--white-05)",
                              color:
                                del.status === "Delivered"
                                  ? "var(--green)"
                                  : del.status === "In Review"
                                  ? "var(--gold)"
                                  : "var(--muted)",
                              border: `0.6px solid ${
                                del.status === "Delivered"
                                  ? "var(--green)"
                                  : del.status === "In Review"
                                  ? "var(--gold)"
                                  : "var(--border)"
                              }`,
                            }}
                          >
                            {del.status}
                          </span>
                        </td>
                        <td className="th-actions" style={{ textAlign: "right" }}>
                          <div className="action-btns-row" style={{ justifyContent: "flex-end", gap: "4px" }}>
                            <button
                              type="button"
                              className="edit-btn-td"
                              title="Edit Reel"
                              onClick={() => handleStartEdit(del)}
                              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                            >
                              <IconEdit size={13} />
                            </button>
                            <button
                              type="button"
                              className="del-btn-td"
                              title="Delete Reel"
                              onClick={() => handleDeleteDelivery(del.id, del.title)}
                              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                            >
                              <IconTrash size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* 7. Minimalist Modal Footer */}
        <div
          style={{
            margin: 0,
            paddingTop: "12px",
            borderTop: "0.6px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: "var(--text-xs)", color: "var(--muted)" }}>
            Viewing: <strong style={{ color: "var(--white)" }}>{selectedMonthLabel}</strong>
          </div>
          <button
            type="button"
            className="btn-secondary btn-sm"
            onClick={onClose}
            style={{ height: "32px", padding: "0 16px" }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReelTrackerModal;
