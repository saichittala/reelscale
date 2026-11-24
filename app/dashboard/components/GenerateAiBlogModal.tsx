"use client";

import React, { useState, useEffect, useRef } from "react";
import { Blog, EditorialValidationReport } from "../types";
import { customFetch } from "../services/api";
import { API_ROUTES } from "../constants";
import { Button, Input } from "@/components/ui";
import { CustomSelect } from "./CustomSelect";
import {
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  X,
  ArrowRight,
  AlertCircle,
  Clock,
  RotateCcw,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  FileText,
  Link as LinkIcon,
} from "lucide-react";

interface GenerateAiBlogModalProps {
  isOpen: boolean;
  onClose: () => void;
  blogCategories: string[];
  onBlogPublished?: (blog: Blog, validation?: EditorialValidationReport) => void;
  showToast?: (msg: string, type?: "success" | "error" | "loading") => void;
  initialTitle?: string;
  initialCategory?: string;
  autoStart?: boolean;
}

const STAGES = [
  { id: 1, label: "Analyzing SEO search intent & commercial gap", atSec: 0 },
  { id: 2, label: "Generating 1,500+ word reader-retention article", atSec: 3 },
  { id: 3, label: "Sourcing royalty-free featured landscape photo", atSec: 12 },
  { id: 4, label: "Injecting verified internal links & schema FAQs", atSec: 18 },
  { id: 5, label: "Publishing directly to Sanity production Content Lake", atSec: 25 },
];

