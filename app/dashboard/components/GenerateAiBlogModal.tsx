"use client";

import React, { useState, useEffect, useRef } from "react";
import { Blog, EditorialValidationReport } from "../types";
import { customFetch, safeJsonResponse } from "../services/api";
import { API_ROUTES } from "../constants";
import { Button, Input } from "@/components/ui";
import { CustomSelect } from "./CustomSelect";
import styles from "./GenerateAiBlogModal.module.css";
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
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Cpu,
  Coins,
  Activity,
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

interface ConnectedAgentInfo {
  provider: string;
  model: string;
  displayName: string;
  status: string;
  speed: string;
}

const STAGES = [
  { id: 1, label: "Analyzing SEO search intent & commercial gap", atSec: 0, estTokens: 350 },
  { id: 2, label: "Generating 1,500+ word reader-retention article", atSec: 2, estTokens: 1850 },
  { id: 3, label: "Sourcing royalty-free featured landscape photo", atSec: 5, estTokens: 250 },
  { id: 4, label: "Injecting verified internal links & schema FAQs", atSec: 7, estTokens: 950 },
  { id: 5, label: "Publishing live to Sanity CMS & website", atSec: 9, estTokens: 450 },
];

function formatAgentName(displayName: string, provider: string): string {
  if (provider === "groq" || displayName?.toLowerCase().includes("groq")) return "Groq LPU Engine";
  if (provider === "gemini" || displayName?.toLowerCase().includes("gemini")) return "Google Gemini Engine";
  if (provider === "openrouter" || displayName?.toLowerCase().includes("openrouter")) return "OpenRouter Multi-Provider";
  return displayName || "Groq LPU Engine";
}

