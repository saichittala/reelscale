"use client";

import React, { useState, useEffect, useRef } from "react";
import { Blog, EditorialValidationReport } from "../types";
import { customFetch, safeJsonResponse } from "../services/api";
import { Button, HoverBorderGradient, Input, Tabs, TabsList, TabsTrigger, DropdownMenu } from "@/components/ui";
import { CustomSelect } from "../components/CustomSelect";
import { IconDotsHorizontal } from "../components/Icons";
import {
  Sparkles,
  Zap,
  CheckCircle2,
  RotateCcw,
  Play,
  Plus,
  Database,
  Cpu,
  Layers,
  Search,
  ExternalLink,
  Edit3,
  Calendar,
  Clock,
  Trash2,
  ArrowRight,
  Image as ImageIcon,
} from "lucide-react";

interface AiBlogWritingProps {
  blogs: Blog[];
  blogCategories: string[];
  onEditBlog?: (blog: Blog) => void;
  onCreateBlog?: () => void;
  onNavigateTab?: (page: string) => void;
  showToast?: (msg: string, type?: "success" | "error" | "loading") => void;
  onHeaderChange?: (left: React.ReactNode, right: React.ReactNode) => void;
  onBlogPublished?: (blog: Blog, validation?: EditorialValidationReport) => void;
}

