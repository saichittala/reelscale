"use client";

import React, { useState, useEffect, useRef } from "react";
import { Blog } from "../types";
import { customFetch } from "../services/api";
import { Button, Input, Tabs, TabsList, TabsTrigger } from "@/components/ui";
import { CustomSelect } from "../components/CustomSelect";
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
} from "lucide-react";

interface AiBlogWritingProps {
  blogs: Blog[];
  blogCategories: string[];
  onEditBlog?: (blog: Blog) => void;
  onCreateBlog?: () => void;
  onNavigateTab?: (page: string) => void;
  showToast?: (msg: string, type?: "success" | "error") => void;
  onHeaderChange?: (left: React.ReactNode, right: React.ReactNode) => void;
}

export function AiBlogWriting({
  blogs,
  blogCategories,
  onEditBlog,
  onCreateBlog,
  onNavigateTab,
  showToast,
  onHeaderChange,
}: AiBlogWritingProps) {
  const [topicLoading, setTopicLoading] = useState(false);
  const [suggestedTopics, setSuggestedTopics] = useState<any[]>([]);
  const [generatingCustom, setGeneratingCustom] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customCategory, setCustomCategory] = useState("Production");
  const [customKeyword, setCustomKeyword] = useState("");
  const [selectedModel, setSelectedModel] = useState("llama-3.3-70b-versatile");
  const [generationQueue, setGenerationQueue] = useState<any[]>([]);
  const [queueLoading, setQueueLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"research" | "studio" | "queue">("research");

  // Fetch initial topics and queue
  const fetchTopics = async () => {
    setTopicLoading(true);
    try {
      const res = await customFetch("/api/ai/topics");
      const json = await res.json();
      if (json.success && json.topics) {
        setSuggestedTopics(json.topics);
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
      const json = await res.json();
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
    const interval = setInterval(fetchQueue, 12000);
    return () => clearInterval(interval);
  }, []);

  // Generate article from suggested topic
  const handleGenerateFromTopic = async (topic: any) => {
    try {
      showToast?.(`Queued generation for: "${topic.title}"`, "success");
      const res = await customFetch("/api/ai/jobs", {
        method: "POST",
        body: JSON.stringify({
          action: "create",
          title: topic.title,
          category: topic.category || "Production",
          slug: topic.proposed_slug,
          primary_keyword: topic.primary_keyword,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast?.("Generation job added to queue & started!", "success");
        fetchQueue();
        setActiveSubTab("queue");
      } else {
        showToast?.(json.message || "Failed to schedule generation", "error");
      }
    } catch {
      showToast?.("Error queuing generation job", "error");
    }
  };

  // Generate custom article from studio input
  const handleGenerateCustom = async () => {
    if (!customTitle.trim()) {
      showToast?.("Please enter an article title", "error");
      return;
    }
    setGeneratingCustom(true);
    try {
      const res = await customFetch("/api/ai/jobs", {
        method: "POST",
        body: JSON.stringify({
          action: "create",
          title: customTitle,
          category: customCategory,
          primary_keyword: customKeyword || customTitle,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast?.("Article created and queued for generation!", "success");
        setCustomTitle("");
        setCustomKeyword("");
        fetchQueue();
        setActiveSubTab("queue");
      } else {
        showToast?.(json.message || "Failed to create generation job", "error");
      }
    } catch {
      showToast?.("Error submitting generation job", "error");
    } finally {
      setGeneratingCustom(false);
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
      const json = await res.json();
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

  const onCreateBlogRef = useRef(onCreateBlog);
  useEffect(() => {
    onCreateBlogRef.current = onCreateBlog;
  });

  useEffect(() => {
    onHeaderChangeRef.current?.(
      null,
      <div className="df-g8 al-c">
        <Button
          variant="gold"
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
    );
  }, [processingNext]);

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
          <div className="stat-label">Running Queue Jobs</div>
          <div className="stat-value">
            <span>{generationQueue.filter((j) => j.status === "processing" || j.status === "pending" || j.status === "queued").length}</span>
            <span className="stat-unit">Active</span>
          </div>
          <div className="stat-icon">
            <Layers size={20} />
          </div>
        </div>

        <div className="stat-card red">
          <div className="stat-label">Inference Engine</div>
          <div className="stat-value text-lg">
            <span>Groq LPU</span>
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
            <p className="ai-section-desc">
              Researches search intent, generates 1,200–1,800 word articles, attaches verified royalty-free imagery, links Hyderabad geo-targets, and connects directly to Sanity Studio.
            </p>
          </div>

          <div className="df-g8 al-c">
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
          </div>
        </div>
      </div>

      {/* ─── SUB-PANEL 1: TOPIC RESEARCH & GAP DISCOVERY ─── */}
      {activeSubTab === "research" && (
        <div className="ai-view-container">
          <div className="df-g8 al-c jc-sb flex-wrap">
            <div>
              <div className="glass-card-label">
                Identified Search Intents & High-ROI Opportunities
              </div>
              <p className="ai-section-desc">
                Evaluates existing articles to discover untargeted search intents across Hyderabad commercial areas.
              </p>
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
            {suggestedTopics.length === 0 ? (
              <div className="glass-card ai-empty-box" style={{ gridColumn: "1 / -1" }}>
                <p className="text-sm text-[var(--muted)]">No content gaps found. Click &quot;Re-scan Content Lake&quot; to generate new topics.</p>
              </div>
            ) : (
              suggestedTopics.map((t, idx) => (
                <div key={idx} className="glass-card ai-topic-card">
                  <div className="ai-topic-body">
                    <div className="ai-topic-header">
                      <span className="badge badge-gold">{t.category || "Production"}</span>
                      <span className="badge badge-green">Priority: {t.content_priority || "High"}</span>
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

                  <div className="ai-topic-card-footer">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleGenerateFromTopic(t)}
                    >
                      <Zap size={14} />
                      <span>Generate Full Article</span>
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
              <label className="ai-field-label">
                Target Article Title
              </label>
              <Input
                placeholder="e.g. 10-Minute Video Reels for Jubilee Hills Restaurants: Complete Production Guide"
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
                Groq AI Inference Model
              </label>
              <CustomSelect
                value={selectedModel}
                onChange={(v) => setSelectedModel(v)}
                options={[
                  { value: "llama-3.3-70b-versatile", label: "llama-3.3-70b-versatile (Recommended • Fast & Creative)" },
                  { value: "llama-3.1-8b-instant", label: "llama-3.1-8b-instant (Ultra Low Latency)" },
                  { value: "mixtral-8x7b-32768", label: "mixtral-8x7b-32768 (High Context Depth)" },
                  { value: "gemini-2.5-flash", label: "gemini-2.5-flash (Google Gemini • 2nd Backup)" },
                  { value: "meta-llama/llama-3.3-70b-instruct", label: "meta-llama/llama-3.3-70b-instruct (OpenRouter • 3rd Backup)" },
                ]}
              />
            </div>
          </div>

          <div className="ai-pipeline-banner">
            <div>
              <span className="ai-pipeline-title">8-Stage AI Generation Pipeline Ready</span>
              <span className="ai-pipeline-desc">
                Research → Keywords → Outline → Long-form Writing → SEO Meta → Linking → Validation → Sanity Studio Sync.
              </span>
            </div>
            <Button
              variant="primary"
              onClick={handleGenerateCustom}
              disabled={generatingCustom}
            >
              <Zap size={16} />
              <span>{generatingCustom ? "Generating..." : "Generate & Queue Article"}</span>
            </Button>
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
