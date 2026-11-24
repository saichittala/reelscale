"use client";

import React, { useState } from "react";
import { Blog, EditorialValidationReport, ValidationCheckItem } from "../types";
import { Button } from "@/components/ui";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  X,
  FileText,
  Clock,
  Link as LinkIcon,
  HelpCircle,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface BlogValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  blog: Blog | null;
  report: EditorialValidationReport | null;
  onViewLive?: () => void;
  onEditBlog?: (blog: Blog) => void;
}

export function BlogValidationModal({
  isOpen,
  onClose,
  blog,
  report,
  onViewLive,
  onEditBlog,
}: BlogValidationModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<"all" | "technical" | "seo" | "brand" | "editorial">("all");
  const [expandedCheckId, setExpandedCheckId] = useState<string | null>(null);

  if (!isOpen || !blog || !report) return null;

  const score = report.overallScore ?? 0;
  const status = report.status || (score >= 80 ? "passed" : score >= 55 ? "flagged" : "rejected");

  const statusColor =
    status === "passed" ? "#10b981" : status === "flagged" ? "#f59e0b" : "#ef4444";
  const statusBg =
    status === "passed"
      ? "rgba(16, 185, 129, 0.15)"
      : status === "flagged"
      ? "rgba(245, 158, 11, 0.15)"
      : "rgba(239, 68, 68, 0.15)";
  const statusBorder =
    status === "passed"
      ? "rgba(16, 185, 129, 0.4)"
      : status === "flagged"
      ? "rgba(245, 158, 11, 0.4)"
      : "rgba(239, 68, 68, 0.4)";

  const checks = Array.isArray(report.checks) ? report.checks : [];
  const filteredChecks =
    selectedCategory === "all"
      ? checks
      : checks.filter((c) => c.category === selectedCategory);

  const passedChecksCount = checks.filter((c) => c.passed).length;
  const totalChecksCount = checks.length;

  return (
    <div className="modal-overlay active" style={{ zIndex: 10000 }}>
      <div
        className="modal"
        style={{
          maxWidth: "760px",
          width: "92vw",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "28px",
          borderRadius: "var(--radius-panel, 20px)",
          position: "relative",
          background: "var(--bg, #0b0c10)",
          border: `1px solid ${statusBorder}`,
          boxShadow: `0 24px 60px rgba(0, 0, 0, 0.7), 0 0 35px ${statusBg}`,
        }}
      >
        {/* Top Gradient Highlight Bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "3px",
            background: "linear-gradient(90deg, #10b981 0%, #8b5cf6 50%, #3b82f6 100%)",
            borderTopLeftRadius: "var(--radius-panel, 20px)",
            borderTopRightRadius: "var(--radius-panel, 20px)",
          }}
        />

        {/* Modal Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "20px",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: statusBg,
                border: `1px solid ${statusBorder}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <ShieldCheck size={24} style={{ color: statusColor }} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <h2
                  style={{
                    fontSize: "19px",
                    fontWeight: 600,
                    color: "var(--white, #ffffff)",
                    margin: 0,
                  }}
                >
                  Editorial & SEO Validation Report
                </h2>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    padding: "3px 10px",
                    borderRadius: "99px",
                    background: statusBg,
                    color: statusColor,
                    border: `1px solid ${statusBorder}`,
                  }}
                >
                  {status} ({passedChecksCount}/{totalChecksCount} passed)
                </span>
              </div>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--muted, #94a3b8)",
                  margin: "4px 0 0 0",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "520px",
                }}
              >
                {blog.title}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--muted, #94a3b8)",
              cursor: "pointer",
              padding: "6px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "color 0.2s ease",
            }}
            title="Close validation report"
          >
            <X size={20} />
          </button>
        </div>

        {/* Score & Summary Hero Banner */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "14px",
            padding: "18px 20px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div style={{ flex: 1, minWidth: "240px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--muted)" }}>
                OVERALL EDITORIAL SCORE
              </span>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: statusColor,
                }}
              >
                {score}/100
              </span>
            </div>
            <p style={{ fontSize: "13px", color: "var(--white)", margin: 0, lineHeight: 1.45 }}>
              {report.summary || "Article evaluated across 15 technical, SEO, and brand fidelity benchmarks."}
            </p>
          </div>

          {/* Radial / Pill Score Display */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: statusBg,
              border: `1px solid ${statusBorder}`,
              borderRadius: "14px",
              padding: "12px 24px",
              minWidth: "110px",
            }}
          >
            <span style={{ fontSize: "28px", fontWeight: 800, color: statusColor, lineHeight: 1 }}>
              {score}
            </span>
            <span style={{ fontSize: "10px", fontWeight: 700, color: statusColor, textTransform: "uppercase", marginTop: "4px" }}>
              {status}
            </span>
          </div>
        </div>

        {/* 4 Metric Counter Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "10px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              borderRadius: "10px",
              padding: "12px 14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--muted)", fontSize: "11px", marginBottom: "4px" }}>
              <FileText size={13} />
              <span>Word Count</span>
            </div>
            <div style={{ fontSize: "17px", fontWeight: 700, color: "var(--white)" }}>
              {report.wordCount || 0}{" "}
              <span style={{ fontSize: "11px", fontWeight: 400, color: "var(--muted)" }}>words</span>
            </div>
          </div>

          <div
            style={{
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              borderRadius: "10px",
              padding: "12px 14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--muted)", fontSize: "11px", marginBottom: "4px" }}>
              <Clock size={13} />
              <span>Reading Time</span>
            </div>
            <div style={{ fontSize: "17px", fontWeight: 700, color: "var(--white)" }}>
              {report.readingTimeMinutes || 1}{" "}
              <span style={{ fontSize: "11px", fontWeight: 400, color: "var(--muted)" }}>mins</span>
            </div>
          </div>

          <div
            style={{
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              borderRadius: "10px",
              padding: "12px 14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--muted)", fontSize: "11px", marginBottom: "4px" }}>
              <LinkIcon size={13} />
              <span>Backlinks</span>
            </div>
            <div style={{ fontSize: "17px", fontWeight: 700, color: "var(--white)" }}>
              {report.internalLinksCount || 0}{" "}
              <span style={{ fontSize: "11px", fontWeight: 400, color: "var(--muted)" }}>links</span>
            </div>
          </div>

          <div
            style={{
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              borderRadius: "10px",
              padding: "12px 14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--muted)", fontSize: "11px", marginBottom: "4px" }}>
              <HelpCircle size={13} />
              <span>FAQ Schema</span>
            </div>
            <div style={{ fontSize: "17px", fontWeight: 700, color: "var(--white)" }}>
              {report.faqCount || 0}{" "}
              <span style={{ fontSize: "11px", fontWeight: 400, color: "var(--muted)" }}>items</span>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            overflowX: "auto",
            marginBottom: "14px",
            paddingBottom: "4px",
          }}
        >
          {(
            [
              { key: "all", label: `All Checks (${checks.length})` },
              { key: "technical", label: "Technical" },
              { key: "seo", label: "SEO" },
              { key: "brand", label: "Brand & Context" },
              { key: "editorial", label: "Editorial Quality" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSelectedCategory(tab.key)}
              style={{
                fontSize: "12px",
                fontWeight: 600,
                padding: "6px 12px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                background: selectedCategory === tab.key ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.03)",
                color: selectedCategory === tab.key ? "var(--white)" : "var(--muted)",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 15-Point Inspection List */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            marginBottom: "24px",
          }}
        >
          {filteredChecks.length === 0 ? (
            <div style={{ padding: "16px", textAlign: "center", color: "var(--muted)", fontSize: "13px" }}>
              No checks found in this category.
            </div>
          ) : (
            filteredChecks.map((c: ValidationCheckItem) => {
              const isExpanded = expandedCheckId === c.id;
              const checkPassed = c.passed;
              const checkIcon = checkPassed ? (
                <CheckCircle2 size={16} style={{ color: "#10b981", flexShrink: 0 }} />
              ) : c.score >= 50 ? (
                <AlertTriangle size={16} style={{ color: "#f59e0b", flexShrink: 0 }} />
              ) : (
                <XCircle size={16} style={{ color: "#ef4444", flexShrink: 0 }} />
              );

              return (
                <div
                  key={c.id}
                  style={{
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    borderRadius: "10px",
                    overflow: "hidden",
                    transition: "border-color 0.2s ease",
                  }}
                >
                  <div
                    onClick={() => setExpandedCheckId(isExpanded ? null : c.id)}
                    style={{
                      padding: "11px 14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "10px",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
                      {checkIcon}
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: 500,
                          color: "var(--white)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {c.name}
                      </span>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 600,
                          padding: "2px 6px",
                          borderRadius: "4px",
                          background: "rgba(255, 255, 255, 0.06)",
                          color: "var(--muted)",
                          textTransform: "uppercase",
                        }}
                      >
                        {c.category}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: checkPassed ? "#10b981" : c.score >= 50 ? "#f59e0b" : "#ef4444",
                        }}
                      >
                        {c.score}/100
                      </span>
                      {isExpanded ? (
                        <ChevronUp size={15} style={{ color: "var(--muted)" }} />
                      ) : (
                        <ChevronDown size={15} style={{ color: "var(--muted)" }} />
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div
                      style={{
                        padding: "10px 14px 14px 40px",
                        borderTop: "1px solid rgba(255, 255, 255, 0.05)",
                        background: "rgba(0, 0, 0, 0.15)",
                        fontSize: "12px",
                        color: "var(--muted)",
                        lineHeight: 1.5,
                      }}
                    >
                      <div style={{ color: "rgba(255, 255, 255, 0.9)", marginBottom: c.recommendation ? "6px" : 0 }}>
                        {c.details}
                      </div>
                      {c.recommendation && (
                        <div
                          style={{
                            background: "rgba(245, 158, 11, 0.08)",
                            border: "1px solid rgba(245, 158, 11, 0.2)",
                            borderRadius: "6px",
                            padding: "6px 10px",
                            color: "#fde68a",
                            marginTop: "6px",
                          }}
                        >
                          <strong>Recommendation:</strong> {c.recommendation}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", alignItems: "center" }}>
          {blog.slug && (
            <Button
              variant="secondary"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.open(`/blog/${blog.slug}`, "_blank");
                }
              }}
            >
              <ExternalLink size={15} />
              <span>View Live Article</span>
            </Button>
          )}

          {onEditBlog && (
            <Button
              variant="ghost"
              onClick={() => {
                onClose();
                onEditBlog(blog);
              }}
            >
              <span>Edit Article</span>
            </Button>
          )}

          <Button variant="primary" onClick={onClose}>
            <span>Done</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
export default BlogValidationModal;