export function GenerateAiBlogModal({
  isOpen,
  onClose,
  blogCategories,
  onBlogPublished,
  showToast,
  initialTitle = "",
  initialCategory = "",
  autoStart = false,
}: GenerateAiBlogModalProps) {
  const [mode, setMode] = useState<"auto" | "custom">(initialTitle ? "custom" : "auto");
  const [topics, setTopics] = useState<any[]>([]);
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
  const [loadingTopics, setLoadingTopics] = useState(false);

  // Custom Form fields
  const [customTitle, setCustomTitle] = useState(initialTitle);
  const [customCategory, setCustomCategory] = useState(initialCategory || blogCategories[0] || "Video Production");
  const [customKeyword, setCustomKeyword] = useState("");
  // Default to Tier 1 Primary: Google Gemini 3.5 Flash Lite
  const [selectedModel, setSelectedModel] = useState("gemini-3.5-flash-lite");

  // Execution State
  const [isGenerating, setIsGenerating] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [publishedBlog, setPublishedBlog] = useState<Blog | null>(null);
  const [validationReport, setValidationReport] = useState<EditorialValidationReport | null>(null);
  const [showValidationDetails, setShowValidationDetails] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const autoStartedRef = useRef(false);

  // Fetch topics on open
  useEffect(() => {
    if (isOpen) {
      setGenerationError(null);
      setPublishedBlog(null);
      setValidationReport(null);
      setShowValidationDetails(false);
      setElapsedSeconds(0);
      autoStartedRef.current = false;
      if (initialTitle) {
        setCustomTitle(initialTitle);
        setMode("custom");
      }
      if (initialCategory) {
        setCustomCategory(initialCategory);
      }
      fetchTopics().then((fetchedTopics) => {
        if (autoStart && !autoStartedRef.current) {
          autoStartedRef.current = true;
          startDirectGeneration(fetchedTopics);
        }
      });
    } else {
      autoStartedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }
  }, [isOpen, initialTitle, initialCategory, autoStart]);

  const fetchTopics = async (): Promise<any[]> => {
    setLoadingTopics(true);
    try {
      const res = await customFetch(`${API_ROUTES.AI_TOPICS}?status=suggested`);
      const json = await res.json();
      if (json.success && Array.isArray(json.topics) && json.topics.length > 0) {
        setTopics(json.topics);
        setCurrentTopicIndex(0);
        return json.topics;
      }
    } catch {
      // Non-blocking
    } finally {
      setLoadingTopics(false);
    }
    return [];
  };

  const executeGeneration = async (
    targetTitle?: string,
    targetCategory?: string,
    targetKeyword?: string,
    targetTopicId?: number
  ) => {
    setGenerationError(null);
    setIsGenerating(true);
    setElapsedSeconds(0);

    abortControllerRef.current = new AbortController();

    try {
      showToast?.("Queuing AI generation & researching search intent...", "loading");

      const processTimer = setTimeout(() => {
        showToast?.("Generating article, headlines & photography...", "loading");
      }, 1500);

      const res = await customFetch(API_ROUTES.AI_GENERATE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: targetTitle || undefined,
          category: targetCategory || customCategory || "Video Production",
          primary_keyword: targetKeyword || undefined,
          topic_id: targetTopicId,
          model: selectedModel,
          publish_directly: true, // Forces immediate "Published" state in Sanity
        }),
      });

      clearTimeout(processTimer);
      const json = await res.json();

      if (json.success && json.blog) {
        setPublishedBlog(json.blog);
        setValidationReport(json.validation || null);
        onBlogPublished?.(json.blog, json.validation);
        showToast?.(`Published directly to production: "${json.blog.title}"!`, "success");
      } else {
        throw new Error(json.message || "Failed to generate blog");
      }
    } catch (err: any) {
      const msg = err.message || "An unexpected error occurred during generation";
      setGenerationError(msg);
      showToast?.(msg, "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const startDirectGeneration = (availableTopics?: any[]) => {
    const list = availableTopics || topics;
    const top = list && list.length > 0 ? list[0] : null;
    executeGeneration(
      top?.title || undefined,
      top?.category || customCategory || "Video Production",
      top?.primary_keyword || undefined,
      top?.id
    );
  };

  const handleNextTopic = () => {
    if (topics.length > 0) {
      setCurrentTopicIndex((prev) => (prev + 1) % topics.length);
    }
  };

  // Live timer during generation
  useEffect(() => {
    if (isGenerating) {
      setElapsedSeconds(0);
      timerRef.current = setInterval(() => {
        setElapsedSeconds((sec) => sec + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isGenerating]);

  // Determine active stage based on elapsed time
  const getActiveStageIndex = () => {
    if (elapsedSeconds >= 25) return 5;
    if (elapsedSeconds >= 18) return 4;
    if (elapsedSeconds >= 12) return 3;
    if (elapsedSeconds >= 3) return 2;
    return 1;
  };
  const activeStage = getActiveStageIndex();

  const currentTopic = topics[currentTopicIndex] || null;

  // Handle generation click
  const handleGenerateAndPublish = async () => {
    if (mode === "auto" && currentTopic) {
      executeGeneration(
        currentTopic.title,
        currentTopic.category || "Video Production",
        currentTopic.primary_keyword || "",
        currentTopic.id
      );
    } else {
      // If customTitle is provided, use it; otherwise fallback to top topic or let backend auto-generate headline!
      const title = customTitle.trim() || (topics[0]?.title ?? undefined);
      const cat = customCategory || topics[0]?.category || "Video Production";
      const kw = customKeyword.trim() || topics[0]?.primary_keyword || undefined;
      const topicId = customTitle.trim() ? undefined : topics[0]?.id;
      executeGeneration(title, cat, kw, topicId);
    }
  };

  const handleDone = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay active" style={{ zIndex: 9999 }}>
      <div
        className="modal"
        style={{
          maxWidth: "680px",
          width: "92vw",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "28px",
          borderRadius: "var(--radius-panel, 20px)",
          position: "relative",
          background: "var(--bg, #0b0c10)",
          border: "1px solid rgba(139, 92, 246, 0.3)",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(139, 92, 246, 0.15)",
        }}
      >
        {/* Animated Top Gradient Line (Green -> Violet -> Blue) */}
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

        {/* Header */}
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
                background: "linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(139, 92, 246, 0.25) 50%, rgba(59, 130, 246, 0.2) 100%)",
                border: "1px solid rgba(139, 92, 246, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 0 16px rgba(139, 92, 246, 0.25)",
              }}
            >
              <Sparkles size={22} style={{ color: "#a78bfa" }} />
            </div>
            <div>
              <h2
                style={{
                  fontSize: "19px",
                  fontWeight: 600,
                  color: "var(--white, #ffffff)",
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  flexWrap: "wrap",
                }}
              >
                <span>AI Blog Generator</span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    padding: "3px 10px",
                    borderRadius: "99px",
                    background: "linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(139, 92, 246, 0.25) 50%, rgba(59, 130, 246, 0.2) 100%)",
                    color: "#ffffff",
                    border: "1px solid rgba(139, 92, 246, 0.4)",
                  }}
                >
                  Direct Production Publish
                </span>
              </h2>
            </div>
          </div>

          {!isGenerating && (
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
              title="Close modal"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* SUCCESS VIEW */}
        {publishedBlog ? (
          <div style={{ padding: "12px 0" }}>
            <div
              style={{
                background: "linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(139, 92, 246, 0.12) 50%, rgba(59, 130, 246, 0.12) 100%)",
                border: "1px solid rgba(139, 92, 246, 0.35)",
                borderRadius: "14px",
                padding: "26px",
                textAlign: "center",
                marginBottom: "20px",
                boxShadow: "0 0 24px rgba(139, 92, 246, 0.2)",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #10b981 0%, #8b5cf6 50%, #3b82f6 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 14px",
                  boxShadow: "0 0 20px rgba(139, 92, 246, 0.5)",
                }}
              >
                <CheckCircle2 size={30} style={{ color: "#ffffff" }} />
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--white)", margin: "0 0 6px 0" }}>
                Blog Published Directly to Production!
              </h3>
              <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0 }}>
                Live on ReelScale website and permanently synced to Sanity Studio Content Lake.
              </p>
            </div>

            {/* Published Article Summary Card */}
            <div
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "20px",
                display: "flex",
                gap: "16px",
                alignItems: "center",
              }}
            >
              {publishedBlog.featuredImage && (
                <img
                  src={publishedBlog.featuredImage}
                  alt={publishedBlog.title}
                  style={{
                    width: "90px",
                    height: "70px",
                    borderRadius: "8px",
                    objectFit: "cover",
                    flexShrink: 0,
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                  }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <span
                    style={{
                      fontSize: "11px",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      background: "rgba(139, 92, 246, 0.2)",
                      color: "#c4b5fd",
                      fontWeight: 600,
                    }}
                  >
                    {publishedBlog.category || "General"}
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      background: "rgba(16, 185, 129, 0.2)",
                      color: "#6ee7b7",
                      fontWeight: 600,
                    }}
                  >
                    ● Live on Production
                  </span>
                </div>
                <div
                  style={{
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "var(--white)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {publishedBlog.title}
                </div>
                <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>
                  Slug: /blog/{publishedBlog.slug}
                </div>
              </div>
            </div>

            {/* Validation Feedback Report */}
            {validationReport && (
              <div
                style={{
                  background:
                    validationReport.status === "passed"
                      ? "rgba(16, 185, 129, 0.08)"
                      : "rgba(245, 158, 11, 0.08)",
                  border: `1px solid ${
                    validationReport.status === "passed"
                      ? "rgba(16, 185, 129, 0.3)"
                      : "rgba(245, 158, 11, 0.3)"
                  }`,
                  borderRadius: "12px",
                  padding: "16px",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "10px",
                    marginBottom: "12px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <ShieldCheck
                      size={18}
                      style={{
                        color:
                          validationReport.status === "passed" ? "#10b981" : "#f59e0b",
                      }}
                    />
                    <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--white)" }}>
                      Editorial & SEO Validation Report
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: "99px",
                        background:
                          validationReport.status === "passed"
                            ? "rgba(16, 185, 129, 0.2)"
                            : "rgba(245, 158, 11, 0.2)",
                        color:
                          validationReport.status === "passed" ? "#6ee7b7" : "#fde68a",
                      }}
                    >
                      Score: {validationReport.overallScore}/100 ({validationReport.status.toUpperCase()})
                    </span>

                    <button
                      type="button"
                      onClick={() => setShowValidationDetails((prev) => !prev)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#a78bfa",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <span>{showValidationDetails ? "Hide 15 Checks" : "View 15 Checks"}</span>
                      {showValidationDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                {/* Validation Quick Metrics */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
                    gap: "8px",
                    marginBottom: showValidationDetails ? "12px" : 0,
                  }}
                >
                  <div style={{ background: "rgba(0, 0, 0, 0.2)", padding: "8px 10px", borderRadius: "8px" }}>
                    <div style={{ fontSize: "10px", color: "var(--muted)", textTransform: "uppercase" }}>Words</div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--white)" }}>
                      {validationReport.wordCount}
                    </div>
                  </div>
                  <div style={{ background: "rgba(0, 0, 0, 0.2)", padding: "8px 10px", borderRadius: "8px" }}>
                    <div style={{ fontSize: "10px", color: "var(--muted)", textTransform: "uppercase" }}>Read Time</div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--white)" }}>
                      {validationReport.readingTimeMinutes} min
                    </div>
                  </div>
                  <div style={{ background: "rgba(0, 0, 0, 0.2)", padding: "8px 10px", borderRadius: "8px" }}>
                    <div style={{ fontSize: "10px", color: "var(--muted)", textTransform: "uppercase" }}>ReelScale Links</div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--white)" }}>
                      {validationReport.internalLinksCount} verified
                    </div>
                  </div>
                  <div style={{ background: "rgba(0, 0, 0, 0.2)", padding: "8px 10px", borderRadius: "8px" }}>
                    <div style={{ fontSize: "10px", color: "var(--muted)", textTransform: "uppercase" }}>Schema FAQs</div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--white)" }}>
                      {validationReport.faqCount} items
                    </div>
                  </div>
                </div>

                {/* Expandable 15-Point Inspection Checklist */}
                {showValidationDetails && (
                  <div
                    style={{
                      maxHeight: "220px",
                      overflowY: "auto",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      paddingTop: "8px",
                      borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                    }}
                  >
                    {validationReport.checks?.map((c, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "8px",
                          fontSize: "12px",
                          padding: "6px 8px",
                          borderRadius: "6px",
                          background: "rgba(0, 0, 0, 0.25)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
                          {c.passed ? (
                            <CheckCircle2 size={14} style={{ color: "#10b981", flexShrink: 0 }} />
                          ) : (
                            <AlertTriangle size={14} style={{ color: "#f59e0b", flexShrink: 0 }} />
                          )}
                          <span style={{ color: "var(--white)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {c.name}
                          </span>
                        </div>
                        <span style={{ fontSize: "11px", fontWeight: 600, color: c.passed ? "#10b981" : "#f59e0b", flexShrink: 0 }}>
                          {c.score}/100
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Actions: ReelScale Red brand button for Primary, Outline for Live View */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <Button
                variant="secondary"
                onClick={() => {
                  window.open(`/blog/${publishedBlog.slug}`, "_blank");
                }}
              >
                <ExternalLink size={15} />
                <span>View Live on Website</span>
              </Button>
              <Button variant="primary" onClick={handleDone}>
                <span>Done</span>
              </Button>
            </div>
          </div>
        ) : isGenerating ? (
          /* GENERATING PROGRESS VIEW WITH AI BRANDING & REAL-TIME TIMER */
          <div style={{ padding: "20px 0" }}>
            <style>{`
              @keyframes aiDropShadowGlow {
                0% {
                  border-color: #a855f7;
                  box-shadow: 0 0 16px rgba(168, 85, 247, 0.65), 0 0 30px rgba(168, 85, 247, 0.25);
                }
                25% {
                  border-color: #ec4899;
                  box-shadow: 0 0 18px rgba(236, 72, 153, 0.65), 0 0 35px rgba(236, 72, 153, 0.25);
                }
                50% {
                  border-color: #3b82f6;
                  box-shadow: 0 0 20px rgba(59, 130, 246, 0.65), 0 0 35px rgba(59, 130, 246, 0.25);
                }
                75% {
                  border-color: #10b981;
                  box-shadow: 0 0 18px rgba(16, 185, 129, 0.65), 0 0 35px rgba(16, 185, 129, 0.25);
                }
                100% {
                  border-color: #a855f7;
                  box-shadow: 0 0 16px rgba(168, 85, 247, 0.65), 0 0 30px rgba(168, 85, 247, 0.25);
                }
              }
            `}</style>
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              {/* AI Icon Orb with animated drop-shadow border (Fixed size, no scaling) */}
              <div
                style={{
                  width: "58px",
                  height: "58px",
                  borderRadius: "50%",
                  background: "rgba(11, 12, 16, 0.95)",
                  border: "2px solid #a855f7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                  animation: "aiDropShadowGlow 3s ease-in-out infinite",
                  flexShrink: 0,
                  transform: "none",
                }}
              >
                <Sparkles size={24} style={{ color: "var(--text-primary, #ffffff)" }} />
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--white)", margin: "0 0 6px 0" }}>
                Generating Full Article & Publishing Live...
              </h3>
              <p style={{ fontSize: "13px", color: "var(--muted)", margin: "0 0 12px 0" }}>
                AI is compiling markdown, sourcing high-res imagery, and publishing to Sanity Lake.
              </p>

              {/* Elapsed Time Badge */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 12px",
                  borderRadius: "99px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  fontSize: "12px",
                  color: "#cbd5e1",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                <Clock size={13} style={{ color: "#a78bfa" }} />
                <span>Elapsed: {elapsedSeconds}s</span>
              </div>
            </div>

            {/* Shimmering Animated Gradient Progress Line */}
            <div
              style={{
                height: "4px",
                width: "100%",
                maxWidth: "520px",
                margin: "0 auto 20px",
                borderRadius: "99px",
                background: "rgba(255, 255, 255, 0.08)",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${Math.min(100, Math.max(15, activeStage * 20))}%`,
                  background: "linear-gradient(90deg, #10b981 0%, #8b5cf6 50%, #3b82f6 100%)",
                  borderRadius: "99px",
                  transition: "width 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
                  boxShadow: "0 0 10px rgba(139, 92, 246, 0.6)",
                }}
              />
            </div>

            {/* Step Progression List */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                maxWidth: "520px",
                margin: "0 auto 20px",
              }}
            >
              {STAGES.map((s) => {
                const isPassed = activeStage > s.id;
                const isCurrent = activeStage === s.id;
                return (
                  <div
                    key={s.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      background: isCurrent
                        ? "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(139, 92, 246, 0.12) 50%, rgba(59, 130, 246, 0.1) 100%)"
                        : isPassed
                        ? "rgba(16, 185, 129, 0.06)"
                        : "transparent",
                      border: isCurrent
                        ? "1px solid rgba(139, 92, 246, 0.4)"
                        : isPassed
                        ? "1px solid rgba(16, 185, 129, 0.25)"
                        : "1px solid rgba(255, 255, 255, 0.05)",
                      transition: "all 0.3s ease",
                    }}
                  >
                    <div
                      style={{
                        width: "22px",
                        height: "22px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "11px",
                        fontWeight: 700,
                        background: isPassed
                          ? "linear-gradient(135deg, #10b981, #059669)"
                          : isCurrent
                          ? "linear-gradient(135deg, #8b5cf6, #3b82f6)"
                          : "rgba(255, 255, 255, 0.1)",
                        color: "#ffffff",
                        flexShrink: 0,
                      }}
                    >
                      {isPassed ? "✓" : s.id}
                    </div>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: isCurrent ? 600 : 400,
                        color: isCurrent
                          ? "var(--white)"
                          : isPassed
                          ? "rgba(255, 255, 255, 0.85)"
                          : "var(--muted)",
                      }}
                    >
                      {s.label}
                    </span>
                    {isCurrent && (
                      <span
                        style={{
                          marginLeft: "auto",
                          fontSize: "11px",
                          color: "#a78bfa",
                          fontWeight: 600,
                        }}
                      >
                        Active...
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {elapsedSeconds >= 35 && (
              <p style={{ textAlign: "center", fontSize: "12px", color: "var(--muted)" }}>
                Assembling rich media schema and invalidating edge caches... almost ready!
              </p>
            )}
          </div>
        ) : (
          /* NORMAL FORM VIEW */
          <div>
            {/* Mode Switcher Tabs */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px",
                background: "rgba(255, 255, 255, 0.03)",
                padding: "4px",
                borderRadius: "10px",
                border: "1px solid var(--border)",
                marginBottom: "20px",
              }}
            >
              <button
                type="button"
                onClick={() => setMode("auto")}
                style={{
                  padding: "9px 12px",
                  borderRadius: "8px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  background: mode === "auto"
                    ? "linear-gradient(135deg, #10b981 0%, #8b5cf6 50%, #3b82f6 100%)"
                    : "transparent",
                  color: "#ffffff",
                  boxShadow: mode === "auto" ? "0 0 12px rgba(139, 92, 246, 0.35)" : "none",
                  transition: "all 0.2s ease",
                }}
              >
                <Zap size={14} />
                <span>Auto-Pick Top SEO Gap</span>
              </button>
              <button
                type="button"
                onClick={() => setMode("custom")}
                style={{
                  padding: "9px 12px",
                  borderRadius: "8px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  background: mode === "custom"
                    ? "linear-gradient(135deg, #10b981 0%, #8b5cf6 50%, #3b82f6 100%)"
                    : "transparent",
                  color: "#ffffff",
                  boxShadow: mode === "custom" ? "0 0 12px rgba(139, 92, 246, 0.35)" : "none",
                  transition: "all 0.2s ease",
                }}
              >
                <Sparkles size={14} />
                <span>Custom Topic / Title</span>
              </button>
            </div>

            {/* Error banner */}
            {generationError && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  background: "rgba(239, 68, 68, 0.12)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#f87171",
                  fontSize: "13px",
                  marginBottom: "16px",
                }}
              >
                <AlertCircle size={16} />
                <span>{generationError}</span>
              </div>
            )}

            {/* AUTO MODE */}
            {mode === "auto" ? (
              <div style={{ marginBottom: "20px" }}>
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid rgba(139, 92, 246, 0.25)",
                    borderRadius: "12px",
                    padding: "18px",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "12px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: "4px",
                          background: "rgba(139, 92, 246, 0.2)",
                          color: "#c4b5fd",
                        }}
                      >
                        {currentTopic?.category || "Production"}
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: "4px",
                          background: "rgba(16, 185, 129, 0.2)",
                          color: "#6ee7b7",
                        }}
                      >
                        Priority: {currentTopic?.content_priority || "High"}
                      </span>
                    </div>

                    {topics.length > 1 && (
                      <button
                        type="button"
                        onClick={handleNextTopic}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#a78bfa",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <span>Shuffle Topic ({currentTopicIndex + 1}/{topics.length})</span>
                        <ArrowRight size={13} />
                      </button>
                    )}
                  </div>

                  <h3
                    style={{
                      fontSize: "16px",
                      fontWeight: 600,
                      color: "var(--white)",
                      margin: "0 0 12px 0",
                      lineHeight: 1.4,
                    }}
                  >
                    {currentTopic?.title || "How Hyderabad Restaurants Can Drive Reservations with Instagram Reels"}
                  </h3>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "10px",
                      fontSize: "12px",
                      background: "rgba(0, 0, 0, 0.3)",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid rgba(255, 255, 255, 0.05)",
                    }}
                  >
                    <div>
                      <span style={{ color: "var(--muted)" }}>Focus Keyword: </span>
                      <strong style={{ color: "var(--white)" }}>
                        {currentTopic?.primary_keyword || "restaurant reels hyderabad"}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: "var(--muted)" }}>Search Intent: </span>
                      <span style={{ color: "var(--white)" }}>
                        {currentTopic?.search_intent || "Commercial / Transactional"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* CUSTOM MODE */
              <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "20px" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "var(--muted)",
                      }}
                    >
                      Article Title (or let AI auto-generate)
                    </label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (topics.length > 0) {
                          const pick = topics[Math.floor(Math.random() * topics.length)];
                          setCustomTitle(pick.title);
                          if (pick.primary_keyword) setCustomKeyword(pick.primary_keyword);
                          if (pick.category) setCustomCategory(pick.category);
                        } else {
                          setCustomTitle("High-Converting Video Content Strategies for Hyderabad Businesses");
                          setCustomKeyword("video production hyderabad");
                        }
                      }}
                      style={{ fontSize: "11px", height: "24px", padding: "0 8px", gap: "4px" }}
                    >
                      <Sparkles size={12} className="text-purple-400" />
                      <span>AI Auto-Pick Headline</span>
                    </Button>
                  </div>
                  <Input
                    placeholder="Leave blank to let AI research and auto-generate winning headline..."
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "var(--muted)",
                        marginBottom: "6px",
                      }}
                    >
                      Article Category
                    </label>
                    <CustomSelect
                      value={customCategory}
                      onChange={(v) => setCustomCategory(v)}
                      options={blogCategories.map((c) => ({ value: c, label: c }))}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "var(--muted)",
                        marginBottom: "6px",
                      }}
                    >
                      Primary Keyword (Optional)
                    </label>
                    <Input
                      placeholder="e.g. restaurant reels hyderabad"
                      value={customKeyword}
                      onChange={(e) => setCustomKeyword(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* AI Direct Production Publish Callout */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(139, 92, 246, 0.08) 50%, rgba(59, 130, 246, 0.08) 100%)",
                border: "1px solid rgba(139, 92, 246, 0.25)",
                borderRadius: "10px",
                padding: "12px 14px",
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <CheckCircle2 size={18} style={{ color: "#10b981", flexShrink: 0 }} />
              <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.9)" }}>
                <strong>Direct Production Publish:</strong> The generated article is automatically synced to Sanity Content Lake and published live to <span style={{ color: "#10b981", fontWeight: 600 }}>https://reelscale.in/blog/</span> with status &quot;Published&quot;.
              </div>
            </div>

            {/* Footer Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", alignItems: "center" }}>
              <Button variant="secondary" onClick={onClose} disabled={isGenerating}>
                <span>Cancel</span>
              </Button>
              <Button
                variant="ai"
                onClick={handleGenerateAndPublish}
                disabled={isGenerating}
                loading={isGenerating}
              >
                <Sparkles size={16} />
                <span>Generate & Publish to Production</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