export function AiBlogWriting({
  blogs,
  blogCategories,
  onEditBlog,
  onCreateBlog,
  onNavigateTab,
  showToast,
  onHeaderChange,
  onBlogPublished,
}: AiBlogWritingProps) {
  const [topicLoading, setTopicLoading] = useState(false);
  const [suggestedTopics, setSuggestedTopics] = useState<any[]>([]);
  const [generatingCustom, setGeneratingCustom] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customCategory, setCustomCategory] = useState("Marketing");
  const [customKeyword, setCustomKeyword] = useState("");
  const [selectedModel, setSelectedModel] = useState("gemini-3.5-flash-lite");
  const [generationQueue, setGenerationQueue] = useState<any[]>([]);
  const [queueLoading, setQueueLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"research" | "studio" | "queue">("research");

  // Fetch initial topics and queue
  const fetchTopics = async () => {
    setTopicLoading(true);
    try {
      const res = await customFetch("/api/ai/topics?status=suggested");
      const json = await safeJsonResponse(res);
      if (json.success && json.topics) {
        // Filter out any topics whose headlines or slugs match existing published blogs
        const publishedTitles = new Set(
          blogs.map((b) => (b.title || "").toLowerCase().replace(/[^a-z0-9]/g, "")).filter(Boolean)
        );
        const publishedSlugs = new Set(blogs.map((b) => (b.slug || "").toLowerCase()).filter(Boolean));

        const fresh = json.topics.filter((t: any) => {
          const norm = (t.title || "").toLowerCase().replace(/[^a-z0-9]/g, "");
          const slug = (t.slug || t.proposed_slug || "").toLowerCase();
          return !publishedTitles.has(norm) && !publishedSlugs.has(slug);
        });

        setSuggestedTopics(fresh);
      }
    } catch {
      showToast?.("Failed to fetch suggested topics", "error");
    } finally {
      setTopicLoading(false);
    }
  };

  const fetchQueue = async () => {
    setQueueLoading(true);
    try {
      const res = await customFetch("/api/ai/jobs?view=stats");
      const json = await safeJsonResponse(res);
      if (json.success && json.jobs) {
        setGenerationQueue(json.jobs);
      }
    } catch {
      // queue error
    } finally {
      setQueueLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
    fetchQueue();
    const interval = setInterval(() => {
      fetchQueue();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Generate article from suggested topic
  const [generatingTopicId, setGeneratingTopicId] = useState<string | number | null>(null);

  const handleGenerateAndPublishTopic = async (topic: any) => {
    setGeneratingTopicId(topic.id || topic.title);
    showToast?.("Queuing blog generation...");

    const timer = setTimeout(() => {
      showToast?.("Processing AI article & verified photography...");
    }, 1500);

    try {
      const res = await customFetch("/api/ai/generate", {
        method: "POST",
        body: JSON.stringify({
          title: topic.title,
          category: topic.category || "Marketing",
          primary_keyword: topic.primary_keyword,
          topic_id: topic.id,
          model: selectedModel,
          publish_directly: true,
        }),
      });
      clearTimeout(timer);
      const json = await safeJsonResponse(res);
      if (json.success && json.blog) {
        showToast?.(`Published directly to production: "${json.blog.title}"!`, "success");
        onBlogPublished?.(json.blog, json.validation);
        fetchTopics();
        fetchQueue();
      } else {
        showToast?.(json.message || "Failed to generate blog", "error");
      }
    } catch (err: any) {
      clearTimeout(timer);
      showToast?.(err.message || "Error generating blog", "error");
    } finally {
      setGeneratingTopicId(null);
    }
  };

  const handleGenerateFromTopic = async (topic: any) => {
    return handleGenerateAndPublishTopic(topic);
  };

  // Generate custom article from studio input
  const handleGenerateCustom = async (publishDirectly: boolean = true) => {
    let titleToSend = customTitle.trim();
    let keywordToSend = customKeyword.trim();
    let categoryToSend = customCategory;
    let topicIdToSend: number | undefined = undefined;

    if (!titleToSend && suggestedTopics.length > 0) {
      const publishedTitles = new Set(
        blogs.map((b) => (b.title || "").toLowerCase().replace(/[^a-z0-9]/g, "")).filter(Boolean)
      );
      const top = suggestedTopics.find(
        (t) => !publishedTitles.has((t.title || "").toLowerCase().replace(/[^a-z0-9]/g, ""))
      ) || suggestedTopics[0];
      titleToSend = top.title;
      keywordToSend = top.primary_keyword || "";
      categoryToSend = top.category || categoryToSend;
      topicIdToSend = top.id;
      setCustomTitle(top.title);
      if (top.primary_keyword) setCustomKeyword(top.primary_keyword);
    }

    setGeneratingCustom(true);
    showToast?.("Queuing AI generation & researching search intent...", "loading");

    const timer = setTimeout(() => {
      showToast?.("Processing AI article & verified photography...", "loading");
    }, 1500);

    try {
      const res = await customFetch("/api/ai/generate", {
        method: "POST",
        body: JSON.stringify({
          title: titleToSend || undefined,
          category: categoryToSend || "Video Production",
          primary_keyword: keywordToSend || undefined,
          topic_id: topicIdToSend,
          model: selectedModel,
          publish_directly: true,
        }),
      });
      clearTimeout(timer);
      const json = await safeJsonResponse(res);
      if (json.success && json.blog) {
        showToast?.(`Published directly to production: "${json.blog.title}"!`, "success");
        onBlogPublished?.(json.blog, json.validation);
        setCustomTitle("");
        setCustomKeyword("");
        fetchQueue();
        if (topicIdToSend) {
          setSuggestedTopics((prev) => prev.filter((t) => t.id !== topicIdToSend));
        }
      } else {
        showToast?.(json.message || "Failed to generate blog", "error");
      }
    } catch {
      clearTimeout(timer);
      showToast?.("Error submitting generation job", "error");
    } finally {
      setGeneratingCustom(false);
    }
  };

  const [directGenerating, setDirectGenerating] = useState(false);

  // Directly auto-generate headline, full article and publish live without manual typing
  const handleDirectGenerateWithAi = async () => {
    if (directGenerating || generatingCustom || Boolean(generatingTopicId)) return;
    setDirectGenerating(true);
    showToast?.("AI is researching search intent & generating winning headline...", "loading");

    const timer = setTimeout(() => {
      showToast?.("Writing 1,500+ word article & attaching verified photography...", "loading");
    }, 1500);

    try {
      // Pick top suggested topic that is NOT already in published/posted blogs
      const publishedTitles = new Set(
        blogs.map((b) => (b.title || "").toLowerCase().replace(/[^a-z0-9]/g, "")).filter(Boolean)
      );
      const topTopic = (suggestedTopics && suggestedTopics.length > 0)
        ? suggestedTopics.find((t) => !publishedTitles.has((t.title || "").toLowerCase().replace(/[^a-z0-9]/g, ""))) || null
        : null;

      const res = await customFetch("/api/ai/generate", {
        method: "POST",
        body: JSON.stringify({
          title: topTopic?.title || undefined,
          category: topTopic?.category || "Video Production",
          primary_keyword: topTopic?.primary_keyword || undefined,
          topic_id: topTopic?.id,
          model: selectedModel,
          publish_directly: true,
        }),
      });

      clearTimeout(timer);
      const json = await safeJsonResponse(res);

      if (json.success && json.blog) {
        showToast?.(`Published directly to production: "${json.blog.title}"!`, "success");
        onBlogPublished?.(json.blog, json.validation);
        if (topTopic?.id) {
          setSuggestedTopics((prev) => prev.filter((t) => t.id !== topTopic.id));
        }
        fetchQueue();
        setActiveSubTab("queue");
      } else {
        showToast?.(json.message || "Failed to generate blog", "error");
      }
    } catch (err: any) {
      clearTimeout(timer);
      showToast?.(err.message || "Error generating blog", "error");
    } finally {
      setDirectGenerating(false);
    }
  };

  const [processingNext, setProcessingNext] = useState(false);

  // Process next job immediately
  const handleProcessNext = async () => {
    if (processingNext) return;
    setProcessingNext(true);
    showToast?.("Processing next pending job in queue...", "success");
    try {
      const res = await customFetch("/api/ai/jobs", {
        method: "POST",
        body: JSON.stringify({ action: "process-next" }),
      });
      const json = await safeJsonResponse(res);
      if (json.success && json.job) {
        showToast?.(`Generated: "${json.job.title}" successfully!`, "success");
        fetchQueue();
      } else {
        showToast?.(json.message || "No pending jobs in queue", "error");
      }
    } catch {
      showToast?.("Error processing job", "error");
    } finally {
      setProcessingNext(false);
    }
  };

  const onHeaderChangeRef = useRef(onHeaderChange);
  useEffect(() => {
    onHeaderChangeRef.current = onHeaderChange;
  });

  const handleProcessNextRef = useRef(handleProcessNext);
  useEffect(() => {
    handleProcessNextRef.current = handleProcessNext;
  });

  const handleDirectGenerateWithAiRef = useRef(handleDirectGenerateWithAi);
  useEffect(() => {
    handleDirectGenerateWithAiRef.current = handleDirectGenerateWithAi;
  });

  const onCreateBlogRef = useRef(onCreateBlog);
  useEffect(() => {
    onCreateBlogRef.current = onCreateBlog;
  });

  useEffect(() => {
    onHeaderChangeRef.current?.(
      null,
      <div className="df-g8 al-c">
        {/* Desktop view: All three action buttons */}
        <div className="header-actions-desktop df-g8 al-c">
          <HoverBorderGradient
            onClick={() => handleDirectGenerateWithAiRef.current()}
            disabled={directGenerating || generatingCustom || Boolean(generatingTopicId)}
            loading={directGenerating}
            title="Directly auto-generate headline, 1,500+ words and publish live to production"
          >
            <Sparkles size={16} />
            <span>{directGenerating ? "Generating Live..." : "Generate with AI"}</span>
          </HoverBorderGradient>
          <Button
            variant="secondary"
            onClick={() => handleProcessNextRef.current()}
            disabled={processingNext}
            title="Trigger execution of next pending generation job"
          >
            <Play size={16} />
            <span>{processingNext ? "Processing..." : "Process Next"}</span>
          </Button>
          <Button
            variant="primary"
            onClick={() => onCreateBlogRef.current?.()}
            title="Open standard manual blog editor"
          >
            <Plus size={16} />
            <span>Manual Editor</span>
          </Button>
        </div>

        {/* Compact / Overflow view: Primary AI Generate + Secondary Three-Dot Menu */}
        <div className="header-actions-compact df-g8 al-c">
          <HoverBorderGradient
            onClick={() => handleDirectGenerateWithAiRef.current()}
            disabled={directGenerating || generatingCustom || Boolean(generatingTopicId)}
            loading={directGenerating}
            title="Directly auto-generate headline, 1,500+ words and publish live to production"
          >
            <Sparkles size={16} />
            <span>{directGenerating ? "Generating..." : "Generate with AI"}</span>
          </HoverBorderGradient>

          <DropdownMenu
            items={[
              {
                label: processingNext ? "Processing Next Job..." : "Process Next Pending Job",
                icon: <Play size={16} />,
                disabled: processingNext,
                onSelect: () => handleProcessNextRef.current(),
              },
              {
                label: "Open Manual Blog Editor",
                icon: <Plus size={16} />,
                onSelect: () => onCreateBlogRef.current?.(),
              },
            ]}
            align="end"
            trigger={
              <Button
                variant="secondary"
                size="icon"
                pill
                className="btn-secondary header-more-btn"
                title="More actions"
                aria-label="More actions"
              >
                <IconDotsHorizontal size={18} />
              </Button>
            }
          />
        </div>
      </div>
    );
  }, [processingNext, directGenerating, generatingCustom, generatingTopicId]);

  useEffect(() => {
    return () => {
      onHeaderChangeRef.current?.(null, null);
    };
  }, []);

  return (
    <div className="ai-view-container">
      {/* ─── Unified Metrics Row (ReelScale Standard .stat-grid) ─── */}
      <div className="stat-grid">
        <div className="stat-card green">
          <div className="stat-label">Sanity Published Posts</div>
          <div className="stat-value green">
            <span>{blogs.length}</span>
            <span className="stat-unit">Blogs</span>
          </div>
          <div className="stat-icon">
            <Database size={20} className="text-[var(--green)]" />
          </div>
        </div>

        <div className="stat-card gold">
          <div className="stat-label">Identified Content Gaps</div>
          <div className="stat-value gold">
            <span>{suggestedTopics.length}</span>
            <span className="stat-unit">Topics</span>
          </div>
          <div className="stat-icon">
            <Search size={20} className="text-[var(--gold)]" />
          </div>
        </div>

        <div className="stat-card white">
          <div className="stat-label">Daily Auto-Publish</div>
          <div className="stat-value text-base">
            <span style={{ color: "var(--green)", fontWeight: 700 }}>Active Backend</span>
          </div>
          <div className="stat-icon">
            <Calendar size={20} className="text-[#a78bfa]" />
          </div>
        </div>

        <div className="stat-card red">
          <div className="stat-label">Primary AI Engine</div>
          <div className="stat-value text-base">
            <span>Gemini 3.5</span>
          </div>
          <div className="stat-icon">
            <Cpu size={20} className="text-[var(--red)]" />
          </div>
        </div>
      </div>

      {/* ─── Hero Overview Card with Standardised Radix Tabs ─── */}
      <div className="glass-card ai-header-card">
        <div className="ai-header-content">
          <div>
            <div className="ai-title-group">
              <span className="ai-icon-pill">
                <Sparkles size={16} />
              </span>
              <h2 className="page-section-title">
                AI Content Generation Studio
              </h2>
            </div>
          </div>

          <div className="df-g8 al-c flex-wrap">
            <Tabs
              value={activeSubTab}
              onValueChange={(val) => setActiveSubTab(val as "research" | "studio" | "queue")}
            >
              <TabsList>
                <TabsTrigger value="research">Topic Discovery ({suggestedTopics.length})</TabsTrigger>
                <TabsTrigger value="studio">On-Demand Studio</TabsTrigger>
                <TabsTrigger value="queue">Live Queue ({generationQueue.length})</TabsTrigger>
              </TabsList>
            </Tabs>

            <Button
              variant="secondary"
              onClick={() => onNavigateTab?.("ai-blog-settings")}
              title="View and edit blog automation schedule and prompt settings"
            >
              <Clock size={15} />
              <span>Automation & Prompt Settings</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ─── SUB-PANEL 1: TOPIC RESEARCH & GAP DISCOVERY ─── */}
      {activeSubTab === "research" && (
        <div className="ai-view-container">
          <div className="df-g8 al-c jc-sb flex-wrap glass-card">
            <div className="glass-card-label m-0">
              Identified Search Intents & High-ROI Opportunities
            </div>
            <Button
              variant="secondary"
              onClick={fetchTopics}
              disabled={topicLoading}
            >
              <RotateCcw size={16} className={topicLoading ? "animate-spin" : ""} />
              <span>{topicLoading ? "Analyzing..." : "Re-scan Content Lake"}</span>
            </Button>
          </div>

          <div className="ai-topics-grid">
            {topicLoading && suggestedTopics.length === 0 ? (
              [0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="glass-card ai-topic-card">
                  <div className="ai-topic-body">
                    <div className="ai-topic-header">
                      <div
                        className="skeleton skeleton-w-var skeleton-h-var"
                        style={{ "--w": "70px", "--h": "20px", borderRadius: "99px" } as any}
                      />
                      <div
                        className="skeleton skeleton-w-var skeleton-h-var"
                        style={{ "--w": "50px", "--h": "20px", borderRadius: "99px" } as any}
                      />
                    </div>
                    <div
                      className="skeleton skeleton-line skeleton-w-var skeleton-h-var"
                      style={{ "--w": "85%", "--h": "18px", marginTop: "12px", marginBottom: "12px" } as any}
                    />
                    <div className="ai-topic-details">
                      <div
                        className="skeleton skeleton-line skeleton-w-var skeleton-h-var mb-6"
                        style={{ "--w": "65%", "--h": "11px" } as any}
                      />
                      <div
                        className="skeleton skeleton-line skeleton-w-var skeleton-h-var mb-6"
                        style={{ "--w": "75%", "--h": "11px" } as any}
                      />
                      <div
                        className="skeleton skeleton-line skeleton-w-var skeleton-h-var"
                        style={{ "--w": "55%", "--h": "11px" } as any}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : suggestedTopics.length === 0 ? (
              <div className="glass-card ai-empty-box" style={{ gridColumn: "1 / -1" }}>
                <p className="text-sm text-[var(--muted)]">No content gaps found. Click &quot;Re-scan Content Lake&quot; to generate new topics.</p>
              </div>
            ) : (
              suggestedTopics.map((t, idx) => (
                <div key={idx} className="glass-card ai-topic-card">
                  <div className="ai-topic-body">
                    <div className="ai-topic-header">
                      <span className="badge badge-gold">{t.category || "Production"}</span>
                      <span className="badge badge-green">{t.content_priority || "High"}</span>
                    </div>

                    <h3 className="ai-topic-title">{t.title}</h3>

                    <div className="ai-topic-details">
                      <div className="ai-topic-row">
                        <span className="ai-topic-label">Focus Keyword:</span>
                        <strong className="ai-topic-val">{t.primary_keyword}</strong>
                      </div>
                      <div className="ai-topic-row">
                        <span className="ai-topic-label">Search Intent:</span>
                        <span className="ai-topic-intent">{t.search_intent}</span>
                      </div>
                      <div className="ai-topic-row">
                        <span className="ai-topic-label">Proposed Slug:</span>
                        <span className="ai-topic-slug">/blog/{t.proposed_slug}</span>
                      </div>
                    </div>

                    {t.reason_for_creating && t.reason_for_creating.trim() ? (
                      <p className="ai-topic-reason">
                        &quot;{t.reason_for_creating}&quot;
                      </p>
                    ) : null}
                  </div>

                  <div className="ai-topic-card-footer" style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <HoverBorderGradient
                      size="sm"
                      onClick={() => handleGenerateAndPublishTopic(t)}
                      disabled={generatingTopicId === (t.id || t.title) || directGenerating}
                      loading={generatingTopicId === (t.id || t.title)}
                      title="Generate complete article with AI and publish directly to production"
                    >
                      <Sparkles size={14} />
                      <span>Generate & Publish Live</span>
                    </HoverBorderGradient>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleGenerateFromTopic(t)}
                      title="Add to background automation queue"
                    >
                      <Zap size={14} />
                      <span>Queue Job</span>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ─── SUB-PANEL 2: ON-DEMAND GENERATION STUDIO ─── */}
      {activeSubTab === "studio" && (
        <div className="glass-card ai-studio-form">
          <div>
            <div className="glass-card-label">
              On-Demand Article Creation Studio
            </div>
            <p className="ai-section-desc">
              Specify your target topic and keyword to trigger long-form markdown writing, SEO metadata, FAQs, and Sanity CMS synchronization.
            </p>
          </div>

          <div className="ai-form-grid">
            <div className="ai-form-field ai-form-full">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label className="ai-field-label" style={{ margin: 0 }}>
                  Target Article Title
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const publishedTitles = new Set(
                      blogs.map((b) => (b.title || "").toLowerCase().replace(/[^a-z0-9]/g, "")).filter(Boolean)
                    );
                    const freshTopics = suggestedTopics.filter(
                      (t) => !publishedTitles.has((t.title || "").toLowerCase().replace(/[^a-z0-9]/g, ""))
                    );
                    if (freshTopics.length > 0) {
                      const pick = freshTopics[Math.floor(Math.random() * freshTopics.length)];
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
                placeholder="e.g. 10-Minute Video Reels (or leave blank for AI to auto-generate winning headline)"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
              />
            </div>

            <div className="ai-form-field">
              <label className="ai-field-label">
                Primary Target Keyword
              </label>
              <Input
                placeholder="e.g. restaurant reels hyderabad"
                value={customKeyword}
                onChange={(e) => setCustomKeyword(e.target.value)}
              />
            </div>

            <div className="ai-form-field">
              <label className="ai-field-label">
                Article Category
              </label>
              <CustomSelect
                value={customCategory}
                onChange={(v) => setCustomCategory(v)}
                options={blogCategories.map((c) => ({ value: c, label: c }))}
              />
            </div>

            <div className="ai-form-field ai-form-full">
              <label className="ai-field-label">
                Primary AI Engine & Model
              </label>
              <CustomSelect
                value={selectedModel}
                onChange={(v) => setSelectedModel(v)}
                options={[
                  { value: "gemini-3.5-flash-lite", label: "gemini-3.5-flash-lite (Google Gemini • Tier 1 Primary • Ultra-Fast)" },
                  { value: "gemini-3-flash-preview", label: "gemini-3-flash-preview (Google Gemini • Frontier Reasoning)" },
                  { value: "openai/gpt-oss-120b", label: "openai/gpt-oss-120b (Groq LPU • Tier 2 Fallback)" },
                  { value: "meta-llama/llama-3.3-70b-instruct", label: "meta-llama/llama-3.3-70b-instruct (OpenRouter • Tier 3 Fallback)" },
                ]}
              />
            </div>
          </div>

          <div className="ai-pipeline-banner">
            <div>
              <span className="ai-pipeline-title">Direct Production Publishing</span>
              <span className="ai-pipeline-desc">
                Generates a market-leading 1,500+ word authority guide, attaches verified royalty-free photography, and publishes immediately to production.
              </span>
            </div>
            <div className="df-g8 al-c">
              <HoverBorderGradient
                onClick={() => handleGenerateCustom(true)}
                disabled={generatingCustom || directGenerating}
                loading={generatingCustom}
                title="Generate with AI and publish directly to production"
              >
                <Sparkles size={16} />
                <span>{generatingCustom ? "Generating & Publishing..." : "Generate & Publish to Production"}</span>
              </HoverBorderGradient>
            </div>
          </div>
        </div>
      )}

      {/* ─── SUB-PANEL 3: LIVE AUTONOMOUS GENERATION QUEUE ─── */}
      {activeSubTab === "queue" && (
        <div className="glass-card ai-header-card">
          <div className="ai-panel-header">
            <div>
              <div className="glass-card-label">
                Autonomous Generation Queue
              </div>
              <p className="ai-section-desc">
                Dispatches jobs sequentially, creates markdown articles, and publishes directly to Sanity Studio Content Lake.
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={fetchQueue}
              disabled={queueLoading}
            >
              <RotateCcw size={16} className={queueLoading ? "animate-spin" : ""} />
              <span>Refresh Queue</span>
            </Button>
          </div>

          <div className="ai-queue-list">
            {generationQueue.length === 0 ? (
              <div className="ai-empty-box">
                <p className="text-xs text-[var(--muted)]">
                  The generation queue is currently empty. Queue jobs from Topic Discovery or On-Demand Studio.
                </p>
              </div>
            ) : (
              generationQueue.map((job) => {
                const sanityDocId = job.sanity_document_id || job.sanity_id;
                return (
                  <div key={job.id} className="ai-queue-card">
                    <div className="ai-queue-info">
                      <div className="ai-queue-title-row">
                        <span
                          className={`badge ${job.status === "completed"
                            ? "badge-green"
                            : job.status === "failed"
                              ? "badge-red"
                              : "badge-gold"
                            }`}
                        >
                          {job.status.toUpperCase()}
                        </span>
                        <h4 className="ai-queue-title">{job.title}</h4>
                      </div>
                      <div className="ai-queue-meta">
                        <span>Category: <strong className="text-white font-medium">{job.category}</strong></span>
                        <span>• Created: {new Date(job.created_at || Date.now()).toLocaleTimeString()}</span>
                        {job.retry_count > 0 && <span>• Retries: {job.retry_count}</span>}
                      </div>
                    </div>

                    <div className="ai-queue-actions">
                      {(job.status === "queued" || job.status === "pending") && (
                        <Button
                          variant="gold"
                          size="sm"
                          onClick={() => handleProcessNext()}
                          disabled={processingNext}
                          title="Generate and post this article now"
                        >
                          <Play size={14} />
                          <span>{processingNext ? "Processing..." : "Generate Now"}</span>
                        </Button>
                      )}

                      {job.status === "processing" && (
                        <span className="badge badge-gold">
                          <RotateCcw size={12} className="animate-spin" />
                          <span>{job.stage ? `Processing: ${job.stage}` : "Generating..."}</span>
                        </span>
                      )}

                      {job.status === "failed" && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={async () => {
                            try {
                              await customFetch("/api/ai/jobs", {
                                method: "POST",
                                body: JSON.stringify({ action: "retry", jobId: job.id }),
                              });
                              showToast?.("Job requeued for generation", "success");
                              fetchQueue();
                            } catch {
                              showToast?.("Failed to retry job", "error");
                            }
                          }}
                        >
                          <RotateCcw size={14} />
                          <span>Retry</span>
                        </Button>
                      )}

                      {job.status === "completed" && (
                        <>
                          <span className="badge badge-green">
                            <CheckCircle2 size={12} />
                            <span>Synced to Sanity</span>
                          </span>

                          <Button
                            variant="secondary"
                            size="sm"
                            href={`https://2gdjnoi2.sanity.studio/structure/post;${sanityDocId || `post-${job.slug}`}`}
                            target="_blank"
                            title="Open document directly in Sanity Studio"
                          >
                            <ExternalLink size={14} />
                            <span>Sanity Studio</span>
                          </Button>

                          {onEditBlog && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const found = blogs.find((b) => b.slug === job.slug || b.title === job.title);
                                if (found) {
                                  onEditBlog(found);
                                } else {
                                  onNavigateTab?.("blogs");
                                }
                              }}
                              title="Edit in Dashboard Editor"
                            >
                              <Edit3 size={14} />
                              <span>Edit</span>
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AiBlogWriting;