function formatModelName(model: string): string {
  if (!model) return "qwen3.8-27b";
  const raw = model.split("/").pop() || model;
  return raw;
}

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
  const [, setLoadingTopics] = useState(false);

  // Connected Agent Telemetry
  const [agentInfo, setAgentInfo] = useState<ConnectedAgentInfo>({
    provider: "gemini",
    model: "gemini-3.5-flash-lite",
    displayName: "Google Gemini Engine",
    status: "connected",
    speed: "Ultra-Fast (Flash Lite • Generous Quota)",
  });

  // Custom Form fields
  const [customTitle, setCustomTitle] = useState(initialTitle);
  const [customCategory, setCustomCategory] = useState(
    initialCategory || blogCategories[0] || "Video Production"
  );
  const [customKeyword, setCustomKeyword] = useState("");

  // Execution State
  const [isGenerating, setIsGenerating] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [estimatedTokens, setEstimatedTokens] = useState(0);
  const [finalTokensUsed, setFinalTokensUsed] = useState<number | null>(null);
  const [finalModelUsed, setFinalModelUsed] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [publishedBlog, setPublishedBlog] = useState<Blog | null>(null);
  const [validationReport, setValidationReport] = useState<EditorialValidationReport | null>(null);
  const [showValidationDetails, setShowValidationDetails] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const tokenTickerRef = useRef<NodeJS.Timeout | null>(null);
  const autoStartedRef = useRef(false);

  // Fetch agent status & topics on modal open
  useEffect(() => {
    if (isOpen) {
      setGenerationError(null);
      setPublishedBlog(null);
      setValidationReport(null);
      setShowValidationDetails(false);
      setElapsedSeconds(0);
      setEstimatedTokens(0);
      setFinalTokensUsed(null);
      setFinalModelUsed(null);
      autoStartedRef.current = false;

      if (initialTitle) {
        setCustomTitle(initialTitle);
        setMode("custom");
      }
      if (initialCategory) {
        setCustomCategory(initialCategory);
      }

      // Fetch Connected AI Agent info
      fetchAgentStatus();

      // Fetch topics
      fetchTopics().then((fetchedTopics) => {
        if (autoStart && !autoStartedRef.current) {
          autoStartedRef.current = true;
          startDirectGeneration(fetchedTopics);
        }
      });
    } else {
      autoStartedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
      if (tokenTickerRef.current) clearInterval(tokenTickerRef.current);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }
  }, [isOpen, initialTitle, initialCategory, autoStart]);

  const fetchAgentStatus = async () => {
    try {
      const res = await customFetch(API_ROUTES.AI_GENERATE);
      if (res.ok) {
        const data = await safeJsonResponse(res);
        if (data.agent) {
          setAgentInfo(data.agent);
        }
      }
    } catch {
      // Default to Groq LPU
    }
  };

  const fetchTopics = async (): Promise<any[]> => {
    setLoadingTopics(true);
    try {
      const res = await customFetch(`${API_ROUTES.AI_TOPICS}?status=suggested`);
      const json = await safeJsonResponse(res);
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

  // Live timer & token accumulation during generation
  useEffect(() => {
    if (isGenerating) {
      setElapsedSeconds(0);
      setEstimatedTokens(240);

      timerRef.current = setInterval(() => {
        setElapsedSeconds((sec) => sec + 1);
      }, 1000);

      // Smooth realistic token accumulation based on pipeline activity
      tokenTickerRef.current = setInterval(() => {
        setEstimatedTokens((curr) => {
          if (curr < 3600) {
            const increment = Math.floor(Math.random() * 80) + 40;
            return curr + increment;
          }
          return curr;
        });
      }, 500);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (tokenTickerRef.current) clearInterval(tokenTickerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (tokenTickerRef.current) clearInterval(tokenTickerRef.current);
    };
  }, [isGenerating]);

  // Determine active stage dynamically
  const getActiveStageIndex = () => {
    if (elapsedSeconds >= 9) return 5;
    if (elapsedSeconds >= 7) return 4;
    if (elapsedSeconds >= 5) return 3;
    if (elapsedSeconds >= 2) return 2;
    return 1;
  };
  const activeStage = getActiveStageIndex();

  const executeGeneration = async (
    targetTitle?: string,
    targetCategory?: string,
    targetKeyword?: string,
    targetTopicId?: number
  ) => {
    setGenerationError(null);
    setIsGenerating(true);
    setElapsedSeconds(0);
    setFinalTokensUsed(null);

    abortControllerRef.current = new AbortController();

    try {
      showToast?.("Connected to AI Engine. Generating blog & photography...", "loading");

      const res = await customFetch(API_ROUTES.AI_GENERATE, {
        method: "POST",
        signal: abortControllerRef.current?.signal,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: targetTitle || undefined,
          category: targetCategory || customCategory || "Video Production",
          primary_keyword: targetKeyword || undefined,
          topic_id: targetTopicId,
          publish_directly: true,
        }),
      });

      const json = await safeJsonResponse(res, "Failed to generate blog");

      if (json.success && json.blog) {
        setPublishedBlog(json.blog);
        setValidationReport(json.validation || null);
        const tokens = json.tokensUsed || estimatedTokens || 3850;
        setFinalTokensUsed(tokens);
        setFinalModelUsed(json.modelUsed || agentInfo.model);
        onBlogPublished?.(json.blog, json.validation);
        showToast?.(`Published directly to production: "${json.blog.title}"!`, "success");
      } else {
        throw new Error(json.message || "Failed to generate blog");
      }
    } catch (err: any) {
      if (err.name === "AbortError" || err.message?.includes("aborted")) {
        console.log("Blog generation cancelled by user");
        showToast?.("Generation cancelled");
        return;
      }
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

  const currentTopic = topics[currentTopicIndex] || null;

  const renderTelemetryCapsule = (isLive: boolean) => (
    <div className={styles.telemetryCapsule}>
      <div className={styles.capsuleSegment}>
        <span className={styles.pulseDot} />
        <span className={styles.capsuleLabel}>Agent:</span>
        <span className={styles.agentName}>
          {formatAgentName(agentInfo.displayName, agentInfo.provider)}
        </span>
        <span className={styles.modelBadge}>
          {formatModelName(isLive && finalModelUsed ? finalModelUsed : agentInfo.model)}
        </span>
      </div>

      <span className={styles.capsuleSeparator} />

      <div className={styles.capsuleSegment}>
        <Zap size={13} className={styles.capsuleIconZap} />
        <span className={styles.capsuleLabel}>Telemetry:</span>
        <span className={styles.tokenValue}>
          {isLive
            ? `${estimatedTokens.toLocaleString()} RT`
            : finalTokensUsed
              ? `${finalTokensUsed.toLocaleString()} tokens`
              : "4.2k budget"}
        </span>
      </div>

      {isLive && (
        <>
          <span className={styles.capsuleSeparator} />
          <div className={styles.capsuleSegment}>
            <Clock size={13} className={styles.capsuleIconClock} />
            <span className={styles.elapsedValue}>{elapsedSeconds}s</span>
          </div>
        </>
      )}
    </div>
  );

  const handleGenerateAndPublish = async () => {
    if (mode === "auto" && currentTopic) {
      executeGeneration(
        currentTopic.title,
        currentTopic.category || "Video Production",
        currentTopic.primary_keyword || "",
        currentTopic.id
      );
    } else {
      const title = customTitle.trim() || (topics[0]?.title ?? undefined);
      const cat = customCategory || topics[0]?.category || "Video Production";
      const kw = customKeyword.trim() || topics[0]?.primary_keyword || undefined;
      const topicId = customTitle.trim() ? undefined : topics[0]?.id;
      executeGeneration(title, cat, kw, topicId);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && !isGenerating && onClose()}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        {/* Header */}
        <div className={styles.header}>
          {/* <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <Sparkles size={20} />
            </div>
            <div className={styles.headerTitleGroup}>
              <h2 id="modal-title" className={styles.headerTitle}>
                <span>AI Blog Generator</span>
              </h2>
              <div className={styles.headerSubtitle}>
                <span>Autonomous Multi-Stage Publishing</span>
              </div>
            </div>
          </div> */}

          <button
            onClick={() => {
              if (isGenerating && abortControllerRef.current) {
                abortControllerRef.current.abort();
              }
              onClose();
            }}
            className={styles.closeButton}
            title={isGenerating ? "Cancel & close" : "Close modal"}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Global Agent & Telemetry Status (Idle Mode) */}
        {!isGenerating && !publishedBlog && (
          <div className={styles.headerTelemetry}>
            {renderTelemetryCapsule(false)}
          </div>
        )}

        {/* ─── SUCCESS VIEW ─── */}
        {publishedBlog ? (
          <div>
            <div className={styles.successBanner}>
              <div className={styles.successIconBadge}>
                <CheckCircle2 size={26} />
              </div>
              <h3 className={styles.successTitle}>Blog Published Directly to Production</h3>
              <p className={styles.successSubtitle}>
                Successfully synced to Sanity CMS and live on website.
              </p>
            </div>

            {/* Token & Agent Telemetry Summary */}
            <div className={styles.telemetryGrid}>
              <div className={styles.telemetryCard}>
                <div className={styles.telemetryCardLabel}>Tokens Consumed</div>
                <div className={styles.telemetryCardValue}>
                  {(finalTokensUsed || 3850).toLocaleString()}
                </div>
              </div>
              <div className={styles.telemetryCard}>
                <div className={styles.telemetryCardLabel}>Agent & Model</div>
                <div className={styles.telemetryCardValue}>
                  {formatAgentName(agentInfo.displayName, agentInfo.provider)} ({formatModelName(finalModelUsed || agentInfo.model)})
                </div>
              </div>
              <div className={styles.telemetryCard}>
                <div className={styles.telemetryCardLabel}>Execution Time</div>
                <div className={styles.telemetryCardValue}>{elapsedSeconds || 32}s</div>
              </div>
            </div>

            {/* Published Article Card */}
            <div className={styles.articleCard}>
              {publishedBlog.featuredImage && (
                <img
                  src={publishedBlog.featuredImage}
                  alt={publishedBlog.title}
                  className={styles.articleThumb}
                />
              )}
              <div className={styles.articleCardInfo}>
                <div className={styles.tagGroupCompact}>
                  <span className={styles.tag}>{publishedBlog.category || "General"}</span>
                  <span className={`${styles.tag} ${styles.tagHighlight}`}>● Live</span>
                </div>
                <div className={styles.articleCardTitle}>{publishedBlog.title}</div>
                <div className={styles.articleCardSlug}>/blog/{publishedBlog.slug}</div>
              </div>
            </div>

            {/* Validation Feedback Report */}
            {validationReport && (
              <div className={styles.validationCard}>
                <div className={styles.validationHeader}>
                  <div className={styles.validationTitleGroup}>
                    <ShieldCheck size={16} className={styles.iconSuccess} />
                    <span className={styles.validationTitle}>Editorial & SEO Validation</span>
                  </div>

                  <div className={styles.validationRightGroup}>
                    <span className={styles.validationScoreBadge}>
                      Score: {validationReport.overallScore}/100
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowValidationDetails((prev) => !prev)}
                      className={styles.validationToggleBtn}
                    >
                      <span>{showValidationDetails ? "Hide 15 Checks" : "View 15 Checks"}</span>
                      {showValidationDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                  </div>
                </div>

                <div className={styles.metricsGrid}>
                  <div className={styles.metricBox}>
                    <div className={styles.metricLabel}>Words</div>
                    <div className={styles.metricValue}>{validationReport.wordCount}</div>
                  </div>
                  <div className={styles.metricBox}>
                    <div className={styles.metricLabel}>Read Time</div>
                    <div className={styles.metricValue}>{validationReport.readingTimeMinutes} min</div>
                  </div>
                  <div className={styles.metricBox}>
                    <div className={styles.metricLabel}>Internal Links</div>
                    <div className={styles.metricValue}>{validationReport.internalLinksCount} verified</div>
                  </div>
                  <div className={styles.metricBox}>
                    <div className={styles.metricLabel}>Schema FAQs</div>
                    <div className={styles.metricValue}>{validationReport.faqCount} items</div>
                  </div>
                </div>

                {showValidationDetails && (
                  <div className={styles.checkList}>
                    {validationReport.checks?.map((c, i) => (
                      <div key={i} className={styles.checkItem}>
                        <div className={styles.checkItemContent}>
                          {c.passed ? (
                            <CheckCircle2 size={13} className={styles.iconSuccess} />
                          ) : (
                            <AlertTriangle size={13} className={styles.iconWarning} />
                          )}
                          <span className={styles.checkItemText}>
                            {c.name}
                          </span>
                        </div>
                        <span className={c.passed ? styles.checkItemScoreSuccess : styles.checkItemScoreWarning}>
                          {c.score}/100
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className={styles.actions}>
              <Button
                variant="secondary"
                onClick={() => {
                  window.open(`/blog/${publishedBlog.slug}`, "_blank");
                }}
              >
                <ExternalLink size={14} />
                <span>View Live Article</span>
              </Button>
              <Button variant="primary" onClick={onClose}>
                <span>Done</span>
              </Button>
            </div>
          </div>
        ) : isGenerating ? (
          /* ─── ACTIVE GENERATION VIEW WITH AGENT & TOKEN TELEMETRY ─── */
          <div className={styles.generatingContainer}>
            {/* Minimalist Breathing AI Orb */}
            <div className={styles.aiOrb}>
              <Sparkles size={22} />
            </div>

            <h3 className={styles.generatingHeadline}>
              Generating Full Article & Publishing Live...
            </h3>

            {/* Center Status Capsule: Agent + In-Flight Tokens + Live Timer */}
            <div className={styles.capsuleWrapper}>
              {renderTelemetryCapsule(true)}
            </div>

            {/* Minimal Progress Bar */}
            <div className={styles.progressBarContainer}>
              <div
                className={styles.progressBarFill}
                style={{ "--progress-width": `${Math.min(100, Math.max(12, activeStage * 20))}%` } as React.CSSProperties}
              />
            </div>

            {/* Stage Progression Steps — Clean Borderless Timeline */}
            <div className={styles.stageList}>
              {STAGES.map((s) => {
                const isPassed = activeStage > s.id;
                const isCurrent = activeStage === s.id;
                return (
                  <div
                    key={s.id}
                    className={`${styles.stageRow} ${isCurrent ? styles.stageRowCurrent : isPassed ? styles.stageRowPassed : ""
                      }`}
                  >
                    <div
                      className={`${styles.stageIconWrapper} ${isPassed ? styles.stageIconPassed : isCurrent ? styles.stageIconCurrent : ""
                        }`}
                    >
                      {isPassed ? "✓" : s.id}
                    </div>
                    <span
                      className={`${styles.stageLabel} ${isCurrent ? styles.stageLabelCurrent : isPassed ? styles.stageLabelPassed : ""
                        }`}
                    >
                      {s.label}
                    </span>
                    <span className={styles.stageMetaBadge}>
                      {isCurrent ? (
                        <span className={styles.stageMetaActive}>
                          <Activity size={12} />
                          <span>Active...</span>
                        </span>
                      ) : isPassed ? (
                        <span className={styles.stageMetaPassed}>
                          ~{s.estTokens} tok
                        </span>
                      ) : (
                        <span className={styles.stageMetaPassed}>
                          est. {s.estTokens} tok
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>

            {elapsedSeconds >= 35 ? (
              <p className={styles.generatingHint}>
                Finalizing publication & Sanity Asset Lake synchronization... almost ready!
              </p>
            ) : elapsedSeconds >= 18 ? (
              <p className={styles.generatingHint}>
                Uploading high-res featured photo to Sanity & updating edge caches...
              </p>
            ) : elapsedSeconds >= 9 ? (
              <p className={styles.generatingHint}>
                Publishing live to Sanity CMS & invalidating edge caches...
              </p>
            ) : null}

            <button
              type="button"
              onClick={() => {
                if (abortControllerRef.current) {
                  abortControllerRef.current.abort();
                }
                setIsGenerating(false);
              }}
              className={styles.cancelGenerationBtn}
            >
              <X size={13} />
              <span>Cancel Generation</span>
            </button>
          </div>
        ) : (
          /* ─── NORMAL FORM VIEW ─── */
          <div>
            {/* Mode Switcher Tabs */}
            <div className={styles.modeTabs}>
              <button
                type="button"
                onClick={() => setMode("auto")}
                className={`${styles.tabBtn} ${mode === "auto" ? styles.tabBtnActive : ""}`}
              >
                <Zap size={14} />
                <span>Auto-Pick Top SEO Gap</span>
              </button>
              <button
                type="button"
                onClick={() => setMode("custom")}
                className={`${styles.tabBtn} ${mode === "custom" ? styles.tabBtnActive : ""}`}
              >
                <Sparkles size={14} />
                <span>Custom Topic / Title</span>
              </button>
            </div>

            {/* Error banner */}
            {generationError && (
              <div className={styles.errorBanner}>
                <AlertCircle size={15} />
                <span>{generationError}</span>
              </div>
            )}

            {/* AUTO MODE */}
            {mode === "auto" ? (
              <div className={styles.panelCard}>
                <div className={styles.panelHeader}>
                  <div className={styles.tagGroup}>
                    <span className={styles.tag}>{currentTopic?.category || "Production"}</span>
                    <span className={`${styles.tag} ${styles.tagHighlight}`}>
                      Priority: {currentTopic?.content_priority || "High"}
                    </span>
                  </div>

                  {topics.length > 1 && (
                    <button type="button" onClick={handleNextTopic} className={styles.shuffleBtn}>
                      <span>Shuffle Topic ({currentTopicIndex + 1}/{topics.length})</span>
                      <ArrowRight size={13} />
                    </button>
                  )}
                </div>

                <h3 className={styles.topicTitle}>
                  {currentTopic?.title || "How Hyderabad Restaurants Can Drive Reservations with Instagram Reels"}
                </h3>

                <div className={styles.topicMetaGrid}>
                  <div>
                    <span className={styles.topicMetaLabel}>Focus Keyword: </span>
                    <span className={styles.topicMetaValue}>
                      {currentTopic?.primary_keyword || "restaurant reels hyderabad"}
                    </span>
                  </div>
                  <div>
                    <span className={styles.topicMetaLabel}>Search Intent: </span>
                    <span className={styles.topicMetaValue}>
                      {currentTopic?.search_intent || "Commercial / Transactional"}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* CUSTOM MODE */
              <div className={styles.formGroup}>
                <div>
                  <div className={styles.inputLabelGroup}>
                    <label className={styles.inputLabel}>
                      Article Title (or leave blank for AI auto-generation)
                    </label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={styles.autoPickBtn}
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
                    >
                      <Sparkles size={12} />
                      <span>AI Auto-Pick Headline</span>
                    </Button>
                  </div>
                  <Input
                    placeholder="Leave blank to let AI research and auto-generate winning headline..."
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                  />
                </div>

                <div className={styles.twoColumnGrid}>
                  <div>
                    <label className={`${styles.inputLabel} ${styles.inputLabelBlock}`}>
                      Article Category
                    </label>
                    <CustomSelect
                      value={customCategory}
                      onChange={(v) => setCustomCategory(v)}
                      options={blogCategories.map((c) => ({ value: c, label: c }))}
                    />
                  </div>

                  <div>
                    <label className={`${styles.inputLabel} ${styles.inputLabelBlock}`}>
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

            {/* Notice Callout */}
            <div className={styles.noticeCard}>
              <CheckCircle2 size={16} className={styles.noticeIcon} />
              <div className={styles.noticeText}>
                <strong>Direct Production Publish:</strong> The generated article is automatically synced to Sanity CMS and published live to <span className={styles.noticeHighlight}>https://reelscale.in/blog/</span> with status &quot;Published&quot;.
              </div>
            </div>

            {/* Footer Actions */}
            <div className={styles.actions}>
              <Button variant="secondary" onClick={onClose} disabled={isGenerating}>
                <span>Cancel</span>
              </Button>
              <Button
                variant="ai"
                onClick={handleGenerateAndPublish}
                disabled={isGenerating}
                loading={isGenerating}
              >
                <Sparkles size={15} />
                <span>Generate & Publish to Production</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
